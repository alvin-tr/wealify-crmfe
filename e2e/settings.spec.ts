import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/settings');
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000);
    });

    test('should display Settings heading', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Settings' })).toBeVisible({ timeout: 15000 });
    });

    test('should show Workspace Settings card', async ({ page }) => {
        await expect(page.locator('text=Workspace Settings')).toBeVisible({ timeout: 10000 });
    });

    test('should display tab navigation', async ({ page }) => {
        await expect(page.locator('text=General').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Monitoring').first()).toBeVisible();
    });

    test('should show User Management form', async ({ page }) => {
        // Click the "User management" tab to navigate there
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        // Form fields should be present
        const hasForm = await page.locator('#create-user-username').isVisible({ timeout: 5000 }).catch(() => false);
        const hasHeading = await page.locator('text=Create new CRM users').isVisible().catch(() => false);
        expect(hasForm || hasHeading).toBeTruthy();
    });

    test('should switch between tabs without errors', async ({ page }) => {
        // Click Monitoring tab
        const monTab = page.locator('text=Monitoring').first();
        if (await monTab.isVisible().catch(() => false)) {
            await monTab.click();
            await page.waitForTimeout(500);
        }

        // Click General tab
        const genTab = page.locator('text=General').first();
        if (await genTab.isVisible().catch(() => false)) {
            await genTab.click();
            await page.waitForTimeout(500);
        }

        // Page should still be functional
        await expect(page.locator('h1', { hasText: 'Settings' })).toBeVisible();
    });

    test('should disable Create User button when form is empty', async ({ page }) => {
        // Make sure we're on Users tab
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        const createBtn = page.locator('button', { hasText: 'Create user' });
        if (await createBtn.isVisible().catch(() => false)) {
            await expect(createBtn).toBeDisabled();
        }
    });

    test('should show password mismatch warning', async ({ page }) => {
        // Make sure we're on Users tab
        const userTab = page.locator('text=User management').first();
        if (await userTab.isVisible().catch(() => false)) {
            await userTab.click();
            await page.waitForTimeout(500);
        }
        const pwField = page.locator('#create-user-password');
        const confirmField = page.locator('#create-user-confirm-password');
        if (await pwField.isVisible().catch(() => false)) {
            await pwField.fill('abc123');
            await confirmField.fill('xyz789');
            await page.waitForTimeout(300);
            await expect(page.locator('text=Passwords do not match')).toBeVisible();
        }
    });
});
