import { test, expect } from '@playwright/test';
import { stubExternalApis } from '../_helpers/network';
import { seedLocalData } from '../_helpers/data';

test.describe('Debug TabCard elements', () => {
  test('Check what elements exist on /list/watching', async ({ page }) => {
    await stubExternalApis(page);
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/list/watching');
    await page.waitForLoadState('networkidle');
    
    // Debug what elements exist
    const debug = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const elementInfo = Array.from(allElements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        dataset: Object.keys(el.dataset).length > 0 ? el.dataset : null,
        textContent: el.textContent?.substring(0, 50) || ''
      })).filter(info => 
        info.className.includes('card') || 
        info.className.includes('tab') ||
        info.dataset?.rail ||
        info.dataset?.card ||
        info.textContent.includes('Stub')
      );
      
      return {
        totalElements: allElements.length,
        relevantElements: elementInfo,
        bodyHTML: document.body.innerHTML.substring(0, 1000)
      };
    });
    
    console.log('Debug info:', JSON.stringify(debug, null, 2));
    
    // Try to find any card-like elements
    const cardSelectors = [
      '[data-testid="cardv2"]',
      '.CardV2', 
      '[class*="card"]',
      '[data-testid="tab-card"]',
      '.tab-card',
      '[data-rail] [data-cards] > *',
      '[data-rail] > *',
      'section > *'
    ];
    
    for (const selector of cardSelectors) {
      const elements = await page.locator(selector).count();
      console.log(`Selector "${selector}": ${elements} elements found`);
    }
  });
});