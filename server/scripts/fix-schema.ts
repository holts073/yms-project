import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('Checking for requiresReset column in users table...');
try {
  db.prepare('ALTER TABLE users ADD COLUMN requiresReset INTEGER DEFAULT 0').run();
  console.log('Column added successfully.');
} catch (e: any) {
  if (e.message.includes('duplicate column name')) {
    console.log('Column already exists.');
  } else {
    console.error('Error adding column:', e.message);
  }
}

const info = db.prepare('PRAGMA table_info(users)').all();
console.log('Schema:', JSON.stringify(info, null, 2));
db.close();
