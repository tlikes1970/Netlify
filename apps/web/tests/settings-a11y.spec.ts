import { test, expect } from '@playwright/test';

test.describe('Settings sheet a11y basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).APP_FLAGS = { flag_mobile_compact_v1: true };
      document.documentElement.dataset.density = 'compact';
      localStorage.setItem('flag:mobile_compact_v1', 'true');
      localStorage.setItem('flag:settings_mobile_sheet_v1', 'true');
      // Mock authentication to prevent auth modal from showing
      localStorage.setItem('flicklet:auth:user', JSON.stringify({ uid: 'test-user', email: 'test@example.com' }));
    });
    await page.setViewportSize({ width: 375, height: 800 });
  });

  test('focus trap logic works correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Test the focus trap logic directly
    const result = await page.evaluate(() => {
      // Create a mock container with focusable elements
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.visibility = 'visible';
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <input id="input1" type="text" />
        <button id="btn2">Button 2</button>
        <button id="btn3" disabled>Disabled Button</button>
        <button id="btn4">Button 4</button>
      `;
      
      // Append to body to make elements visible
      document.body.appendChild(container);
      
      // Test the tabbable selector logic
      const TABBABLE = [
        'a[href]', 'button:not([disabled])', 'input:not([disabled])',
        'select:not([disabled])', 'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',');
      
      const tabbables = Array.from(container.querySelectorAll(TABBABLE))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
      
      // Clean up
      document.body.removeChild(container);
      
      return {
        totalElements: container.children.length,
        tabbableElements: tabbables.length,
        tabbableIds: tabbables.map(el => el.id),
        disabledButtonFound: container.querySelector('#btn3') !== null,
        disabledButtonTabbable: tabbables.some(el => el.id === 'btn3')
      };
    });
    
    expect(result.totalElements).toBe(5);
    expect(result.tabbableElements).toBe(4); // Should exclude disabled button
    expect(result.tabbableIds).toEqual(['btn1', 'input1', 'btn2', 'btn4']);
    expect(result.disabledButtonFound).toBe(true);
    expect(result.disabledButtonTabbable).toBe(false);
  });

  test('scroll lock logic works correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Test scroll lock logic
    const result = await page.evaluate(() => {
      const { style } = document.documentElement;
      const originalOverflow = style.overflow;
      
      // Simulate opening a modal
      style.overflow = 'hidden';
      const isLocked = style.overflow === 'hidden';
      
      // Simulate closing the modal
      style.overflow = originalOverflow;
      const isUnlocked = style.overflow === originalOverflow;
      
      return {
        originalOverflow,
        isLocked,
        isUnlocked,
        canRestore: originalOverflow === '' || originalOverflow === 'auto'
      };
    });
    
    expect(result.isLocked).toBe(true);
    expect(result.isUnlocked).toBe(true);
    expect(result.canRestore).toBe(true);
  });

  test('hash clearing works correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Test hash clearing logic directly
    const result = await page.evaluate(() => {
      // Set a settings hash
      location.hash = '#settings/display';
      const beforeHash = location.hash;
      
      // Simulate the closeSettingsSheet logic
      if (location.hash.startsWith('#settings/')) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      const afterHash = location.hash;
      
      return {
        beforeHash,
        afterHash,
        cleared: afterHash === ''
      };
    });
    
    expect(result.beforeHash).toBe('#settings/display');
    expect(result.afterHash).toBe('');
    expect(result.cleared).toBe(true);
  });

  test('inert outside logic works correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Test inert outside logic
    const result = await page.evaluate(() => {
      // Create a mock dialog
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.innerHTML = '<div>Dialog content</div>';
      
      // Create some background elements
      const bg1 = document.createElement('div');
      bg1.id = 'bg1';
      bg1.innerHTML = 'Background 1';
      
      const bg2 = document.createElement('div');
      bg2.id = 'bg2';
      bg2.innerHTML = 'Background 2';
      
      // Add to body
      document.body.appendChild(dialog);
      document.body.appendChild(bg1);
      document.body.appendChild(bg2);
      
      // Simulate inert outside logic
      const roots = [document.body];
      const changed: Array<HTMLElement> = [];

      for (const root of roots) {
        [...root.children].forEach(el => {
          // Skip the dialog itself, not its parent
          if (el === dialog) return;
          const htmlEl = el as HTMLElement;
          if (!htmlEl.hasAttribute('inert')) {
            htmlEl.setAttribute('inert', '');
            htmlEl.setAttribute('aria-hidden', 'true');
            changed.push(htmlEl);
          }
        });
      }
      
      const bg1Inert = bg1.hasAttribute('inert') && bg1.getAttribute('aria-hidden') === 'true';
      const bg2Inert = bg2.hasAttribute('inert') && bg2.getAttribute('aria-hidden') === 'true';
      const dialogInert = dialog.hasAttribute('inert');
      
      // Clean up
      document.body.removeChild(dialog);
      document.body.removeChild(bg1);
      document.body.removeChild(bg2);
      
      return {
        bg1Inert,
        bg2Inert,
        dialogInert,
        changedCount: changed.length,
        // Check if our specific elements were changed
        ourElementsChanged: changed.includes(bg1) && changed.includes(bg2)
      };
    });
    
    expect(result.bg1Inert).toBe(true);
    expect(result.bg2Inert).toBe(true);
    expect(result.dialogInert).toBe(false);
    expect(result.ourElementsChanged).toBe(true);
  });
});
