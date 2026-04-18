import Database from 'better-sqlite3';

const db = new Database(':memory:');
db.exec(`CREATE TABLE test (id INTEGER, val TEXT, other TEXT, more TEXT)`);

const stmt = db.prepare('INSERT INTO test (id, val, other, more) VALUES (?, ?, ?, ?)');

try {
  stmt.run(1, { foo: 'bar' }, 'str', 'str2');
  console.log('Success object');
} catch (e: any) {
  console.log('Object Error:', e.message);
}

try {
  stmt.run(1, undefined, 'str', 'str2');
  console.log('Success undefined');
} catch (e: any) {
  console.log('Undefined Error:', e.message);
}

