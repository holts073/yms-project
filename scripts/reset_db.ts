import { db } from '../src/db/sqlite';

console.log('--- YMS DATABASE RESET INITIATED ---');

const tablesToReset = [
  'deliveries',
  'yms_deliveries',
  'pallet_transactions',
  'address_book',
  'documents',
  'audit_logs',
  'logs',
  'yms_alerts'
];

db.transaction(() => {
  for (const table of tablesToReset) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
      console.log(`[CLEAN] Table '${table}' cleared.`);
    } catch (err) {
      console.warn(`[WARN] Could not clear table '${table}':`, err);
    }
  }
  
  // Reset dock statuses to Available
  db.prepare("UPDATE yms_docks SET status = 'Available', currentDeliveryId = NULL").run();
  console.log('[CLEAN] All docks reset to Available.');

  // Reset waiting area statuses to Available
  db.prepare("UPDATE yms_waiting_areas SET status = 'Available', currentDeliveryId = NULL").run();
  console.log('[CLEAN] All waiting areas reset to Available.');
})();

console.log('--- DATABASE RESET COMPLETED SUCCESSFULY ---');
console.log('Note: Users, Warehouses, Docks, and Settings have been preserved.');
