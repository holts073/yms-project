import { test, expect } from '@playwright/test';
import { login, bootstrapWarehouse, navigateTo } from './helpers';

test.describe('Yard Stability & Capacity Sync', () => {
    const testWarehouseId = 'W06-STAB';

    test.beforeEach(async ({ page }) => {
        await login(page);
        await navigateTo(page, 'Dock Planning');
        await bootstrapWarehouse(page, testWarehouseId);
        // Wait for dashboard to stabilize
        await expect(page.locator('[data-testid="capacity-max"]')).toBeVisible({ timeout: 15000 });
    });

    test('should reflect decreased capacity when a dock is blocked', async ({ page }) => {
        // 1. Check initial capacity
        const initialMax = await page.locator('[data-testid="capacity-max"]').innerText();
        expect(initialMax).toBe('32');

        // 2. Add another dock via settings to have something to block
        await navigateTo(page, 'Instellingen');
        await page.click('button:has-text("YMS Instellingen")');
        await page.click('[data-testid="settings-tabs"] button:has-text("Docks")');
        await page.click('button:has-text("Dock Toevoegen")');
        
        // Wait for the new dock card to appear (Dock 2)
        await expect(page.locator('[data-testid="dock-card-2"]')).toBeVisible({ timeout: 10000 });
        
        // 3. Go back to dashboard and verify capacity is now 64
        await navigateTo(page, 'Dock Planning');
        await expect(page.locator('[data-testid="capacity-max"]')).toHaveText('64', { timeout: 10000 });

        // 4. Block Dock 2 in Settings
        await navigateTo(page, 'Instellingen');
        await page.click('button:has-text("YMS Instellingen")');
        await page.click('[data-testid="settings-tabs"] button:has-text("Docks")');
        await page.click('[data-testid="block-dock-2"]');
        
        // 5. Verify Capacity on Dashboard is back to 32
        await navigateTo(page, 'Dock Planning');
        await expect(page.locator('[data-testid="capacity-max"]')).toHaveText('32', { timeout: 10000 });
        
        // 6. Verify Dock 2 is NOT in the Planning Grid anymore
        // (Planning grid shows name, e.g. "Nieuw Dock 2")
        await expect(page.locator('text=Nieuw Dock 2')).not.toBeVisible();
    });

    test('should filter out blocked waiting areas from dashboard', async ({ page }) => {
        await navigateTo(page, 'Instellingen');
        await page.click('button:has-text("YMS Instellingen")');
        await page.click('[data-testid="settings-tabs"] button:has-text("Wachtruimtes")');
        
        // 1. Add a waiting area
        await page.click('button:has-text("Toevoegen")');
        await expect(page.locator('[data-testid="wa-card-1"]')).toBeVisible({ timeout: 10000 });
        
        // 2. Verify visibility on Dashboard
        await navigateTo(page, 'Dock Planning');
        await expect(page.locator('text=Plaats Wachtplaats 1')).toBeVisible({ timeout: 10000 });

        // 3. Block it in Settings
        await navigateTo(page, 'Instellingen');
        await page.click('button:has-text("YMS Instellingen")');
        await page.click('[data-testid="settings-tabs"] button:has-text("Wachtruimtes")');
        await page.click('[data-testid="block-wa-1"]');
        
        // 4. Verify disappearance from Dashboard
        await navigateTo(page, 'Dock Planning');
        await expect(page.locator('text=Plaats Wachtplaats 1')).not.toBeVisible({ timeout: 10000 });
    });

    test('should delete dock and permanently remove it from capacity', async ({ page }) => {
        await navigateTo(page, 'Instellingen');
        await page.click('button:has-text("YMS Instellingen")');
        await page.click('[data-testid="settings-tabs"] button:has-text("Docks")');
        
        // Ensure we have a dock to delete
        const dockId = 100 + (parseInt(testWarehouseId.replace(/[^0-9]/g, '')) || 0);
        await expect(page.locator(`[data-testid="dock-card-${dockId}"]`)).toBeVisible({ timeout: 10000 });

        // 1. Delete it
        page.on('dialog', dialog => dialog.accept()); // Handle confirmation
        await page.click(`[data-testid="delete-dock-${dockId}"]`);
        
        // 2. Verify Capacity is 0 on Dashboard
        await navigateTo(page, 'Dock Planning');
        await expect(page.locator('[data-testid="capacity-max"]')).toHaveText('0', { timeout: 15000 });
    });
});
