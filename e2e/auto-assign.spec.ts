import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Auto-Assign Toggle', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/sales-users');
        await expect(page.getByRole('heading', { name: 'Sales Users' })).toBeVisible({ timeout: 10000 });
    });

    test('should have Nhận Số toggle column in the Sales Users table', async ({ page }) => {
        // Table should load
        await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

        // the header should exist
        const header = page.locator('th').filter({ hasText: 'Nhận Số' });
        await expect(header).toBeVisible();

        // Check if there's a switch toggle in the table
        const toggleButton = page.locator('button[role="switch"]').first();
        if (await toggleButton.isVisible()) {
            await expect(toggleButton).toBeVisible();
            
            const isChecked = await toggleButton.getAttribute('aria-checked') === 'true';
            
            // Toggle it
            await toggleButton.click();

            // Wait for toast notification
            const toast = page.locator('.flex.items-start.gap-3').filter({ hasText: 'Status Updated' });
            await expect(toast).toBeVisible({ timeout: 5000 });
            
            // Toggle it back to restore state
            await page.waitForTimeout(1000);
            await toggleButton.click();
            await expect(page.locator('.flex.items-start.gap-3').filter({ hasText: 'Status Updated' }).nth(1)).toBeVisible({ timeout: 5000 });
        }
    });
});
