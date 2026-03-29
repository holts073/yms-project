-- 001_initial_schema.sql
-- Baseline schema definition for YMS Control Tower

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions TEXT, 
  requiresReset INTEGER DEFAULT 0 
);

CREATE TABLE IF NOT EXISTS address_book (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, 
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
  type TEXT NOT NULL, 
  reference TEXT NOT NULL,
  supplierId TEXT NOT NULL,
  transporterId TEXT,
  forwarderId TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  eta TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
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
  notes TEXT,
  statusHistory TEXT, 
  loadingTime TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  deliveryId TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL, 
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
  value TEXT NOT NULL 
);

CREATE TABLE IF NOT EXISTS yms_warehouses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  hasGate INTEGER DEFAULT 0,
  openingTime TEXT DEFAULT '07:00',
  closingTime TEXT DEFAULT '15:00'
);

CREATE TABLE IF NOT EXISTS pallet_transactions (
  id TEXT PRIMARY KEY,
  entityId TEXT NOT NULL, 
  entityType TEXT NOT NULL, 
  deliveryId TEXT NOT NULL, 
  balanceChange INTEGER NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS yms_docks (
  id INTEGER,
  warehouseId TEXT NOT NULL,
  name TEXT NOT NULL,
  allowedTemperatures TEXT NOT NULL, 
  status TEXT NOT NULL DEFAULT 'Available',
  adminStatus TEXT NOT NULL DEFAULT 'Active',
  currentDeliveryId TEXT,
  isFastLane INTEGER DEFAULT 0,
  isOutboundOnly INTEGER DEFAULT 0,
  direction_capability TEXT NOT NULL DEFAULT 'BOTH',
  PRIMARY KEY(id, warehouseId),
  FOREIGN KEY(warehouseId) REFERENCES yms_warehouses(id) ON DELETE CASCADE
);

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
  statusTimestamps TEXT, 
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
  startDate TEXT NOT NULL, 
  endDate TEXT NOT NULL,   
  status TEXT NOT NULL,
  allowedTemperatures TEXT NOT NULL, 
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

-- Indices
CREATE INDEX IF NOT EXISTS idx_docs_deliveryId ON documents(deliveryId);
CREATE INDEX IF NOT EXISTS idx_audit_deliveryId ON audit_logs(deliveryId);
CREATE INDEX IF NOT EXISTS idx_deliveries_ref ON deliveries(reference);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_etaW ON deliveries(etaWarehouse);
CREATE INDEX IF NOT EXISTS idx_yms_del_ref ON yms_deliveries(reference);
CREATE INDEX IF NOT EXISTS idx_yms_del_status ON yms_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_yms_del_dock ON yms_deliveries(dockId);
CREATE UNIQUE INDEX IF NOT EXISTS idx_yms_docks_composite ON yms_docks(id, warehouseId);
CREATE UNIQUE INDEX IF NOT EXISTS idx_yms_waiting_areas_composite ON yms_waiting_areas(id, warehouseId);
