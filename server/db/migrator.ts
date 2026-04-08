import { Database } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Database Migrator for YMS Control Tower
 * This ensures the schema version matches the code.
 */
export async function runMigrations(db: Database) {
  console.log('[YMS MIGRATOR] Checking for database migrations...');

  // 1. Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // 2. Read migration files
  const migrationsDir = path.join(process.cwd(), 'server/db/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[YMS MIGRATOR] Migrations directory not found: ${migrationsDir}`);
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') || f.endsWith('.ts'))
    .sort(); // Ensure 001 runs before 002

  // 3. Apply missing migrations
  for (const file of files) {
    const isApplied = db.prepare('SELECT 1 FROM _migrations WHERE name = ?').get(file);

    if (!isApplied) {
      const filePath = path.join(migrationsDir, file);

      try {
        if (file.endsWith('.sql')) {
           // SQL migrations: Apply Synchronously within a formal transaction
           console.log(`[YMS MIGRATOR] Applying SQL migration (Sync): ${file}`);
           const sql = fs.readFileSync(filePath, 'utf8');
           db.transaction(() => {
             db.exec(sql);
             db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)')
               .run(file, new Date().toISOString());
           })();
           console.log(`[YMS MIGRATOR] Success: ${file}`);
        } else if (file.endsWith('.ts')) {
          // TS migrations: Use dynamic import (Async)
          console.log(`[YMS MIGRATOR] Applying TS migration (Async): ${file}`);
          const migrationContent = await import(pathToFileURL(filePath).href);
          
          db.transaction(() => {
             if (typeof migrationContent.up === 'function') {
               migrationContent.up(db);
             }
             db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)')
               .run(file, new Date().toISOString());
          })();
          console.log(`[YMS MIGRATOR] Success: ${file}`);
        }
      } catch (error) {
        console.error(`[YMS MIGRATOR] FAILED: ${file}`, error);
        throw error; // Stop the server if a migration fails
      }
    }
  }

  console.log('[YMS MIGRATOR] All migrations are up to date.');
}
