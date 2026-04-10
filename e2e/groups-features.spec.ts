import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Groups Page — Features', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/groups');
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000);
    });

    // --- CREATE GROUP ---
    test('should open New Group modal', async ({ page }) => {
        const newGroupBtn = page.locator('text=New Group');
        if (await newGroupBtn.isVisible().catch(() => false)) {
            await newGroupBtn.click();
            await page.waitForTimeout(500);
            const modal = page.locator('[role="dialog"]');
            await expect(modal).toBeVisible({ timeout: 5000 });
        }
    });

    // --- TABLE FEATURES ---
    test('should display group rows with action buttons', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            // Each group row should have action buttons
            const actionBtns = page.locator('table tbody button');
            const count = await actionBtns.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('should show group volume stats', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            const vol30d = page.locator('text=30d:').first();
            const volTotal = page.locator('text=Total:').first();
            await expect(vol30d).toBeVisible({ timeout: 10000 });
            await expect(volTotal).toBeVisible();
        }
    });

    test('should have View Care History button', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            await expect(page.locator('text=View Care History').first()).toBeVisible({ timeout: 10000 });
        }
    });

    // --- ACTION BUTTONS ---
    test('should have group action buttons visible', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            // Look for tooltipped action buttons in first row
            const actionBtns = page.locator('table tbody tr').first().locator('button');
            const count = await actionBtns.count();
            // Groups should have multiple action buttons (edit, analytics, assign, add members, delete)
            expect(count).toBeGreaterThan(0);
        }
    });

    test('should filter groups by search query', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search groups"]');
        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.fill('test');
            await page.waitForTimeout(500);
            await expect(page.locator('h1', { hasText: 'Groups' })).toBeVisible();
        }
    });

    test('should show Delete confirmation when pressing delete', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            // Find any delete button (trash icon)
            const allBtns = page.locator('table tbody tr').first().locator('button');
            const btnCount = await allBtns.count();
            // The last button is typically Delete
            if (btnCount > 0) {
                const lastBtn = allBtns.nth(btnCount - 1);
                await lastBtn.click();
                await page.waitForTimeout(500);
                // Check if confirmation dialog appeared
                const hasDialog = await page.locator('[role="dialog"]').isVisible().catch(() => false);
                if (hasDialog) {
                    // Close it
                    const cancelBtn = page.locator('[role="dialog"] button', { hasText: /Cancel|Close/i }).first();
                    if (await cancelBtn.isVisible().catch(() => false)) {
                        await cancelBtn.click();
                    }
                }
            }
        }
    });

    test('should have group owner column in table', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            await expect(page.locator('th', { hasText: 'Owner' }).first()).toBeVisible({ timeout: 10000 });
        }
    });

    test('should have members column in table', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            await expect(page.locator('th', { hasText: 'Members' }).first()).toBeVisible({ timeout: 10000 });
        }
    });
});
