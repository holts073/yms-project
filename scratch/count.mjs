import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
const res = db.prepare('SELECT count(*) as c FROM deliveries').get();
console.log('Deliveries:', res.c);
