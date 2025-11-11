import { Page } from '@playwright/test';

type Item = { id: string; title: string; posterUrl?: string };

export async function seedLocalData(page: Page, { watching = [] as Item[] } = {}) {
  // Minimal structure the app expects; adjust keys if your app differs
  const seed = {
    movies: { watching, wishlist: [], watched: [] },
    tv:     { watching, wishlist: [], watched: [] }
  };
  await page.addInitScript((data) => {
    try { localStorage.setItem('flicklet-data', JSON.stringify(data)); } catch {}
  }, seed);
}




































