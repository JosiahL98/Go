import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'go.db');

mkdirSync(dataDir, { recursive: true });

const SQL = await initSqlJs();

let db;
if (existsSync(dbPath)) {
  const buffer = readFileSync(dbPath);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    wins        INTEGER NOT NULL DEFAULT 0,
    losses      INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS games (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    board_size  INTEGER NOT NULL CHECK (board_size IN (9, 13, 19)),
    black_id    INTEGER NOT NULL REFERENCES users(id),
    white_id    INTEGER REFERENCES users(id),
    status      TEXT    NOT NULL DEFAULT 'waiting',
    winner_id   INTEGER REFERENCES users(id),
    result      TEXT,
    komi        REAL    NOT NULL DEFAULT 6.5,
    board_state TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS moves (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id     INTEGER NOT NULL REFERENCES games(id),
    move_number INTEGER NOT NULL,
    player_id   INTEGER NOT NULL REFERENCES users(id),
    x           INTEGER,
    y           INTEGER,
    is_pass     INTEGER NOT NULL DEFAULT 0,
    captured    TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(game_id, move_number)
  );
`);

// Save to disk
function saveDb() {
  const data = db.export();
  writeFileSync(dbPath, Buffer.from(data), { mode: 0o600 });
}

// Save periodically and on changes
saveDb();

// Wrapper helpers to make the API easier to use (similar to better-sqlite3)
const dbHelper = {
  // Run a statement (INSERT, UPDATE, DELETE). Returns { lastInsertRowid, changes }
  run(sql, params = []) {
    db.run(sql, params);
    const lastId = db.exec('SELECT last_insert_rowid() as id');
    const changes = db.exec('SELECT changes() as c');
    saveDb();
    return {
      lastInsertRowid: lastId[0]?.values[0][0] || 0,
      changes: changes[0]?.values[0][0] || 0,
    };
  },

  // Get a single row as an object. Returns object or undefined
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      stmt.free();
      const row = {};
      cols.forEach((col, i) => { row[col] = vals[i]; });
      return row;
    }
    stmt.free();
    return undefined;
  },

  // Get all rows as array of objects
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    const cols = stmt.getColumnNames();
    while (stmt.step()) {
      const vals = stmt.get();
      const row = {};
      cols.forEach((col, i) => { row[col] = vals[i]; });
      rows.push(row);
    }
    stmt.free();
    return rows;
  },
};

export default dbHelper;
