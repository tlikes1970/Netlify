import { test, expect } from '@playwright/test';

test('Not Interested feature works correctly', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#discoverTab');
  
  // Click on discover tab
  await page.click('#discoverTab');
  
  // Wait for discover section to be visible
  await page.waitForSelector('#discoverSection');
  
  // Check if discover list has items (might be empty initially)
  const discoverList = page.locator('#discoverList');
  
  // If there are items, test the Not Interested functionality
  const items = await discoverList.locator('.show-card').count();
  
  if (items > 0) {
    // Find the first item with a "Not Interested" button
    const firstItem = discoverList.locator('.show-card').first();
    const notInterestedBtn = firstItem.locator('button[data-action="notInterested"]');
    
    // Verify the button exists
    await expect(notInterestedBtn).toBeVisible();
    await expect(notInterestedBtn).toHaveText('🚫 Not Interested');
    
    // Click the Not Interested button
    await notInterestedBtn.click();
    
    // Verify the item is marked as not interested (should fade out)
    await expect(firstItem).toHaveCSS('opacity', '0.5');
    
    // Wait for the item to be removed
    await page.waitForTimeout(600);
    
    // Verify the item is no longer visible
    await expect(firstItem).toHaveCount(0);
  } else {
    // If no items, just verify the discover section loads
    await expect(page.locator('#discoverSection')).toBeVisible();
    await expect(page.locator('#discoverList')).toBeVisible();
  }
});

test('Not Interested management in settings', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#settingsTab');
  
  // Click on settings tab
  await page.click('#settingsTab');
  
  // Wait for settings section to be visible
  await page.waitForSelector('#settingsSection');
  
  // Look for the Not Interested management button
  const manageBtn = page.locator('#manageNotInterestedBtn');
  await expect(manageBtn).toBeVisible();
  await expect(manageBtn).toHaveText('🚫 Manage Not Interested List');
  
  // Click the manage button
  await manageBtn.click();
  
  // Wait for the modal to appear
  await page.waitForSelector('#notInterestedModal');
  
  // Verify modal content
  await expect(page.locator('#notInterestedModal h3')).toHaveText('🚫 Not Interested List');
  
  // Close the modal
  await page.locator('#notInterestedModal button:has-text("Close")').click();
  
  // Verify modal is closed
  await expect(page.locator('#notInterestedModal')).toHaveCount(0);
});
