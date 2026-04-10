import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/');
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
    });

    test('should display dashboard heading', async ({ page }) => {
        // Admin sees "Welcome to CRM Web", Sales sees "Sales Analytics"
        const heading = page.locator('h2').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
        const text = await heading.textContent();
        expect(text).toMatch(/Welcome to CRM Web|Sales Analytics/i);
    });

    test('should not show any errors on dashboard', async ({ page }) => {
        const errorMsg = page.locator('text=/error|failed|500/i');
        const errorCount = await errorMsg.count();
        // Filter out any that are just labels/headers, look for actual error states
        let actualErrors = 0;
        for (let i = 0; i < errorCount; i++) {
            const el = errorMsg.nth(i);
            const classes = await el.getAttribute('class') || '';
            if (classes.includes('red') || classes.includes('error')) {
                actualErrors++;
            }
        }
        expect(actualErrors).toBe(0);
    });
});
