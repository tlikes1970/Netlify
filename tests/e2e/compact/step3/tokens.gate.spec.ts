import { test, expect } from '@playwright/test';

test.describe('Compact Token Gate Verification', () => {
  
  test('Case A: Default flag OFF → no data-compact-mobile-v1 attr; computed --poster-w != 50px', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto('http://localhost:8888/');
    await page.waitForLoadState('networkidle');

    // Check that flag is OFF by default
    const flagValue = await page.evaluate(() => {
      return localStorage.getItem('flag:mobile_compact_v1');
    });
    console.log('Flag value (should be null):', flagValue);

    // Check data attribute is not present
    const compactAttr = await page.evaluate(() => {
      return document.documentElement.dataset.compactMobileV1;
    });
    console.log('Compact attribute (should be undefined):', compactAttr);

    // Check computed CSS variable value
    const posterWidth = await page.evaluate(() => {
      const computed = getComputedStyle(document.documentElement);
      return computed.getPropertyValue('--poster-w-compact');
    });
    console.log('Computed --poster-w-compact (should be empty):', posterWidth);

    // Verify assertions
    expect(flagValue).toBeNull();
    expect(compactAttr).toBeUndefined();
    expect(posterWidth.trim()).toBe('');
    expect(consoleErrors).toHaveLength(0);
  });

  test('Case B: Flag ON + compact density → attr present; computed --poster-w-compact == 50px', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Set flag and density before navigation
    await page.goto('http://localhost:8888/');
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_compact_v1', 'true');
      document.documentElement.dataset.density = 'compact';
    });

    // Reload to trigger the attribute logic
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check flag is ON
    const flagValue = await page.evaluate(() => {
      return localStorage.getItem('flag:mobile_compact_v1');
    });
    console.log('Flag value (should be "true"):', flagValue);

    // Check density is set
    const densityAttr = await page.evaluate(() => {
      return document.documentElement.dataset.density;
    });
    console.log('Density attribute (should be "compact"):', densityAttr);

    // Check compact attribute is present
    const compactAttr = await page.evaluate(() => {
      return document.documentElement.dataset.compactMobileV1;
    });
    console.log('Compact attribute (should be "true"):', compactAttr);

    // Check computed CSS variable value
    const posterWidth = await page.evaluate(() => {
      const computed = getComputedStyle(document.documentElement);
      return computed.getPropertyValue('--poster-w-compact');
    });
    console.log('Computed --poster-w-compact (should be "50px"):', posterWidth);

    // Verify assertions
    expect(flagValue).toBe('true');
    expect(densityAttr).toBe('compact');
    expect(compactAttr).toBe('true');
    expect(posterWidth.trim()).toBe('50px');
    expect(consoleErrors).toHaveLength(0);
  });

  test('Case C: Flag ON + comfy density → attr absent; --poster-w-compact != 50px', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Set flag ON but density to "comfy" (not compact)
    await page.goto('http://localhost:8888/');
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_compact_v1', 'true');
      document.documentElement.dataset.density = 'comfy';
    });

    // Reload to trigger the attribute logic
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check flag is ON
    const flagValue = await page.evaluate(() => {
      return localStorage.getItem('flag:mobile_compact_v1');
    });
    console.log('Flag value (should be "true"):', flagValue);

    // Check density is set to comfy
    const densityAttr = await page.evaluate(() => {
      return document.documentElement.dataset.density;
    });
    console.log('Density attribute (should be "comfy"):', densityAttr);

    // Check compact attribute is NOT present
    const compactAttr = await page.evaluate(() => {
      return document.documentElement.dataset.compactMobileV1;
    });
    console.log('Compact attribute (should be undefined):', compactAttr);

    // Check computed CSS variable value
    const posterWidth = await page.evaluate(() => {
      const computed = getComputedStyle(document.documentElement);
      return computed.getPropertyValue('--poster-w-compact');
    });
    console.log('Computed --poster-w-compact (should be empty):', posterWidth);

    // Verify assertions
    expect(flagValue).toBe('true');
    expect(densityAttr).toBe('comfy');
    expect(compactAttr).toBeUndefined();
    expect(posterWidth.trim()).toBe('');
    expect(consoleErrors).toHaveLength(0);
  });

  test('Case D: Mobile viewport detection', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8888/');
    
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_compact_v1', 'true');
      document.documentElement.dataset.density = 'compact';
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check mobile detection
    const isMobile = await page.evaluate(() => {
      return window.matchMedia('(max-width: 768px)').matches;
    });
    console.log('Is mobile viewport (should be true):', isMobile);

    // Check compact attribute is present on mobile
    const compactAttr = await page.evaluate(() => {
      return document.documentElement.dataset.compactMobileV1;
    });
    console.log('Compact attribute on mobile (should be "true"):', compactAttr);

    // Check computed CSS variable value
    const posterWidth = await page.evaluate(() => {
      const computed = getComputedStyle(document.documentElement);
      return computed.getPropertyValue('--poster-w-compact');
    });
    console.log('Computed --poster-w-compact on mobile (should be "50px"):', posterWidth);

    // Verify assertions
    expect(isMobile).toBe(true);
    expect(compactAttr).toBe('true');
    expect(posterWidth.trim()).toBe('50px');
    expect(consoleErrors).toHaveLength(0);
  });
});
