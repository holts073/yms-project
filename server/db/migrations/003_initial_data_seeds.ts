import { Database } from 'better-sqlite3';

/**
 * Migration 003: Initial Data Seeds
 * Sets up default settings and warehouse data.
 */
export function up(db: Database) {
  console.log('[YMS MIGRATOR] Seeding initial data...');

  // 1. Initial Warehouse
  db.prepare(`
    INSERT OR IGNORE INTO yms_warehouses (id, name, description) 
    VALUES ('W01', 'Magazijn 01', 'Hoofdmagazijn');
  `).run();

  // 2. Initial Shipment Settings
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

  // 3. Initial Docks and Waiting Areas (only for W01)
  const dockCount = db.prepare("SELECT COUNT(*) as count FROM yms_docks WHERE warehouseId = 'W01'").get() as { count: number };
  if (dockCount.count === 0) {
    const insertDock = db.prepare("INSERT INTO yms_docks (id, warehouseId, name, allowedTemperatures) VALUES (?, 'W01', ?, ?)");
    for (let i = 1; i <= 20; i++) {
      insertDock.run(i, `Dock ${i}`, JSON.stringify(['Droog', 'Vries', 'Koel']));
    }
  }

  const waitingAreaCount = db.prepare("SELECT COUNT(*) as count FROM yms_waiting_areas WHERE warehouseId = 'W01'").get() as { count: number };
  if (waitingAreaCount.count === 0) {
    const insertWaitingArea = db.prepare("INSERT INTO yms_waiting_areas (id, warehouseId, name) VALUES (?, 'W01', ?)");
    for (let i = 1; i <= 10; i++) {
      insertWaitingArea.run(i, `Wachtplaats ${i}`);
    }
  }

  console.log('[YMS MIGRATOR] Seeding completed.');
}
