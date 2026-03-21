import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

function checkTable(tableName: string) {
  try {
    const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
    console.log(`Table ${tableName} exists. Columns:`, info.map((c: any) => c.name).join(', '));
    return true;
  } catch (e) {
    console.error(`Table ${tableName} does NOT exist or error occurred:`, e.message);
    return false;
  }
}

console.log('--- YMS Database Diagnostics ---');

const tables = ['yms_docks', 'yms_waiting_areas', 'yms_deliveries', 'deliveries'];
tables.forEach(checkTable);

try {
  const dockCount = db.prepare('SELECT COUNT(*) as count FROM yms_docks').get() as any;
  console.log('Dock count:', dockCount.count);
} catch (e) {
  console.error('Error fetching docks:', e.message);
}

try {
  const delCount = db.prepare('SELECT COUNT(*) as count FROM yms_deliveries').get() as any;
  console.log('YMS Delivery count:', delCount.count);
} catch (e) {
  console.error('Error fetching YMS deliveries:', e.message);
}

// Test a specific query from queries.ts
try {
    const d = {
        id: 'diag-test',
        reference: 'DIAG-REF',
        licensePlate: 'DIAG-PLATE',
        supplier: 'DIAG-SUPP',
        temperature: 'Droog',
        scheduledTime: new Date().toISOString(),
        status: 'Scheduled'
    };
    db.prepare(`
        INSERT OR REPLACE INTO yms_deliveries (
            id, reference, licensePlate, supplier, temperature, scheduledTime, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(d.id, d.reference, d.licensePlate, d.supplier, d.temperature, d.scheduledTime, d.status);
    console.log('Test INSERT successful.');
    db.prepare('DELETE FROM yms_deliveries WHERE id = "diag-test"').run();
} catch (e) {
    console.error('Test INSERT failed:', e.message);
}
