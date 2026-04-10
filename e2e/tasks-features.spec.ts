import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Tasks Page — Features', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/tasks');
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000);
    });

    // --- CREATE TASK MODAL ---
    test('should open create task modal with all form fields', async ({ page }) => {
        await page.locator('text=New Task').click();
        await page.waitForTimeout(500);
        await expect(page.locator('text=Basic Information')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('input[placeholder*="task title"]')).toBeVisible();
        await expect(page.locator('textarea[placeholder*="task description"]')).toBeVisible();
        await expect(page.locator('text=Task Details')).toBeVisible();
        await expect(page.locator('text=Assignees').first()).toBeVisible();
        await expect(page.locator('text=Manage Assignees')).toBeVisible();
        await expect(page.locator('text=Customers').first()).toBeVisible();
        await expect(page.locator('text=Manage Customers')).toBeVisible();
        await expect(page.locator('text=Attachments')).toBeVisible();
    });

    test('should disable Create button when title is empty', async ({ page }) => {
        await page.locator('text=New Task').click();
        await page.waitForTimeout(500);
        const createBtn = page.locator('button', { hasText: 'Create' });
        await expect(createBtn).toBeDisabled();
    });

    test('should enable Create button when title is filled', async ({ page }) => {
        await page.locator('text=New Task').click();
        await page.waitForTimeout(500);
        await page.locator('input[placeholder*="task title"]').fill('Test Task Title');
        await page.waitForTimeout(300);
        const createBtn = page.locator('button', { hasText: 'Create' });
        await expect(createBtn).toBeEnabled();
    });

    test('should close modal with Cancel button', async ({ page }) => {
        await page.locator('text=New Task').click();
        await page.waitForTimeout(500);
        await page.locator('button', { hasText: 'Cancel' }).click();
        await page.waitForTimeout(500);
        await expect(page.locator('text=Basic Information')).not.toBeVisible();
    });

    // --- FILTERS ---
    test('should have Status filter section', async ({ page }) => {
        await expect(page.locator('text=Status').first()).toBeVisible({ timeout: 15000 });
    });

    test('should have Include archived checkbox', async ({ page }) => {
        await expect(page.locator('text=Include archived')).toBeVisible({ timeout: 15000 });
    });

    test('should have Refresh button', async ({ page }) => {
        await expect(page.locator('text=Refresh').first()).toBeVisible({ timeout: 15000 });
    });

    // --- CREATE MODAL DETAILS ---
    test('should have file upload area in create task modal', async ({ page }) => {
        await page.locator('text=New Task').click();
        await page.waitForTimeout(500);
        // The upload button text is dynamic: "Upload files (optional)" or "N file(s) selected"
        await expect(page.locator('text=/Upload files|file\\(s\\) selected/')).toBeVisible({ timeout: 5000 });
    });

    test('should have deadline date picker in create task modal', async ({ page }) => {
        await page.locator('text=New Task').click();
        await page.waitForTimeout(500);
        await expect(page.locator('text=Deadline')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('input[type="datetime-local"]')).toBeVisible();
    });

    test('should have priority selector in create task modal', async ({ page }) => {
        await page.locator('text=New Task').click();
        await page.waitForTimeout(500);
        await expect(page.locator('text=Priority').first()).toBeVisible({ timeout: 5000 });
    });
});
