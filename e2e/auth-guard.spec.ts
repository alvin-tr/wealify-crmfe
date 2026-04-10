import { test, expect } from '@playwright/test';

test.describe('Auth Guard — Edge Cases', () => {
    test('should redirect unauthenticated user to /login', async ({ page }) => {
        // Try to visit Customers without logging in
        await page.goto('/customers');
        await page.waitForTimeout(2000);

        // Should redirect to /login
        expect(page.url()).toContain('/login');
    });

    test('should redirect unauthenticated user from /tasks to /login', async ({ page }) => {
        await page.goto('/tasks');
        await page.waitForTimeout(2000);
        expect(page.url()).toContain('/login');
    });

    test('should redirect unauthenticated user from /settings to /login', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForTimeout(2000);
        expect(page.url()).toContain('/login');
    });
});
