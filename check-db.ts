import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

const tables = [
  'deliveries',
  'yms_deliveries',
  'address_book',
  'users',
  'settings'
];

console.log('--- DATABASE CHECK ---');
for (const table of tables) {
  try {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    console.log(`${table}: ${row.count} rows`);
    if (row.count > 0 && table !== 'users' && table !== 'settings') {
        const samples = db.prepare(`SELECT * FROM ${table} LIMIT 2`).all();
        console.log(`Samples for ${table}:`, JSON.stringify(samples, null, 2));
    }
  } catch (e) {
    console.log(`${table}: ERROR - ${e.message}`);
  }
}
