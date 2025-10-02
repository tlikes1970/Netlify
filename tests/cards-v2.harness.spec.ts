import { test, expect } from '@playwright/test';

test('Search harness shows 8 capabilities with 4 disabled', async ({ page }) => {
  await page.goto('file:///C:/Users/likes/Side%20Projects/TV%20Tracker/Netlify/www/dev/cards-v2-search-harness.html');
  const btns = page.locator('.actions button');
  await expect(btns).toHaveCount(8);
  const names = await btns.allTextContents();
  expect(names).toEqual([
    'wantToWatch','moveToWatching','markWatched','notInterested',
    'reviewNotes','addTag','similarTo','refineSearch'
  ]);
  const disabled = page.locator('.actions button[aria-disabled="true"]');
  await expect(disabled).toHaveCount(4);
});