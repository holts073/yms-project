import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
const delCols = db.prepare("PRAGMA table_info(deliveries)").all();
const ymsCols = db.prepare("PRAGMA table_info(yms_deliveries)").all();
console.log('Deliveries columns:', delCols.map(c => c.name).filter(n => n.toLowerCase().includes('pallet')));
console.log('YMS Deliveries columns:', ymsCols.map(c => c.name).filter(n => n.toLowerCase().includes('pallet')));
