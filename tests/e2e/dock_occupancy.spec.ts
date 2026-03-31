import { test, expect } from '@playwright/test';
import { loginAsRole, selectWarehouse, bootstrapDelivery, TEST_DATE } from './helpers';

test.describe('YMS Dock Occupancy Sync', () => {
    test.beforeEach(async ({ page }) => {
        // Assume reset-db has been run recently or run it manually if needed
        await loginAsRole(page, 'admin');
        await selectWarehouse(page, 'W01');
    });

    test('should free the dock and update UI when delivery is COMPLETED', async ({ page }) => {
        // 1. Create and assign a delivery to a dock
        const dockId = 4; // Dock 4
        const delivery = await bootstrapDelivery(page, 'W01', {
            dockId,
            status: 'DOCKED',
            scheduledTime: `${TEST_DATE}T10:00:00.000Z`
        });

        // 2. Verify dock is 'Occupied' in UI
        const dockSelector = `[data-testid="dock-card-${dockId}"]`;
        await page.waitForSelector(`${dockSelector}:has-text("Occupied")`, { timeout: 10000 });
        await expect(page.locator(dockSelector)).toContainText('Occupied');
        await expect(page.locator(dockSelector)).toContainText(delivery.reference);

        // 3. Mark delivery as COMPLETED via the list
        // In YmsDeliveryList, find the delivery and change status
        const delRow = page.locator(`[data-testid="delivery-row-${delivery.id}"]`);
        await delRow.locator('select').selectOption('COMPLETED');

        // 4. CRITICAL: Verify dock becomes 'Available' IMMEDIATELY without reload
        await page.waitForSelector(`${dockSelector}:has-text("Available")`, { timeout: 10000 });
        await expect(page.locator(dockSelector)).toContainText('Available');
        await expect(page.locator(dockSelector)).not.toContainText(delivery.reference);
        
        console.log('Dock occupancy correctly synced after COMPLETED status.');
    });
});
