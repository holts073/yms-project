import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
const info = db.prepare(`PRAGMA table_info(deliveries)`).all();
const hasDockId = info.some(c => c.name === 'dockId');
console.log('Deliveries has dockId:', hasDockId);
if (hasDockId) {
    console.log('Column details:', info.find(c => c.name === 'dockId'));
}
