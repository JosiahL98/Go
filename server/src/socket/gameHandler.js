import db from '../db.js';
import GoGame from '../engine/GoGame.js';
import { BLACK, WHITE } from '../engine/constants.js';

// V-11: Bounded game map with TTL-based eviction
const MAX_ACTIVE_GAMES = 500;
const GAME_TTL_MS = 60 * 60 * 1000; // 1 hour inactivity
const activeGames = new Map(); // gameId -> { game: GoGame, lastActivity: number }

// NEW-02: Per-socket rate limiting (max 30 events/sec)
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX = 30;

function createRateLimiter() {
  let count = 0;
  let windowStart = Date.now();
  return function check() {
    const now = Date.now();
    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
      count = 0;
      windowStart = now;
    }
    count++;
    return count <= RATE_LIMIT_MAX;
  };
}

// NEW-03: Strict integer validation — rejects null, undefined, empty string, booleans
function validateInt(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 18 ? n : null; // NEW-08: upper bound (max index for 19x19)
}

function validateGameId(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function touchGame(gameId) {
  const entry = activeGames.get(gameId);
  if (entry) entry.lastActivity = Date.now();
}

// V-11: Evict stale games periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of activeGames) {
    if (now - entry.lastActivity > GAME_TTL_MS) {
      activeGames.delete(id);
    }
  }
}, 5 * 60 * 1000);

function getOrCreateGame(gameId) {
  if (activeGames.has(gameId)) {
    touchGame(gameId);
    return activeGames.get(gameId).game;
  }

  if (activeGames.size >= MAX_ACTIVE_GAMES) return null;

  const gameRow = db.get('SELECT * FROM games WHERE id = ?', [gameId]);
  if (!gameRow) return null;

  const moves = db.all('SELECT * FROM moves WHERE game_id = ? ORDER BY move_number', [gameId]);
  // NEW-04: Pass player IDs for correct color assignment
  const game = GoGame.fromMoves(gameRow.board_size, gameRow.komi, moves, gameRow.black_id, gameRow.white_id);
  activeGames.set(gameId, { game, lastActivity: Date.now() });
  return game;
}

function getPlayerColor(gameRow, userId) {
  if (gameRow.black_id === userId) return BLACK;
  if (gameRow.white_id === userId) return WHITE;
  return null;
}

