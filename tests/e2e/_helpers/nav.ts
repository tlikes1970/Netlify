import { Page, expect } from '@playwright/test';

const TAB_CANDIDATES = [/watching/i, /on deck/i, /queue/i];

export async function gotoWatchingTab(page: Page) {
  // Try bottom nav first
  const nav = page.locator('nav, [role="navigation"]').first();
  for (const rx of TAB_CANDIDATES) {
    const btn = nav.getByRole('link', { name: rx }).or(nav.getByRole('button', { name: rx }));
    if (await btn.count()) { await btn.first().click(); return; }
  }
  // Fallback: look for top tabs
  const topTabs = page.locator('[role="tablist"] [role="tab"]');
  const count = await topTabs.count();
  for (let i = 0; i < count; i++) {
    const t = topTabs.nth(i);
    const name = (await t.innerText()).trim();
    if (TAB_CANDIDATES.some(rx => rx.test(name))) { await t.click(); return; }
  }
  // As a last resort, no-op; test will fail at selection phase providing diagnostics
  await expect(nav).toHaveCount(1); // trigger helpful error if nothing matched
}










































