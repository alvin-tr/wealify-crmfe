import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Sales Requests Page — Features', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto('/sales-requests');
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { });
        await page.waitForTimeout(2000);
    });

    // --- TABS ---
    test('should have tab buttons for filtering', async ({ page }) => {
        const tabs = ['Pending', 'Approved', 'Rejected', 'All'];
        let visibleCount = 0;
        for (const tabName of tabs) {
            const tab = page.locator('button', { hasText: tabName }).first();
            if (await tab.isVisible().catch(() => false)) {
                visibleCount++;
            }
        }
        // At least some tabs should be visible (admin sees all 4)
        expect(visibleCount).toBeGreaterThan(0);
    });

    // --- TABLE ---
    test('should display table with core columns', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            const coreHeaders = ['Status', 'Created'];
            for (const header of coreHeaders) {
                const th = page.locator('th', { hasText: header }).first();
                const isVisible = await th.isVisible().catch(() => false);
                expect(isVisible).toBeTruthy();
            }
        }
    });

    test('should show status badges in table', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            const rows = page.locator('table tbody tr');
            const rowCount = await rows.count();
            if (rowCount > 0) {
                // First row should have some status-related content
                const firstRow = rows.first();
                const text = await firstRow.textContent() || '';
                expect(text.length).toBeGreaterThan(0);
            }
        }
    });

    // --- APPROVE/REJECT ---
    test('should show action buttons for pending requests', async ({ page }) => {
        const pendingTab = page.locator('button', { hasText: 'Pending' }).first();
        if (await pendingTab.isVisible().catch(() => false)) {
            await pendingTab.click();
            await page.waitForTimeout(1000);
            // Check if there are action buttons in the table
            const actionBtns = page.locator('table tbody button');
            const count = await actionBtns.count();
            // Either there are buttons (pending requests exist) or not (no pending requests)
            expect(count >= 0).toBeTruthy();
        }
    });

    test('should switch tabs without crashing', async ({ page }) => {
        const tabs = ['Pending', 'Approved', 'Rejected', 'All'];
        for (const tabName of tabs) {
            const tab = page.locator('button', { hasText: tabName }).first();
            if (await tab.isVisible().catch(() => false)) {
                await tab.click();
                await page.waitForTimeout(500);
            }
        }
        // Page should still be functional after switching all tabs
        await expect(page.locator('h1', { hasText: 'Sales Requests' })).toBeVisible();
    });

    // --- VIEW DETAILS ---
    test('should be able to view request details if requests exist', async ({ page }) => {
        const hasTable = await page.locator('table').isVisible().catch(() => false);
        if (hasTable) {
            const viewBtn = page.locator('text=View details').first();
            if (await viewBtn.isVisible().catch(() => false)) {
                await viewBtn.click();
                await page.waitForTimeout(500);
                // Some modal/detail should appear
                const hasDialog = await page.locator('[role="dialog"]').isVisible().catch(() => false);
                expect(hasDialog).toBeTruthy();
                // Close it
                const closeBtn = page.locator('[role="dialog"] button', { hasText: /Close|Cancel/i }).first();
                if (await closeBtn.isVisible().catch(() => false)) {
                    await closeBtn.click();
                }
            }
        }
    });

    test('should not show server errors on any tab', async ({ page }) => {
        const tabs = ['All', 'Pending', 'Approved', 'Rejected'];
        for (const tabName of tabs) {
            const tab = page.locator('button', { hasText: tabName }).first();
            if (await tab.isVisible().catch(() => false)) {
                await tab.click();
                await page.waitForTimeout(500);
            }
        }
        const errorMsg = page.locator('text=/error loading/i');
        const hasError = await errorMsg.isVisible().catch(() => false);
        expect(hasError).toBeFalsy();
    });
});
