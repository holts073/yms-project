import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as Client } from 'socket.io-client';
import { db, dbReady } from '../../src/db/sqlite';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'fallback_secret_key_for_dev_only';
const testToken = jwt.sign({ id: 'u1', name: 'Test Admin', role: 'admin' }, JWT_SECRET);

describe('Milestone Automation Integration', () => {
  let clientSocket: any;
  const PORT = 3000;

  beforeAll(async () => {
    await dbReady;
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

  it('should auto-jump status when a triggering document is received', async () => {
    const deliveryId = 'test-milestone-' + Math.random().toString(36).substr(2, 5);
    const now = new Date().toISOString();
    
    // 1. Seed a container delivery with all required NOT NULL columns
    db.prepare(`
      INSERT INTO deliveries (id, type, reference, supplierId, status, eta, createdAt, updatedAt)
      VALUES (?, 'container', 'TEST-AUTO-MS', 's1', 0, ?, ?, ?)
    `).run(deliveryId, now, now, now);

    // 2. Update status via document 'Seaway Bill / B/L' (Trigger for 25)
    clientSocket.emit('action', {
      type: 'UPDATE_DELIVERY',
      payload: {
        id: deliveryId,
        type: 'container',
        reference: 'TEST-AUTO-MS',
        status: 0, // Explicitly provide current status
        documents: [
          { name: 'Seaway Bill / B/L', status: 'received', required: true }
        ]
      }
    });

    // 3. Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Verify jump
    const updated = db.prepare('SELECT status FROM deliveries WHERE id = ?').get(deliveryId) as any;
    expect(updated.status).toBe(25);

    // 5. Update second document 'Notification of Arrival' (Trigger for 50)
    clientSocket.emit('action', {
      type: 'UPDATE_DELIVERY',
      payload: {
        id: deliveryId,
        type: 'container',
        reference: 'TEST-AUTO-MS',
        status: 25, // Current status after first jump
        documents: [
          { name: 'Seaway Bill / B/L', status: 'received', required: true },
          { name: 'Notification of Arrival', status: 'received', required: true }
        ]
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const updated2 = db.prepare('SELECT status FROM deliveries WHERE id = ?').get(deliveryId) as any;
    expect(updated2.status).toBe(50);

    // Cleanup
    db.prepare('DELETE FROM deliveries WHERE id = ?').run(deliveryId);
    db.prepare('DELETE FROM documents WHERE deliveryId = ?').run(deliveryId);
  });
});
