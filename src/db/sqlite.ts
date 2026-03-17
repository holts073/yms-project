import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'database.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    permissions TEXT -- JSON string containing granular permissions
  );

  CREATE TABLE IF NOT EXISTS address_book (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'supplier' or 'transporter'
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    address TEXT,
    pickupAddress TEXT,
    otif INTEGER,
    remarks TEXT
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'container' or 'exworks'
    reference TEXT NOT NULL,
    supplierId TEXT NOT NULL,
    transporterId TEXT,
    forwarderId TEXT,
    status INTEGER NOT NULL DEFAULT 0,
    eta TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    
    -- Ex-Works & Extras
    transportCost REAL,
    weight REAL,
    palletType TEXT,
    palletCount INTEGER,
    cargoType TEXT,
    loadingCountry TEXT,
    loadingCity TEXT,
    palletExchange BOOLEAN,
    
    -- Container Specific
    etd TEXT,
    etaPort TEXT,
    etaWarehouse TEXT,
    originalEtaWarehouse TEXT,
    portOfArrival TEXT,
    billOfLading TEXT,
    containerNumber TEXT,
    
    -- Calculated/Metadata
    delayRisk TEXT,
    predictionReason TEXT,
    notes TEXT,
    statusHistory TEXT -- JSON string [0, 25, 50]
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    deliveryId TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending' | 'received' | 'missing'
    required BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY(deliveryId) REFERENCES deliveries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    reference TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    deliveryId TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    FOREIGN KEY(deliveryId) REFERENCES deliveries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL -- JSON string
  );
`);

// Migration for logs table
try {
  db.prepare("ALTER TABLE logs ADD COLUMN reference TEXT").run();
} catch (e) {
  // Column already exists
}


// Helper for settings
export function getSetting(key: string, defaultValue: any = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : defaultValue;
}

export function saveSetting(key: string, value: any) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}

// Database Seeder / Migrator will be written in server.ts
