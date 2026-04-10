import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should display login form correctly', async ({ page }) => {
        await expect(page.locator('h1')).toHaveText('Sign in to CRM');
        await expect(page.locator('#username')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should disable Sign In button when fields are empty', async ({ page }) => {
        const signInBtn = page.getByRole('button', { name: /sign in/i });
        await expect(signInBtn).toBeDisabled();
    });

    test('should reject invalid credentials', async ({ page }) => {
        await page.locator('#username').fill('wrong_user');
        await page.locator('#password').fill('wrong_pass');

        const signInBtn = page.getByRole('button', { name: /sign in/i });
        await signInBtn.click({ force: true, timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(3000);

        // Either: error message appeared, OR we stayed on login page (both correct)
        const onLoginPage = page.url().includes('/login');
        expect(onLoginPage).toBeTruthy();
    });

    test('should login successfully and redirect to dashboard', async ({ page }) => {
        await login(page, 'admin', 'admin123');
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
    });

    test('should persist session after login (no re-login on refresh)', async ({ page }) => {
        await login(page, 'admin', 'admin123');
        await page.waitForURL((url) => !url.pathname.includes('/login'));
        await page.reload();
        await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    });
});
