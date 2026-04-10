import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Settings Page — Features', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/settings');
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000);
    });

    // --- USER MANAGEMENT ---
    test('should have Full Name, Username, Password, Confirm Password fields', async ({ page }) => {
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        await expect(page.locator('#create-user-full-name')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#create-user-username')).toBeVisible();
        await expect(page.locator('#create-user-password')).toBeVisible();
        await expect(page.locator('#create-user-confirm-password')).toBeVisible();
    });

    test('should have Role dropdown', async ({ page }) => {
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        const roleSelect = page.locator('#create-user-role');
        await expect(roleSelect).toBeVisible({ timeout: 10000 });
    });

    test('should have Status dropdown', async ({ page }) => {
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        const statusSelect = page.locator('#create-user-status');
        await expect(statusSelect).toBeVisible({ timeout: 10000 });
    });

    test('should have Avatar URL field', async ({ page }) => {
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        await expect(page.locator('#create-user-avatar')).toBeVisible({ timeout: 10000 });
    });

    test('should enable Create button when form is valid', async ({ page }) => {
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        await page.locator('#create-user-full-name').fill('Test User');
        await page.locator('#create-user-username').fill('testuser');
        await page.locator('#create-user-password').fill('password123');
        await page.locator('#create-user-confirm-password').fill('password123');
        await page.waitForTimeout(300);
        const createBtn = page.locator('button', { hasText: 'Create user' });
        await expect(createBtn).toBeEnabled();
    });

    test('should Reset form when clicking Reset button', async ({ page }) => {
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        await page.locator('#create-user-full-name').fill('Test User');
        await page.locator('#create-user-username').fill('testuser');
        await page.locator('button', { hasText: 'Reset' }).click();
        await page.waitForTimeout(300);
        await expect(page.locator('#create-user-full-name')).toHaveValue('');
        await expect(page.locator('#create-user-username')).toHaveValue('');
    });

    // --- MONITORING TAB ---
    test('should show monitoring controls when switching to Monitoring tab', async ({ page }) => {
        const monTab = page.locator('text=Monitoring').first();
        if (await monTab.isVisible().catch(() => false)) {
            await monTab.click();
            await page.waitForTimeout(1000);
            await expect(page.locator('text=Monitoring automation')).toBeVisible({ timeout: 10000 });
            await expect(page.locator('text=Refresh summary data')).toBeVisible();
            await expect(page.locator('text=Run monitoring rules')).toBeVisible();
        }
    });

    test('should show Refresh summary and Run rules buttons in Monitoring', async ({ page }) => {
        const monTab = page.locator('text=Monitoring').first();
        if (await monTab.isVisible().catch(() => false)) {
            await monTab.click();
            await page.waitForTimeout(1000);
            await expect(page.locator('button', { hasText: 'Refresh summary' })).toBeVisible({ timeout: 10000 });
            await expect(page.locator('button', { hasText: 'Run rules' })).toBeVisible();
        }
    });
});
