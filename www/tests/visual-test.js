/**
 * Visual Testing Script for Phase 1.1
 * Captures screenshots to verify card layout changes
 */

const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for dynamic content
    await page.waitForTimeout(2000);
    
    // Check if currently watching section exists
    const sectionExists = await page.locator('#currentlyWatchingPreview').count() > 0;
    console.log(`Currently watching section exists: ${sectionExists}`);
    
    // Take screenshot of home page
    await page.screenshot({ 
      path: 'screenshots/phase-1.1/home-page-full.png',
      fullPage: true 
    });
    
    // Take screenshot of currently watching section if it exists
    if (sectionExists) {
      const currentlyWatchingSection = page.locator('#currentlyWatchingPreview');
      await currentlyWatchingSection.screenshot({ 
        path: 'screenshots/phase-1.1/currently-watching-section.png' 
      });
      
      // Check if cards are rendered as poster cards (not list items)
      const cards = await page.locator('#currentlyWatchingPreview .card').count();
      console.log(`Found ${cards} cards in currently watching section`);
      
      // Check card variant if cards exist
      if (cards > 0) {
        const firstCard = page.locator('#currentlyWatchingPreview .card').first();
        const cardVariant = await firstCard.getAttribute('data-variant');
        console.log(`First card variant: ${cardVariant}`);
      }
    } else {
      console.log('Currently watching section not found, taking general home page screenshot');
    }
    
    // Take mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: 'screenshots/phase-1.1/mobile-home-page.png',
      fullPage: true 
    });
    
    console.log('Screenshots captured successfully!');
    console.log('Check the screenshots/phase-1.1/ directory for results');
    
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  captureScreenshots().catch(console.error);
}

module.exports = { captureScreenshots };
