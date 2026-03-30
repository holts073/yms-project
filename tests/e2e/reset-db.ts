/**
 * E2E Test Database Reset Script
 * Cleans all test data and ensures a known-good state for E2E tests.
 * 
 * Usage: npx tsx tests/e2e/reset-db.ts
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../database.sqlite');

async function resetTestData() {
  console.log('[reset-db] Opening database at', DB_PATH);
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // 1. Remove all test warehouses (keep W01)
  const deleteWarehouses = db.prepare("DELETE FROM yms_warehouses WHERE id != 'W01'");
  const whResult = deleteWarehouses.run();
  console.log(`[reset-db] Deleted ${whResult.changes} test warehouses`);

  // 2. Remove test docks (keep W01 docks)
  const deleteDocks = db.prepare("DELETE FROM yms_docks WHERE warehouseId != 'W01'");
  const dockResult = deleteDocks.run();
  console.log(`[reset-db] Deleted ${dockResult.changes} test docks`);

  // 3. Remove test deliveries
  const deleteDeliveries = db.prepare("DELETE FROM yms_deliveries WHERE warehouseId != 'W01'");
  const delResult = deleteDeliveries.run();
  console.log(`[reset-db] Deleted ${delResult.changes} test deliveries`);
  
  // 4. Remove test waiting areas
  const deleteWA = db.prepare("DELETE FROM yms_waiting_areas WHERE warehouseId != 'W01'");
  const waResult = deleteWA.run();
  console.log(`[reset-db] Deleted ${waResult.changes} test waiting areas`);

  // 5. Ensure W01 has at least one dock for testing
  const docks = db.prepare("SELECT id FROM yms_docks WHERE warehouseId = 'W01'").all();
  if (docks.length === 0) {
    db.prepare(`INSERT OR REPLACE INTO yms_docks (id, warehouseId, name, status, adminStatus, allowedTemperatures, direction_capability)
                VALUES (1, 'W01', 'Dock 1', 'Available', 'Active', '["Droog","Koel","Vries"]', 'BOTH')`).run();
    db.prepare(`INSERT OR REPLACE INTO yms_docks (id, warehouseId, name, status, adminStatus, allowedTemperatures, direction_capability)
                VALUES (2, 'W01', 'Dock 2', 'Available', 'Active', '["Droog"]', 'BOTH')`).run();
    console.log('[reset-db] Created default docks for W01');
  }

  // 6. Clean up test deliveries on W01 too (refs starting with test prefixes)
  const cleanW01 = db.prepare("DELETE FROM yms_deliveries WHERE warehouseId = 'W01' AND (reference LIKE 'REF-%' OR reference LIKE 'PLAN-%' OR reference LIKE 'SMART-%' OR reference LIKE 'FAST-%' OR reference LIKE 'PAL-%' OR reference LIKE 'DRY-%' OR reference LIKE 'REEFER-%' OR reference LIKE 'PIPE-%')");
  const cleanResult = cleanW01.run();
  console.log(`[reset-db] Cleaned ${cleanResult.changes} test deliveries from W01`);

  // Summary
  const warehouses = db.prepare("SELECT id, name FROM yms_warehouses").all();
  const allDocks = db.prepare("SELECT id, name, warehouseId FROM yms_docks").all();
  console.log('\n[reset-db] Final state:');
  console.log('  Warehouses:', warehouses);
  console.log('  Docks:', allDocks);
  
  db.close();
  console.log('\n[reset-db] Done!');
}

resetTestData().catch(err => {
  console.error('[reset-db] Failed:', err);
  process.exit(1);
});
