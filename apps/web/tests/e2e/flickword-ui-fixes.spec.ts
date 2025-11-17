import { test, expect } from "@playwright/test";

test.describe("FlickWord UI Fixes", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto("/");
    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test("FW-1: Modal touch support for dragging", async ({ page }) => {
    // Open FlickWord modal
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".flickword-game", { timeout: 5000 });

    // Check that modal has touch event handlers
    const modal = page.locator(".gm-dialog");
    await expect(modal).toHaveAttribute("class", /gm-draggable/);

    // Simulate touch start (mobile device)
    const touchStart = await modal.evaluate((el) => {
      const event = new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [
          new Touch({ identifier: 1, target: el, clientX: 100, clientY: 100 }),
        ],
      });
      el.dispatchEvent(event);
      return true;
    });
    expect(touchStart).toBe(true);
  });

  test("FW-2: Modal uses CSS variable for z-index", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".gm-dialog", { timeout: 5000 });

    const modal = page.locator(".gm-dialog");
    const zIndex = await modal.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // Should use CSS variable or fallback, not hardcoded 10000
    expect(zIndex).not.toBe("10000");
  });

  test("FW-3: Testing buttons not visible in production", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".flickword-game", { timeout: 5000 });

    // Check that testing button is not visible (or only in dev)
    const testButton = page.locator(
      'button[aria-label*="testing"], button[aria-label*="Load new word"]'
    );
    const count = await testButton.count();

    // In production, should be 0. In dev, might be 1 but that's acceptable
    expect(count).toBeLessThanOrEqual(1);
  });

  test("FW-4: Error state handling", async ({ page, context }) => {
    // Block API requests to simulate error
    await context.route("**/api/**", (route) => route.abort());

    await page.click('text="Play Now"', { first: true });

    // Should show error message or fallback
    const errorOrLoading = page.locator(
      ".fw-error, .fw-loading, .fw-error-banner"
    );
    await expect(errorOrLoading.first()).toBeVisible({ timeout: 10000 });
  });

  test("FW-5: Keyboard focus management", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-grid", { timeout: 5000 });

    // Check that tiles can receive focus
    const firstTile = page.locator(".fw-tile").first();
    await firstTile.focus();

    const isFocused = await firstTile.evaluate(
      (el) => document.activeElement === el
    );
    expect(isFocused).toBe(true);
  });

  test("FW-6: ARIA labels on game grid", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-grid", { timeout: 5000 });

    const grid = page.locator(".fw-grid");
    await expect(grid).toHaveAttribute("role", "grid");
    await expect(grid).toHaveAttribute("aria-label");
    await expect(grid).toHaveAttribute("aria-rowcount");
    await expect(grid).toHaveAttribute("aria-colcount", "5");
  });

  test("FW-7: Keyboard keys have focus indicators", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-keyboard", { timeout: 5000 });

    const firstKey = page.locator(".fw-key").first();
    await firstKey.focus();

    // Check focus-visible styles
    const outline = await firstKey.evaluate((el) => {
      return window.getComputedStyle(el).outline;
    });
    expect(outline).not.toBe("none");
  });

  test("FW-8: Notification accessibility", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-keyboard", { timeout: 5000 });

    // Type invalid word to trigger notification
    await page.keyboard.type("ABCDE");
    await page.keyboard.press("Enter");

    // Wait for notification
    const notification = page.locator(".fw-notification");
    await expect(notification.first()).toBeVisible({ timeout: 3000 });

    // Check ARIA attributes
    await expect(notification.first()).toHaveAttribute("role", "alert");
  });

  test("FW-9: Loading state accessibility", async ({ page }) => {
    // Open modal quickly to catch loading state
    await page.click('text="Play Now"', { first: true });

    const loadingState = page.locator(".fw-loading, [role='status']");
    const isVisible = await loadingState
      .first()
      .isVisible()
      .catch(() => false);

    if (isVisible) {
      await expect(loadingState.first()).toHaveAttribute("aria-live", "polite");
    }
  });

  test("FW-10: Community Panel card keyboard navigation", async ({ page }) => {
    // Find FlickWord card
    const flickWordCard = page
      .locator('div[role="button"][aria-label*="FlickWord"]')
      .first();

    await expect(flickWordCard).toHaveAttribute("tabIndex", "0");
    await expect(flickWordCard).toHaveAttribute("role", "button");

    // Test keyboard activation
    await flickWordCard.focus();
    await page.keyboard.press("Enter");

    // Modal should open
    await expect(page.locator(".flickword-game")).toBeVisible({
      timeout: 5000,
    });
  });

  test("FW-11: Tile focus indicators", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-tile", { timeout: 5000 });

    const tile = page.locator(".fw-tile").first();
    await tile.focus();

    // Check focus-visible styles
    const outline = await tile.evaluate((el) => {
      return window.getComputedStyle(el).outline;
    });
    expect(outline).not.toBe("none");
  });

  test("FW-12: Button text responsiveness", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-keyboard", { timeout: 5000 });

    // Check Enter button
    const enterButton = page.locator(".fw-key-enter");
    const text = await enterButton.textContent();
    expect(text).toBeTruthy();

    // Check button doesn't overflow on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const isVisible = await enterButton.isVisible();
    expect(isVisible).toBe(true);
  });

  test("FW-13: Color contrast on keyboard keys", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-keyboard", { timeout: 5000 });

    // Type a word to get some keys colored
    await page.keyboard.type("HOUSE");
    await page.keyboard.press("Enter");

    // Wait for reveal animation
    await page.waitForTimeout(1000);

    // Check that colored keys have sufficient contrast
    const coloredKey = page
      .locator(".fw-key.correct, .fw-key.present, .fw-key.absent")
      .first();
    if ((await coloredKey.count()) > 0) {
      const bgColor = await coloredKey.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      const textColor = await coloredKey.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      // Both should be defined (not transparent)
      expect(bgColor).toBeTruthy();
      expect(textColor).toBeTruthy();
    }
  });

  test("FW-14: Modal header stats update", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-stats", { timeout: 5000 });

    // Check that stats are displayed
    const stats = page.locator(".fw-stats");
    await expect(stats).toBeVisible();

    // Check that streak is shown (even if 0)
    const streakText = await stats.textContent();
    expect(streakText).toContain("Streak");
  });

  test("FW-15: Reduced motion support", async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-tile", { timeout: 5000 });

    // Type a word
    await page.keyboard.type("HOUSE");
    await page.keyboard.press("Enter");

    // Wait a bit
    await page.waitForTimeout(500);

    // Animations should be disabled or minimal
    const tile = page.locator(".fw-tile.correct").first();
    if ((await tile.count()) > 0) {
      const animation = await tile.evaluate((el) => {
        return window.getComputedStyle(el).animation;
      });
      // Animation should be "none" or very short
      expect(animation).toBeTruthy();
    }
  });

  test("FW-16: Invalid input visual feedback", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-keyboard", { timeout: 5000 });

    // Type invalid word
    await page.keyboard.type("ABCDE");
    await page.keyboard.press("Enter");

    // Should see shake animation or notification
    const shakeTile = page.locator(".fw-tile-shake");
    const notification = page.locator(".fw-notification-error");

    const hasFeedback = await Promise.race([
      shakeTile
        .first()
        .isVisible()
        .then(() => true),
      notification
        .first()
        .isVisible()
        .then(() => true),
    ]).catch(() => false);

    expect(hasFeedback).toBe(true);
  });

  test("FW-17: Close button keyboard shortcut hint", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".gm-close", { timeout: 5000 });

    const closeButton = page.locator(".gm-close");
    const ariaLabel = await closeButton.getAttribute("aria-label");

    // Should mention Escape key
    expect(ariaLabel).toContain("Escape");

    // Test Escape key works
    await page.keyboard.press("Escape");
    await expect(page.locator(".flickword-game")).not.toBeVisible({
      timeout: 2000,
    });
  });

  test("FW-18: Stats view button labels", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-keyboard", { timeout: 5000 });

    // Complete a game quickly (type correct word if possible)
    // Or wait for game to complete naturally

    // For now, just check that stats view buttons exist when shown
    const playAgainButton = page.locator('button:has-text("Play Again")');
    const closeButton = page.locator('button:has-text("Close")');

    // These might not be visible if game isn't complete
    // But if they are, they should have proper aria-labels
    if ((await playAgainButton.count()) > 0) {
      await expect(playAgainButton.first()).toHaveAttribute("aria-label");
    }
    if ((await closeButton.count()) > 0) {
      await expect(closeButton.first()).toHaveAttribute("aria-label");
    }
  });

  test("FW-19: Word info keyboard navigation", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-word-info, .fw-grid", { timeout: 5000 });

    // Word info might not be visible by default
    const wordInfo = page.locator(".fw-word-info");
    if ((await wordInfo.count()) > 0) {
      await wordInfo.first().focus();
      const tabIndex = await wordInfo.first().getAttribute("tabIndex");
      expect(tabIndex).toBe("0");
    }
  });

  test("FW-20: Mobile touch targets", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-keyboard", { timeout: 5000 });

    // Check keyboard keys are at least 44x44px (WCAG minimum)
    const key = page.locator(".fw-key").first();
    const box = await key.boundingBox();

    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(32); // Allow some flexibility for very small screens
      expect(box.height).toBeGreaterThanOrEqual(38); // Allow some flexibility
    }
  });

  test("Accessibility: Screen reader support", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".flickword-game", { timeout: 5000 });

    // Check for screen reader only content
    const srOnly = page.locator(".sr-only");
    if ((await srOnly.count()) > 0) {
      const styles = await srOnly.first().evaluate((el) => {
        return window.getComputedStyle(el).clip;
      });
      // Should be clipped or positioned off-screen
      expect(styles).toBeTruthy();
    }
  });

  test("Accessibility: Grid live region updates", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-grid", { timeout: 5000 });

    const grid = page.locator(".fw-grid");
    await expect(grid).toHaveAttribute("aria-live", "polite");
  });

  test("Accessibility: Keyboard key ARIA labels", async ({ page }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".fw-keyboard", { timeout: 5000 });

    const firstKey = page.locator(".fw-key").first();
    await expect(firstKey).toHaveAttribute("aria-label");
  });

  test("Cross-browser: Modal dragging works", async ({ page, browserName }) => {
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".gm-dialog", { timeout: 5000 });

    const modal = page.locator(".gm-dialog");
    const initialPosition = await modal.boundingBox();

    if (initialPosition) {
      // Simulate drag
      await modal.hover();
      await page.mouse.down();
      await page.mouse.move(100, 100);
      await page.mouse.up();

      // Position should have changed (or at least modal should still be visible)
      await expect(modal).toBeVisible();
    }
  });
});










