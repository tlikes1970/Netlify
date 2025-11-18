import { test, expect } from '@playwright/test';

test.describe('Settings Sheet Basic Test', () => {
  test('Basic test to verify test runner works', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Flicklet/);
  });
});















































