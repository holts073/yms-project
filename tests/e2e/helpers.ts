import { Page, expect } from '@playwright/test';
import { UserRole } from '../../src/types';

/**
 * FIXED TEST DATE (Round 18)
 * Using a fixed date eliminates all timezone and "today" shifting issues.
 */
export const TEST_DATE = '2026-12-25';

/**
 * Common Login Helper with State Isolation
 */
export async function login(page: Page) {
  return loginAsRole(page, 'admin');
}

/**
 * Login specifically as a given role
 */
export async function loginAsRole(page: Page, role: UserRole) {
  const credentials = {
    admin: { email: 'admin@ilgfood.com', pass: 'ilg2026!' },
    manager: { email: 'manager@ilgfood.com', pass: 'manager123' },
    staff: { email: 'staff@ilgfood.com', pass: 'welkom123' },
    viewer: { email: 'viewer@ilgfood.com', pass: 'viewer123' },
    tablet: { email: 'tablet@ilgfood.com', pass: 'tablet123' } // Just in case
  };

  const { email, pass } = credentials[role] || credentials.admin;

  // Navigate to login page if not already there
  if (page.url().includes('/dashboard') || page.url().includes('/api')) {
    await page.goto('/');
  }

  await page.fill('[data-testid="login-email"]', email);
  await page.fill('[data-testid="login-password"]', pass);
  await page.click('[data-testid="login-submit"]');
  
  // Wait for login success (navigation to dashboard)
  await page.waitForURL('**/', { timeout: 10000 });
  await page.waitForSelector('nav', { timeout: 10000 });
  
  // Wait for the Application Socket Listener to be ready
  await page.waitForFunction(() => (window as any).YMS_READY === true, { timeout: 10000 });
  
  // Force the application to the test date
  await page.evaluate((date) => {
    window.dispatchEvent(new CustomEvent('YMS_ACTION', { 
      detail: { type: 'YMS_SET_SELECTED_DATE', payload: date } 
    }));
  }, TEST_DATE);
  
  await page.waitForTimeout(1000);
}

/**
 * Dispatch an action and wait for a selector to appear
 */
export async function dispatchSync(page: Page, action: { type: string, payload: any }, selector: string) {
  let success = false;
  let retries = 3;

  while (retries > 0 && !success) {
    try {
      await page.waitForFunction(() => (window as any).YMS_READY === true, { timeout: 10000 });
      await page.evaluate((act) => {
        window.dispatchEvent(new CustomEvent('YMS_ACTION', { detail: act }));
      }, action);

      // Check if it appears within 5 seconds for this specific try
      await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
      success = true;
    } catch (e) {
      retries--;
      if (retries > 0) {
        await page.reload(); // Hard reset for the next try
        await login(page);   // Re-auth
        await page.waitForTimeout(1000);
      }
    }
  }

  if (!success) {
    throw new Error(`Failed to dispatch and see ${selector} after 3 retries.`);
  }
  await page.waitForTimeout(1000);
}

/**
 * Ensure Warehouse exists and is selected
 */
export async function selectWarehouse(page: Page, whId: string) {
  // Always dispatch to server to ensure socket.data.selectedWarehouseId is set
  await page.evaluate((id) => {
    window.dispatchEvent(new CustomEvent('YMS_ACTION', { 
      detail: { type: 'SELECT_WAREHOUSE', payload: id } 
    }));
  }, whId);

  // UI interaction if needed (clicking the button)
  const buttonSelector = `[data-testid="${whId === 'W01' ? 'active-warehouse' : `warehouse-${whId}`}"]`;
  if (whId !== 'W01') {
    await page.waitForSelector(buttonSelector, { timeout: 10000 });
    await page.click(buttonSelector);
  }

  // Wait for the specific warehouse name to appear in the active badge
  const whName = whId.includes('-') ? whId.split('-').pop() : whId;
  await expect(page.locator('[data-testid="active-warehouse"]')).toContainText(whName || whId, { timeout: 10000 });
  await page.waitForTimeout(1000);
}

/**
 * Bootstrap a Warehouse and its Docks
 */
