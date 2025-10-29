import { test, expect } from '@playwright/test';

test('Home renders without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  expect(errors).toEqual([]);
});















