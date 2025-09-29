import { test, expect } from '@playwright/test';

test.describe('Settings Draft State', () => {
test('Settings draft state functionality', async ({ page }) => {
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
    
    // Check if draft state is initialized (data-dirty should be false initially)
    const dirtyState = await settingsModal.getAttribute('data-dirty');
    expect(dirtyState).toBe('false');
    
    // Find a text input to test draft functionality
    const displayNameInput = page.locator('#displayNameInput');
    if (await displayNameInput.isVisible()) {
      // Get initial value
      const initialValue = await displayNameInput.inputValue();
      
      // Change the value
      await displayNameInput.fill('Test Draft Value');
      
      // Check if dirty state is now true
      const dirtyStateAfterChange = await settingsModal.getAttribute('data-dirty');
      expect(dirtyStateAfterChange).toBe('true');
      
      // Check if Save button is enabled
      const saveButton = page.locator('#settingsSave');
      if (await saveButton.isVisible()) {
        const isSaveEnabled = await saveButton.isEnabled();
        expect(isSaveEnabled).toBe(true);
      }
      
      // Test Cancel functionality
      const cancelButton = page.locator('#settingsCancel');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Value should revert to original
        const revertedValue = await displayNameInput.inputValue();
        expect(revertedValue).toBe(initialValue);
        
        // Dirty state should be false again
        const dirtyStateAfterCancel = await settingsModal.getAttribute('data-dirty');
        expect(dirtyStateAfterCancel).toBe('false');
      }
    }
    
    // Test Reset functionality
    const resetButton = page.locator('#settingsReset');
    if (await resetButton.isVisible()) {
      // Click reset (this should trigger confirmation dialog)
      await resetButton.click();
      
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept());
      
      // After reset, dirty state should be true (requires save)
      const dirtyStateAfterReset = await settingsModal.getAttribute('data-dirty');
      expect(dirtyStateAfterReset).toBe('true');
    }
  });
});
