import { test, expect } from '@playwright/test';

test('ES language sends language=es-ES and flips labels', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#langToggle', 'es');
  await expect(page.locator('[data-i18n="subtitle"]')).toHaveText(/Seguimiento/i);

  let sawSpanish = false;
  await page.route('**/.netlify/functions/tmdb**', async route => {
    if (route.request().url().includes('language=es-ES')) sawSpanish = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
  });

  await page.fill('#searchInput', 'algo');
  await page.click('#searchBtn');
  expect(sawSpanish).toBeTruthy();
});
