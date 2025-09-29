import { test, expect } from '@playwright/test';

test.describe('Settings Validation', () => {
  test('Settings validation functionality', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on Settings button (FAB)
    const settingsButton = page.locator('#btnSettings');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();
    await page.waitForTimeout(1000);
    
    // Check if settings modal is visible
    const settingsModal = page.locator('#settingsModal');
    await expect(settingsModal).toBeVisible();
    
    // Test validation on Curated Rows field
    const curatedRowsInput = page.locator('#settingCuratedRows');
    if (await curatedRowsInput.isVisible()) {
      // Set an invalid value (too high)
      await curatedRowsInput.fill('999');
      await curatedRowsInput.blur();
      
      // Check if error message appears
      const errorMessage = page.locator('.settings-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Maximum is');
      
      // Check if Save button is disabled
      const saveButton = page.locator('#settingsSave');
      if (await saveButton.isVisible()) {
        const isSaveDisabled = await saveButton.isDisabled();
        expect(isSaveDisabled).toBe(true);
      }
      
      // Set a valid value
      await curatedRowsInput.fill('3');
      await curatedRowsInput.blur();
      
      // Check if error message disappears
      await expect(errorMessage).not.toBeVisible();
      
      // Check if Save button is enabled (if dirty)
      if (await saveButton.isVisible()) {
        const isSaveEnabled = await saveButton.isEnabled();
        expect(isSaveEnabled).toBe(true);
      }
    }
    
    // Test validation on Display Name field (if it has maxLength)
    const displayNameInput = page.locator('#displayNameInput');
    if (await displayNameInput.isVisible()) {
      // Set a very long value to test maxLength validation
      const longName = 'A'.repeat(100);
      await displayNameInput.fill(longName);
      await displayNameInput.blur();
      
      // Check if length error appears (if maxLength is set in schema)
      const lengthError = page.locator('.settings-error');
      if (await lengthError.isVisible()) {
        await expect(lengthError).toContainText('Maximum length');
      }
    }
  });
});
