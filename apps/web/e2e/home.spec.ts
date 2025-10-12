import { test, expect } from '@playwright/test';

test('home rails and debug functions exist', async ({ page }) => {
  await page.goto('/');
  const rails: any[] = await page.evaluate(() => (window as any).debugRails?.());
  expect(Array.isArray(rails)).toBeTruthy();
  expect(rails.length).toBeGreaterThanOrEqual(4);
  const ids = rails.map(r => r.id);
  for (const id of ['your-shows','for-you','in-theaters','feedback']) {
    expect(ids).toContain(id);
  }

  const cards: any[] = await page.evaluate(() => (window as any).debugCards?.());
  expect(Array.isArray(cards)).toBeTruthy();
  if (cards.length > 0) {
    expect(cards[0]).toHaveProperty('posterAR');
    expect(cards[0]).toHaveProperty('actionsDisplay');
  }
});
