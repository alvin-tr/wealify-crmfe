import { Page, expect } from '@playwright/test';

/**
 * Login helper — authenticates as the given user and navigates to the dashboard.
 * Reusable across all test files to avoid repeating login logic.
 */
export async function login(page: Page, username = 'admin', password = 'admin123') {
    await page.goto('/login');
    await page.locator('input[placeholder*="username" i], input[id*="username" i], input[type="text"]').first().fill(username);
    await page.locator('input[placeholder*="password" i], input[id*="password" i], input[type="password"]').first().fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    // Wait for redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

/**
 * Ensure the page has no unhandled JS errors.
 * Call this at the start of each test to catch console errors.
 */
export function captureConsoleErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    return errors;
}
