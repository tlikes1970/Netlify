import { test, expect, enableSearchFallback, clearSearchUI } from './fixtures';

test('clear search hides results and resets inputs', async ({ page }) => {
  await enableSearchFallback(page);
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#searchInput');
  
  // Wait for search functionality to be initialized (500ms delay + extra buffer)
  await page.waitForTimeout(1000);
  
  // Verify search button has onclick handler
  await page.waitForFunction(() => {
    const searchBtn = document.getElementById('searchBtn');
    return searchBtn && searchBtn.onclick !== null;
  }, { timeout: 10000 });
  
  // Prevent modal from reappearing by disabling login prompt logic
  await page.evaluate(() => {
    // Mark that we've already prompted the user to prevent modal from reappearing
    localStorage.setItem('flicklet-login-prompted', 'true');
    // Also set a flag to disable modal reopening
    window.__testMode = true;
  });
  
  // Check if login modal is present and remove it completely
  const modalBackdrop = page.locator('.modal-backdrop[data-testid="modal-backdrop"]');
  
  if (await modalBackdrop.isVisible()) {
    console.log('🔒 Login modal detected, removing it completely...');
    // Remove modal backdrop from DOM entirely
    await page.evaluate(() => {
      const modals = document.querySelectorAll('.modal-backdrop[data-testid="modal-backdrop"]');
      modals.forEach(modal => modal.remove());
    });
    console.log('✅ Modal removed completely');
  }
  
  // Wait a bit to ensure modal doesn't reappear
  await page.waitForTimeout(1000);
  
  // Final check: ensure no modal exists in DOM
  await page.waitForFunction(() => {
    const modals = document.querySelectorAll('.modal-backdrop[data-testid="modal-backdrop"]');
    return modals.length === 0;
  }, { timeout: 10000 });
  
  // Fill search input
  await page.fill('#searchInput', 'archer');
  
  // Click search button
  await page.click('#searchBtn');
  
  // Debug: check if fallback is working
  const fallbackEnabled = await page.evaluate(() => (window as any).__testSearchFallback);
  console.log('Fallback enabled:', fallbackEnabled);
  
  // Wait for search results to appear
  await page.waitForSelector('#searchResults', { state: 'visible' });
  await expect(page.locator('#searchResults')).toBeVisible();
  
  // Use the robust clear helper
  await clearSearchUI(page);
  
  // Verify search results are hidden and input is cleared
  await expect(page.locator('#searchResults')).toBeHidden();
  await expect(page.locator('#searchInput')).toHaveValue('');
});
