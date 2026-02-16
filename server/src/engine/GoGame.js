import Board from './Board.js';
import { EMPTY, BLACK, WHITE } from './constants.js';
import { scoreGame } from './scoring.js';

export default class GoGame {
  constructor(boardSize, komi = 6.5) {
    this.board = new Board(boardSize);
    this.boardSize = boardSize;
    this.komi = komi;
    this.currentPlayer = BLACK;
    this.moveHistory = [];
    this.previousBoardHash = null;
    this.capturedByBlack = 0; // stones black has captured
    this.capturedByWhite = 0;
    this.consecutivePasses = 0;
    this.isOver = false;
    this.winner = null;
    this.result = null;
  }

  playMove(x, y, color) {
    if (this.isOver) return { success: false, error: 'Game is over' };
    if (color !== this.currentPlayer) return { success: false, error: 'Not your turn' };
    if (!this.board.inBounds(x, y)) return { success: false, error: 'Out of bounds' };
    if (this.board.get(x, y) !== EMPTY) return { success: false, error: 'Position occupied' };

    // Save board state for ko check
    const prevHash = this.board.hash();

    // Place stone
    this.board.set(x, y, color);

    // Capture opponent dead groups
    const captured = this.board.captureDeadGroups(x, y, color);

    // Suicide check: if the placed stone's group has 0 liberties and no captures were made
    if (captured.length === 0) {
      const group = this.board.getGroup(x, y);
      if (group.liberties.size === 0) {
        // Undo
        this.board.set(x, y, EMPTY);
        return { success: false, error: 'Suicide is not allowed' };
      }
    }

    // Ko check: board state must not match the state before the previous move
    const newHash = this.board.hash();
    if (this.previousBoardHash !== null && newHash === this.previousBoardHash) {
      // Undo move and captures
      this.board.set(x, y, EMPTY);
      const opponent = color === BLACK ? WHITE : BLACK;
      for (const c of captured) {
        this.board.set(c.x, c.y, opponent);
      }
      return { success: false, error: 'Ko rule violation' };
    }

    // Commit move
    this.previousBoardHash = prevHash;

    if (color === BLACK) this.capturedByBlack += captured.length;
    else this.capturedByWhite += captured.length;

    this.moveHistory.push({ x, y, color, captured });
    this.consecutivePasses = 0;
    this.currentPlayer = color === BLACK ? WHITE : BLACK;

    return { success: true, captured };
  }

  pass(color) {
    if (this.isOver) return { success: false, error: 'Game is over' };
    if (color !== this.currentPlayer) return { success: false, error: 'Not your turn' };

    this.moveHistory.push({ x: null, y: null, color, captured: [], isPass: true });
    this.consecutivePasses++;
    this.currentPlayer = color === BLACK ? WHITE : BLACK;

    if (this.consecutivePasses >= 2) {
      return this._endGameByScoring();
    }

    return { success: true, gameOver: false };
  }

  resign(color) {
    if (this.isOver) return { success: false, error: 'Game is over' };

    this.isOver = true;
    this.winner = color === BLACK ? WHITE : BLACK;
    this.result = `${this.winner === BLACK ? 'B' : 'W'}+Resign`;

    return { success: true, winner: this.winner, result: this.result };
  }

  _endGameByScoring() {
    const score = scoreGame(this.board, this.komi);
    this.isOver = true;
    this.winner = score.winner;
    this.result = score.result;

    return {
      success: true,
      gameOver: true,
      blackScore: score.blackScore,
      whiteScore: score.whiteScore,
      winner: score.winner,
      result: score.result,
    };
  }

  getState() {
    return {
      board: this.board.toJSON(),
      boardSize: this.boardSize,
      currentPlayer: this.currentPlayer,
      capturedByBlack: this.capturedByBlack,
      capturedByWhite: this.capturedByWhite,
      moveCount: this.moveHistory.length,
      isOver: this.isOver,
      winner: this.winner,
      result: this.result,
    };
  }

  // Reconstruct game from a list of moves (for loading from DB)
  static fromMoves(boardSize, komi, moves, blackId, whiteId) {
    const game = new GoGame(boardSize, komi);
    for (const move of moves) {
      const color = move.player_id === blackId ? BLACK : WHITE;
      if (move.is_pass) {
        game.pass(color);
      } else {
        game.playMove(move.x, move.y, color);
      }
    }
    return game;
  }
}
