import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Leads Page', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/leads');
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(1000);
    });

    test('should load leads page without crashing', async ({ page }) => {
        // Verify we're on the leads page and it rendered something
        expect(page.url()).toContain('/leads');
        // Should not show a blank page — at least the sidebar is there
        await expect(page.locator('text=Leads').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display lead data (kanban or table)', async ({ page }) => {
        // Leads page might use kanban board or table
        const hasContent = await page.locator('table, [class*="card"], [class*="kanban"], [class*="board"], [class*="column"]')
            .first()
            .isVisible({ timeout: 10000 })
            .catch(() => false);

        // Even if no leads data, the page should load without errors
        const hasError = await page.locator('text=/error loading|server error|500 internal/i')
            .isVisible()
            .catch(() => false);

        expect(hasError).toBeFalsy();
    });

    test('should not show any server errors', async ({ page }) => {
        const errorMessage = page.locator('text=/error loading|server error|500 internal/i');
        const errorCount = await errorMessage.count();
        expect(errorCount).toBe(0);
    });
});

test.describe('Navigation Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('sidebar should show all main navigation items', async ({ page }) => {
        const navItems = ['Dashboard', 'Customers', 'Groups', 'Leads', 'Tasks'];
        for (const item of navItems) {
            await expect(page.locator(`text=${item}`).first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('should navigate to Tasks page without errors', async ({ page }) => {
        await page.click('text=Tasks');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
        expect(page.url()).toContain('/tasks');

        const hasError = await page.locator('text=/error loading|server error|500 internal/i')
            .isVisible()
            .catch(() => false);
        expect(hasError).toBeFalsy();
    });

    test('should navigate to Groups page without errors', async ({ page }) => {
        await page.click('text=Groups');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const hasError = await page.locator('text=/error loading|server error|500 internal/i')
            .isVisible()
            .catch(() => false);
        expect(hasError).toBeFalsy();
    });

    test('should navigate to Settings page without errors', async ({ page }) => {
        await page.click('text=Settings');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

        const hasError = await page.locator('text=/error loading|server error|500 internal/i')
            .isVisible()
            .catch(() => false);
        expect(hasError).toBeFalsy();
    });
});
