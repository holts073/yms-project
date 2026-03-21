import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

try {
  console.log('--- Testing YMS Database Operations ---');

  // 1. Check Docks
  const docks = db.prepare('SELECT * FROM yms_docks').all();
  console.log(`Found ${docks.length} docks.`);
  if (docks.length !== 20) throw new Error('Expected 20 docks');

  // 2. Check Waiting Areas
  const waitingAreas = db.prepare('SELECT * FROM yms_waiting_areas').all();
  console.log(`Found ${waitingAreas.length} waiting areas.`);
  if (waitingAreas.length !== 10) throw new Error('Expected 10 waiting areas');

  // 3. Insert a test delivery
  const testDelivery = {
    id: 'test-123',
    reference: 'REF-001',
    licensePlate: 'AA-123-BB',
    supplier: 'Test Supplier',
    temperature: 'Droog',
    scheduledTime: new Date().toISOString(),
    status: 'Scheduled'
  };

  db.prepare(`
    INSERT OR REPLACE INTO yms_deliveries (
      id, reference, licensePlate, supplier, temperature, scheduledTime, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    testDelivery.id, testDelivery.reference, testDelivery.licensePlate, testDelivery.supplier, testDelivery.temperature, testDelivery.scheduledTime, testDelivery.status
  );
  console.log('Inserted test delivery.');

  // 4. Assign to a dock
  db.prepare('UPDATE yms_docks SET status = ?, currentDeliveryId = ? WHERE id = ?')
    .run('Occupied', testDelivery.id, 1);
  db.prepare('UPDATE yms_deliveries SET dockId = ?, status = ? WHERE id = ?')
    .run(1, 'At Dock', testDelivery.id);
  console.log('Assigned delivery to Dock 1.');

  // 5. Verify assignment
  const updatedDock = db.prepare('SELECT * FROM yms_docks WHERE id = 1').get() as any;
  const updatedDelivery = db.prepare('SELECT * FROM yms_deliveries WHERE id = "test-123"').get() as any;

  console.log('Updated Dock 1:', updatedDock);
  console.log('Updated Delivery:', updatedDelivery);

  if (updatedDock.currentDeliveryId !== 'test-123') throw new Error('Dock assignment failed');
  if (updatedDelivery.dockId !== 1) throw new Error('Delivery assignment failed');

  // Cleanup
  db.prepare('DELETE FROM yms_deliveries WHERE id = "test-123"').run();
  db.prepare('UPDATE yms_docks SET status = "Available", currentDeliveryId = NULL WHERE id = 1').run();
  console.log('Cleanup successful.');

  console.log('--- ALL YMS DB TESTS PASSED ---');
} catch (error) {
  console.error('--- YMS DB TEST FAILED ---');
  console.error(error);
  process.exit(1);
}
