# Flicklet – Cursor Rules (React V2)

## Active Codebase

**Primary app:** `apps/web` (React V2, Vite)
**Dev server:** `http://localhost:8888`
**E2E base URL:** `E2E_BASE_URL` env (default `http://localhost:8888`)
**Feature flag:** `mobile_compact_v1` (localStorage key: `flag:mobile_compact_v1`)

### Hard Blocks

* Do **not** create, modify, or reference files under `www/` (legacy V1). Treat as read-only.
* Do **not** add imports, stylesheets, or scripts to `www/index.html`.
* Do **not** start a second dev server. The user runs the server.

### Allowed Paths

* `apps/web/**` (source, components, styles, flags, pages)
* `reports/**` (analysis outputs)
* `tests/e2e/**` (Playwright tests for React V2 only)

---

## Current Project Scope

**Project:** Mobile Compact V1 (React V2)
**Goal:** Introduce compact mobile styling via a **gated token layer** with a **runtime attribute gate**, then migrate views progressively.
**Guarantee:** No UI or behavioral change unless explicitly in the approved step.

---

## Architecture (React V2)

* **Framework:** React (Vite). Files are under `apps/web/src/**`.
* **Flags helper:** `apps/web/src/lib/flags.ts` or `flags.tsx`.

  ```ts
  export function flag(name: 'mobile_compact_v1'): boolean {
    try {
      const v = localStorage.getItem('flag:' + name);
      if (v !== null) return v === 'true';
    } catch {}
    return false;
  }
  ```
* **Styles/tokens:** `apps/web/src/styles/**`, `tailwind.config.*`, `postcss.config.*`, and any global CSS.

---

## Migration Guardrails

### Token Gate (no visual change by default)

* Import once: `styles/tokens-compact-mobile.css` (in `apps/web` HTML/entry import chain).
* Apply overrides **only** inside this selector:

  ```css
  html[data-density="compact"][data-compact-mobile-v1="true"] {
    --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
    --radius: 12px;
    --poster-w: 136px;
    --poster-h: calc(var(--poster-w) * 1.5);
    --font-sm: 13px; --font-md: 14.5px; --font-lg: 16.5px;
  }
  ```
* **Do not** invent suffixed vars like `--poster-w-compact`. Override the real ones under the gate.

### Runtime Attribute Gate (no visual change by default)

* In `flags.ts(x)`, expose a function that sets/removes `data-compact-mobile-v1` on `<html>` when:

  1. `flag('mobile_compact_v1') === true`
  2. viewport is mobile (`matchMedia('(max-width: 768px)')`)
  3. `<html>` has `data-density="compact"`
* Bind on `DOMContentLoaded`, `visibilitychange`, `resize`, and `storage`.

### CSS & Specificity Policy

* Avoid `!important`. If a vendor override is unavoidable, document with:
  `/* OVERRIDE: lib | reason | owner | expires */`
* Prefer tokens and cascade order over specificity wars.
* Do not modify global token values outside the gated selector.

---

## Testing & Validation

### Playwright (React V2)

* Base URL: `E2E_BASE_URL` or `http://localhost:8888`.
* Failing conditions: any console error in tests.

**Gate verification spec pattern:**

```ts
// tests/e2e/compact/v2/stepX/tokens.gate.spec.ts
import { test, expect } from '@playwright/test';
const cssVar = (p, n) => p.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), n);

test('flag OFF → gate absent', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('flag:mobile_compact_v1'));
  await page.reload();
  const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
  const posterW = await cssVar(page, '--poster-w');
  expect(attr).toBe('');
  expect(posterW).not.toBe('136px');
});

test('flag ON + compact density → gate present', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('flag:mobile_compact_v1', 'true');
    document.documentElement.dataset.density = 'compact';
  });
  await page.reload();
  const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
  const posterW = await cssVar(page, '--poster-w');
  expect(attr).toBe('true');
  expect(posterW).toBe('136px');
});
```

### Manual Sanity (no UI change by default)

* In DevTools:

  ```js
  localStorage.setItem('flag:mobile_compact_v1','true');
  document.documentElement.dataset.density='compact';
  getComputedStyle(document.documentElement).getPropertyValue('--poster-w').trim(); // expect 136px
  ```
* Remove flag or density; expect not 136px and no `data-compact-mobile-v1`.

---

## Process & Governance

### Step Discipline

* One step per branch, with binary acceptance criteria.
* No refactors or drive-bys outside the approved step.
* Rollback must be one commit or a tag revert.

### Reports

* Place analysis outputs under `reports/` with clear filenames:

  * `reports/v2-tokens-map.csv`
  * `reports/v2-tokens-conflicts.csv`
  * `reports/v2-css-specificity-mobile.csv`
  * `reports/v2-fixed-bottom-audit.md`
  * `reports/v2-card-variants-map.md`

### Tests

* Place V2 tests under `tests/e2e/compact/v2/**`.
* Do not reference `www/` in any test.

### Server Management

* Do **not** run `npm run dev` or start any server.
* Assume the user’s Vite server is running on port 8888.

---

## Out-of-Scope (Legacy V1)

All of the below pertains to the **vanilla JS app under `www/`** and is **not to be touched** in this project:

* IIFE modules, `window.FlickletApp`, monolithic `functions.js`
* V1 CSS load order (`main.css`, `components.css`, `mobile.css`)
* V1 FAB system, Up-arrow control, V1 modals/notification design
* FlickWord V1 files (`www/features/flickword-*`, modal scripts, V1 stats)
* V1 Firebase wiring, Netlify server rules for `www/`

Keep V1 references only as historical context. Do not modify or import from `www/`.

---

## Acceptance Checklist (per step)

* Only the whitelisted files/paths changed.
* No UI or behavioral changes unless explicitly stated.
* Tests pass with zero console errors.
* Reports exist and are non-empty when required.
* Rollback path documented in the step description.

---

## Quick Commands (for humans, not Cursor)

* Start V2 dev: `npm run dev --prefix apps/web`
* Run a single e2e spec:
  `E2E_BASE_URL=http://localhost:8888 npm run test:e2e -- tests/e2e/compact/v2/step1/app.v2.root.smoke.spec.ts`

---

**This document supersedes all prior Cursor guidance for Flicklet.** If a rule conflicts with this file, this file wins.
