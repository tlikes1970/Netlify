import { test, expect } from '@playwright/test';

test('Currently Watching harness shows exactly 4 capabilities', async ({ page }) => {
  await page.goto('file:///C:/Users/likes/Side%20Projects/TV%20Tracker/Netlify/www/dev/cards-v2-currentlywatching-harness.html');
  const btns = page.locator('.actions button');
  await expect(btns).toHaveCount(4);
  const names = await btns.allTextContents();
  expect(names).toEqual(['wantToWatch','markWatched','notInterested','delete']);
});
