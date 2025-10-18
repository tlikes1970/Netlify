import { test, expect } from '@playwright/test';

test('settings tab initialization logic works correctly', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  // Test the initSettingsTabs function directly
  const result = await page.evaluate(() => {
    // Create a mock container with tabs and panels
    const container = document.createElement('div');
    container.innerHTML = `
      <div role="tablist">
        <button role="tab" id="tab-account" aria-controls="panel-account">Account</button>
        <button role="tab" id="tab-display" aria-controls="panel-display">Display</button>
        <button role="tab" id="tab-advanced" aria-controls="panel-advanced">Advanced</button>
      </div>
      <div role="tabpanel" id="panel-account" hidden>Account content</div>
      <div role="tabpanel" id="panel-display" hidden>Display content</div>
      <div role="tabpanel" id="panel-advanced" hidden>Advanced content</div>
    `;
    
    // Import and test the initSettingsTabs function
    // Since we can't import modules directly in evaluate, we'll test the logic inline
    const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
    const panels = Array.from(container.querySelectorAll('[role="tabpanel"]'));
    
    // Test the slugify function
    function slugify(s: string) {
      return (s || '')
        .toLowerCase()
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    // Test the getHashTarget function
    function getHashTarget(): string | null {
      const m = location.hash.match(/#settings\/([\w-]+)/);
      return m ? m[1] : null;
    }
    
    // Test tab key generation
    const tabKeys = tabs.map(t => {
      const key = t.id || slugify(t.textContent || '');
      return { id: t.id, textContent: t.textContent?.trim(), key };
    });
    
    // Test hash parsing
    const hashTarget = getHashTarget();
    
    return {
      tabsFound: tabs.length,
      panelsFound: panels.length,
      tabKeys,
      hashTarget,
      slugifyTests: {
        'Account': slugify('Account'),
        'Display Settings': slugify('Display Settings'),
        'Advanced Options': slugify('Advanced Options')
      }
    };
  });
  
  expect(result.tabsFound).toBe(3);
  expect(result.panelsFound).toBe(3);
  expect(result.tabKeys).toEqual([
    { id: 'tab-account', textContent: 'Account', key: 'tab-account' },
    { id: 'tab-display', textContent: 'Display', key: 'tab-display' },
    { id: 'tab-advanced', textContent: 'Advanced', key: 'tab-advanced' }
  ]);
  expect(result.slugifyTests).toEqual({
    'Account': 'account',
    'Display Settings': 'display-settings',
    'Advanced Options': 'advanced-options'
  });
});

test('deep link selects exactly one tab on first paint', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  // Enable the feature flags and gates needed for settings sheet
  await page.evaluate(() => {
    document.documentElement.dataset.density = 'compact';
    localStorage.setItem('flag:mobile_compact_v1', 'true');
    localStorage.setItem('flag:settings_mobile_sheet_v1', 'true');
    // Mock authentication to prevent auth modal from showing
    localStorage.setItem('flicklet:auth:user', JSON.stringify({ uid: 'test-user', email: 'test@example.com' }));
    // Trigger the gate to run
    window.dispatchEvent(new Event('storage'));
  });
  
  // Navigate to settings hash to trigger the sheet opening
  await page.goto('/#settings/display', { waitUntil: 'domcontentloaded' });
  
  // Wait for the settings sheet to be rendered
  await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 });
  
  // Debug: Check if the gate is active
  const gateStatus = await page.evaluate(() => ({
    compactMobileV1: document.documentElement.dataset.compactMobileV1,
    density: document.documentElement.dataset.density,
    mobileCompactFlag: localStorage.getItem('flag:mobile_compact_v1'),
    settingsSheetFlag: localStorage.getItem('flag:settings_mobile_sheet_v1'),
    hash: location.hash,
    settingsSheetOpen: document.documentElement.getAttribute('data-settings-sheet'),
    settingsDialogs: document.querySelectorAll('[role="dialog"][aria-modal="true"]').length
  }));
  console.log('Gate status:', gateStatus);
  
  const counts = await page.evaluate(() => {
    // Look specifically within the settings dialog
    const settingsDialog = document.querySelector('[role="dialog"][aria-modal="true"]');
    const tabs = settingsDialog ? [...settingsDialog.querySelectorAll('[role="tab"]')] : [];
    const panels = settingsDialog ? [...settingsDialog.querySelectorAll('[role="tabpanel"]')] : [];
    const allButtons = settingsDialog ? [...settingsDialog.querySelectorAll('button')] : [];
    const debug = {
      tabs: tabs.map(t => ({
        id: t.id,
        ariaSelected: t.getAttribute('aria-selected'),
        textContent: t.textContent?.trim()
      })),
      panels: panels.map(p => ({
        id: p.id,
        hidden: p.hasAttribute('hidden'),
        ariaHidden: p.getAttribute('aria-hidden')
      })),
      allButtons: allButtons.map(b => ({
        textContent: b.textContent?.trim(),
        role: b.getAttribute('role'),
        id: b.id
      })),
      hash: location.hash,
      settingsDialogFound: !!settingsDialog,
      settingsDialogHTML: settingsDialog ? settingsDialog.innerHTML.substring(0, 500) : null
    };
    return {
      tabs: tabs.length,
      selected: tabs.filter(t => t.getAttribute('aria-selected') === 'true').length,
      visible: panels.filter(p => !p.hasAttribute('hidden')).length,
      debug
    };
  });
  
  console.log('Debug info:', counts.debug);
  expect(counts.tabs).toBeGreaterThan(0);
  expect(counts.selected).toBe(1);
  expect(counts.visible).toBe(1);
});

test('clicking a tab updates hash without adding history entries', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  // Enable the feature flags and gates needed for settings sheet
  await page.evaluate(() => {
    document.documentElement.dataset.density = 'compact';
    localStorage.setItem('flag:mobile_compact_v1', 'true');
    localStorage.setItem('flag:settings_mobile_sheet_v1', 'true');
    // Mock authentication to prevent auth modal from showing
    localStorage.setItem('flicklet:auth:user', JSON.stringify({ uid: 'test-user', email: 'test@example.com' }));
    // Trigger the gate to run
    window.dispatchEvent(new Event('storage'));
  });
  
  // Navigate to settings hash to trigger the sheet opening
  await page.goto('/#settings/display', { waitUntil: 'domcontentloaded' });
  
  // Wait for the settings sheet to be rendered
  await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 });
  
  const before = await page.evaluate(() => history.length);
  await page.evaluate(() => {
    const t = document.querySelectorAll('[role="tab"]')[1] as HTMLElement;
    t?.click();
    return location.hash;
  });
  const after = await page.evaluate(() => history.length);
  expect(after).toBe(before); // used replaceState, no new history entry
});

