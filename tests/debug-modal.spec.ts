import { test, expect } from '@playwright/test';

test('Debug login modal structure', async ({ page }) => {
  console.log('🚀 Starting modal debug...');
  
  // Navigate to the page
  await page.goto('/');
  console.log('✅ Page loaded');
  
  // Wait for page to load
  await page.waitForSelector('#searchInput');
  console.log('✅ Search input found');
  
  // Wait a bit for modal to appear
  await page.waitForTimeout(2000);
  
  // Check if modal is present
  const modalBackdrop = page.locator('.modal-backdrop[data-testid="modal-backdrop"]');
  const isModalVisible = await modalBackdrop.isVisible();
  console.log('🔒 Modal backdrop visible:', isModalVisible);
  
  if (isModalVisible) {
    console.log('🔍 Analyzing modal structure...');
    
    // Get modal HTML
    const modalHTML = await modalBackdrop.innerHTML();
    console.log('📄 Modal HTML length:', modalHTML.length);
    console.log('📄 Modal HTML preview:', modalHTML.substring(0, 500));
    
    // Look for close buttons
    const closeButtons = page.locator('.modal-backdrop button');
    const closeButtonCount = await closeButtons.count();
    console.log('🔘 Close button count:', closeButtonCount);
    
    for (let i = 0; i < closeButtonCount; i++) {
      const button = closeButtons.nth(i);
      const buttonText = await button.textContent();
      console.log(`🔘 Button ${i + 1}:`, buttonText?.trim());
    }
    
    // Look for any elements with "close" in text or attributes
    const closeElements = page.locator('.modal-backdrop [class*="close"], .modal-backdrop [id*="close"], .modal-backdrop [data-action*="close"]');
    const closeElementCount = await closeElements.count();
    console.log('🔘 Close-related elements count:', closeElementCount);
    
    // Try to find the modal content
    const modalContent = page.locator('.modal-backdrop .modal-content, .modal-backdrop .modal, .modal-backdrop [class*="modal"]');
    const modalContentCount = await modalContent.count();
    console.log('🔘 Modal content elements count:', modalContentCount);
    
    if (modalContentCount > 0) {
      const contentHTML = await modalContent.first().innerHTML();
      console.log('📄 Modal content HTML preview:', contentHTML.substring(0, 500));
    }
    
    // Try to close modal by clicking outside
    console.log('🔧 Attempting to close modal by clicking outside...');
    await page.click('body', { position: { x: 10, y: 10 } });
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Check if modal is still visible
    const isModalStillVisible = await modalBackdrop.isVisible();
    console.log('🔒 Modal still visible after outside click:', isModalStillVisible);
    
    if (isModalStillVisible) {
      // Try pressing Escape key
      console.log('🔧 Attempting to close modal with Escape key...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      const isModalVisibleAfterEscape = await modalBackdrop.isVisible();
      console.log('🔒 Modal visible after Escape:', isModalVisibleAfterEscape);
    }
  } else {
    console.log('✅ No modal detected');
  }
  
  console.log('📊 Modal debug completed');
});
