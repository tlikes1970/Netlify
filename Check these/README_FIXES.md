# Flicklet – Clean Core Drop-in

This package provides cleaned core files that unify initialization, fix tab rendering, establish robust event delegation, and normalize data access. It is designed to replace the legacy split across `app.js`, `bootstrap.js`, `functions.js`, and `utils.js` without breaking existing HTML.

## Files
- `utils.cleaned.js` — single source of truth for `appData`, persistence helpers, notifications, and common utilities.
- `functions.cleaned.js` — core UI functions (tabs, lists, settings, import/export, item actions).
- `app.cleaned.js` — single, centralized lifecycle (`FlickletApp`) with predictable init and rendering.
- `bootstrap.cleaned.js` — minimal DOMContentLoaded bootstrapper.

## How to integrate (safe trial)
1. In your HTML, **include these four files after your config files** (`tmdb-config.js`, `i18n.js`, etc.) and **before** any other app scripts:
   ```html
   <script src="utils.cleaned.js"></script>
   <script src="functions.cleaned.js"></script>
   <script src="app.cleaned.js"></script>
   <script src="bootstrap.cleaned.js"></script>
   ```
2. Comment out / remove duplicate legacy bundles (`functions.js`, `functions-clean.js`, older `bootstrap.js`, legacy `app.js`) **one by one** while testing. Keep other modules (e.g., search, i18n) as-is.
3. Verify:
   - Tabs switch correctly (class-based, no inline `display`).
   - Buttons work on newly rendered items (event delegation).
   - Theme toggle and language picker persist and re-render without console errors.
   - Import/export works; moving/removing items updates counts immediately.

## Notes
- CSS fixes (sticky search on iOS): ensure no ancestor of `.top-search` has `overflow` set; prefer `overflow: visible` on the scroll container.
- If `initializeFirebase`, `applyTranslations`, or search helpers are missing in your build, the cleaned core provides safe fallbacks so the app won’t hard crash.
