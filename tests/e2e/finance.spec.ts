import { test, expect } from '@playwright/test';
import { login, selectWarehouse, dispatchSync, bootstrapWarehouse, TEST_DATE, navigateTo } from './helpers';

test.describe.skip('Finance & Pallets Ledger', () => {
    const testRef = `PAL-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const testWarehouseId = 'W06-FIN';

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should create pallet transaction after delivery completion', async ({ page }) => {
        // 1. Bootstrap Warehouse and Dock
        await navigateTo(page, 'Dock Planning');
        await bootstrapWarehouse(page, testWarehouseId);
        
        // 2. Add Delivery at Fixed TEST_DATE
        await dispatchSync(page, {
            type: 'YMS_SAVE_DELIVERY',
            payload: {
                id: 'finance-test-id',
                reference: testRef,
                licensePlate: 'FIN-000',
                supplier: 'Finance Supplier',
                transporterId: 'DHL-ID',
                temperature: 'Droog',
                scheduledTime: `${TEST_DATE}T10:00:00.000Z`,
                status: 'UNLOADING',
                warehouseId: testWarehouseId,
                direction: 'INBOUND',
                palletCount: 25,
                palletType: 'EUR',
                palletRate: 15,
                isPalletExchangeConfirmed: true
            }
        }, `[data-testid*="${testRef}"]`);

        // 3. Navigate to Arrivals
        await navigateTo(page, 'Aankomst & Inspectie');
        await selectWarehouse(page, testWarehouseId);

        // 4. Complete
        const deliveryRow = page.locator('[data-testid*="row"]').filter({ hasText: testRef });
        await expect(deliveryRow).toBeVisible({ timeout: 15000 });
        await deliveryRow.getByTestId('btn-complete').click();
        
        // Handle confirmation if any
        if (await page.locator('button:has-text("Bevestigen")').isVisible()) {
            await page.click('button:has-text("Bevestigen")');
        }

        // 5. Verify Pallet Ledger
        await navigateTo(page, 'Pallet Ledger');
        const ledgerRow = page.locator('tr').filter({ hasText: testRef });
        await expect(ledgerRow).toBeVisible({ timeout: 15000 });
        await expect(ledgerRow).toContainText('25');
    });

    test('should show reconciliation overview and settlement options', async ({ page }) => {
        await navigateTo(page, 'Reconciliatie');
        await expect(page.locator('h2:has-text("Reconciliatie")')).toBeVisible({ timeout: 10000 });
        
        // Select an entity if possible (using first one in list)
        const entityRow = page.locator('button[class*="w-full"]').first();
        await expect(entityRow).toBeVisible({ timeout: 15000 });
        await entityRow.click();
        
        // Verify "Verrekenen" button is visible
        await expect(page.locator('button:has-text("Verrekenen")')).toBeVisible({ timeout: 10000 });
    });
});
