import { test, expect } from '@playwright/test';

test.describe('Theme & Mardi Gras', () => {
  test('defaults and persistence', async ({ page, context }) => {
    await page.goto('http://localhost:8000'); // adjust if different port
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'system');
    await expect(page.locator('body')).toHaveAttribute('data-mardi', 'off');

    // Open settings via gear
    await page.click('#btnSettings');
    await page.waitForSelector('#settingsModal:not([hidden])');
    await page.waitForSelector('#themeDark', { state: 'visible' });
    await page.check('#themeDark');
    await page.click('#settingsClose');

    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');

    // Turn on Mardi overlay
    await page.click('#btnSettings');
    await page.waitForSelector('#settingsModal:not([hidden])');
    await page.waitForSelector('#mardiOverlayToggle', { state: 'visible' });
    await page.check('#mardiOverlayToggle');
    await page.click('#settingsClose');
    await expect(page.locator('body')).toHaveAttribute('data-mardi', 'on');

    // Reload → persists
    await page.reload();
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveAttribute('data-mardi', 'on');

    // New tab → persists
    const page2 = await context.newPage();
    await page2.goto('http://localhost:8000');
    await expect(page2.locator('body')).toHaveAttribute('data-theme', 'dark');
    await expect(page2.locator('body')).toHaveAttribute('data-mardi', 'on');
  });

  test('system mode updates with OS preference', async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.click('#btnSettings');
    await page.waitForSelector('#settingsModal:not([hidden])');
    await page.waitForSelector('#themeSystem', { state: 'visible' });
    await page.check('#themeSystem');
    await page.click('#settingsClose');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'system');

    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'system');
  });

  test('settings modal accessibility', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Check gear button accessibility
    const settingsBtn = page.locator('#btnSettings');
    await expect(settingsBtn).toHaveAttribute('aria-label', 'Open settings');
    await expect(settingsBtn).toHaveAttribute('aria-haspopup', 'dialog');
    
    // Open modal and check accessibility
    await settingsBtn.click();
    
    const modal = page.locator('#settingsModal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'settingsTitle');
    
    // Check focus trap
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // ESC should close modal
    await page.keyboard.press('Escape');
    await expect(modal).toHaveAttribute('hidden', '');
  });

  test('theme switching works instantly', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Open settings
    await page.click('#btnSettings');
    await page.waitForSelector('#settingsModal:not([hidden])');
    
    // Switch to light theme
    await page.waitForSelector('#themeLight', { state: 'visible' });
    await page.check('#themeLight');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
    
    // Switch to dark theme
    await page.check('#themeDark');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
    
    // Switch back to system
    await page.check('#themeSystem');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'system');
    
    // Toggle Mardi Gras
    await page.check('#mardiOverlayToggle');
    await expect(page.locator('body')).toHaveAttribute('data-mardi', 'on');
    
    await page.uncheck('#mardiOverlayToggle');
    await expect(page.locator('body')).toHaveAttribute('data-mardi', 'off');
  });

  test('localStorage persistence', async ({ page, context }) => {
    await page.goto('http://localhost:8000');
    
    // Set custom theme and mardi
    await page.click('#btnSettings');
    await page.waitForSelector('#settingsModal:not([hidden])');
    await page.waitForSelector('#themeLight', { state: 'visible' });
    await page.check('#themeLight');
    await page.waitForSelector('#mardiOverlayToggle', { state: 'visible' });
    await page.check('#mardiOverlayToggle');
    await page.click('#settingsClose');
    
    // Check localStorage
    const theme = await page.evaluate(() => localStorage.getItem('pref_theme'));
    const mardi = await page.evaluate(() => localStorage.getItem('pref_mardi'));
    
    expect(theme).toBe('light');
    expect(mardi).toBe('on');
    
    // Clear localStorage and reload
    await page.evaluate(() => {
      localStorage.removeItem('pref_theme');
      localStorage.removeItem('pref_mardi');
    });
    await page.reload();
    
    // Should default to system/off
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'system');
    await expect(page.locator('body')).toHaveAttribute('data-mardi', 'off');
  });
});
