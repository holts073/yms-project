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
    permissions TEXT, -- JSON string containing granular permissions
    requiresReset INTEGER DEFAULT 0 -- 0 = No, 1 = Yes
  );

  CREATE TABLE IF NOT EXISTS address_book (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'supplier' or 'transporter' or 'customer'
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    address TEXT,
    pickupAddress TEXT,
    otif INTEGER,
    remarks TEXT,
    supplier_number TEXT,
    customer_number TEXT
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
    incoterm TEXT,
    readyForPickupDate TEXT,
    
    -- Container Specific
    etd TEXT,
    etaPort TEXT,
    etaWarehouse TEXT,
    originalEtaWarehouse TEXT,
    portOfArrival TEXT,
    billOfLading TEXT,
    containerNumber TEXT,
    dockId INTEGER,
    customsStatus TEXT,
    dischargeTerminal TEXT,
    
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
    address TEXT,
    hasGate INTEGER DEFAULT 0 -- 0 = No Gate, 1 = Has Gate
  );

  CREATE TABLE IF NOT EXISTS pallet_transactions (
    id TEXT PRIMARY KEY,
    entityId TEXT NOT NULL,   -- supplierId or transporterId or customerId
    entityType TEXT NOT NULL, -- supplier, transporter, customer
    deliveryId TEXT NOT NULL, 
    balanceChange INTEGER NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

try {
  db.prepare('ALTER TABLE yms_warehouses ADD COLUMN address TEXT').run();
} catch (e) {}

try {
  db.prepare('ALTER TABLE yms_warehouses ADD COLUMN hasGate INTEGER DEFAULT 0').run();
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
    direction_capability TEXT NOT NULL DEFAULT 'BOTH', -- INBOUND, OUTBOUND, BOTH
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
    palletCount INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS yms_dock_overrides (
    id TEXT PRIMARY KEY,
    warehouseId TEXT NOT NULL,
    dockId INTEGER NOT NULL,
    startDate TEXT NOT NULL, -- YYYY-MM-DD
    endDate TEXT NOT NULL,   -- YYYY-MM-DD
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

  -- Performance Indices
  CREATE INDEX IF NOT EXISTS idx_docs_deliveryId ON documents(deliveryId);
  CREATE INDEX IF NOT EXISTS idx_audit_deliveryId ON audit_logs(deliveryId);
  CREATE INDEX IF NOT EXISTS idx_deliveries_ref ON deliveries(reference);
  CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
  CREATE INDEX IF NOT EXISTS idx_deliveries_etaW ON deliveries(etaWarehouse);
  CREATE INDEX IF NOT EXISTS idx_yms_del_ref ON yms_deliveries(reference);
  CREATE INDEX IF NOT EXISTS idx_yms_del_status ON yms_deliveries(status);
  CREATE INDEX IF NOT EXISTS idx_yms_del_dock ON yms_deliveries(dockId);
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
  { table: 'deliveries', column: 'customsStatus', type: 'TEXT' },
  { table: 'deliveries', column: 'dischargeTerminal', type: 'TEXT' },
  { table: 'deliveries', column: 'incoterm', type: 'TEXT' },
  { table: 'deliveries', column: 'readyForPickupDate', type: 'TEXT' },
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
  { table: 'yms_waiting_areas', column: 'adminStatus', type: 'TEXT DEFAULT "Active"' },
  { table: 'address_book', column: 'supplier_number', type: 'TEXT' },
  { table: 'address_book', column: 'customer_number', type: 'TEXT' },
  { table: 'users', column: 'requiresReset', type: 'INTEGER DEFAULT 0' }
];

migrations.forEach(m => {
  try {
    db.prepare(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`).run();
  } catch (e) {}
});

// Composite Unique Indices for Foreign Key support
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_yms_docks_composite ON yms_docks(id, warehouseId)');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_yms_waiting_areas_composite ON yms_waiting_areas(id, warehouseId)');
} catch (e) {}

// Structural migration for yms_dock_overrides
try {
    db.prepare('ALTER TABLE yms_dock_overrides ADD COLUMN startDate TEXT').run();
    db.prepare('ALTER TABLE yms_dock_overrides ADD COLUMN endDate TEXT').run();
    // Copy date to startDate if startDate is null
    db.exec("UPDATE yms_dock_overrides SET startDate = date, endDate = date WHERE startDate IS NULL");
} catch (e) {}

try {
    db.prepare("ALTER TABLE yms_docks ADD COLUMN direction_capability TEXT NOT NULL DEFAULT 'BOTH'").run();
} catch (e) {}

// Helper for settings
export function getSetting(key: string, defaultValue: any = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? JSON.parse(row.value) : defaultValue;
}

export function saveSetting(key: string, value: any) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}

// Initial Seed for shipment_settings (alleen als het nog niet bestaat)
const existingShipmentSettings = db.prepare("SELECT value FROM settings WHERE key = 'shipment_settings'").get();
if (!existingShipmentSettings) {
  const initialShipmentSettings = {
    container: [
      { name: 'Seaway Bill / B/L', required: true, triggers_status_jump: true, triggers_status_value: 25 },
      { name: 'Commercial Invoice', required: true, triggers_status_jump: false },
      { name: 'Packing List', required: true, triggers_status_jump: false },
      { name: 'Notification of Arrival', required: true, triggers_status_jump: true, triggers_status_value: 50 },
      { name: 'Certificate of Origin', required: false, triggers_status_jump: false }
    ],
    exworks: [
      { name: 'CMR / Vrachtbrief', required: true, triggers_status_jump: true, triggers_status_value: 50 },
      { name: 'Commercial Invoice', required: true, triggers_status_jump: false },
      { name: 'Packing List', required: true, triggers_status_jump: false }
    ]
  };
  db.prepare("INSERT INTO settings (key, value) VALUES ('shipment_settings', ?)").run(JSON.stringify(initialShipmentSettings));
}
