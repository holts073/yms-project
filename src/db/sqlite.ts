import Database from 'better-sqlite3';
import { join } from 'path';
import { runMigrations } from '../../server/db/migrator';

const dbPath = join(process.cwd(), 'database.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema and run migrations (synchronous)
// runMigrations returns a Promise but better-sqlite3 uses sync calls within transactions.
// Since this is top-level, we wrap it in an async execution for the migrator.
(async () => {
  try {
    await runMigrations(db);
  } catch (error) {
    console.error('[YMS BOOTSTRAP] Migration failure, server might be unstable:', error);
  }
})();

// Helper for settings
export function getSetting(key: string, defaultValue: any = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : defaultValue;
}

export function saveSetting(key: string, value: any) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}
