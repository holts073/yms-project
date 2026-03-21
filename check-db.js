import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'yms_%'").all();
console.log('Found YMS tables:', tables);

if (tables.length > 0) {
    tables.forEach(t => {
        const info = db.prepare(`PRAGMA table_info(${t.name})`).all();
        console.log(`Table ${t.name}:`, info.map(c => c.name));
    });
}
