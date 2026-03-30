import { test, expect } from '@playwright/test';
import { login, dispatchSync, bootstrapWarehouse, TEST_DATE, navigateTo } from './helpers';

test.describe('Dashboard Pipeline Flow', () => {
  const testRef = `PIPE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const testWarehouseId = 'W08-PIPE';

  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Dashboard');
    await bootstrapWarehouse(page, testWarehouseId);
  });

  test('should create an Ex-Works delivery and advance through document checks', async ({ page }) => {
    // 1. Simulate Ex-Works arrival at Fixed TEST_DATE
    await dispatchSync(page, {
        type: 'YMS_SAVE_DELIVERY',
        payload: {
            id: 'pipe-test-id',
            reference: testRef,
            licensePlate: 'PIPE-123',
            supplier: 'Pipe Logistics',
            temperature: 'Droog',
            scheduledTime: `${TEST_DATE}T11:00:00.000Z`,
            status: 'PLANNED',
            warehouseId: testWarehouseId,
            direction: 'INBOUND',
            palletCount: 12,
            documents: [
                { id: 'doc-1', name: 'Transport Order', status: 'pending', required: true }
            ]
        }
    }, `[data-testid*="${testRef}"]`);

    const row = page.locator('[data-testid*="row"]').filter({ hasText: testRef });
    await expect(row).toBeVisible({ timeout: 15000 });

    // 2. Open Details & Verify Documents
    await row.click();
    await expect(page.locator('h3:has-text("Documenten & Check-in")')).toBeVisible();
    
    // 3. Mark Doc as Received
    const docRow = page.locator('div:has-text("Transport Order")').locator('..');
    await docRow.locator('button:has-text("Ontvangen")').click();
    
    // 4. Verify Milestone Update
    await expect(page.locator('text=Status: Documenten OK')).toBeVisible({ timeout: 15000 });
  });
});
