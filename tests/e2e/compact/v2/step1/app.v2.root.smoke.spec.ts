import { test, expect } from '@playwright/test';

test.describe('React V2 App Smoke Test', () => {
  test('should load without console errors', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(`Console Error: ${msg.text()}`);
      }
    });

    // Navigate to the app
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8888';
    await page.goto(baseURL);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that document title is non-empty (sanity check)
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check for console errors
    if (consoleMessages.length > 0) {
      console.log('Console errors found:', consoleMessages);
      throw new Error(`Console errors detected: ${consoleMessages.join(', ')}`);
    }

    // Basic DOM structure check
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Check for React root element
    const rootElement = await page.locator('#root');
    await expect(rootElement).toBeVisible();
  });

  test('should have basic accessibility structure', async ({ page }) => {
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8888';
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // Check for main landmark
    const main = await page.locator('main');
    await expect(main).toBeVisible();

    // Check for basic HTML structure
    const html = await page.locator('html');
    await expect(html).toBeVisible();
  });
});
















