import { test, expect } from '@playwright/test';

test.describe('YMS Priority Queue', () => {
  test('should prioritize Reefer over Dry trucks in the queue', async ({ page }) => {
    // 1. Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@ilgfood.com');
    await page.fill('input[type="password"]', 'welkom123');
    await page.click('button:has-text("Inloggen")');

    // 2. Navigate to YMS Arrivals
    // Wait for sidebar to be ready
    const departuresLink = page.getByRole('button', { name: 'Aankomst & Inspectie' });
    await expect(departuresLink).toBeVisible({ timeout: 30000 });
    await departuresLink.click();

    // Wait for YMS Arrivals Dashboard to load
    await expect(page.getByTestId('yms-queue')).toBeVisible({ timeout: 30000 });

    const testWarehouseId = 'WH-TEST-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const dryRef = `DRY-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const reeferRef = `REEFER-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // 3. Select the unique test warehouse via YMS_ACTION event
    await page.evaluate((whId) => {
      window.dispatchEvent(new CustomEvent('YMS_ACTION', {
        detail: {
          type: 'SELECT_WAREHOUSE',
          payload: whId
        }
      }));
    }, testWarehouseId);

    // 4. Add a 'Dry' truck (simulated arrival)
    await page.evaluate(({ whId, ref }) => {
      window.dispatchEvent(new CustomEvent('YMS_ACTION', {
        detail: {
          type: 'YMS_SAVE_DELIVERY',
          payload: {
            id: 'test-dry-id',
            reference: ref,
            licensePlate: 'DRY-123',
            supplier: 'Test Supplier',
            temperature: 'Droog',
            isReefer: false,
            scheduledTime: new Date().toISOString(),
            registrationTime: new Date().toISOString(),
            status: 'GATE_IN',
            warehouseId: whId,
            direction: 'INBOUND'
          }
        }
      }));
    }, { whId: testWarehouseId, ref: dryRef });

    // Wait for it to appear
    await expect(page.locator(`[data-testid="delivery-reference"]:has-text("${dryRef}")`)).toBeVisible({ timeout: 20000 });

    // 5. Add a 'Reefer' truck (simulated arrival) - 5 mins later
    await page.evaluate(({ whId, ref }) => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      window.dispatchEvent(new CustomEvent('YMS_ACTION', {
        detail: {
          type: 'YMS_SAVE_DELIVERY',
          payload: {
            id: 'test-reefer-id',
            reference: ref,
            licensePlate: 'REEF-999',
            supplier: 'Cold Chain inc',
            temperature: 'Vries', // Higher priority
            isReefer: true,
            scheduledTime: now.toISOString(),
            registrationTime: now.toISOString(),
            status: 'GATE_IN',
            warehouseId: whId,
            direction: 'INBOUND'
          }
        }
      }));
    }, { whId: testWarehouseId, ref: reeferRef });

    // 6. Validate Order (Reefer should jump ahead of Dry)
    const queueItems = page.locator('[data-testid="yms-queue-item"]');
    await expect(queueItems.first().locator('[data-testid="delivery-reference"]')).toHaveText(reeferRef, { timeout: 30000 });
    
    // Validate reefer has priority badge
    await expect(queueItems.first().locator('[data-testid="priority-badge"]')).toBeVisible();

    // 7. Cleanup
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('YMS_ACTION', { detail: { type: 'YMS_DELETE_DELIVERY', payload: 'test-dry-id' } }));
      window.dispatchEvent(new CustomEvent('YMS_ACTION', { detail: { type: 'YMS_DELETE_DELIVERY', payload: 'test-reefer-id' } }));
    });
  });
});
