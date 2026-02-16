import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.use(authenticateToken);

// List games (optionally filter by status)
const VALID_STATUSES = ['waiting', 'active', 'finished'];

router.get('/', (req, res) => {
  const { status } = req.query;
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    const games = db.all(`
      SELECT g.*,
        b.username as black_username,
        w.username as white_username
      FROM games g
      LEFT JOIN users b ON g.black_id = b.id
      LEFT JOIN users w ON g.white_id = w.id
      WHERE g.status = ?
      ORDER BY g.created_at DESC
    `, [status]);
    res.json(games);
  } else {
    const games = db.all(`
      SELECT g.*,
        b.username as black_username,
        w.username as white_username
      FROM games g
      LEFT JOIN users b ON g.black_id = b.id
      LEFT JOIN users w ON g.white_id = w.id
      WHERE g.status IN ('waiting', 'active')
      ORDER BY g.created_at DESC
    `);
    res.json(games);
  }
});

// Get single game with moves
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid game ID' });
  }
  const game = db.get(`
    SELECT g.*,
      b.username as black_username,
      w.username as white_username
    FROM games g
    LEFT JOIN users b ON g.black_id = b.id
    LEFT JOIN users w ON g.white_id = w.id
    WHERE g.id = ?
  `, [id]);

  if (!game) return res.status(404).json({ error: 'Game not found' });

  const moves = db.all(
    'SELECT * FROM moves WHERE game_id = ? ORDER BY move_number',
    [id]
  );

  res.json({ ...game, moves });
});

// Create a new game
router.post('/', (req, res) => {
  const { boardSize } = req.body;
  const size = Number(boardSize);
  if (![9, 13, 19].includes(size)) {
    return res.status(400).json({ error: 'Board size must be 9, 13, or 19' });
  }

  // V-13: Limit active games per user
  const activeCount = db.get(
    `SELECT COUNT(*) as count FROM games
     WHERE (black_id = ? OR white_id = ?) AND status IN ('waiting', 'active')`,
    [req.user.id, req.user.id]
  );
  if (activeCount && activeCount.count >= 5) {
    return res.status(429).json({ error: 'You have too many active games (max 5)' });
  }

  const result = db.run(
    'INSERT INTO games (board_size, black_id) VALUES (?, ?)',
    [size, req.user.id]
  );

  const game = db.get(`
    SELECT g.*, b.username as black_username
    FROM games g
    LEFT JOIN users b ON g.black_id = b.id
    WHERE g.id = ?
  `, [result.lastInsertRowid]);

  res.status(201).json(game);
});

export default router;
