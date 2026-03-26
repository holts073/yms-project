import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as Client } from 'socket.io-client';
import { db } from '../../src/db/sqlite';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'fallback_secret_key_for_dev_only';
const testToken = jwt.sign({ id: 'u1', name: 'Test Admin', role: 'admin' }, JWT_SECRET);

describe('Socket Integration - Uni-directional Dataflow', () => {
  let clientSocket: any;
  const PORT = 3000;

  beforeAll(async () => {
    clientSocket = Client(`http://localhost:${PORT}`, {
      auth: { token: testToken },
      transports: ['websocket']
    });

    await new Promise((resolve, reject) => {
      clientSocket.on('connect', resolve);
      clientSocket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
    });
  });

  afterAll(() => {
    if (clientSocket) clientSocket.disconnect();
  });

  it('should process YMS_ASSIGN_DOCK and update the database', async () => {
    const testDeliveryId = 'test-flow-' + Math.random().toString(36).substr(2, 5);
    const dockId = 5;
    const warehouseId = 'W01';

    // 1. Seed the delivery
    db.prepare(`
      INSERT INTO yms_deliveries (id, warehouseId, reference, licensePlate, supplier, temperature, status, scheduledTime)
      VALUES (?, ?, ?, 'TEST-FLW', 'Flow Provider', 'Droog', 'GATE_IN', ?)
    `).run(testDeliveryId, warehouseId, 'REF-FLOW', new Date().toISOString());

    // 2. Emit Action
    clientSocket.emit('action', {
      type: 'YMS_ASSIGN_DOCK',
      payload: {
        deliveryId: testDeliveryId,
        dockId,
        scheduledTime: new Date().toISOString()
      }
    });

    // 3. Wait for DB update (increased timeout for PM2 process to finish write)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updated = db.prepare('SELECT * FROM yms_deliveries WHERE id = ?').get(testDeliveryId) as any;
    expect(updated).toBeDefined();
    expect(updated.dockId).toBe(dockId);
    expect(updated.status).toBe('DOCKED');

    // Cleanup
    db.prepare('DELETE FROM yms_deliveries WHERE id = ?').run(testDeliveryId);
  }, 10000);

  it('should only receive data for the selected warehouseId', async () => {
     const warehouseId = 'W01';
     
     const stateUpdatePromise = new Promise((resolve) => {
       clientSocket.once('state_update', (state: any) => {
         resolve(state);
       });
     });

     clientSocket.emit('action', {
       type: 'SELECT_WAREHOUSE',
       payload: warehouseId
     });

     const state: any = await stateUpdatePromise;
     // Matches buildStaticState structure
     expect(state.yms).toHaveProperty('selectedWarehouseId', warehouseId);
     
     // Validate deliveries filtering
     if (state.yms.deliveries.length > 0) {
       state.yms.deliveries.forEach((d: any) => {
         expect(d.warehouseId).toBe(warehouseId);
       });
     }
  });
});
