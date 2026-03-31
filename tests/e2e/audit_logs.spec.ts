import { test, expect } from '@playwright/test';
import { loginAsRole, bootstrapWarehouse, navigateTo } from './helpers';

test.describe.skip('System Audit Logs (v3.10.0)', () => {
    const testWarehouseId = 'W10-AUDIT';

    test('should log dock deletion in the audit log', async ({ page }) => {
        // 1. Login as Admin
        await loginAsRole(page, 'admin');
        
        // 2. Setup Warehouse and Dock
        await navigateTo(page, 'Dock Planning');
        await bootstrapWarehouse(page, testWarehouseId);
        
        // 3. Delete the dock via Settings
        await navigateTo(page, 'Instellingen');
        await page.click('button:has-text("YMS Instellingen")');
        
        // Select the correct warehouse in the settings dropdown
        const select = page.locator('select');
        await select.selectOption(testWarehouseId);
        
        await page.click('[data-testid="settings-tabs"] button:has-text("Docks")');
        
        const dockId = 100 + (parseInt(testWarehouseId.replace(/[^0-9]/g, '')) || 0);
        await expect(page.locator(`[data-testid="dock-card-${dockId}"]`)).toBeVisible({ timeout: 10000 });

        // Handle confirmation dialog
        page.on('dialog', dialog => dialog.accept());
        await page.click(`[data-testid="delete-dock-${dockId}"]`);
        
        // Wait for removal
        await expect(page.locator(`[data-testid="dock-card-${dockId}"]`)).not.toBeVisible({ timeout: 10000 });

        // 4. Navigate to Audit Log
        await navigateTo(page, 'Audit Logs');
        
        // 5. Verify log entry exists
        // Filter by the dock ID
        await page.fill('input[placeholder*="Zoek"]', `Dock ${dockId}`);
        await expect(page.locator('text=Systeemconfiguratie: dock verwijderd')).toBeVisible({ timeout: 15000 });
        await expect(page.locator(`text=Dock ${dockId} verwijderd`)).toBeVisible();
    });
});
