import { test, expect } from '@playwright/test';
import { login, dispatchSync, bootstrapWarehouse, dragTimelineItem, TEST_DATE, navigateTo } from './helpers';

test.describe('Smart Capacity Settings', () => {
    const testWarehouseId = 'W05-CAP';

    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateTo(page, 'Dock Planning');
        await bootstrapWarehouse(page, testWarehouseId);
    });

    test('should update slot duration on timeline when warehouse settings are changed', async ({ page }) => {
        // 1. Set Smart Capacity Settings via Socket
        await dispatchSync(page, {
            type: 'YMS_SAVE_WAREHOUSE',
            payload: { 
                id: testWarehouseId, 
                name: 'CAP', 
                hasGate: true, 
                baseUnloadingTime: 20, 
                minutesPerPallet: 5, 
                fastLaneThreshold: 15 
            }
        }, `[data-testid="active-warehouse"]:has-text("CAP")`);
        
        await page.waitForTimeout(1000);

        const ref = `SMART-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        // 2. Add Delivery at Fixed TEST_DATE with 10 pallets
        // Expected Duration: 20 + (10 * 5) = 70 mins
        await dispatchSync(page, {
            type: 'YMS_SAVE_DELIVERY',
            payload: {
                id: 'smart-test-id',
                reference: ref,
                licensePlate: 'CAP-001',
                supplier: 'Smart Logistics',
                temperature: 'Droog',
                scheduledTime: `${TEST_DATE}T09:00:00.000Z`,
                status: 'PLANNED',
                dockId: 105, 
                warehouseId: testWarehouseId,
                direction: 'INBOUND',
                palletCount: 10
            }
        }, `[data-testid="timeline-item-${ref}"]`);

        const item = page.getByTestId(`timeline-item-${ref}`);
        await expect(item).toBeVisible({ timeout: 15000 });
        
        // 3. Verify Calculated Duration via data-duration attribute (Round 18)
        const duration = await item.getAttribute('data-duration');
        expect(duration).toBe('70');
    });

    test('should block assignment to fast lane if pallet count exceeds threshold', async ({ page }) => {
        // 1. Set Fast Lane Threshold to 5 pallets via Socket
        await dispatchSync(page, {
            type: 'YMS_SAVE_WAREHOUSE',
            payload: { id: testWarehouseId, name: 'CAP', hasGate: true, fastLaneThreshold: 5 }
        }, `[data-testid="active-warehouse"]:has-text("CAP")`);
        
        // 2. Ensure dock is Fast Lane (Dock ID 105 from bootstrap)
        await dispatchSync(page, {
            type: 'YMS_SAVE_DOCK',
            payload: { id: 105, warehouseId: testWarehouseId, name: 'Dock 105', isFastLane: true, status: 'Available', adminStatus: 'Active', allowedTemperatures: ['Droog'], direction_capability: 'BOTH' }
        }, '[data-testid="dock-row-105"]');

        const ref = `FAST-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        // 3. Add truck with 20 pallets at 10:00
        await dispatchSync(page, {
            type: 'YMS_SAVE_DELIVERY',
            payload: {
                id: 'fastlane-test-id',
                reference: ref,
                licensePlate: 'FAST-001',
                supplier: 'Fast Logistics',
                temperature: 'Droog',
                status: 'EXPECTED',
                warehouseId: testWarehouseId,
                direction: 'INBOUND',
                palletCount: 20,
                scheduledTime: `${TEST_DATE}T10:00:00.000Z`
            }
        }, `[data-testid="timeline-item-${ref}"]`);

        // 4. Drag to Fast Lane dock
        await dragTimelineItem(page, `[data-testid="timeline-item-${ref}"]`, `[data-testid="slot-cell-105-10:00"]`);

        // 5. Verify Failure Message
        await expect(page.locator('text=Conflict: Dock 105 is een Fast Lane')).toBeVisible({ timeout: 20000 });
    });
});