export default function handleConnection(socket, io) {
  const user = socket.user;

  // NEW-02: Attach rate limiter to each socket
  const rateLimitCheck = createRateLimiter();

  function rateLimit() {
    if (!rateLimitCheck()) {
      socket.emit('error', { message: 'Too many requests' });
      return false;
    }
    return true;
  }

  socket.on('join-game', (data) => {
    if (!rateLimit()) return;

    const gameId = validateGameId(data?.gameId);
    if (!gameId) return socket.emit('error', { message: 'Invalid game ID' });

    const gameRow = db.get(`
      SELECT g.*, b.username as black_username, w.username as white_username
      FROM games g
      LEFT JOIN users b ON g.black_id = b.id
      LEFT JOIN users w ON g.white_id = w.id
      WHERE g.id = ?
    `, [gameId]);

    if (!gameRow) return socket.emit('error', { message: 'Game not found' });

    // V-06: Atomic join with WHERE preconditions to prevent race condition
    if (gameRow.status === 'waiting' && gameRow.black_id !== user.id && !gameRow.white_id) {
      const result = db.run(
        'UPDATE games SET white_id = ?, status = ? WHERE id = ? AND status = ? AND white_id IS NULL',
        [user.id, 'active', gameId, 'waiting']
      );

      if (result.changes === 1) {
        gameRow.white_id = user.id;
        gameRow.white_username = user.username;
        gameRow.status = 'active';

        io.to(`game:${gameId}`).emit('player-joined', {
          userId: user.id,
          username: user.username,
          color: WHITE,
        });
      } else {
        const fresh = db.get('SELECT * FROM games WHERE id = ?', [gameId]);
        if (fresh) {
          gameRow.white_id = fresh.white_id;
          gameRow.status = fresh.status;
        }
      }
    }

    socket.join(`game:${gameId}`);
    socket.gameId = gameId;

    const game = getOrCreateGame(gameId);
    if (!game) return socket.emit('error', { message: 'Failed to load game' });

    const state = game.getState();
    socket.emit('game-state', {
      ...state,
      blackPlayer: { id: gameRow.black_id, username: gameRow.black_username },
      whitePlayer: gameRow.white_id
        ? { id: gameRow.white_id, username: gameRow.white_username }
        : null,
      status: gameRow.status,
    });
  });

  socket.on('place-stone', (data) => {
    if (!rateLimit()) return;

    const gameId = validateGameId(data?.gameId);
    const x = validateInt(data?.x);
    const y = validateInt(data?.y);
    if (gameId === null || x === null || y === null) {
      return socket.emit('error', { message: 'Invalid input' });
    }

    const gameRow = db.get('SELECT * FROM games WHERE id = ?', [gameId]);
    if (!gameRow || gameRow.status !== 'active') {
      return socket.emit('error', { message: 'Game is not active' });
    }

    const color = getPlayerColor(gameRow, user.id);
    if (!color) return socket.emit('error', { message: 'You are not in this game' });

    const game = getOrCreateGame(gameId);
    if (!game) return socket.emit('error', { message: 'Game not found' });

    // V-05: Server-side turn validation (defense in depth)
    if (game.currentPlayer !== color) {
      return socket.emit('error', { message: 'Not your turn' });
    }

    const result = game.playMove(x, y, color);
    if (!result.success) {
      return socket.emit('error', { message: result.error });
    }

    const moveNumber = game.moveHistory.length;
    db.run(`
      INSERT INTO moves (game_id, move_number, player_id, x, y, is_pass, captured)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `, [gameId, moveNumber, user.id, x, y, JSON.stringify(result.captured)]);

    touchGame(gameId);

    io.to(`game:${gameId}`).emit('move-made', {
      x, y, color, captured: result.captured, moveNumber,
    });
  });

  socket.on('pass', (data) => {
    if (!rateLimit()) return;

    const gameId = validateGameId(data?.gameId);
    if (!gameId) return socket.emit('error', { message: 'Invalid game ID' });

    const gameRow = db.get('SELECT * FROM games WHERE id = ?', [gameId]);
    if (!gameRow || gameRow.status !== 'active') {
      return socket.emit('error', { message: 'Game is not active' });
    }

    const color = getPlayerColor(gameRow, user.id);
    if (!color) return socket.emit('error', { message: 'You are not in this game' });

    const game = getOrCreateGame(gameId);
    if (!game) return socket.emit('error', { message: 'Game not found' });

    if (game.currentPlayer !== color) {
      return socket.emit('error', { message: 'Not your turn' });
    }

    const result = game.pass(color);
    if (!result.success) {
      return socket.emit('error', { message: result.error });
    }

    const moveNumber = game.moveHistory.length;
    db.run(`
      INSERT INTO moves (game_id, move_number, player_id, is_pass)
      VALUES (?, ?, ?, 1)
    `, [gameId, moveNumber, user.id]);

    touchGame(gameId);

    io.to(`game:${gameId}`).emit('player-passed', { color });

    if (result.gameOver) {
      finishGame(gameId, gameRow, game, result, io);
    }
  });

  socket.on('resign', (data) => {
    if (!rateLimit()) return;

    const gameId = validateGameId(data?.gameId);
    if (!gameId) return socket.emit('error', { message: 'Invalid game ID' });

    const gameRow = db.get('SELECT * FROM games WHERE id = ?', [gameId]);
    if (!gameRow || gameRow.status !== 'active') {
      return socket.emit('error', { message: 'Game is not active' });
    }

    const color = getPlayerColor(gameRow, user.id);
    if (!color) return socket.emit('error', { message: 'You are not in this game' });

    const game = getOrCreateGame(gameId);
    if (!game) return socket.emit('error', { message: 'Game not found' });

    const result = game.resign(color);
    if (!result.success) {
      return socket.emit('error', { message: result.error });
    }

    finishGame(gameId, gameRow, game, result, io);
  });

  socket.on('disconnect', () => {
    // Game stays in memory for reconnection (with TTL eviction)
  });
}

function finishGame(gameId, gameRow, game, result, io) {
  const winnerId = result.winner === BLACK ? gameRow.black_id :
                   result.winner === WHITE ? gameRow.white_id : null;

  db.run(`
    UPDATE games SET status = 'finished', winner_id = ?, result = ?,
      board_state = ?, finished_at = datetime('now')
    WHERE id = ?
  `, [winnerId, result.result, JSON.stringify(game.board.toJSON()), gameId]);

  if (winnerId) {
    const loserId = winnerId === gameRow.black_id ? gameRow.white_id : gameRow.black_id;
    db.run('UPDATE users SET wins = wins + 1 WHERE id = ?', [winnerId]);
    db.run('UPDATE users SET losses = losses + 1 WHERE id = ?', [loserId]);
  }

  io.to(`game:${gameId}`).emit('game-over', {
    winner: result.winner,
    result: result.result,
    blackScore: result.blackScore,
    whiteScore: result.whiteScore,
  });

  activeGames.delete(gameId);
}

// V-22 + NEW-13: Cleanup stale waiting games in DB and memory
export function cleanupStaleGames() {
  // Get IDs of games being cancelled before updating
  const stale = db.all(`
    SELECT id FROM games
    WHERE status = 'waiting'
    AND created_at < datetime('now', '-30 minutes')
  `);

  if (stale.length > 0) {
    db.run(`
      UPDATE games SET status = 'cancelled'
      WHERE status = 'waiting'
      AND created_at < datetime('now', '-30 minutes')
    `);
    // Also clear from in-memory map
    for (const row of stale) {
      activeGames.delete(row.id);
    }
  }
}

setInterval(cleanupStaleGames, 10 * 60 * 1000);
