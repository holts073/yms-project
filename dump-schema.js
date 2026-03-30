const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('database.sqlite');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table'").all();

const schemaText = schema.map(row => row.sql + ';').join('\n\n');
fs.writeFileSync('schema.sql', schemaText);

console.log('✅ Schema is opgeslagen in schema.sql');
db.close();
