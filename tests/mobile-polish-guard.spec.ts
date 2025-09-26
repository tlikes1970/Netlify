import { test, expect } from '@playwright/test';

test.describe('Mobile Polish Guard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page first to establish context
    await page.goto('/');
    // Clear any existing mobile overrides
    await page.evaluate(() => {
      localStorage.removeItem('forceMobileV1');
      // Ensure mobile polish guard is enabled
      if (window.FLAGS) {
        window.FLAGS.mobilePolishGuard = true;
      }
    });
  });

  test('desktop viewport disables mobile polish', async ({ page }) => {
    // Set desktop viewport (≥1024px)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();

    // Wait for mobile polish guard to initialize
    await page.waitForTimeout(100);

    // Check console log for disabled message
    const logs = await page.evaluate(() => {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      return logs;
    });

    // Verify mobile-v1 class is NOT applied on desktop
    const hasMobileClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-v1');
    });

    expect(hasMobileClass).toBe(false);

    // Check that we have the correct console message
    const mobileLog = logs.find((log) => log.includes('Mobile polish') && log.includes('DISABLED'));
    expect(mobileLog).toBeTruthy();
    expect(mobileLog).toContain('vw:1200');
  });

  test('mobile viewport enables mobile polish', async ({ page }) => {
    // Set mobile viewport (≤640px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Wait for mobile polish guard to initialize
    await page.waitForTimeout(100);

    // Verify mobile-v1 class IS applied on mobile
    const hasMobileClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-v1');
    });

    expect(hasMobileClass).toBe(true);

    // Check console log for enabled message
    const logs = await page.evaluate(() => {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      return logs;
    });

    const mobileLog = logs.find((log) => log.includes('Mobile polish') && log.includes('ENABLED'));
    expect(mobileLog).toBeTruthy();
    expect(mobileLog).toContain('vw:375');
  });

  test('dev override forces mobile polish on desktop', async ({ page }) => {
    // Set desktop viewport but force mobile override
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.evaluate(() => {
      localStorage.setItem('forceMobileV1', '1');
    });

    await page.reload();
    await page.waitForTimeout(100);

    // Verify mobile-v1 class IS applied despite desktop viewport
    const hasMobileClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-v1');
    });

    expect(hasMobileClass).toBe(true);
  });

  test('orientation change maintains correct state', async ({ page }) => {
    // Start in mobile portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(100);

    // Verify mobile class is applied
    let hasMobileClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-v1');
    });
    expect(hasMobileClass).toBe(true);

    // Rotate to landscape (still mobile width)
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(100);

    // Verify mobile class is still applied (width still ≤640px)
    hasMobileClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-v1');
    });
    expect(hasMobileClass).toBe(true);

    // Switch to desktop width
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);

    // Verify mobile class is removed
    hasMobileClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-v1');
    });
    expect(hasMobileClass).toBe(false);
  });

  test('feature flag can disable mobile polish guard', async ({ page }) => {
    // Disable the feature flag
    await page.evaluate(() => {
      if (window.FLAGS) {
        window.FLAGS.mobilePolishGuard = false;
      }
    });

    await page.reload();
    await page.waitForTimeout(100);

    // Verify no mobile class is applied regardless of viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);

    const hasMobileClass = await page.evaluate(() => {
      return document.body.classList.contains('mobile-v1');
    });

    expect(hasMobileClass).toBe(false);
  });

  test('regression: sign-in still works', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await page.waitForTimeout(100);

    // Try to access settings tab (which might trigger sign-in flow)
    await page.click('#settingsTab');
    await page.waitForTimeout(500);

    // Verify settings section is visible
    const settingsVisible = await page.isVisible('#settingsSection');
    expect(settingsVisible).toBe(true);
  });

  test('regression: no additional console errors', async ({ page }) => {
    const errors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Filter out expected errors (like Firebase config warnings)
    const unexpectedErrors = errors.filter(
      (error) =>
        !error.includes('Firebase') && !error.includes('TMDB') && !error.includes('network'),
    );

    expect(unexpectedErrors).toHaveLength(0);
  });
});
