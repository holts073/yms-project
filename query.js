const db = require('better-sqlite3')('db.sqlite');
console.log(db.prepare("SELECT * FROM pallet_transactions ORDER BY createdAt DESC LIMIT 5").all());
