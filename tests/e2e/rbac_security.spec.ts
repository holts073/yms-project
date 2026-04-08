import { test, expect } from '@playwright/test';
import { loginAsRole, bootstrapWarehouse, navigateTo } from './helpers';

test.describe('RBAC & Security Hardening (v3.10.0)', () => {
    const testWarehouseId = 'W10-RBAC';

    test('Viewer should NOT see management buttons and stay in Read-only mode', async ({ page }) => {
        // 1. Login as Viewer
        await loginAsRole(page, 'viewer');
        
        // 2. Navigate to Dock Planning (should be visible)
        await navigateTo(page, 'Dock Planning');
        await expect(page.locator('text=Yard Overzicht')).toBeVisible({ timeout: 10000 });

        // 3. Navigate to Settings and check for "blocked" actions
        await navigateTo(page, 'Instellingen');
        await page.click('button:has-text("YMS Instellingen")');
        
        // Tab Docks
        await page.click('[data-testid="settings-tabs"] button:has-text("Docks")');
        
        // Admin buttons like "Dock Toevoegen" should not be visible or should be disabled
        // According to AGENTS.md, UI should adapt.
        const addDockButton = page.locator('button:has-text("Dock Toevoegen")');
        await expect(addDockButton).not.toBeVisible();
        
        // 4. Try to access arrivals and check for Access Denied (since Viewer has NO capabilities by default)
        await navigateTo(page, 'Aankomst & Inspectie');
        
        // Wait for Access Denied view
        const accessDenied = page.locator('[data-testid="access-denied-view"]');
        await expect(accessDenied).toBeVisible({ timeout: 10000 });
        await expect(accessDenied).toContainText('Toegang Geweigerd');
        await expect(accessDenied).toContainText('Upgrade');
    });

    test('Staff should see locked items for Finance features', async ({ page }) => {
        // 1. Login as Staff
        await loginAsRole(page, 'staff');
        
        // 2. Check sidebar for locked Finance item
        const financeItem = page.locator('button:has-text("Pallet Reconciliatie")');
        await expect(financeItem).toBeVisible();
        await expect(financeItem.locator('text=PRO')).toBeVisible(); // Check for PRO badge
        
        // 3. Click locked item -> Access Denied
        await financeItem.click();
        const accessDenied = page.locator('[data-testid="access-denied-view"]');
        await expect(accessDenied).toBeVisible();
    });

    test('Admin should have full access to management features', async ({ page }) => {
        // 1. Login as Admin
        await loginAsRole(page, 'admin');
        
        // 2. Navigate to Settings
        await navigateTo(page, 'Instellingen');
        await page.click('button:has-text("YMS Instellingen")');
        await page.click('[data-testid="settings-tabs"] button:has-text("Docks")');
        
        // Admin should see "Dock Toevoegen"
        const addDockButton = page.locator('button:has-text("Dock Toevoegen")');
        await expect(addDockButton).toBeVisible();

        // 3. Navigate to Arrivals
        await navigateTo(page, 'Aankomst & Inspectie');
        // If there's a delivery, check for complete button
        // (We can use a helper to bootstrap if needed, but here we just check visibility of the UI element conceptually)
        // Let's bootstrap a warehouse to be sure
        await navigateTo(page, 'Dock Planning');
        await bootstrapWarehouse(page, testWarehouseId);
        
        await navigateTo(page, 'Aankomst & Inspectie');
        // After bootstrap, there might not be a delivery yet, but the UI should show the column for actions
        await expect(page.locator('th:has-text("Acties")')).toBeVisible();
    });
});
