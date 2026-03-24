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

  CREATE TABLE IF NOT EXISTS yms_warehouses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT
  );
`);

// Migration for existing yms_warehouses
try {
  db.prepare('ALTER TABLE yms_warehouses ADD COLUMN address TEXT').run();
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS yms_docks (
    id INTEGER,
    warehouseId TEXT NOT NULL,
    name TEXT NOT NULL,
    allowedTemperatures TEXT NOT NULL, -- JSON array
    status TEXT NOT NULL DEFAULT 'Available',
    adminStatus TEXT NOT NULL DEFAULT 'Active',
    currentDeliveryId TEXT,
    isFastLane INTEGER DEFAULT 0,
    isOutboundOnly INTEGER DEFAULT 0,
    PRIMARY KEY(id, warehouseId),
    FOREIGN KEY(warehouseId) REFERENCES yms_warehouses(id) ON DELETE CASCADE
  );
`);

// Migration for yms_docks
try {
  db.prepare('ALTER TABLE yms_docks ADD COLUMN isOutboundOnly INTEGER DEFAULT 0').run();
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS yms_waiting_areas (
    id INTEGER,
    warehouseId TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available',
    adminStatus TEXT NOT NULL DEFAULT 'Active',
    currentDeliveryId TEXT,
    PRIMARY KEY(id, warehouseId),
    FOREIGN KEY(warehouseId) REFERENCES yms_warehouses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS yms_deliveries (
    id TEXT PRIMARY KEY,
    warehouseId TEXT NOT NULL,
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
    mainDeliveryId TEXT,
    registrationTime TEXT,
    isLate BOOLEAN,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    statusTimestamps TEXT, -- JSON record of timestamps
    estimatedDuration INTEGER DEFAULT 60,
    isReefer INTEGER DEFAULT 0,
    tempAlertThreshold INTEGER DEFAULT 30,
    lastEtaUpdate TEXT,
    direction TEXT DEFAULT 'INBOUND',
    palletCount INTEGER DEFAULT 0,
    FOREIGN KEY(warehouseId) REFERENCES yms_warehouses(id),
    FOREIGN KEY(dockId, warehouseId) REFERENCES yms_docks(id, warehouseId),
    FOREIGN KEY(waitingAreaId, warehouseId) REFERENCES yms_waiting_areas(id, warehouseId)
  );

  CREATE TABLE IF NOT EXISTS yms_dock_overrides (
    id TEXT PRIMARY KEY,
    warehouseId TEXT NOT NULL,
    dockId INTEGER NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL,
    allowedTemperatures TEXT NOT NULL, -- JSON array
    FOREIGN KEY(dockId, warehouseId) REFERENCES yms_docks(id, warehouseId) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS yms_alerts (
    id TEXT PRIMARY KEY,
    deliveryId TEXT,
    warehouseId TEXT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    message TEXT NOT NULL,
    resolved INTEGER DEFAULT 0
  );
`);

// YMS V3 Migrations
try {
  db.exec(`
    INSERT OR IGNORE INTO yms_warehouses (id, name, description) 
    VALUES ('W01', 'Magazijn 01', 'Hoofdmagazijn');
  `);
} catch (e) {}

const ymsTables = ['yms_docks', 'yms_waiting_areas', 'yms_deliveries', 'yms_dock_overrides'];
ymsTables.forEach(table => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN warehouseId TEXT NOT NULL DEFAULT 'W01'`).run();
  } catch (e) {}
});

// Initial Seed for docks
const dockCount = db.prepare("SELECT COUNT(*) as count FROM yms_docks WHERE warehouseId = 'W01'").get() as { count: number };
if (dockCount.count === 0) {
  const insertDock = db.prepare("INSERT INTO yms_docks (id, warehouseId, name, allowedTemperatures) VALUES (?, 'W01', ?, ?)");
  for (let i = 1; i <= 20; i++) {
    insertDock.run(i, `Dock ${i}`, JSON.stringify(['Droog', 'Vries', 'Koel']));
  }
}

// Initial Seed for waiting areas
const waitingAreaCount = db.prepare("SELECT COUNT(*) as count FROM yms_waiting_areas WHERE warehouseId = 'W01'").get() as { count: number };
if (waitingAreaCount.count === 0) {
  const insertWaitingArea = db.prepare("INSERT INTO yms_waiting_areas (id, warehouseId, name) VALUES (?, 'W01', ?)");
  for (let i = 1; i <= 10; i++) {
    insertWaitingArea.run(i, `Wachtplaats ${i}`);
  }
}

// Additional Migrations
const migrations = [
  { table: 'logs', column: 'reference', type: 'TEXT' },
  { table: 'deliveries', column: 'loadingTime', type: 'TEXT' },
  { table: 'deliveries', column: 'dockId', type: 'INTEGER' },
  { table: 'yms_deliveries', column: 'transporterId', type: 'TEXT' },
  { table: 'yms_deliveries', column: 'supplierId', type: 'TEXT' },
  { table: 'yms_deliveries', column: 'registrationTime', type: 'TEXT' },
  { table: 'yms_deliveries', column: 'isLate', type: 'BOOLEAN' },
  { table: 'yms_deliveries', column: 'statusTimestamps', type: 'TEXT' },
  { table: 'yms_deliveries', column: 'mainDeliveryId', type: 'TEXT' },
  { table: 'yms_deliveries', column: 'estimatedDuration', type: 'INTEGER DEFAULT 60' },
  { table: 'yms_deliveries', column: 'isReefer', type: 'INTEGER DEFAULT 0' },
  { table: 'yms_deliveries', column: 'tempAlertThreshold', type: 'INTEGER DEFAULT 30' },
  { table: 'yms_deliveries', column: 'lastEtaUpdate', type: 'TEXT' },
  { table: 'yms_deliveries', column: 'direction', type: 'TEXT DEFAULT "INBOUND"' },
  { table: 'yms_deliveries', column: 'palletCount', type: 'INTEGER DEFAULT 0' },
  { table: 'yms_docks', column: 'isFastLane', type: 'INTEGER DEFAULT 0' },
  { table: 'yms_docks', column: 'adminStatus', type: 'TEXT DEFAULT "Active"' },
  { table: 'yms_waiting_areas', column: 'adminStatus', type: 'TEXT DEFAULT "Active"' }
];

migrations.forEach(m => {
  try {
    db.prepare(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`).run();
  } catch (e) {}
});

// Helper for settings
export function getSetting(key: string, defaultValue: any = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : defaultValue;
}

export function saveSetting(key: string, value: any) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}
