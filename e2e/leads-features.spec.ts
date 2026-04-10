import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Leads Page — Features', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/leads');
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000);
    });

    // --- STATISTICS ---
    test('should display Total Leads stat card', async ({ page }) => {
        await expect(page.locator('text=Total Leads').first()).toBeVisible({ timeout: 15000 });
    });

    test('should display Qualified Leads stat card', async ({ page }) => {
        await expect(page.locator('text=Qualified Leads').first()).toBeVisible({ timeout: 15000 });
    });

    // --- MORE DETAILS ---
    test('should have More Details collapsible section', async ({ page }) => {
        await expect(page.locator('text=More Details').first()).toBeVisible({ timeout: 15000 });
        // Has Show/Hide toggle button
        const toggleBtn = page.locator('button', { hasText: /Show|Hide/ }).first();
        await expect(toggleBtn).toBeVisible();
    });

    // --- HEADER BUTTONS ---
    test('should show New Lead button', async ({ page }) => {
        await expect(page.locator('text=New Lead')).toBeVisible({ timeout: 15000 });
    });

    test('should show Download Template button', async ({ page }) => {
        await expect(page.locator('text=Download Template')).toBeVisible({ timeout: 15000 });
    });

    test('should show Refresh button', async ({ page }) => {
        await expect(page.locator('text=Refresh').first()).toBeVisible({ timeout: 15000 });
    });

    // --- TABLE ---
    test('should display leads in table with pagination', async ({ page }) => {
        // Should have the leads table with items-per-page control
        await expect(page.locator('text=Items per page').first()).toBeVisible({ timeout: 15000 });
    });

    test('should show Converted Leads stat card', async ({ page }) => {
        await expect(page.locator('text=Converted Leads').first()).toBeVisible({ timeout: 15000 });
    });
});
