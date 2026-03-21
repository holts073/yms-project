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
    dockId INTEGER,
    
    -- Calculated/Metadata
    delayRisk TEXT,
    predictionReason TEXT,
    notes TEXT,
    statusHistory TEXT, -- JSON string [0, 25, 50]
    loadingTime TEXT
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

  CREATE TABLE IF NOT EXISTS yms_docks (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    allowedTemperatures TEXT NOT NULL, -- JSON array
    status TEXT NOT NULL DEFAULT 'Available',
    currentDeliveryId TEXT
  );

  CREATE TABLE IF NOT EXISTS yms_waiting_areas (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available',
    currentDeliveryId TEXT
  );

  CREATE TABLE IF NOT EXISTS yms_deliveries (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL,
    licensePlate TEXT NOT NULL,
    supplier TEXT NOT NULL,
    temperature TEXT NOT NULL,
    scheduledTime TEXT NOT NULL,
    arrivalTime TEXT,
    dockId INTEGER,
    waitingAreaId INTEGER,
    transporterId TEXT,
    supplierId TEXT,
    registrationTime TEXT,
    isLate BOOLEAN,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    FOREIGN KEY(dockId) REFERENCES yms_docks(id),
    FOREIGN KEY(waitingAreaId) REFERENCES yms_waiting_areas(id)
  );
`);

// Initial Seed for docks
const dockCount = db.prepare('SELECT COUNT(*) as count FROM yms_docks').get() as { count: number };
if (dockCount.count === 0) {
  const insertDock = db.prepare('INSERT INTO yms_docks (id, name, allowedTemperatures) VALUES (?, ?, ?)');
  for (let i = 1; i <= 20; i++) {
    insertDock.run(i, `Dock ${i}`, JSON.stringify(['Droog', 'Vries', 'Koel']));
  }
}

// Initial Seed for waiting areas
const waitingAreaCount = db.prepare('SELECT COUNT(*) as count FROM yms_waiting_areas').get() as { count: number };
if (waitingAreaCount.count === 0) {
  const insertWaitingArea = db.prepare('INSERT INTO yms_waiting_areas (id, name) VALUES (?, ?)');
  for (let i = 1; i <= 10; i++) {
    insertWaitingArea.run(i, `Wachtplaats ${i}`);
  }
}

// Initial Seed for shipment_settings
const existingSettings = db.prepare('SELECT value FROM settings WHERE key = ?').get('shipment_settings');
if (!existingSettings) {
  const initialShipmentSettings = {
    container: [
      { name: 'Seaway Bill / B/L', required: true },
      { name: 'Commercial Invoice', required: true },
      { name: 'Packing List', required: true },
      { name: 'Notification of Arrival', required: true },
      { name: 'Certificate of Origin', required: false }
    ],
    exworks: [
      { name: 'CMR / Vrachtbrief', required: true },
      { name: 'Commercial Invoice', required: true },
      { name: 'Packing List', required: true }
    ]
  };
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('shipment_settings', JSON.stringify(initialShipmentSettings));
}

// Migration for logs table
try {
  db.prepare("ALTER TABLE logs ADD COLUMN reference TEXT").run();
} catch (e) {
  // Column already exists
}

try {
  db.prepare("ALTER TABLE deliveries ADD COLUMN loadingTime TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE deliveries ADD COLUMN dockId INTEGER").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE yms_deliveries ADD COLUMN transporterId TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE yms_deliveries ADD COLUMN supplierId TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE yms_deliveries ADD COLUMN registrationTime TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE yms_deliveries ADD COLUMN isLate BOOLEAN").run();
} catch (e) {}


// Helper for settings
export function getSetting(key: string, defaultValue: any = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : defaultValue;
}

export function saveSetting(key: string, value: any) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}

// Database Seeder / Migrator will be written in server.ts
