import Database from 'better-sqlite3';
import { join } from 'path';
import { runMigrations } from '../../server/db/migrator';
import fs from 'fs';

const dbPath = join(process.cwd(), 'database.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode
db.pragma('journal_mode = WAL');

/**
 * SUPER-CRITICAL: Synchronous Schema Sync
 * We must apply .sql migrations BEFORE any other module (like queries.ts) 
 * can call db.prepare(). 
 */
function applySyncMigrations() {
  const migrationsDir = join(process.cwd(), 'server/db/migrations');
  if (!fs.existsSync(migrationsDir)) return;

  // Initialize migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const isApplied = db.prepare('SELECT 1 FROM _migrations WHERE name = ?').get(file);
    if (!isApplied) {
      console.log(`[YMS SQL-SYNC] Applying: ${file}`);
      const sql = fs.readFileSync(join(migrationsDir, file), 'utf8');
      try {
        db.transaction(() => {
          db.exec(sql);
          db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)')
            .run(file, new Date().toISOString());
        })();
      } catch (e) {
        console.error(`[YMS SQL-SYNC] FAILED ${file}:`, e);
        throw e;
      }
    }
  }
}

// Apply SQL migrations synchronously at boot time
applySyncMigrations();

// Handle TS migrations (seeds) asynchronously in background
export const dbReady = (async () => {
  try {
    await runMigrations(db); // This will skip already applied SQLs and run TS
    console.log('[YMS BOOTSTRAP] Database is fully ready (Schema & Seeds)');
  } catch (error) {
    console.error('[YMS BOOTSTRAP] Async migration failure:', error);
    throw error;
  }
})();

// Helper for settings
export function getSetting(key: string, defaultValue: any = null) {
  // Migrations (v3.14.0 - Security)
  try { db.prepare("ALTER TABLE users ADD COLUMN twoFactorSecret TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN twoFactorEnabled INTEGER DEFAULT 0").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE logs ADD COLUMN warehouseId TEXT").run(); } catch(e) {}
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : defaultValue;
}

export function saveSetting(key: string, value: any) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}
