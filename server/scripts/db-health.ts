import { db } from '../../src/db/sqlite';

function checkHealth() {
  console.log("--- YMS DB HEALTH CHECK ---");
  let issues = 0;

  // 1. DOCKED without dockId or waitingAreaId
  const missingDock = db.prepare(`
    SELECT id, reference, status FROM yms_deliveries 
    WHERE status IN ('DOCKED', 'UNLOADING', 'LOADING') 
    AND dockId IS NULL
  `).all() as any[];

  if (missingDock.length > 0) {
    console.error(`FAIL: Found ${missingDock.length} deliveries DOCKED without a dockId!`);
    missingDock.forEach(d => console.error(` -> ID: ${d.id}, Ref: ${d.reference}`));
    issues++;
  }

  // 2. Missing warehouseId
  const missingWarehouse = db.prepare(`
    SELECT id, reference FROM yms_deliveries WHERE warehouseId IS NULL OR warehouseId = ''
  `).all() as any[];

  if (missingWarehouse.length > 0) {
    console.error(`FAIL: Found ${missingWarehouse.length} deliveries without a warehouseId!`);
    issues++;
  }

  // 3. Audit Log Verification
  // Check if recent status changes are in audit_logs
  // (Simple check: is audit_logs empty while we have deliveries?)
  const auditCount = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get() as { count: number };
  const deliveryCount = db.prepare("SELECT COUNT(*) as count FROM yms_deliveries").get() as { count: number };

  if (deliveryCount.count > 0 && auditCount.count === 0) {
     console.warn("WARN: Deliveries exist but audit_logs is empty. Auditing might be failing.");
     // Not a hard fail but worth noting
  }

  if (issues === 0) {
    console.log("SUCCESS: Database integrity is 100% waterdicht.");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

checkHealth();
