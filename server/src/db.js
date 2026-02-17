import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create tables on startup
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    wins        INTEGER NOT NULL DEFAULT 0,
    losses      INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS games (
    id          SERIAL PRIMARY KEY,
    board_size  INTEGER NOT NULL CHECK (board_size IN (9, 13, 19)),
    black_id    INTEGER NOT NULL REFERENCES users(id),
    white_id    INTEGER REFERENCES users(id),
    status      TEXT    NOT NULL DEFAULT 'waiting',
    winner_id   INTEGER REFERENCES users(id),
    result      TEXT,
    komi        REAL    NOT NULL DEFAULT 6.5,
    board_state TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS moves (
    id          SERIAL PRIMARY KEY,
    game_id     INTEGER NOT NULL REFERENCES games(id),
    move_number INTEGER NOT NULL,
    player_id   INTEGER NOT NULL REFERENCES users(id),
    x           INTEGER,
    y           INTEGER,
    is_pass     INTEGER NOT NULL DEFAULT 0,
    captured    TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(game_id, move_number)
  );
`);

const db = {
  // Run a statement. Returns { lastInsertRowid, changes }
  async run(sql, params = []) {
    const result = await pool.query(sql, params);
    return {
      lastInsertRowid: result.rows[0]?.id || 0,
      changes: result.rowCount || 0,
    };
  },

  // Get a single row. Returns object or undefined
  async get(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0] || undefined;
  },

  // Get all rows as array of objects
  async all(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
  },
};

export default db;
