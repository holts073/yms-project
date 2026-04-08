import { db } from './sqlite';
import { 
  Delivery, 
  Document, 
  AuditEntry, 
  AddressEntry, 
  User, 
  YmsDock, 
  YmsWaitingArea, 
  YmsDelivery, 
  YmsWarehouse, 
  YmsDockOverride, 
  YmsAlert,
  LogEntry,
  PalletTransaction
} from '../types';

// Cached Prepared Statements
const stmts = {
  getDocsByDeliveryId: db.prepare('SELECT * FROM documents WHERE deliveryId = ?'),
  getAuditByDeliveryId: db.prepare('SELECT * FROM audit_logs WHERE deliveryId = ?'),
  getAllDocs: db.prepare('SELECT * FROM documents'),
  getAllAudit: db.prepare('SELECT * FROM audit_logs'),
  getDocsBatch: (ids: string[]) => db.prepare(`SELECT * FROM documents WHERE deliveryId IN (${ids.map(() => '?').join(',')})`),
  getAuditBatch: (ids: string[]) => db.prepare(`SELECT * FROM audit_logs WHERE deliveryId IN (${ids.map(() => '?').join(',')})`),
  insertDelivery: db.prepare(`
    INSERT OR REPLACE INTO deliveries (
      id, type, reference, supplierId, transporterId, forwarderId, status, eta, createdAt, updatedAt, warehouseId,
      transportCost, weight, palletType, palletCount, palletRate, cargoType, loadingCountry, loadingCity, palletExchange,
      etd, etaPort, etaWarehouse, originalEtaWarehouse, portOfArrival, billOfLading, containerNumber,
      notes, statusHistory, loadingTime, dockId, customsStatus, dischargeTerminal, incoterm, readyForPickupDate, requiresQA,
      demurrageDailyRate, standingTimeCost, thcCost, customsCost
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  deleteDocs: db.prepare('DELETE FROM documents WHERE deliveryId = ?'),
  insertDoc: db.prepare('INSERT INTO documents (id, deliveryId, name, status, required, blocksMilestone) VALUES (?, ?, ?, ?, ?, ?)'),
  deleteAudit: db.prepare('DELETE FROM audit_logs WHERE deliveryId = ?'),
  insertAudit: db.prepare('INSERT INTO audit_logs (id, deliveryId, timestamp, user, action, details) VALUES (?, ?, ?, ?, ?, ?)'),
  deleteDelivery: db.prepare('DELETE FROM deliveries WHERE id = ?'),
  getUsers: db.prepare('SELECT * FROM users'),
  getUserPassword: db.prepare('SELECT passwordHash FROM users WHERE id = ?'),
  insertUser: db.prepare('INSERT OR REPLACE INTO users (id, name, email, passwordHash, role, permissions, requiresReset, twoFactorSecret, twoFactorEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
  getAddressBook: db.prepare('SELECT * FROM address_book ORDER BY name ASC'),
  insertAddressBook: db.prepare('INSERT OR REPLACE INTO address_book (id, type, name, contact, email, address, pickupAddress, otif, remarks, supplier_number, customer_number, pallet_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  deleteAddressBook: db.prepare('DELETE FROM address_book WHERE id = ?'),
  getLogs: db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100'),
  insertLog: db.prepare('INSERT INTO logs (id, timestamp, user, action, details, reference, warehouseId) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  getYmsDocks: db.prepare('SELECT * FROM yms_docks'),
  getYmsDocksByWarehouse: db.prepare('SELECT * FROM yms_docks WHERE warehouseId = ? ORDER BY name ASC'),
  saveYmsDock: db.prepare(`
    INSERT OR REPLACE INTO yms_docks (
      name, allowedTemperatures, status, adminStatus, currentDeliveryId, isFastLane, direction_capability, id, warehouseId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getYmsWaitingAreas: db.prepare('SELECT * FROM yms_waiting_areas'),
  getYmsWaitingAreasByWarehouse: db.prepare('SELECT * FROM yms_waiting_areas WHERE warehouseId = ? ORDER BY name ASC'),
  saveYmsWaitingArea: db.prepare(`
    INSERT OR REPLACE INTO yms_waiting_areas (
      name, status, adminStatus, currentDeliveryId, id, warehouseId
    ) VALUES (?, ?, ?, ?, ?, ?)
  `),
  getYmsDeliveries: db.prepare('SELECT * FROM yms_deliveries'),
  getYmsDeliveriesByWarehouse: db.prepare('SELECT * FROM yms_deliveries WHERE warehouseId = ?'),
  insertYmsDelivery: db.prepare(`
    INSERT OR REPLACE INTO yms_deliveries (
      id, warehouseId, reference, licensePlate, supplier, supplierId, mainDeliveryId, temperature, 
      scheduledTime, arrivalTime, registrationTime, isLate, dockId, waitingAreaId, transporterId, status, statusTimestamps,
      estimatedDuration, isReefer, tempAlertThreshold, lastEtaUpdate,
      direction, palletCount, palletType, palletRate, notes, requiresQA,
      incoterm, demurrageDailyRate, standingTimeCost, thcCost, customsCost
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  deleteYmsDelivery: db.prepare('DELETE FROM yms_deliveries WHERE id = ?'),
  deleteYmsDock: db.prepare('DELETE FROM yms_docks WHERE id = ? AND warehouseId = ?'),
  deleteYmsWaitingArea: db.prepare('DELETE FROM yms_waiting_areas WHERE id = ? AND warehouseId = ?'),
  getYmsWarehouses: db.prepare('SELECT * FROM yms_warehouses'),
  insertYmsWarehouse: db.prepare('INSERT OR REPLACE INTO yms_warehouses (id, name, description, address, hasGate, fastLaneThreshold, minutesPerPallet, baseUnloadingTime, openingTime, closingTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  getYmsDockOverrides: db.prepare('SELECT * FROM yms_dock_overrides'),
  getYmsDockOverridesByWarehouse: db.prepare('SELECT * FROM yms_dock_overrides WHERE warehouseId = ?'),
  insertYmsDockOverride: db.prepare(`
    INSERT OR REPLACE INTO yms_dock_overrides (id, warehouseId, dockId, startDate, endDate, status, allowedTemperatures)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  deleteYmsDockOverride: db.prepare('DELETE FROM yms_dock_overrides WHERE id = ?'),
  getYmsAlerts: db.prepare('SELECT * FROM yms_alerts'),
  getYmsAlertsByWarehouse: db.prepare('SELECT * FROM yms_alerts WHERE warehouseId = ?'),
  insertYmsAlert: db.prepare(`
    INSERT OR REPLACE INTO yms_alerts (id, deliveryId, warehouseId, type, severity, timestamp, message, resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  deleteYmsAlert: db.prepare('DELETE FROM yms_alerts WHERE id = ?'),
  resolveYmsAlert: db.prepare('UPDATE yms_alerts SET resolved = 1 WHERE id = ?'),
  getPalletTransactionsByEntity: db.prepare('SELECT * FROM pallet_transactions WHERE entityId = ? ORDER BY createdAt DESC'),
  getPalletTransactions: db.prepare('SELECT * FROM pallet_transactions ORDER BY createdAt DESC'),
  insertPalletTransaction: db.prepare('INSERT OR REPLACE INTO pallet_transactions (id, entityId, entityType, deliveryId, balanceChange, palletType, palletRate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  getYmsSlots: db.prepare('SELECT * FROM yms_slots WHERE warehouseId = ?'),
  insertYmsSlot: db.prepare('INSERT OR REPLACE INTO yms_slots (id, warehouseId, dockId, deliveryId, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?)'),
  deleteYmsSlot: db.prepare('DELETE FROM yms_slots WHERE id = ?'),
  deleteYmsSlotByDelivery: db.prepare('DELETE FROM yms_slots WHERE deliveryId = ?')
};

export function getAllDeliveries(page: number = 1, limit: number = 1000, search: string = '', typeFilter: string = 'all', sort: string = 'eta', statusLess100: boolean = false) {
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM deliveries WHERE 1=1';
  const params: any[] = [];

  if (statusLess100) {
    query += ' AND status < 100';
  }

  if (search) {
    query += ' AND (reference LIKE ? OR billOfLading LIKE ? OR containerNumber LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (typeFilter && typeFilter !== 'all') {
    query += ' AND type = ?';
    params.push(typeFilter);
  }

  const validSorts = ['eta', 'reference', 'status'];
  if (sort && validSorts.includes(sort)) {
    query += ` ORDER BY ${sort} ASC`;
  } else {
    query += ' ORDER BY createdAt DESC';
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const totalRow = db.prepare(countQuery).get(...params) as { count: number };

  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params) as Record<string, any>[];

  if (rows.length === 0) {
    return { deliveries: [], total: totalRow.count, totalPages: Math.ceil(totalRow.count / limit), currentPage: page };
  }

  // Optimized Fetch: Batch documents and audit logs for all rows on the page
  const ids = rows.map(r => r.id);
  const allDocs = stmts.getDocsBatch(ids).all(...ids) as Record<string, any>[];
  const allAudit = stmts.getAuditBatch(ids).all(...ids) as Record<string, any>[];

  const docsMap = allDocs.reduce((acc, d) => {
    if (!acc[d.deliveryId]) acc[d.deliveryId] = [];
    acc[d.deliveryId].push({ 
      id: d.id,
      name: d.name,
      status: d.status,
      required: d.required === 1,
      blocksMilestone: d.blocksMilestone 
    });
    return acc;
  }, {} as Record<string, Document[]>);

  const auditMap = allAudit.reduce((acc, a) => {
    if (!acc[a.deliveryId]) acc[a.deliveryId] = [];
    acc[a.deliveryId].push({
      timestamp: a.timestamp,
      user: a.user,
      action: a.action,
      details: a.details
    });
    return acc;
  }, {} as Record<string, AuditEntry[]>);

  const deliveries: Delivery[] = rows.map(r => ({
    ...r,
    type: r.type as 'container' | 'exworks',
    status: r.status as number,
    palletExchange: r.palletExchange === 1,
    statusHistory: r.statusHistory ? JSON.parse(r.statusHistory) : [],
    documents: docsMap[r.id] || [],
    auditTrail: auditMap[r.id] || []
  } as Delivery));

  return {
    deliveries,
    total: totalRow.count,
    totalPages: Math.ceil(totalRow.count / limit),
    currentPage: page
  };
}

export function insertDelivery(d: Delivery) {
  db.transaction(() => {
    stmts.insertDelivery.run(
      d.id, d.type, d.reference, d.supplierId, d.transporterId, d.forwarderId, d.status, d.eta, d.createdAt, d.updatedAt, d.warehouseId || 'W01',
      d.transportCost, d.weight, d.palletType || null, d.palletCount || 0, d.palletRate || 0, d.cargoType, d.loadingCountry, d.loadingCity, d.palletExchange ? 1 : 0,
      d.etd, d.etaPort, d.etaWarehouse, d.originalEtaWarehouse, d.portOfArrival, d.billOfLading, d.containerNumber,
      d.notes, d.statusHistory ? JSON.stringify(d.statusHistory) : null, d.loadingTime, d.dockId || null,
      d.customsStatus || null, d.dischargeTerminal || null, d.incoterm || null, d.readyForPickupDate || null,
      d.requiresQA ? 1 : 0,
      d.demurrageDailyRate || 0, d.standingTimeCost || 0, d.thcCost || 0, d.customsCost || 0
    );

    // Documents
    stmts.deleteDocs.run(d.id);
    if (d.documents) {
      for (const doc of d.documents) {
        stmts.insertDoc.run(doc.id, d.id, doc.name, doc.status, doc.required ? 1 : 0, doc.blocksMilestone || 100);
      }
    }

    // Audit logs - Append only new entries
    if (d.auditTrail && d.auditTrail.length > 0) {
      const lastAudit = d.auditTrail[d.auditTrail.length - 1];
      
      // Check if this specific log already exists to prevent duplicates during syncs
      const existing = db.prepare('SELECT id FROM audit_logs WHERE deliveryId = ? AND timestamp = ? AND action = ?').get(d.id, lastAudit.timestamp, lastAudit.action);
      
      if (!existing) {
        stmts.insertAudit.run(Math.random().toString(36).substr(2, 9), d.id, lastAudit.timestamp, lastAudit.user, lastAudit.action, lastAudit.details);
      }
    }
  })();
}

export function deleteDelivery(id: string) {
  stmts.deleteDelivery.run(id);
}

// Helpers for other entities...
export function getUsers(): User[] {
  const users = stmts.getUsers.all() as Record<string, any>[];
  return users.map(u => ({
    ...u,
    permissions: u.permissions ? JSON.parse(u.permissions) : undefined,
    requiresReset: u.requiresReset === 1
  } as User));
}

export function saveUser(u: User) {
  const existing = db.prepare('SELECT passwordHash, requiresReset FROM users WHERE id = ?').get(u.id) as { passwordHash: string, requiresReset: number } | undefined;
  const passwordHash = u.passwordHash || existing?.passwordHash || null;
  const requiresReset = u.requiresReset !== undefined ? (u.requiresReset ? 1 : 0) : (existing?.requiresReset || 0);
  
  stmts.insertUser.run(u.id, u.name, u.email, passwordHash, u.role, u.permissions ? JSON.stringify(u.permissions) : null, requiresReset, u.twoFactorSecret || null, u.twoFactorEnabled ? 1 : 0);
}

export function deleteUser(id: string) {
  stmts.deleteUser.run(id);
}

export function getAddressBook() {
  const all = stmts.getAddressBook.all() as AddressEntry[];
  const suppliers = all.filter(e => e.type === 'supplier');
  const transporters = all.filter(e => e.type === 'transporter');
  const customers = all.filter(e => e.type === 'customer');
  return { suppliers, transporters, customers };
}

export function saveAddressBookEntry(entry: AddressEntry) {
  return stmts.insertAddressBook.run(
    entry.id, 
    entry.type, 
    entry.name, 
    entry.contact, 
    entry.email, 
    entry.address, 
    entry.pickupAddress || null, 
    entry.otif || 0, 
    entry.remarks || null,
    entry.supplier_number || null,
    entry.customer_number || null,
    entry.pallet_rate || 0.00
  );
}

export function deleteAddressEntry(id: string) {
  stmts.deleteAddressBook.run(id);
}

export function savePalletTransaction(t: { entityId: string, entityType: string, deliveryId: string, balanceChange: number, palletType?: string, palletRate?: number }) {
  stmts.insertPalletTransaction.run(
    Math.random().toString(36).substr(2, 9),
    t.entityId,
    t.entityType,
    t.deliveryId,
    t.balanceChange,
    t.palletType || null,
    t.palletRate || 0,
    new Date().toISOString()
  );
}

export function getPalletBalances() {
  const rows = db.prepare('SELECT entityId, SUM(balanceChange) as balance FROM pallet_transactions GROUP BY entityId').all() as { entityId: string, balance: number }[];
  return rows.reduce((acc, r) => {
    acc[r.entityId] = r.balance;
    return acc;
  }, {} as Record<string, number>);
}

export function getPalletTransactions(entityId?: string): PalletTransaction[] {
  if (entityId) {
    return stmts.getPalletTransactionsByEntity.all(entityId) as PalletTransaction[];
  }
  return stmts.getPalletTransactions.all() as PalletTransaction[];
}

export function getLogs() {
  return stmts.getLogs.all();
}


export function saveLog(log: Omit<LogEntry, 'id'>) {
  stmts.insertLog.run(Math.random().toString(36).substr(2, 9), log.timestamp, log.user, log.action, log.details, log.reference || null, log.warehouseId || null);
}

export const addLog = (log: Omit<LogEntry, 'id'>) => saveLog(log);

export function addAuditEntry(deliveryId: string, user: string, action: string, details: string) {
  stmts.insertAudit.run(Math.random().toString(36).substr(2, 9), deliveryId, new Date().toISOString(), user, action, details);
}

// YMS Queries
export function getYmsDocks(warehouseId?: string, includeAll: boolean = false): (YmsDock & { isOverridden: boolean })[] {
  let query = "SELECT * FROM yms_docks";
  const params: (string | number)[] = [];
  
  if (warehouseId) {
    query += " WHERE warehouseId = ?";
    params.push(warehouseId);
  }
  
  if (!includeAll) {
    query += warehouseId ? " AND adminStatus = 'Active'" : " WHERE adminStatus = 'Active'";
  }

  query += " ORDER BY id ASC";

  const docks = db.prepare(query).all(...params) as Record<string, any>[];
  const overrides = getYmsDockOverrides(warehouseId);
  const now = new Date().toISOString().split('T')[0];

  return (docks as Record<string, any>[]).map(d => {
    // Process overrides for today
    const activeOverride = overrides.find(o => o.dockId === d.id && o.startDate <= now && o.endDate >= now);
    if (activeOverride) {
      return {
        ...d,
        allowedTemperatures: activeOverride.allowedTemperatures,
        status: activeOverride.status === 'Blocked' ? 'Blocked' : d.status,
        isOverridden: true
      } as YmsDock & { isOverridden: boolean };
    }
    return {
      ...d,
      allowedTemperatures: JSON.parse(d.allowedTemperatures),
      isOverridden: false
    } as YmsDock & { isOverridden: boolean };
  });
}

export function saveYmsDock(dock: YmsDock) {
  stmts.saveYmsDock.run(dock.name, JSON.stringify(dock.allowedTemperatures), dock.status, dock.adminStatus || 'Active', dock.currentDeliveryId || null, dock.isFastLane ? 1 : 0, dock.direction_capability || 'BOTH', dock.id, dock.warehouseId);
}

export function getYmsWaitingAreas(warehouseId?: string, includeAll: boolean = false): YmsWaitingArea[] {
  let query = "SELECT * FROM yms_waiting_areas";
  const params: any[] = [];
  
  if (warehouseId) {
    query += " WHERE warehouseId = ?";
    params.push(warehouseId);
  }
  
  if (!includeAll) {
    query += warehouseId ? " AND adminStatus = 'Active'" : " WHERE adminStatus = 'Active'";
  }

  query += " ORDER BY id ASC";

  return db.prepare(query).all(...params) as YmsWaitingArea[];
}

export function saveYmsWaitingArea(wa: YmsWaitingArea) {
  stmts.saveYmsWaitingArea.run(wa.name, wa.status, wa.adminStatus || 'Active', wa.currentDeliveryId || null, wa.id, wa.warehouseId);
}

export function getYmsDeliveries(warehouseId?: string): YmsDelivery[] {
  const rows = (warehouseId ? stmts.getYmsDeliveriesByWarehouse.all(warehouseId) : stmts.getYmsDeliveries.all()) as Record<string, any>[];
  return rows.map(r => ({
    ...r,
    isReefer: r.isReefer === 1,
    isLate: r.isLate === 1,
    statusTimestamps: r.statusTimestamps ? JSON.parse(r.statusTimestamps) : {},
    direction: r.direction || 'INBOUND',
    palletCount: r.palletCount || 0
  } as YmsDelivery));
}

export function saveYmsDelivery(d: YmsDelivery) {
  stmts.insertYmsDelivery.run(
    d.id,
    d.warehouseId || 'W01',
    d.reference,
    d.licensePlate,
    d.supplier,
    d.supplierId || null,
    d.mainDeliveryId || null,
    d.temperature,
    d.scheduledTime,
    d.arrivalTime || null,
    d.registrationTime || null,
    d.isLate ? 1 : 0,
    d.dockId || null,
    d.waitingAreaId || null,
    d.transporterId || null,
    d.status,
    d.statusTimestamps ? JSON.stringify(d.statusTimestamps) : null,
    d.estimatedDuration || 60,
    d.isReefer ? 1 : 0,
    d.tempAlertThreshold || 30,
    d.lastEtaUpdate || null,
    d.direction || 'INBOUND',
    d.palletCount || 0,
    d.palletType || 'EUR',
    d.palletRate || 0,
    d.notes || null,
    d.requiresQA ? 1 : 0,
    d.incoterm || 'EXW',
    d.demurrageDailyRate || 0,
    d.standingTimeCost || 0,
    d.thcCost || 0,
    d.customsCost || 0
  );
}

export function deleteYmsDelivery(id: string) {
  stmts.deleteYmsDelivery.run(id);
}

export function deleteYmsDock(id: number, warehouseId: string) {
  stmts.deleteYmsDock.run(id, warehouseId);
}

export function deleteYmsWaitingArea(id: number, warehouseId: string) {
  stmts.deleteYmsWaitingArea.run(id, warehouseId);
}

export function getYmsWarehouses(): YmsWarehouse[] {
  const rows = stmts.getYmsWarehouses.all() as Record<string, any>[];
  return rows.map(r => ({
    ...r,
    hasGate: r.hasGate === 1
  } as YmsWarehouse));
}

export function saveYmsWarehouse(w: YmsWarehouse) {
  const isNew = !db.prepare('SELECT id FROM yms_warehouses WHERE id = ?').get(w.id);
  stmts.insertYmsWarehouse.run(
    w.id, 
    w.name, 
    w.description || null, 
    w.address || null, 
    w.hasGate ? 1 : 0,
    w.fastLaneThreshold || 12,
    w.minutesPerPallet || 2,
    w.baseUnloadingTime || 15,
    w.openingTime || '07:00',
    w.closingTime || '15:00'
  );
  
  if (isNew) {
    initializeWarehouseInfrastructure(w.id);
  }
}

export function initializeWarehouseInfrastructure(warehouseId: string) {
  db.transaction(() => {
    // Standard Docks (1-10)
    const insertDock = db.prepare("INSERT OR IGNORE INTO yms_docks (id, warehouseId, name, allowedTemperatures, status, adminStatus, direction_capability) VALUES (?, ?, ?, ?, 'Available', 'Active', 'BOTH')");
    for (let i = 1; i <= 10; i++) {
      insertDock.run(i, warehouseId, `Dock ${i}`, JSON.stringify(['Droog', 'Vries', 'Koel']));
    }

    // Standard Waiting Areas (W1-W5)
    const insertWaitingArea = db.prepare("INSERT OR IGNORE INTO yms_waiting_areas (id, warehouseId, name, status, adminStatus) VALUES (?, ?, ?, 'Available', 'Active')");
    for (let i = 1; i <= 5; i++) {
      insertWaitingArea.run(i, warehouseId, `Wachtplaats ${i}`);
    }
  })();
}

export function deleteYmsWarehouse(id: string) {
  db.transaction(() => {
    db.prepare('DELETE FROM yms_docks WHERE warehouseId = ?').run(id);
    db.prepare('DELETE FROM yms_waiting_areas WHERE warehouseId = ?').run(id);
    db.prepare('DELETE FROM yms_deliveries WHERE warehouseId = ?').run(id);
    db.prepare('DELETE FROM yms_dock_overrides WHERE warehouseId = ?').run(id);
    db.prepare('DELETE FROM yms_warehouses WHERE id = ?').run(id);
  })();
}

export function getYmsDockOverrides(warehouseId?: string): YmsDockOverride[] {
  const rows = (warehouseId ? stmts.getYmsDockOverridesByWarehouse.all(warehouseId) : stmts.getYmsDockOverrides.all()) as Record<string, any>[];
  return rows.map(r => ({
    ...r,
    allowedTemperatures: JSON.parse(r.allowedTemperatures)
  } as YmsDockOverride));
}

export function saveYmsDockOverride(o: YmsDockOverride) {
  stmts.insertYmsDockOverride.run(o.id, o.warehouseId, o.dockId, o.startDate, o.endDate, o.status, JSON.stringify(o.allowedTemperatures));
}

export function deleteYmsDockOverride(id: string) {
  stmts.deleteYmsDockOverride.run(id);
}

export function getYmsAlerts(warehouseId?: string): YmsAlert[] {
  const rows = (warehouseId ? stmts.getYmsAlertsByWarehouse.all(warehouseId) : stmts.getYmsAlerts.all()) as Record<string, any>[];
  return rows.map(r => ({
    ...r,
    resolved: r.resolved === 1
  } as YmsAlert));
}

export function saveYmsAlert(a: YmsAlert) {
  stmts.insertYmsAlert.run(a.id, a.deliveryId || null, a.warehouseId, a.type, a.severity, a.timestamp, a.message, a.resolved ? 1 : 0);
}

export function deleteYmsAlert(id: string) {
  stmts.deleteYmsAlert.run(id);
}

export function resolveYmsAlert(id: string) {
  stmts.resolveYmsAlert.run(id);
}

// v3.9.0 Slot Queries
export function getYmsSlots(warehouseId: string): YmsSlot[] {
  return stmts.getYmsSlots.all(warehouseId) as YmsSlot[];
}

import { YmsSlot } from '../types';

export function saveYmsSlot(slot: YmsSlot) {
  stmts.insertYmsSlot.run(slot.id, slot.warehouseId, slot.dockId, slot.deliveryId, slot.startTime, slot.endTime);
}

export function deleteYmsSlot(id: string) {
  stmts.deleteYmsSlot.run(id);
}

export function deleteYmsSlotByDelivery(deliveryId: string) {
  stmts.deleteYmsSlotByDelivery.run(deliveryId);
}

export function getYmsPerformance(warehouseId?: string) {
  let query = "SELECT * FROM yms_deliveries WHERE status IN ('COMPLETED', 'GATE_OUT')";
  const params: any[] = [];
  if (warehouseId) {
    query += " AND warehouseId = ?";
    params.push(warehouseId);
  }
  
  const rows = db.prepare(query).all(...params) as Record<string, any>[];
  
  return rows.map(r => {
    const timestamps = r.statusTimestamps ? JSON.parse(r.statusTimestamps) : {};
    
    // Arrival Delay (Actual vs Scheduled)
    let arrivalDelay = 0;
    if (r.registrationTime && r.scheduledTime) {
      const actual = new Date(r.registrationTime).getTime();
      const planned = new Date(r.scheduledTime).getTime();
      arrivalDelay = Math.round((actual - planned) / 60000); // Minutes
    }

    // Unloading Performance (Actual vs Estimated)
    let unloadingDeviation = 0;
    if (timestamps.DOCKED && timestamps.COMPLETED && r.estimatedDuration) {
      const start = new Date(timestamps.DOCKED).getTime();
      const end = new Date(timestamps.COMPLETED).getTime();
      const actualDur = Math.round((end - start) / 60000);
      unloadingDeviation = actualDur - r.estimatedDuration;
    }

    return {
      id: r.id,
      reference: r.reference,
      supplier: r.supplier,
      supplierId: r.supplierId,
      transporterId: r.transporterId,
      arrivalDelay,
      unloadingDeviation,
      palletCount: r.palletCount || 0,
      timestamp: r.scheduledTime
    };
  });
}
