import { test, expect } from '@playwright/test';
import { loginAsRole, dispatchSync, bootstrapWarehouse, TEST_DATE, navigateTo } from './helpers';

test.describe('YMS Slot Conflict Prevention (v3.9.0)', () => {
    const testWarehouseId = 'W09-SLOT';
    const dockId = 101; // From bootstrap

    test.beforeEach(async ({ page }) => {
        // Use staff or manager to ensure conflict prevention is active
        await loginAsRole(page, 'staff');
        await navigateTo(page, 'Dock Planning');
        await bootstrapWarehouse(page, testWarehouseId);
    });

    test('should prevent overlapping slots for non-admin users', async ({ page }) => {
        // 1. Create first delivery at 10:00
        const ref1 = `SLOT-A-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        await dispatchSync(page, {
            type: 'YMS_ASSIGN_DOCK',
            payload: {
                deliveryId: 'del-1',
                dockId: dockId,
                scheduledTime: `${TEST_DATE}T10:00:00.000Z`,
                warehouseId: testWarehouseId // Ensure we pass it
            }
        }, `[data-testid*="del-1"]`).catch(() => {
            // If dispatchSync fails because the delivery doesn't exist in the state, 
            // we should first SAVE it.
        });

        // Actually, let's use a cleaner approach: bootstrap two deliveries first
        await dispatchSync(page, {
            type: 'YMS_SAVE_DELIVERY',
            payload: {
                id: 'del-1',
                reference: ref1,
                licensePlate: 'TRUCK-1',
                supplier: 'Supplier 1',
                temperature: 'Droog',
                scheduledTime: `${TEST_DATE}T10:00:00.000Z`,
                status: 'PLANNED',
                warehouseId: testWarehouseId,
                direction: 'INBOUND',
                palletCount: 10
            }
        }, `[data-testid*="${ref1}"]`);

        const ref2 = `SLOT-B-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        await dispatchSync(page, {
            type: 'YMS_SAVE_DELIVERY',
            payload: {
                id: 'del-2',
                reference: ref2,
                licensePlate: 'TRUCK-2',
                supplier: 'Supplier 2',
                temperature: 'Droog',
                scheduledTime: `${TEST_DATE}T10:30:00.000Z`,
                status: 'PLANNED',
                warehouseId: testWarehouseId,
                direction: 'INBOUND',
                palletCount: 10
            }
        }, `[data-testid*="${ref2}"]`);

        // 2. Assign del-1 to dock 101 at 10:00
        await page.evaluate(({deliveryId, dockId, time}) => {
            window.dispatchEvent(new CustomEvent('YMS_ACTION', { 
                detail: { type: 'YMS_ASSIGN_DOCK', payload: { deliveryId, dockId, scheduledTime: time } } 
            }));
        }, { deliveryId: 'del-1', dockId, time: `${TEST_DATE}T10:00:00.000Z` });
        
        await page.waitForTimeout(1000);

        // 3. Try to assign del-2 to same dock at 10:15 (overlap!)
        // Since duration is min 30 min, 10:00-10:30 is taken.
        await page.evaluate(({deliveryId, dockId, time}) => {
            window.dispatchEvent(new CustomEvent('YMS_ACTION', { 
                detail: { type: 'YMS_ASSIGN_DOCK', payload: { deliveryId, dockId, scheduledTime: time } } 
            }));
        }, { deliveryId: 'del-2', dockId, time: `${TEST_DATE}T10:15:00.000Z` });

        // 4. Verify error message toast (Sonner)
        await expect(page.locator('text=Conflict: Dock')).toBeVisible({ timeout: 10000 });
    });
});
