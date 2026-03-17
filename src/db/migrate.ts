import Database from 'better-sqlite3';
import path from 'path';

// Connect to both the new and old structure (using the same 'yms.db' file for simplicity)
const db = new Database('yms.db');

export function runMigrations() {
  // Check if old JSON state exists
  const oldStateRow = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='state'").get();
  
  if (oldStateRow) {
    const row = db.prepare('SELECT data FROM state WHERE id = 1').get() as { data: string } | undefined;
    if (row) {
      const oldState = JSON.parse(row.data);
      console.log('Found old JSON state. Running migration to relational schema...');

      try {
        db.exec('BEGIN TRANSACTION');

        // Migrate Users
        if (oldState.users) {
          const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, permissions) VALUES (?, ?, ?, ?, ?, ?)');
          for (const u of oldState.users) {
            insertUser.run(u.id, u.name, u.email, u.passwordHash, u.role, u.permissions ? JSON.stringify(u.permissions) : null);
          }
        }

        // Migrate Suppliers
        if (oldState.addressBook?.suppliers) {
          const insertSupplier = db.prepare('INSERT OR IGNORE INTO address_book (id, type, name, contact, email, address, pickupAddress, otif, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
          for (const s of oldState.addressBook.suppliers) {
            insertSupplier.run(s.id, 'supplier', s.name, s.contact, s.email, s.address, s.pickupAddress, s.otif, s.remarks);
          }
        }

        // Migrate Transporters
        if (oldState.addressBook?.transporters) {
          const insertTrans = db.prepare('INSERT OR IGNORE INTO address_book (id, type, name, contact, email, address, pickupAddress, otif, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
          for (const t of oldState.addressBook.transporters) {
            insertTrans.run(t.id, 'transporter', t.name, t.contact, t.email, t.address, t.pickupAddress, t.otif, t.remarks);
          }
        }

        // Migrate Company Settings
        if (oldState.companySettings) {
          db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('companySettings', ?)").run(JSON.stringify(oldState.companySettings));
        }

        // Migrate Logs
        if (oldState.logs) {
          const insertLog = db.prepare('INSERT OR IGNORE INTO logs (id, timestamp, user, action, details) VALUES (?, ?, ?, ?, ?)');
          for (const l of oldState.logs) {
            insertLog.run(l.id, l.timestamp, l.user, l.action, l.details);
          }
        }

        // Migrate Deliveries
        if (oldState.deliveries) {
          const insertDel = db.prepare(`
            INSERT OR IGNORE INTO deliveries (
              id, type, reference, supplierId, transporterId, forwarderId, status, eta, createdAt, updatedAt,
              transportCost, weight, palletType, palletCount, cargoType, loadingCountry, loadingCity, palletExchange,
              etd, etaPort, etaWarehouse, originalEtaWarehouse, portOfArrival, billOfLading, containerNumber,
              delayRisk, predictionReason, notes, statusHistory
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          const insertDoc = db.prepare('INSERT OR IGNORE INTO documents (id, deliveryId, name, status, required) VALUES (?, ?, ?, ?, ?)');
          const insertAudit = db.prepare('INSERT OR IGNORE INTO audit_logs (id, deliveryId, timestamp, user, action, details) VALUES (?, ?, ?, ?, ?, ?)');

          for (const d of oldState.deliveries) {
            insertDel.run(
              d.id, d.type, d.reference, d.supplierId, d.transporterId, d.forwarderId, d.status, d.eta, d.createdAt || new Date().toISOString(), d.updatedAt || new Date().toISOString(),
              d.transportCost, d.weight, d.palletType, d.palletCount, d.cargoType, d.loadingCountry, d.loadingCity, d.palletExchange ? 1 : 0,
              d.etd, d.etaPort, d.etaWarehouse, d.originalEtaWarehouse, d.portOfArrival, d.billOfLading, d.containerNumber,
              d.delayRisk, d.predictionReason, d.notes, d.statusHistory ? JSON.stringify(d.statusHistory) : null
            );

            if (d.documents) {
              for (const doc of d.documents) {
                insertDoc.run(doc.id, d.id, doc.name, doc.status, doc.required ? 1 : 0);
              }
            }

            if (d.auditTrail) {
              for (const a of d.auditTrail) {
                insertAudit.run(a.id || Math.random().toString(36).substr(2, 9), d.id, a.timestamp, a.user, a.action, a.details);
              }
            }
          }
        }

        // Drop old state table
        db.exec('DROP TABLE state');
        db.exec('COMMIT');
        console.log('Migration completed successfully.');
      } catch (err) {
        db.exec('ROLLBACK');
        console.error('Migration failed', err);
      }
    }
  }
}
