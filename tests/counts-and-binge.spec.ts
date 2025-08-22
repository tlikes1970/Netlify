import { test, expect } from '@playwright/test';

test('moving items updates counts and binge banner', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const item = { id: 123456, media_type: 'tv', name: 'Fake Show', first_air_date: '2023-01-01', runtime: 45, episode_run_time:[45] };
    // @ts-ignore
    window.addToList(item, 'watching');
  });

  await expect(page.locator('#totalWatchingCount')).toHaveText('1');
  const before = await page.locator('#bingeTimeText').textContent();

  await page.click('#watchingTab');
  await page.locator('button:has-text("Remove")').first().click();

  await page.evaluate(() => {
    const item = { id: 123456, media_type: 'tv', name: 'Fake Show', first_air_date:'2023-01-01', runtime:45 };
    // @ts-ignore
    window.addToList(item, 'wishlist');
  });

  await page.click('#homeTab');
  await expect(page.locator('#totalWatchingCount')).toHaveText('0');
  await expect(page.locator('#totalWishlistCount')).toHaveText('1');
  const after = await page.locator('#bingeTimeText').textContent();
  expect(before).not.toEqual(after);
});
