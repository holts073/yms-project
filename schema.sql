CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    permissions TEXT -- JSON string containing granular permissions
  , requiresReset INTEGER DEFAULT 0);

CREATE TABLE address_book (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'supplier' or 'transporter'
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    address TEXT,
    pickupAddress TEXT,
    otif INTEGER,
    remarks TEXT
  , supplier_number TEXT, customer_number TEXT, pallet_rate REAL DEFAULT 0.00);

CREATE TABLE deliveries (
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
  , loadingTime TEXT, dockId INTEGER, customsStatus TEXT, dischargeTerminal TEXT, incoterm TEXT, readyForPickupDate TEXT, palletRate REAL DEFAULT 0.00);

CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    deliveryId TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending' | 'received' | 'missing'
    required BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY(deliveryId) REFERENCES deliveries(id) ON DELETE CASCADE
  );

CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT
  , reference TEXT);

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    deliveryId TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    FOREIGN KEY(deliveryId) REFERENCES deliveries(id) ON DELETE CASCADE
  );

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL -- JSON string
  );

CREATE TABLE yms_warehouses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
  , address TEXT, hasGate INTEGER DEFAULT 0, openingTime TEXT DEFAULT "07:00", closingTime TEXT DEFAULT "15:00", fastLaneThreshold INTEGER DEFAULT 12, minutesPerPallet INTEGER DEFAULT 2, baseUnloadingTime INTEGER DEFAULT 15);

CREATE TABLE yms_dock_overrides (
    id TEXT PRIMARY KEY,
    warehouseId TEXT NOT NULL,
    dockId INTEGER NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL,
    allowedTemperatures TEXT NOT NULL, startDate TEXT, endDate TEXT, -- JSON array
    FOREIGN KEY(dockId, warehouseId) REFERENCES yms_docks(id, warehouseId) ON DELETE CASCADE
  );

CREATE TABLE yms_alerts (
    id TEXT PRIMARY KEY,
    deliveryId TEXT,
    warehouseId TEXT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    message TEXT NOT NULL,
    resolved INTEGER DEFAULT 0
  );

CREATE TABLE pallet_transactions (
    id TEXT PRIMARY KEY,
    entityId TEXT NOT NULL,   -- supplierId or transporterId or customerId
    entityType TEXT NOT NULL, -- supplier, transporter, customer
    deliveryId TEXT NOT NULL, 
    balanceChange INTEGER NOT NULL,
    createdAt TEXT NOT NULL
  , palletType TEXT, palletRate REAL);

CREATE TABLE yms_docks (id INTEGER, warehouseId TEXT NOT NULL, name TEXT NOT NULL, allowedTemperatures TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Available', adminStatus TEXT NOT NULL DEFAULT 'Active', currentDeliveryId TEXT, isFastLane INTEGER DEFAULT 0, isOutboundOnly INTEGER DEFAULT 0, direction_capability TEXT NOT NULL DEFAULT 'BOTH', PRIMARY KEY(id, warehouseId), FOREIGN KEY(warehouseId) REFERENCES yms_warehouses(id) ON DELETE CASCADE);

CREATE TABLE yms_waiting_areas (id INTEGER, warehouseId TEXT NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Available', adminStatus TEXT NOT NULL DEFAULT 'Active', currentDeliveryId TEXT, PRIMARY KEY(id, warehouseId), FOREIGN KEY(warehouseId) REFERENCES yms_warehouses(id) ON DELETE CASCADE);

CREATE TABLE "yms_deliveries_backup" (
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
      isLate BOOLEAN DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PLANNED',
      statusTimestamps TEXT,
      estimatedDuration INTEGER DEFAULT 60,
      isReefer INTEGER DEFAULT 0,
      tempAlertThreshold INTEGER DEFAULT 30,
      lastEtaUpdate TEXT,
      direction TEXT DEFAULT 'INBOUND',
      palletCount INTEGER DEFAULT 0
    );

CREATE TABLE yms_deliveries (
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
  isLate INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PLANNED',
  statusTimestamps TEXT,
  estimatedDuration INTEGER DEFAULT 60,
  isReefer INTEGER DEFAULT 0,
  tempAlertThreshold INTEGER DEFAULT 30,
  lastEtaUpdate TEXT,
  direction TEXT DEFAULT 'INBOUND',
  palletCount INTEGER DEFAULT 0
, palletType TEXT DEFAULT 'EUR', palletRate REAL DEFAULT 0.00);

CREATE TABLE _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );

CREATE TABLE sqlite_sequence(name,seq);

CREATE TABLE yms_slots (
  id TEXT PRIMARY KEY,
  warehouseId TEXT NOT NULL,
  dockId INTEGER NOT NULL,
  deliveryId TEXT NOT NULL,
  startTime TEXT NOT NULL, -- ISO String (YYYY-MM-DDTHH:mm:00.000Z)
  endTime TEXT NOT NULL,   -- ISO String (YYYY-MM-DDTHH:mm:00.000Z)
  FOREIGN KEY(deliveryId) REFERENCES yms_deliveries(id) ON DELETE CASCADE,
  FOREIGN KEY(dockId, warehouseId) REFERENCES yms_docks(id, warehouseId) ON DELETE CASCADE
);