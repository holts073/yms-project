import Database from 'better-sqlite3';

const db = new Database('database.sqlite');
const users = db.prepare('SELECT email, passwordHash FROM users').all();
console.log('Users in DB:');
console.table(users);
