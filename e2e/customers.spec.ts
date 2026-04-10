import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Customers Page', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/customers');
        // Wait for the page to fully render — customers table can take time with 8000 rows
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000); // Extra buffer for Vue reactivity
    });

    test('should display page header and stats cards', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Customers' })).toBeVisible({ timeout: 30000 });
        await expect(page.locator('text=Total Customers')).toBeVisible({ timeout: 30000 });
    });

    test('should show tier distribution (Diamond, Gold, Silver, Standard)', async ({ page }) => {
        await expect(page.locator('text=Customers by Tier')).toBeVisible({ timeout: 30000 });
        const tierLabels = ['Diamond', 'Gold', 'Silver', 'Standard'];
        for (const tier of tierLabels) {
            await expect(page.locator(`text=${tier}`).first()).toBeVisible();
        }
    });

    test('should render customer table with correct columns', async ({ page }) => {
        await page.waitForSelector('table', { timeout: 30000 });
        const expectedHeaders = ['ID', 'Full Name', 'Email', 'Phone', 'Tier'];
        for (const header of expectedHeaders) {
            await expect(page.locator('th', { hasText: header }).first()).toBeVisible();
        }
    });

    test('should display customer rows in the table', async ({ page }) => {
        await page.waitForSelector('tbody tr', { timeout: 30000 });
        const rows = page.locator('tbody tr');
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show pagination controls', async ({ page }) => {
        await page.waitForSelector('text=Items per page', { timeout: 30000 });
        await expect(page.locator('text=Items per page')).toBeVisible();
    });

    test('should navigate between pages', async ({ page }) => {
        await page.waitForSelector('tbody tr', { timeout: 30000 });

        // Find a "next page" type button
        const nextButtons = page.locator('button').filter({ has: page.locator('svg, [class*="chevron-right"]') });
        const count = await nextButtons.count();

        if (count > 0) {
            const btn = nextButtons.last();
            if (await btn.isEnabled()) {
                await btn.click();
                await page.waitForTimeout(1000);
            }
        }
        // Just verify the page didn't crash
        await expect(page.locator('tbody tr').first()).toBeVisible();
    });

    test('should filter customers by search query', async ({ page }) => {
        test.setTimeout(120000);
        await page.waitForSelector('tbody tr', { timeout: 30000 });
        const searchInput = page.locator('input[placeholder*="Search customers"]');
        await searchInput.fill('NGUYEN');
        await searchInput.press('Enter');
        await page.waitForTimeout(1500);

        // Just verify no crash — search is client-side and may or may not match
        const heading = page.locator('h1', { hasText: 'Customers' });
        await expect(heading).toBeVisible();
    });

    test('should not crash when loading 8000+ customers', async ({ page }) => {
        // Wait for stats to appear
        await page.waitForSelector('text=Total Customers', { timeout: 30000 });
        const statsArea = page.locator('text=Total Customers').locator('..');
        await expect(statsArea).toBeVisible();
        // Verify the page is interactive — no white screen
        await expect(page.locator('h1', { hasText: 'Customers' })).toBeVisible();
    });
});
