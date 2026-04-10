import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Groups Page', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/groups');
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(1000);
    });

    test('should display Groups heading', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Groups' })).toBeVisible({ timeout: 10000 });
    });

    test('should show New Group button for admin', async ({ page }) => {
        // Admin user should see the New Group button
        await expect(page.locator('text=New Group')).toBeVisible({ timeout: 5000 });
    });

    test('should display groups table with correct columns', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        const hasEmpty = await page.locator('text=/No groups/i').isVisible().catch(() => false);

        if (hasTable) {
            const headers = ['Group Name', 'Description', 'Members', 'Owner'];
            for (const header of headers) {
                await expect(page.locator('th', { hasText: header }).first()).toBeVisible();
            }
        }
        // Either table or empty state should be visible
        expect(hasTable || hasEmpty).toBeTruthy();
    });

    test('should have search input', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            await expect(page.locator('input[placeholder*="Search groups"]')).toBeVisible();
        }
    });

    test('should not show server errors', async ({ page }) => {
        const errorMsg = page.locator('text=/error loading groups/i');
        const hasError = await errorMsg.isVisible().catch(() => false);
        expect(hasError).toBeFalsy();
    });
});
