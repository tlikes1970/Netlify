import { test, expect } from '@playwright/test';

test('Up Next harness has zero actions', async ({ page }) => {
  await page.goto('file:///C:/Users/likes/Side%20Projects/TV%20Tracker/Netlify/www/dev/cards-v2-upnext-harness.html');
  const btns = page.locator('.actions button');
  await expect(btns).toHaveCount(0);
});
