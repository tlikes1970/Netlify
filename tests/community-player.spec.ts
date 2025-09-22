import { test, expect } from "@playwright/test";

test.describe("Community Player Seed", () => {
  test("legacy blocks removed", async ({ page }) => {
    await page.goto("http://localhost:8000/");
    await expect(page.locator("#community-content")).toHaveCount(0);
    await expect(page.locator(".community-left")).toHaveCount(0);
    await expect(page.locator(".player-placeholder")).toHaveCount(0);
    await expect(page.locator(".community-player-placeholder")).toHaveCount(0);
    await expect(page.locator(".loading-spinner")).toHaveCount(0);
  });

  test("renders 7 seed cards", async ({ page }) => {
    await page.goto("http://localhost:8000/");
    await expect(page.locator("#community-player .c-card")).toHaveCount(7);
  });

  test("a11y basics: images have alt, first card focusable", async ({ page }) => {
    await page.goto("http://localhost:8000/");
    const imgs = page.locator("#community-player .c-card img");
    const n = await imgs.count();
    for (let i = 0; i < n; i++) {
      await expect(imgs.nth(i)).toHaveAttribute("alt", /.*/);
    }
    await page.keyboard.press("Tab");
    await expect(page.locator("#community-player .c-card").first()).toBeFocused();
  });

  test("poll tile shows 4 bars", async ({ page }) => {
    await page.goto("http://localhost:8000/");
    await expect(page.locator(".type-poll_results .poll .bar")).toHaveCount(4);
  });
});
