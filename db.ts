import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('yms.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  );
`);

export const getState = () => {
  const row = db.prepare('SELECT data FROM state WHERE id = 1').get() as { data: string } | undefined;
  return row ? JSON.parse(row.data) : null;
};

export const saveState = (state: any) => {
  const data = JSON.stringify(state);
  db.prepare('INSERT OR REPLACE INTO state (id, data) VALUES (1, ?)')
    .run(data);
};

export default db;