export async function bootstrapWarehouse(page: Page, whId: string) {
  // 1. Save Warehouse
  await dispatchSync(page, {
    type: 'YMS_SAVE_WAREHOUSE',
    payload: { 
      id: whId, 
      name: whId.includes('-') ? whId.split('-').pop() : whId, 
      hasGate: true, 
      fastLaneThreshold: 12, 
      minutesPerPallet: 2, 
      baseUnloadingTime: 15,
      openingTime: '07:00',
      closingTime: '23:00'
    }
  }, `[data-testid="${whId === 'W01' ? 'active-warehouse' : `warehouse-${whId}`}"]`);

  // 2. Select it
  await selectWarehouse(page, whId);
  
  // 3. Force Date Sync AFTER warehouse selection
  await page.evaluate((date) => {
    window.dispatchEvent(new CustomEvent('YMS_ACTION', { 
      detail: { type: 'YMS_SET_SELECTED_DATE', payload: date } 
    }));
  }, TEST_DATE);
  await page.waitForTimeout(1000);

  // 4. Save a Dock
  const dockId = 100 + (parseInt(whId.replace(/[^0-9]/g, '')) || 0);
  await dispatchSync(page, {
    type: 'YMS_SAVE_DOCK',
    payload: { 
      id: dockId, 
      warehouseId: whId, 
      name: `Dock ${dockId}`, 
      status: 'Available', 
      adminStatus: 'Active', 
      allowedTemperatures: ['Droog', 'Koel', 'Vries'], 
      direction_capability: 'BOTH' 
    }
  }, `[data-testid="dock-row-${dockId}"]`);

  return { dockId };
}

/**
 * Bootstrap a Delivery ensuring all NOT NULL fields are present
 */
export async function bootstrapDelivery(page: Page, warehouseId: string, overrides: any = {}) {
  const delivery = {
    id: `TEST-${Math.random().toString(36).substr(2, 9)}`,
    warehouseId,
    reference: `REF-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    licensePlate: `TRUCK-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
    supplier: 'Test Supplier B.V.',
    temperature: 'Droog',
    scheduledTime: `${TEST_DATE}T10:00:00.000Z`,
    status: 'PLANNED',
    palletCount: 15,
    direction: 'INBOUND',
    ...overrides
  };
  
  await dispatchSync(page, { type: 'YMS_SAVE_DELIVERY', payload: delivery }, `[data-testid*="${delivery.reference}"]`);
  return delivery;
}

/**
 * Universal Navigation Helper (Handles hidden sidebar)
 */
export async function navigateTo(page: Page, name: string) {
  // Try to find the link in the sidebar (using force if hidden)
  const link = page.getByRole('button', { name, includeHidden: true });
  await link.click({ timeout: 5000, force: true }).catch(async () => {
    // If it fails, maybe reload or try a direct dispatch if we have hash-routing
    // For now, reload is safest if we are in a 'trapped' state
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name, includeHidden: true }).click({ force: true });
  });
}

/**
 * Manual Drag and Drop helper for dnd-kit compatible with Playwright
 */
export async function dragTimelineItem(page: Page, itemSelector: string, slotSelector: string) {
  const item = page.locator(itemSelector).first();
  const slot = page.locator(slotSelector).first();

  await expect(item).toBeVisible({ timeout: 15000 });
  await expect(slot).toBeVisible({ timeout: 15000 });

  const itemBox = await item.boundingBox();
  const slotBox = await slot.boundingBox();

  if (!itemBox || !slotBox) throw new Error('Could not find item or slot bounding box');

  await page.mouse.move(itemBox.x + itemBox.width / 2, itemBox.y + itemBox.height / 2);
  await page.mouse.down();
  
  const endX = slotBox.x + slotBox.width / 2;
  const endY = slotBox.y + slotBox.height / 2;
  
  await page.mouse.move(endX + 5, endY + 5, { steps: 15 });
  await page.mouse.move(endX, endY, { steps: 10 });
  
  await page.waitForTimeout(1500);
  await page.mouse.up();
}
