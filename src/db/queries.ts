import { db } from './sqlite';
import { Delivery, Document, AuditEntry, AddressEntry, User } from '../types';

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
      id, type, reference, supplierId, transporterId, forwarderId, status, eta, createdAt, updatedAt,
      transportCost, weight, palletType, palletCount, cargoType, loadingCountry, loadingCity, palletExchange,
      etd, etaPort, etaWarehouse, originalEtaWarehouse, portOfArrival, billOfLading, containerNumber,
      notes, statusHistory, loadingTime, dockId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  deleteDocs: db.prepare('DELETE FROM documents WHERE deliveryId = ?'),
  insertDoc: db.prepare('INSERT INTO documents (id, deliveryId, name, status, required) VALUES (?, ?, ?, ?, ?)'),
  deleteAudit: db.prepare('DELETE FROM audit_logs WHERE deliveryId = ?'),
  insertAudit: db.prepare('INSERT INTO audit_logs (id, deliveryId, timestamp, user, action, details) VALUES (?, ?, ?, ?, ?, ?)'),
  deleteDelivery: db.prepare('DELETE FROM deliveries WHERE id = ?'),
  getUsers: db.prepare('SELECT * FROM users'),
  getUserPassword: db.prepare('SELECT passwordHash FROM users WHERE id = ?'),
  insertUser: db.prepare('INSERT OR REPLACE INTO users (id, name, email, passwordHash, role, permissions) VALUES (?, ?, ?, ?, ?, ?)'),
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
  getAddressBookByEmail: (type: string) => db.prepare("SELECT * FROM address_book WHERE type = ?"),
  deleteAddressEntry: db.prepare('DELETE FROM address_book WHERE id = ?'),
  getLogs: db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100'),
  insertLog: db.prepare('INSERT INTO logs (id, timestamp, user, action, details, reference) VALUES (?, ?, ?, ?, ?, ?)'),
  getYmsDocks: db.prepare('SELECT * FROM yms_docks'),
  getYmsDocksByWarehouse: db.prepare('SELECT * FROM yms_docks WHERE warehouseId = ?'),
  updateYmsDock: db.prepare('UPDATE yms_docks SET name = ?, allowedTemperatures = ?, status = ?, adminStatus = ?, currentDeliveryId = ?, isFastLane = ?, isOutboundOnly = ? WHERE id = ? AND warehouseId = ?'),
  getYmsWaitingAreas: db.prepare('SELECT * FROM yms_waiting_areas'),
  getYmsWaitingAreasByWarehouse: db.prepare('SELECT * FROM yms_waiting_areas WHERE warehouseId = ?'),
  updateYmsWaitingArea: db.prepare('UPDATE yms_waiting_areas SET name = ?, status = ?, adminStatus = ?, currentDeliveryId = ? WHERE id = ? AND warehouseId = ?'),
  getYmsDeliveries: db.prepare('SELECT * FROM yms_deliveries'),
  getYmsDeliveriesByWarehouse: db.prepare('SELECT * FROM yms_deliveries WHERE warehouseId = ?'),
  insertYmsDelivery: db.prepare(`
    INSERT OR REPLACE INTO yms_deliveries (
      id, warehouseId, reference, licensePlate, supplier, supplierId, mainDeliveryId, temperature, 
      scheduledTime, arrivalTime, registrationTime, isLate, dockId, waitingAreaId, transporterId, status, statusTimestamps,
      estimatedDuration, isReefer, tempAlertThreshold, lastEtaUpdate,
      direction, palletCount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  deleteYmsDelivery: db.prepare('DELETE FROM yms_deliveries WHERE id = ?'),
  getYmsWarehouses: db.prepare('SELECT * FROM yms_warehouses'),
  insertYmsWarehouse: db.prepare('INSERT OR REPLACE INTO yms_warehouses (id, name, description, address) VALUES (?, ?, ?, ?)')
};

export function getDeliveries(page: number = 1, limit: number = 15, search: string = '', typeFilter: string = 'all', sort: string = 'eta', statusLess100: boolean = false) {
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM deliveries WHERE 1=1';
  const params: any[] = [];

  if (statusLess100) {
    query += ' AND status < 100';
  }

  if (search) {
    query += ' AND (reference LIKE ? OR billOfLading LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
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

  const rows = db.prepare(query).all(...params) as any[];

  if (rows.length === 0) {
    return { deliveries: [], total: totalRow.count, totalPages: Math.ceil(totalRow.count / limit), currentPage: page };
  }

  // Optimized Fetch: Batch documents and audit logs for all rows on the page
  const ids = rows.map(r => r.id);
  const allDocs = stmts.getDocsBatch(ids).all(...ids) as any[];
  const allAudit = stmts.getAuditBatch(ids).all(...ids) as any[];

  const docsMap = allDocs.reduce((acc, d) => {
    if (!acc[d.deliveryId]) acc[d.deliveryId] = [];
    acc[d.deliveryId].push({ ...d, required: d.required === 1 });
    return acc;
  }, {} as Record<string, any[]>);

  const auditMap = allAudit.reduce((acc, a) => {
    if (!acc[a.deliveryId]) acc[a.deliveryId] = [];
    acc[a.deliveryId].push(a);
    return acc;
  }, {} as Record<string, any[]>);

  const deliveries: Delivery[] = rows.map(r => ({
    ...r,
    palletExchange: r.palletExchange === 1,
    statusHistory: r.statusHistory ? JSON.parse(r.statusHistory) : [],
    documents: docsMap[r.id] || [],
    auditTrail: auditMap[r.id] || []
  }));

  return {
    deliveries,
    total: totalRow.count,
    totalPages: Math.ceil(totalRow.count / limit),
    currentPage: page
  };
}

export function getAllDeliveries() {
  const rows = db.prepare('SELECT * FROM deliveries').all() as any[];
  return rows.map(r => {
    const docs = db.prepare('SELECT * FROM documents WHERE deliveryId = ?').all(r.id) as any[];
    const audit = db.prepare('SELECT * FROM audit_logs WHERE deliveryId = ?').all(r.id) as any[];

    return {
      ...r,
      palletExchange: r.palletExchange === 1,
      statusHistory: r.statusHistory ? JSON.parse(r.statusHistory) : [],
      documents: docs.map(d => ({ ...d, required: d.required === 1 })),
      auditTrail: audit
    };
  });
}

export function insertDelivery(d: Delivery) {
  db.transaction(() => {
    stmts.insertDelivery.run(
      d.id, d.type, d.reference, d.supplierId, d.transporterId, d.forwarderId, d.status, d.eta, d.createdAt, d.updatedAt,
      d.transportCost, d.weight, d.palletType, d.palletCount, d.cargoType, d.loadingCountry, d.loadingCity, d.palletExchange ? 1 : 0,
      d.etd, d.etaPort, d.etaWarehouse, d.originalEtaWarehouse, d.portOfArrival, d.billOfLading, d.containerNumber,
      d.notes, d.statusHistory ? JSON.stringify(d.statusHistory) : null, d.loadingTime, d.dockId || null
    );

    // Documents
    stmts.deleteDocs.run(d.id);
    if (d.documents) {
      for (const doc of d.documents) {
        stmts.insertDoc.run(doc.id, d.id, doc.name, doc.status, doc.required ? 1 : 0);
      }
    }

    // Audit logs
    stmts.deleteAudit.run(d.id);
    if (d.auditTrail) {
      for (const a of d.auditTrail) {
        stmts.insertAudit.run((a as any).id || Math.random().toString(36).substr(2, 9), d.id, a.timestamp, a.user, a.action, a.details);
      }
    }
  })();
}

export function deleteDelivery(id: string) {
  stmts.deleteDelivery.run(id);
}

// Helpers for other entities...
export function getUsers(): User[] {
  const users = stmts.getUsers.all() as any[];
  return users.map(u => ({
    ...u,
    permissions: u.permissions ? JSON.parse(u.permissions) : undefined
  }));
}

export function saveUser(u: User) {
  const existing = stmts.getUserPassword.get(u.id) as { passwordHash: string } | undefined;
  const passwordHash = u.passwordHash || existing?.passwordHash || null;
  
  stmts.insertUser.run(u.id, u.name, u.email, passwordHash, u.role, u.permissions ? JSON.stringify(u.permissions) : null);
}

export function deleteUser(id: string) {
  stmts.deleteUser.run(id);
}

export function getAddressBook() {
  const suppliers = db.prepare("SELECT * FROM address_book WHERE type = 'supplier'").all() as AddressEntry[];
  const transporters = db.prepare("SELECT * FROM address_book WHERE type = 'transporter'").all() as AddressEntry[];
  return { suppliers, transporters };
}

export function saveAddressBookEntry(entry: AddressEntry) {
  db.prepare('INSERT OR REPLACE INTO address_book (id, type, name, contact, email, address, pickupAddress, otif, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(entry.id, entry.type, entry.name, entry.contact, entry.email, entry.address, entry.pickupAddress, entry.otif, entry.remarks);
}

export function deleteAddressEntry(id: string) {
  stmts.deleteAddressEntry.run(id);
}

export function getLogs() {
  return stmts.getLogs.all();
}


export function addLog(log: any) {
  stmts.insertLog.run(Math.random().toString(36).substr(2, 9), log.timestamp, log.user, log.action, log.details, log.reference || null);
}

// YMS Queries
export function getYmsDocks(warehouseId?: string): any[] {
  const rows = warehouseId ? stmts.getYmsDocksByWarehouse.all(warehouseId) : stmts.getYmsDocks.all() as any[];
  return rows.map(r => ({
    ...r,
    allowedTemperatures: JSON.parse(r.allowedTemperatures)
  }));
}

export function saveYmsDock(dock: any) {
  stmts.updateYmsDock.run(dock.name, JSON.stringify(dock.allowedTemperatures), dock.status, dock.adminStatus || 'Active', dock.currentDeliveryId || null, dock.isFastLane ? 1 : 0, dock.isOutboundOnly ? 1 : 0, dock.id, dock.warehouseId);
}

export function getYmsWaitingAreas(warehouseId?: string): any[] {
  return warehouseId ? stmts.getYmsWaitingAreasByWarehouse.all(warehouseId) : stmts.getYmsWaitingAreas.all() as any[];
}

export function saveYmsWaitingArea(wa: any) {
  stmts.updateYmsWaitingArea.run(wa.name, wa.status, wa.adminStatus || 'Active', wa.currentDeliveryId || null, wa.id, wa.warehouseId);
}

export function getYmsDeliveries(warehouseId?: string): any[] {
  const rows = warehouseId ? stmts.getYmsDeliveriesByWarehouse.all(warehouseId) : stmts.getYmsDeliveries.all() as any[];
  return rows.map(r => ({
    ...r,
    isReefer: r.isReefer === 1,
    isLate: r.isLate === 1,
    statusTimestamps: r.statusTimestamps ? JSON.parse(r.statusTimestamps) : {},
    direction: r.direction || 'INBOUND',
    palletCount: r.palletCount || 0
  }));
}

export function saveYmsDelivery(d: any) {
  stmts.insertYmsDelivery.run(
    d.id, d.warehouseId || 'W01', d.reference, d.licensePlate, d.supplier, d.supplierId || null, d.mainDeliveryId || null, d.temperature,
    d.scheduledTime, d.arrivalTime || null, d.registrationTime || null, d.isLate ? 1 : 0, 
    d.dockId || null, d.waitingAreaId || null, d.transporterId || null, d.status, d.statusTimestamps ? JSON.stringify(d.statusTimestamps) : null,
    d.estimatedDuration || 60, d.isReefer ? 1 : 0, d.tempAlertThreshold || 30, d.lastEtaUpdate || null,
    d.direction || 'INBOUND', d.palletCount || 0
  );
}

export function deleteYmsDelivery(id: string) {
  stmts.deleteYmsDelivery.run(id);
}

export function getYmsWarehouses(): any[] {
  return stmts.getYmsWarehouses.all() as any[];
}

export function saveYmsWarehouse(w: any) {
  stmts.insertYmsWarehouse.run(w.id, w.name, w.description || null, w.address || null);
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

export function getYmsDockOverrides(warehouseId?: string): any[] {
  let query = 'SELECT * FROM yms_dock_overrides';
  const params: any[] = [];
  if (warehouseId) {
    query += ' WHERE warehouseId = ?';
    params.push(warehouseId);
  }
  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(r => ({
    ...r,
    allowedTemperatures: JSON.parse(r.allowedTemperatures)
  }));
}

export function saveYmsDockOverride(o: any) {
  db.prepare(`
    INSERT OR REPLACE INTO yms_dock_overrides (id, warehouseId, dockId, date, status, allowedTemperatures)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(o.id, o.warehouseId, o.dockId, o.date, o.status, JSON.stringify(o.allowedTemperatures));
}

export function deleteYmsDockOverride(id: string) {
  db.prepare('DELETE FROM yms_dock_overrides WHERE id = ?').run(id);
}

export function getYmsAlerts(warehouseId?: string): any[] {
  let query = 'SELECT * FROM yms_alerts';
  const params: any[] = [];
  if (warehouseId) {
    query += ' WHERE warehouseId = ?';
    params.push(warehouseId);
  }
  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(r => ({
    ...r,
    resolved: r.resolved === 1
  }));
}

export function saveYmsAlert(a: any) {
  db.prepare(`
    INSERT OR REPLACE INTO yms_alerts (id, deliveryId, warehouseId, type, severity, timestamp, message, resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(a.id, a.deliveryId || null, a.warehouseId, a.type, a.severity, a.timestamp, a.message, a.resolved ? 1 : 0);
}

export function deleteYmsAlert(id: string) {
  db.prepare('DELETE FROM yms_alerts WHERE id = ?').run(id);
}

export function resolveYmsAlert(id: string) {
  db.prepare('UPDATE yms_alerts SET resolved = 1 WHERE id = ?').run(id);
}
