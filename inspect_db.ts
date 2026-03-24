import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log("--- yms_docks schema ---");
const docksSchema = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'yms_docks'").get();
console.log(docksSchema?.sql);

console.log("\n--- yms_dock_overrides schema ---");
const overridesSchema = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'yms_dock_overrides'").get();
console.log(overridesSchema?.sql);

console.log("\n--- PRAGMA foreign_key_list(yms_dock_overrides) ---");
const fkList = db.prepare("PRAGMA foreign_key_list(yms_dock_overrides)").all();
console.table(fkList);
