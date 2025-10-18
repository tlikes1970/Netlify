import { BrowserContext, Page } from '@playwright/test';

export function isExternal(url: string) {
  try {
    const u = new URL(url);
    const base = process.env.E2E_BASE_URL || 'http://localhost:8888';
    const bu = new URL(base);
    return u.origin !== bu.origin;
  } catch { return true; }
}

export async function stubExternalApis(page: Page) {
  // Keep for per-page usage (already exists), but prefer context-level below
  await page.route('**/*', route => {
    const url = route.request().url();
    if (!isExternal(url)) return route.continue();
    if (/api\.themoviedb\.org|tmdb|image\.tmdb\.org/i.test(url))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [], page: 1, total_pages: 1, total_results: 0 }) });
    if (/\.(png|jpg|jpeg|webp|avif|svg)(\?|$)/i.test(url))
      return route.fulfill({ status: 200, contentType: 'image/png', body: '' });
    if (/geo|ipapi|ipinfo|location|geocode/i.test(url))
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    return route.continue();
  });
}

export async function stubContextApis(context: BrowserContext) {
  await context.route('**/*', route => {
    const url = route.request().url();
    if (!isExternal(url)) return route.continue();
    if (/api\.themoviedb\.org|tmdb|image\.tmdb\.org/i.test(url))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [], page: 1, total_pages: 1, total_results: 0 }) });
    if (/\.(png|jpg|jpeg|webp|avif|svg)(\?|$)/i.test(url))
      return route.fulfill({ status: 200, contentType: 'image/png', body: '' });
    if (/geo|ipapi|ipinfo|location|geocode/i.test(url))
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}
