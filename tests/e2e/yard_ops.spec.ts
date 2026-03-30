import { test, expect } from '@playwright/test';
import { login, dispatchSync, bootstrapWarehouse, TEST_DATE, navigateTo } from './helpers';

test.describe('YMS Yard Operations', () => {
  const testRef = `REF-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const testWarehouseId = 'W04-OPS';

  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Dock Planning');
    await bootstrapWarehouse(page, testWarehouseId);
    await navigateTo(page, 'Aankomst & Inspectie');
  });

  test('should complete a full truck lifecycle from arrival to completion', async ({ page }) => {
    // 1. Simulate Arrival at Fixed TEST_DATE
    await dispatchSync(page, {
        type: 'YMS_SAVE_DELIVERY',
        payload: {
            id: 'ops-test-id',
            reference: testRef,
            licensePlate: 'OPS-321',
            supplier: 'Ops Logistics',
            temperature: 'Droog',
            scheduledTime: `${TEST_DATE}T10:00:00.000Z`,
            registrationTime: `${TEST_DATE}T09:30:00.000Z`,
            status: 'GATE_IN',
            warehouseId: testWarehouseId,
            direction: 'INBOUND',
            palletCount: 10
        }
    }, `[data-testid="table-row"]:has-text("${testRef}")`);

    const deliveryRow = page.getByTestId('table-row').filter({ hasText: testRef });
    await expect(deliveryRow).toBeVisible({ timeout: 15000 });

    // 2. Assign Dock (Dock ID 104 from bootstrap)
    await deliveryRow.getByTestId('btn-assign').click();
    await page.locator('button:has-text("Dock 104")').click();
    await page.locator('button:has-text("Bevestig Toewijzing")').click();

    // 3. Verify Docked
    await expect(deliveryRow.getByTestId('delivery-status-badge')).toContainText("Gedockt");

    // 4. Unload
    await deliveryRow.getByTestId('btn-unload').click();
    await expect(deliveryRow.getByTestId('delivery-status-badge')).toContainText("Lossen");

    // 5. Complete
    await deliveryRow.getByTestId('btn-complete').click();

    // 6. Verify Archived
    await expect(page.locator(`text=${testRef}`)).not.toBeVisible({ timeout: 15000 });
  });
});
