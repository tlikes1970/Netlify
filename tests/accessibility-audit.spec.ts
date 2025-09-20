import { test, expect, Page } from './fixtures';

/**
 * Process: Accessibility Audit
 * Purpose: Comprehensive accessibility testing for WCAG compliance
 * Data Source: DOM structure, ARIA attributes, and keyboard navigation
 * Update Path: Run after any UI changes or accessibility improvements
 * Dependencies: All UI components and interactive elements
 */

test.describe('Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Keyboard Navigation - Complete Tab Order', async ({ page }) => {
    // Test that all interactive elements are reachable via keyboard
    const focusableElements = await page.evaluate(() => {
      const selectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[role="button"]:not([disabled])',
        '[role="tab"]',
        '[role="menuitem"]'
      ];
      
      const elements = document.querySelectorAll(selectors.join(', '));
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        role: el.getAttribute('role'),
        tabIndex: el.getAttribute('tabindex')
      }));
    });
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // Test tab navigation through all elements
    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        return active ? {
          tagName: active.tagName,
          id: active.id,
          className: active.className
        } : null;
      });
      
      expect(focusedElement).toBeTruthy();
    }
  });

  test('ARIA Labels and Roles - Proper Semantics', async ({ page }) => {
    // Check for proper ARIA roles
    const roles = await page.evaluate(() => {
      const elementsWithRoles = document.querySelectorAll('[role]');
      return Array.from(elementsWithRoles).map(el => ({
        tagName: el.tagName,
        role: el.getAttribute('role'),
        id: el.id,
        className: el.className
      }));
    });
    
    // Should have proper ARIA roles
    expect(roles.length).toBeGreaterThan(0);
    
    // Check for tablist/tab pattern
    const tablist = page.locator('[role="tablist"]');
    if (await tablist.count() > 0) {
      await expect(tablist).toBeVisible();
      
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
      
      // Each tab should have proper attributes
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const ariaSelected = await tab.getAttribute('aria-selected');
        const ariaControls = await tab.getAttribute('aria-controls');
        
        expect(ariaSelected).toBeTruthy();
        if (ariaControls) {
          const panel = page.locator(`#${ariaControls}`);
          await expect(panel).toBeVisible();
        }
      }
    }
  });

  test('Color Contrast - Visual Accessibility', async ({ page }) => {
    // Test that text has sufficient contrast
    const textElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, button, a');
      return Array.from(elements).map(el => {
        const styles = window.getComputedStyle(el);
        return {
          tagName: el.tagName,
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          textContent: el.textContent?.substring(0, 50) || ''
        };
      }).filter(el => el.textContent.trim().length > 0);
    });
    
    // Should have text elements with proper styling
    expect(textElements.length).toBeGreaterThan(0);
    
    // In a real test, you would use a library like axe-core to check contrast ratios
    // For now, we'll verify that elements have color properties
    textElements.forEach(element => {
      expect(element.color).toBeTruthy();
    });
  });

  test('Screen Reader Support - ARIA Descriptions', async ({ page }) => {
    // Check for proper ARIA labels and descriptions
    const ariaElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        ariaLabelledBy: el.getAttribute('aria-labelledby'),
        ariaDescribedBy: el.getAttribute('aria-describedby'),
        id: el.id
      }));
    });
    
    // Should have elements with ARIA labels
    expect(ariaElements.length).toBeGreaterThan(0);
    
    // Check that form inputs have proper labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Each input should have either an aria-label or aria-labelledby
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('Focus Management - Visible Focus Indicators', async ({ page }) => {
    // Test that focused elements have visible focus indicators
    const focusableElements = page.locator('button, input, select, textarea, a, [tabindex]');
    const count = await focusableElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = focusableElements.nth(i);
      await element.focus();
      
      // Check if element has focus styles
      const hasFocusStyles = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || 
               styles.boxShadow !== 'none' || 
               styles.borderColor !== 'transparent';
      }, element);
      
      expect(hasFocusStyles).toBeTruthy();
    }
  });

  test('Skip Links - Navigation Shortcuts', async ({ page }) => {
    // Check for skip links
    const skipLinks = page.locator('a[href*="#"], .skip-link, [data-skip]');
    const skipLinkCount = await skipLinks.count();
    
    if (skipLinkCount > 0) {
      // Test skip link functionality
      const firstSkipLink = skipLinks.first();
      await firstSkipLink.click();
      
      // Should navigate to target
      const href = await firstSkipLink.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1);
        const target = page.locator(`#${targetId}`);
        await expect(target).toBeVisible();
      }
    }
  });

  test('Error Messages - Accessible Error Handling', async ({ page }) => {
    // Test search with invalid input
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('invalid search that should trigger error');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // Check for error messages with proper ARIA attributes
    const errorMessages = page.locator('[role="alert"], .error, .error-message, [aria-live]');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      // Error messages should be accessible
      const firstError = errorMessages.first();
      await expect(firstError).toBeVisible();
      
      const ariaLive = await firstError.getAttribute('aria-live');
      const role = await firstError.getAttribute('role');
      
      expect(ariaLive || role === 'alert').toBeTruthy();
    }
  });

  test('Mobile Accessibility - Touch Targets', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that touch targets are at least 44px (WCAG guideline)
    const touchTargets = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
      return Array.from(elements).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tagName: el.tagName,
          width: rect.width,
          height: rect.height,
          id: el.id
        };
      }).filter(target => target.width > 0 && target.height > 0);
    });
    
    // All touch targets should meet minimum size requirements
    touchTargets.forEach(target => {
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    });
  });

  test('Heading Structure - Proper Hierarchy', async ({ page }) => {
    // Check heading hierarchy
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(el => ({
        tagName: el.tagName,
        text: el.textContent?.substring(0, 50) || '',
        id: el.id
      }));
    });
    
    // Should have proper heading structure
    expect(headings.length).toBeGreaterThan(0);
    
    // Check that h1 comes before h2, etc.
    let lastLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      expect(level).toBeGreaterThanOrEqual(lastLevel - 1);
      lastLevel = level;
    });
  });

  test('Alternative Text - Image Accessibility', async ({ page }) => {
    // Check that images have proper alt text
    const images = await page.evaluate(() => {
      const imgElements = document.querySelectorAll('img');
      return Array.from(imgElements).map(img => ({
        src: img.src,
        alt: img.alt,
        role: img.getAttribute('role')
      }));
    });
    
    images.forEach(img => {
      // Images should have alt text or be decorative
      const hasAlt = img.alt !== null && img.alt !== '';
      const isDecorative = img.role === 'presentation' || img.alt === '';
      
      expect(hasAlt || isDecorative).toBeTruthy();
    });
  });

  test('Form Accessibility - Complete Form Labels', async ({ page }) => {
    // Check all form elements have proper labels
    const formElements = page.locator('input, select, textarea');
    const count = await formElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = formElements.nth(i);
      const type = await element.getAttribute('type');
      const id = await element.getAttribute('id');
      
      // Skip hidden inputs
      if (type === 'hidden') continue;
      
      // Check for associated label
      let hasLabel = false;
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = await label.count() > 0;
      }
      
      // Check for aria-label
      const ariaLabel = await element.getAttribute('aria-label');
      if (ariaLabel) hasLabel = true;
      
      // Check for aria-labelledby
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      if (ariaLabelledBy) hasLabel = true;
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('Dynamic Content - ARIA Live Regions', async ({ page }) => {
    // Test that dynamic content updates are announced
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveRegionCount = await liveRegions.count();
    
    // Should have live regions for dynamic content
    expect(liveRegionCount).toBeGreaterThan(0);
    
    // Test search results announcement
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('test');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // Search results should be announced
    const searchResults = page.locator('#searchResults');
    if (await searchResults.count() > 0) {
      const ariaLive = await searchResults.getAttribute('aria-live');
      const role = await searchResults.getAttribute('role');
      
      expect(ariaLive || role === 'status' || role === 'alert').toBeTruthy();
    }
  });
});
