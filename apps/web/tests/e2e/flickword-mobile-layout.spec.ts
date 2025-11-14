import { test, expect } from "@playwright/test";

test.describe("FlickWord Mobile Layout - Exact Sizing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Open FlickWord modal
    await page.click('text="Play Now"', { first: true });
    await page.waitForSelector(".flickword-game", { timeout: 5000 });
  });

  test("At 480px: tiles 42×42, keys ≥50×52, full width keyboard", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 800 });

    // Wait for game to load
    await page.waitForSelector(".fw-tile", { timeout: 5000 });

    // Check first tile size
    const firstTile = page.locator(".fw-tile").first();
    const tileBox = await firstTile.boundingBox();
    if (tileBox) {
      const tileWidth = Math.round(tileBox.width);
      const tileHeight = Math.round(tileBox.height);
      expect(tileWidth).toBe(42);
      expect(tileHeight).toBe(42);
    }

    // Check keyboard key size
    const firstKey = page.locator(".fw-key").first();
    const keyBox = await firstKey.boundingBox();
    if (keyBox) {
      const keyWidth = Math.round(keyBox.width);
      const keyHeight = Math.round(keyBox.height);
      expect(keyWidth).toBeGreaterThanOrEqual(50);
      expect(keyHeight).toBe(52);
    }

    // Check keyboard uses full width
    const keyboard = page.locator(".fw-keyboard");
    const keyboardBox = await keyboard.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 480;
    if (keyboardBox) {
      // Should be close to viewport width minus container padding
      expect(keyboardBox.width).toBeGreaterThan(viewportWidth * 0.9);
    }

    // Check no horizontal overflow
    const body = page.locator("body");
    const bodyBox = await body.boundingBox();
    if (bodyBox) {
      expect(bodyBox.width).toBeLessThanOrEqual(viewportWidth);
    }
  });

  test("At 375px: tiles 38×38, keys ≥46×50", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });

    await page.waitForSelector(".fw-tile", { timeout: 5000 });

    const firstTile = page.locator(".fw-tile").first();
    const tileBox = await firstTile.boundingBox();
    if (tileBox) {
      const tileWidth = Math.round(tileBox.width);
      const tileHeight = Math.round(tileBox.height);
      expect(tileWidth).toBe(38);
      expect(tileHeight).toBe(38);
    }

    const firstKey = page.locator(".fw-key").first();
    const keyBox = await firstKey.boundingBox();
    if (keyBox) {
      const keyWidth = Math.round(keyBox.width);
      const keyHeight = Math.round(keyBox.height);
      expect(keyWidth).toBeGreaterThanOrEqual(46);
      expect(keyHeight).toBe(50);
    }
  });

  test("At 320px: tiles 36×36, keys ≥42×48", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });

    await page.waitForSelector(".fw-tile", { timeout: 5000 });

    const firstTile = page.locator(".fw-tile").first();
    const tileBox = await firstTile.boundingBox();
    if (tileBox) {
      const tileWidth = Math.round(tileBox.width);
      const tileHeight = Math.round(tileBox.height);
      expect(tileWidth).toBe(36);
      expect(tileHeight).toBe(36);
    }

    const firstKey = page.locator(".fw-key").first();
    const keyBox = await firstKey.boundingBox();
    if (keyBox) {
      const keyWidth = Math.round(keyBox.width);
      const keyHeight = Math.round(keyBox.height);
      expect(keyWidth).toBeGreaterThanOrEqual(42);
      expect(keyHeight).toBe(48);
    }
  });

  test("Keyboard rows do not overflow horizontally", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });

    await page.waitForSelector(".fw-kb-wrap", { timeout: 5000 });

    const keyboardRows = page.locator(".fw-kb-wrap");
    const count = await keyboardRows.count();

    for (let i = 0; i < count; i++) {
      const row = keyboardRows.nth(i);
      const rowBox = await row.boundingBox();
      const viewportWidth = page.viewportSize()?.width || 375;

      if (rowBox) {
        // Row should not exceed viewport width
        expect(rowBox.width).toBeLessThanOrEqual(viewportWidth);
      }
    }
  });

  test("Grid gap reduced on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });

    await page.waitForSelector(".fw-grid", { timeout: 5000 });

    const grid = page.locator(".fw-grid");
    const gap = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });

    // Gap should be 2px or 3px on mobile (reduced from default)
    const gapValue = parseInt(gap);
    expect(gapValue).toBeLessThanOrEqual(3);
  });

  test("Keyboard key gap reduced on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });

    await page.waitForSelector(".fw-kb-wrap", { timeout: 5000 });

    const kbWrap = page.locator(".fw-kb-wrap").first();
    const gap = await kbWrap.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });

    // Gap should be 3px on mobile (reduced from default 4px)
    const gapValue = parseInt(gap);
    expect(gapValue).toBeLessThanOrEqual(3);
  });
});






