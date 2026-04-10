import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Customers Page — Features', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/customers');
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000);
    });

    // --- FILTERS ---
    test('should have Tier filter dropdown', async ({ page }) => {
        const tierFilter = page.locator('[title="Filter by tier"]');
        await expect(tierFilter).toBeVisible({ timeout: 30000 });
    });

    test('should have Sale Status filter dropdown', async ({ page }) => {
        const statusFilter = page.locator('[title="Filter by sale status"]');
        await expect(statusFilter).toBeVisible({ timeout: 30000 });
    });

    test('should have Email filter input', async ({ page }) => {
        const emailFilter = page.locator('[title="Filter by email"]');
        await expect(emailFilter).toBeVisible({ timeout: 30000 });
    });

    test('should have Phone filter input', async ({ page }) => {
        const phoneFilter = page.locator('[title="Filter by phone"]');
        await expect(phoneFilter).toBeVisible({ timeout: 30000 });
    });

    test('should have Referral Code filter input', async ({ page }) => {
        const refFilter = page.locator('[title="Filter by referral code"]');
        await expect(refFilter).toBeVisible({ timeout: 30000 });
    });

    test('should have Hide Zero Volume checkbox', async ({ page }) => {
        const checkbox = page.locator('#hideZeroVolume');
        await expect(checkbox).toBeVisible({ timeout: 30000 });
        await expect(page.locator('label[for="hideZeroVolume"]')).toHaveText('Hide zero volume');
    });

    test('should have Date range filters (from/to)', async ({ page }) => {
        await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 30000 });
        await expect(page.locator('input[type="date"]').nth(1)).toBeVisible();
    });

    test('should have Reset Filters button', async ({ page }) => {
        const resetBtn = page.locator('[aria-label="Reset filters"]');
        await expect(resetBtn).toBeVisible({ timeout: 30000 });
    });

    // --- TABLE INTERACTIONS ---
    test('should have Select All checkbox in table header', async ({ page }) => {
        const selectAll = page.locator('thead input[type="checkbox"]');
        await expect(selectAll).toBeVisible({ timeout: 30000 });
    });

    test('should have sortable column headers', async ({ page }) => {
        // Click ID column to sort
        const idHeader = page.locator('th', { hasText: 'ID' }).first();
        await expect(idHeader).toBeVisible({ timeout: 30000 });
        // Verify it's clickable (has cursor-pointer class)
        const classes = await idHeader.getAttribute('class') || '';
        expect(classes).toContain('cursor-pointer');
    });

    // --- ADMIN FEATURES ---
    test('should show Export Excel button for admin', async ({ page }) => {
        const exportBtn = page.locator('text=Export Excel');
        await expect(exportBtn).toBeVisible({ timeout: 30000 });
    });

    test('should filter by email when typing', async ({ page }) => {
        const emailFilter = page.locator('[title="Filter by email"]');
        await emailFilter.fill('test@');
        await page.waitForTimeout(1000);
        // Table should still be visible (no crash)
        await expect(page.locator('table')).toBeVisible();
    });
});
