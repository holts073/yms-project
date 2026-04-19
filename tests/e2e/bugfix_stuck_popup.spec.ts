import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers';

test.describe('Bugfix: Stuck Edit Popup', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsRole(page, 'admin');
    });

    test('should close the modal and NOT re-open after saving a delivery', async ({ page }) => {
        // 1. Navigate to deliveries with a specific ID to trigger the auto-open
        // We know from reset-db.ts that the first delivery ID is usually something like 'D001' or similar.
        // Let's go to Dashboard first to see a delivery.
        await page.goto('/');
        await page.waitForSelector('text=Dashboard');

        // Click on a delivery in the DashboardTable to navigate and auto-open
        // In Dashboard.tsx: onSelect={(id) => onNavigate?.('deliveries', undefined, id)}
        const row = page.locator('tr').nth(1);
        await row.click();

        // 2. Wait for Modal to open
        await expect(page.locator('text=Vracht Bewerken')).toBeVisible();

        // 3. Edit something and Save
        const refInput = page.locator('input[name="reference"]');
        const originalRef = await refInput.inputValue();
        await refInput.fill(originalRef + '-MOD');
        
        await page.locator('button:has-text("Opslaan")').click();

        // 4. Verify Modal closes
        await expect(page.locator('text=Vracht Bewerken')).not.toBeVisible();

        // 5. Wait for socket update (simulated by waiting a bit)
        await page.waitForTimeout(1000);

        // 6. CRITICAL: Verify Modal stays closed
        await expect(page.locator('text=Vracht Bewerken')).not.toBeVisible();
        
        // 7. Verify data was updated in the table
        await expect(page.locator(`text=${originalRef}-MOD`)).toBeVisible();
    });
});
