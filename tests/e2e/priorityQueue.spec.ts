import { test, expect } from '@playwright/test';
import { login, selectWarehouse, dispatchSync, bootstrapWarehouse, TEST_DATE, navigateTo } from './helpers';

test.describe('YMS Priority Queue', () => {
    const testWarehouseId = 'W07-PRIO';
    const dryRef = `DRY-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const reeferRef = `REEFER-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateTo(page, 'Dock Planning');
        await bootstrapWarehouse(page, testWarehouseId);
    });

    test('should prioritize Reefer over Dry trucks in the queue', async ({ page }) => {
        // 1. Add Dry truck at TEST_DATE
        await dispatchSync(page, {
            type: 'YMS_SAVE_DELIVERY',
            payload: {
                id: 'prio-dry-id',
                reference: dryRef,
                licensePlate: 'DRY-111',
                supplier: 'Dry Supplier',
                temperature: 'Droog',
                isReefer: false,
                scheduledTime: `${TEST_DATE}T10:00:00.000Z`,
                registrationTime: `${TEST_DATE}T09:00:00.000Z`,
                status: 'GATE_IN',
                warehouseId: testWarehouseId,
                direction: 'INBOUND',
                palletCount: 10
            }
        }, `[data-testid="table-row"]:has-text("${dryRef}")`);

        // 2. Add Reefer truck at TEST_DATE
        await dispatchSync(page, {
            type: 'YMS_SAVE_DELIVERY',
            payload: {
                id: 'prio-reefer-id',
                reference: reeferRef,
                licensePlate: 'REEF-222',
                supplier: 'Reefer Supplier',
                temperature: 'Vries',
                isReefer: true,
                scheduledTime: `${TEST_DATE}T10:00:00.000Z`,
                registrationTime: `${TEST_DATE}T09:05:00.000Z`,
                status: 'GATE_IN',
                warehouseId: testWarehouseId,
                direction: 'INBOUND',
                palletCount: 10
            }
        }, `[data-testid="table-row"]:has-text("${reeferRef}")`);

        // 3. Verify Order in Arrivals
        await page.getByRole('button', { name: 'Aankomst & Inspectie' }).click();
        await selectWarehouse(page, testWarehouseId);

        const firstQueueItem = page.locator('[data-testid="yms-queue-item"]').first();
        await expect(firstQueueItem.getByTestId('delivery-reference')).toHaveText(reeferRef, { timeout: 20000 });
        await expect(firstQueueItem.getByTestId('priority-badge')).toBeVisible();
    });
});
