import { test, expect } from '@playwright/test';
import { login, dispatchSync, bootstrapWarehouse, dragTimelineItem, TEST_DATE, navigateTo } from './helpers';

test.describe('YMS Yard Planning', () => {
    const testRef = `PLAN-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const testWarehouseId = 'W03-PLAN';

    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateTo(page, 'Dock Planning');
        await bootstrapWarehouse(page, testWarehouseId);
    });

    test('should snap a delivery to the 30-min grid during drag and drop', async ({ page }) => {
        // 1. Setup Delivery for Fixed TEST_DATE at 10:00
        await dispatchSync(page, {
            type: 'YMS_SAVE_DELIVERY',
            payload: {
                id: 'plan-test-id',
                reference: testRef,
                licensePlate: 'GRID-999',
                supplier: 'Grid Logistics',
                temperature: 'Droog',
                scheduledTime: `${TEST_DATE}T10:00:00.000Z`,
                status: 'EXPECTED',
                warehouseId: testWarehouseId,
                direction: 'INBOUND',
                palletCount: 15
            }
        }, `[data-testid*="${testRef}"]`);

        const timelineItem = page.locator(`[data-testid*="${testRef}"]`).first();
        await expect(timelineItem).toBeVisible({ timeout: 15000 });

        // 2. Drag to Slot 103 at 09:00 (Dock ID 103 from bootstrap)
        await dragTimelineItem(page, `[data-testid*="${testRef}"]`, `[data-testid="slot-cell-103-09:00"]`);
        
        // 3. Verify snap and status change to PLANNED
        await expect(timelineItem).toContainText('09:00', { timeout: 15000 });
        await expect(timelineItem).toContainText('PLANNED', { timeout: 10000 });
    });
});
