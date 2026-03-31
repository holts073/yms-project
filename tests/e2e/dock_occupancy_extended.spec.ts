import { test, expect } from '@playwright/test';
import { loginAsRole, selectWarehouse, bootstrapDelivery, TEST_DATE } from './helpers';

test.describe('YMS Dock Occupancy Extended Sync', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsRole(page, 'admin');
        await selectWarehouse(page, 'W01');
    });

    test('should free the dock when a delivery is deleted', async ({ page }) => {
        // 1. Create and assign a delivery to a dock
        const dockId = 5; // Dock 5
        const delivery = await bootstrapDelivery(page, 'W01', {
            dockId,
            status: 'DOCKED',
            reference: 'DELETE-SYNC-TEST',
            scheduledTime: `${TEST_DATE}T11:00:00.000Z`
        });

        // 2. Verify dock is 'Occupied' in UI
        const dockSelector = `[data-testid="dock-card-${dockId}"]`;
        await page.waitForSelector(`${dockSelector}:has-text("Occupied")`);
        await expect(page.locator(dockSelector)).toContainText(delivery.reference);

        // 3. Delete the delivery DIRECTLY via the action bus to test the logic
        // This is more robust than clicking a button that might be hidden or moved
        await page.evaluate((id) => {
            window.dispatchEvent(new CustomEvent('YMS_ACTION', { 
                detail: { type: 'YMS_DELETE_DELIVERY', payload: id } 
            }));
        }, delivery.id);

        // 4. Verify dock becomes 'Available' IMMEDIATELY
        await page.waitForSelector(`${dockSelector}:has-text("Available")`, { timeout: 15000 });
        await expect(page.locator(dockSelector)).toContainText('Available');
        
        console.log('Dock occupancy correctly cleared after DELETION.');
    });

    test('should free the dock when status changes to GATE_OUT', async ({ page }) => {
        const dockId = 7; // Dock 7
        const delivery = await bootstrapDelivery(page, 'W01', {
            dockId,
            status: 'DOCKED',
            reference: 'GATEOUT-SYNC-TEST',
            scheduledTime: `${TEST_DATE}T12:00:00.000Z`
        });

        const dockSelector = `[data-testid="dock-card-${dockId}"]`;
        await page.waitForSelector(`${dockSelector}:has-text("Occupied")`);

        // Change status to GATE_OUT
        const delRow = page.locator(`[data-testid="delivery-row-${delivery.id}"]`);
        await delRow.locator('select').selectOption('GATE_OUT');

        // Verify dock becomes 'Available' 
        await page.waitForSelector(`${dockSelector}:has-text("Available")`, { timeout: 10000 });
        await expect(page.locator(dockSelector)).toContainText('Available');
        
        console.log('Dock occupancy correctly cleared after GATE_OUT.');
    });
});
