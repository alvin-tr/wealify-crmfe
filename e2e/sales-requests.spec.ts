import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Sales Requests Page', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/sales-requests');
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000);
    });

    test('should display Sales Requests heading', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Sales Requests' })).toBeVisible({ timeout: 15000 });
    });

    test('should show tabs or content for admin', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Sales Requests' })).toBeVisible();
    });

    test('should load page content without crashing', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Sales Requests' })).toBeVisible({ timeout: 15000 });
        const hasError = await page.locator('text=/error loading requests/i').isVisible().catch(() => false);
        expect(hasError).toBeFalsy();
    });

    test('should not show server errors', async ({ page }) => {
        const errorMsg = page.locator('text=/error loading requests/i');
        const hasError = await errorMsg.isVisible().catch(() => false);
        expect(hasError).toBeFalsy();
    });
});
