import { test, expect } from '@playwright/test';

test('Preview harness shows V2 cards with preview variant', async ({ page }) => {
  const filePath = 'file:///C:/Users/likes/Side%20Projects/TV%20Tracker/Netlify/www/dev/cards-v2-currentlywatching-harness.html';
  await page.goto(filePath);
  
  // Check that we have V2 cards
  const cards = page.locator('.cw-card.v2');
  await expect(cards).toHaveCount(1);
  
  // Check that preview variant is applied
  const previewCard = page.locator('.cw-card.v2.preview-variant');
  await expect(previewCard).toHaveCount(1);
  
  // Check that poster wrap exists for preview variant
  const posterWrap = page.locator('.cw-card.v2 .poster-wrap');
  await expect(posterWrap).toHaveCount(1);
  
  // Check that we have the expected number of action buttons (2 for preview)
  const actionButtons = page.locator('.cw-card.v2 .actions button');
  await expect(actionButtons).toHaveCount(2);
  
  // Check button labels
  const buttonTexts = await actionButtons.allTextContents();
  expect(buttonTexts).toEqual(['Want to Watch', 'Watched']);
  
  // Check that preview actions have the correct class
  const previewActions = page.locator('.cw-card.v2 .actions .preview-action');
  await expect(previewActions).toHaveCount(2);
});

test('Preview harness handles missing posters gracefully', async ({ page }) => {
  const filePath = 'file:///C:/Users/likes/Side%20Projects/TV%20Tracker/Netlify/www/dev/cards-v2-currentlywatching-harness.html';
  await page.goto(filePath);
  
  // Check that placeholder image is shown
  const placeholderImg = page.locator('.cw-card.v2 .poster-wrap img[src*="data:image/svg+xml"]');
  await expect(placeholderImg).toHaveCount(1);
  
  // Check that the placeholder has the correct alt text
  const img = page.locator('.cw-card.v2 .poster-wrap img');
  await expect(img).toHaveAttribute('alt', '');
  await expect(img).toHaveAttribute('loading', 'lazy');
});





