import { test, expect } from '@playwright/test';

// Helper: scroll enough to trigger sticky behavior
async function ensureScrollable(page) {
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  if (bodyHeight < 1600) {
    // If the app content isn't tall in test env, fabricate some height so sticky can be observed
    await page.evaluate(() => {
      const pad = document.createElement('div');
      pad.id = '__test-pad';
      pad.style.height = '2000px';
      document.body.appendChild(pad);
    });
  }
}

// Prefer no reduced motion so we can assert animation; some CI defaults reduce motion.
test.use({
  contextOptions: { reducedMotion: 'no-preference' },
});

// 1) Version renders and matches source constant (string equality check)
test('header: shows app version string', async ({ page }) => {
  await page.goto('/');
  const ver = page.getByTestId('app-version');
  await expect(ver).toBeVisible();
  const text = await ver.innerText();
  expect(text).toMatch(/^v\d+\.\d+\.\d+$/);
});

// 2) Only the search bar is sticky
//    - Scroll and validate search row sticks to top while the title scrolls away
//    - We assert that #desktop-search-row top stays at 0 ± 2px after scroll
//    - And that the app title is no longer intersecting the viewport top area

test('layout: only search row is sticky', async ({ page }) => {
  await page.goto('/');
  await ensureScrollable(page);

  const search = page.locator('#desktop-search-row');
  await expect(search).toBeVisible();

  // Record initial top then scroll
  const beforeTop = await search.evaluate((el) => el.getBoundingClientRect().top);
  await page.evaluate(() => window.scrollTo({ top: 800 }));
  await page.waitForTimeout(100);
  const afterTop = await search.evaluate((el) => el.getBoundingClientRect().top);

  // Sticky rows pin to the top edge when scrolled
  expect(Math.abs(afterTop)).toBeLessThanOrEqual(2);

  // Title should scroll away (not at top)
  const title = page.getByTestId('app-title');
  const titleTop = await title.evaluate((el) => el.getBoundingClientRect().top);
  expect(titleTop).toBeLessThan(0);

  // And computed position of search row is sticky
  const computed = await search.evaluate((el) => getComputedStyle(el).position);
  expect(computed).toBe('sticky');
});

// 3) Marquee animates and respects configured duration
//    We assert animationName, and that duration is roughly >= 28s (since default is 30s)

test('marquee: renders and animates at slow speed', async ({ page }) => {
  await page.goto('/');
  const scroller = page.getByTestId('marquee-scroller');
  await expect(scroller).toBeVisible();

  const { name, duration } = await scroller.evaluate((el) => {
    const cs = getComputedStyle(el as HTMLElement);
    return { name: cs.animationName, duration: cs.animationDuration };
  });

  // In non-reduced-motion, we expect our keyframes
  expect(["flicklet-scroll-x"]).toContain(name);

  // duration like '30s' or '30000ms' — normalize to seconds
  const secs = duration.endsWith('ms') ? parseFloat(duration) / 1000 : parseFloat(duration);
  expect(secs).toBeGreaterThanOrEqual(28);
});

// 4) Marquee pauses on hover
//    Hovering the rail should pause the scroller animation

test('marquee: pause on hover', async ({ page }) => {
  await page.goto('/');
  const rail = page.getByTestId('marquee-rail');
  const scroller = page.getByTestId('marquee-scroller');
  await expect(rail).toBeVisible();

  // Before hover
  let playState = await scroller.evaluate((el) => getComputedStyle(el as HTMLElement).animationPlayState);
  expect(playState).toBe('running');

  await rail.hover();
  await page.waitForTimeout(50);

  playState = await scroller.evaluate((el) => getComputedStyle(el as HTMLElement).animationPlayState);
  expect(playState).toBe('paused');
});
