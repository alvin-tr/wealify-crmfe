import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(2000);
  
  await page.goto('http://localhost:3000/sales-users');
  await page.waitForTimeout(2000);
  
  const artifactDir = 'C:\\Users\\TheHuman\\.gemini\\antigravity\\brain\\99b4912f-5e30-449f-b02d-9811d9d52823';
  await page.screenshot({ path: path.join(artifactDir, 'sales_users_toggles.png'), fullPage: true });
  console.log('Saved screenshot of Sales Users page.');
  
  await browser.close();
})();
