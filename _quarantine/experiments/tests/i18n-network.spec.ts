import { test, expect } from '@playwright/test';

test('ES language sends language=es-ES for TMDB requests', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#langToggle');
  
  // Select Spanish language
  await page.selectOption('#langToggle', 'es');
  
  // Mock TMDB API calls to check language parameter
  let sawSpanish = false;
  await page.route('**/.netlify/functions/tmdb**', async route => {
    if (route.request().url().includes('language=es-ES')) {
      sawSpanish = true;
    }
    await route.fulfill({ 
      status: 200, 
      contentType: 'application/json', 
      body: JSON.stringify({ results: [] }) 
    });
  });

  // Perform a search to trigger TMDB API call
  await page.fill('#searchInput', 'algo');
  await page.click('#searchBtn');
  
  // Verify that Spanish language was used in API call
  expect(sawSpanish).toBeTruthy();
});
