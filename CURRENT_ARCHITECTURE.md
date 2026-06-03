# Current Architecture — Flicklet TV Tracker

Last updated: 2026-06-03

This document is the **source of truth for how the repo is organized and deployed today**. Update it when folders, deploy branches, service boundaries, or runtime behavior (especially Capacitor / env) change.

---

## Standing documentation rule

**Before any scoped Cursor/AI change**, review:

1. [CURRENT_TASK.md](./CURRENT_TASK.md)
2. [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
3. [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md)

Update the affected doc(s) after changes that impact product direction, architecture, priorities, known issues, env/runtime behavior, or release status.

**AI behavior:** Act as mentor, reviewer, coach, and goalkeeper. Cite verified paths and runtime behavior; avoid assumptions.

---

## Product model (terminology)

| Term | Meaning |
|------|---------|
| **Trial** | 21-day full access (e.g. “Flicklet starts fully unlocked for your first 21 days”) |
| **Read-Only** | After trial: browse, export, restore; limited writes |
| **Full Access** | One-time paid unlock (Google Play Billing on Android) — not “Pro” / “Premium” / subscription wording in user copy |

**Deprecated in user-facing copy:** Pro, Premium, Subscription, monthly/yearly pricing language, premium themes, Coming Soon monetization blocks.

**Expired trial copy (canonical):** Library still yours; export/restore anytime; Full Access one-time purchase for tracking/reminders/editing; no subscriptions, ads, or selling user data (`apps/web/src/lib/copy/access.ts`).

**Billing:** Google Play Billing for Android — **end-to-end validation still required**. Apple deferred.

**Auth (Android-first):** Google native sign-in on Capacitor (`googleAuthNative.ts`, `VITE_GOOGLE_WEB_CLIENT_ID`). Apple login should not ship on Android-first release. Username optional; **legal full names must not appear in UI**.

---

## Product architecture / direction (core, not optional polish)

### WTForecast-style rotating personality

- **Role:** Core product differentiator — makes Flicklet screenshot- and discussion-worthy beyond table-stakes tracking.
- **Model:** Curated/static rotating pools per surface and personality mode — **not** runtime AI generation.
- **Surfaces (target):** Home headers, recommendation intros, empty states, toasts, confirmations, reminders, errors, fake motivational/context cards.
- **Settings:** Personality intensity / mode selection.
- **Tone:** Witty, short, memorable, app-store safe — not cruel, repetitive, or generic.
- **Implementation status:** Not built yet; see [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

### Unified Library (mobile)

- **Role:** Core mobile UX — reduce tab clutter (Currently Watching / Want To Watch / Watched).
- **Goal:** One Library-style experience with quick status moves and custom lists preserved; avoid cluttered mega-dashboard.
- **Status:** Direction only; not implemented.

### Confirmation + action feedback

- **Role:** Trust UX — no silent destructive or meaningful state changes.
- **Target:** Confirm dialogs before destructive actions; confirmation toasts/snackbars after meaningful success paths.
- **Status:** Not implemented.

---

## Active folders (source of truth)

| Path | Role |
|------|------|
| `apps/web/` | **Active frontend** — React + Vite SPA |
| `apps/web/src/` | **Active UI and client logic** — do not implement features in archive/legacy trees |
| `apps/web/.env` | **Local dev** Vite env (not committed) |
| `apps/web/.env.mobile` | Optional mobile build env (`VITE_API_BASE_URL`, `VITE_GOOGLE_WEB_CLIENT_ID`, etc.) |
| `netlify/functions/` | **Production serverless functions** |
| `netlify.toml` | Netlify build, dev, redirects, function directory |
| `android/` | Capacitor Android shell (`com.TravisL.tvtracker`) |
| `capacitor.config.json` | Capacitor `webDir`: `apps/web/dist` |
| `docs/` | Maintainer docs |
| `package.json` (repo root) | Root scripts; **`npx netlify dev` from repo root** |

### Do not treat as active without audit

| Path | Notes |
|------|-------|
| `_legacy_v1/`, `legacy/`, `archive/` | Old implementations |
| `_repo_cleanup_archive/` | Quarantined docs/scripts — not runtime truth |
| `functions/` | Separate Firebase/admin tree — **not** production Netlify deploy path |
| `ios/` | Deferred |

---

## Deployment model

| Environment | Branch | Build | Publish |
|-------------|--------|-------|---------|
| **Netlify production** | `simplify/try-before-buy-v1` | `npm run build` in `apps/web` | `apps/web/dist` |
| **Functions** | Same deploy | `netlify/functions` | Netlify esbuild bundle |

- **Firebase:** Auth (Google), Firestore, user settings sync (`fullSettings` — does **not** yet include For You genre rows).
- **TMDB:** Live via `tmdb-proxy` (server token); client uses `/api/tmdb-proxy` redirect.
- **SendGrid:** Feedback via `feedback.cjs` — production send still needs verification.

---

## Local development model

**Run from repo root:**

```bash
npx netlify dev
```

| Item | Value |
|------|-------|
| App URL | http://localhost:8888 |
| Vite (behind Netlify) | port 4173 |
| Functions | `netlify/functions` |
| API routes | Same `/api/*` redirects as production |

**Android / Capacitor build:**

```bash
npm run mobile:build   # apps/web --mode mobile (optional env)
npm run mobile:sync    # build + cap copy/sync
```

---

## Environment variable rules

| Context | Source of truth |
|---------|-----------------|
| **Local frontend (Vite)** | `apps/web/.env` |
| **Mobile build overrides** | `apps/web/.env.mobile` (optional) |
| **Local Netlify CLI / functions** | Repo-root `.env` (`TMDB_TOKEN`, SendGrid, etc.) |
| **Production** | **Netlify dashboard only** |

Important `VITE_*` examples:

| Variable | Purpose |
|----------|---------|
| `VITE_GOOGLE_WEB_CLIENT_ID` | Native Google Sign-In on Android/iOS |
| `VITE_API_BASE_URL` | Absolute Netlify origin for `/api/*` on mobile builds |
| `VITE_TMDB_PROXY_BASE` | Full TMDB proxy URL (optional; derived from API base) |
| `VITE_PUBLIC_BASE_URL` | Canonical site origin; fallback for native API base in `apiConfig` |

`VITE_*` are baked at build time — Netlify/dashboard changes require rebuild/redeploy.

---

## Android / Capacitor runtime

### WebView origin

- App assets load from **`capacitor://localhost`** (or `https://localhost` on some configs) — **no same-origin Netlify server** in the WebView.

### API routing (`apps/web/src/lib/apiConfig.ts`)

| Runtime | `API_BASE` / `TMDB_PROXY_BASE` behavior |
|---------|----------------------------------------|
| **Browser + `npx netlify dev`** | Empty base → relative `/api/tmdb-proxy` (same host as dev server) |
| **Production Netlify site** | Relative `/api/*` on `flicklet.netlify.app` |
| **Capacitor native** (env unset) | Runtime fallback to `https://flicklet.netlify.app` + `/api/tmdb-proxy` via `isCapacitorNative()` |
| **Capacitor / mobile build** (env set) | `VITE_API_BASE_URL` / `VITE_TMDB_PROXY_BASE` override fallback |

Helpers: `apiUrl('/api/...')` for billing and other Netlify routes; TMDB modules import `TMDB_PROXY_BASE`.

**Verified (2026-06-03):** Search, posters, and TMDB-backed rails work on Android after this fix.

### Auth

- Native Google Sign-In → Firebase `signInWithCredential`; requires correct Web OAuth client ID in env.

### Billing (one-time Full Access)

| Layer | Detail |
|-------|--------|
| **Product** | `flicklet_full_access` — INAPP non-consumable (`billingProducts.ts`) |
| **Client flow** | `startProUpgrade()` → `proUpgrade.ts` → Capacitor `Billing` plugin → `POST /api/billing/validate` |
| **Android native** | `BillingPlugin.java` — query/purchase/restore **INAPP** (not SUBS) |
| **Server** | `netlify/functions/billing/products.cjs`, `validate.cjs` — `purchaseType: one_time`, long-lived `currentPeriodEnd` |
| **Entitlement** | Firestore `users/{uid}/billing/status` → `useProStatus` (`isPro` internal name) → `useEntitlements`; trial/read-only unchanged |
| **Validation** | **Stub** — real `purchases.products.get` TODO in `validate.cjs` |
| **Success UX** | Toast: “Purchase confirmed. Full Access unlocked.” (`pro-upgrade-success` → `App.tsx`) |

Legacy subscription product IDs are not used by the current app build.

---

## For You genre row storage (Home rails)

**Not Firebase-synced today.**

| Item | Detail |
|------|--------|
| **Consumer** | `useForYouRows` → `useForYouContent` → `Rail` in `App.tsx` |
| **Settings editor** | `ForYouGenreConfig` in Display settings |
| **Storage module** | `apps/web/src/lib/forYouRowsStorage.ts` |
| **Keys** | `flicklet:forYouRows:v2:{uid}` per account; `flicklet:forYouRows:v2:guest` for signed-out |
| **Legacy** | `flicklet:forYouRows` — read once, migrated or discarded, then removed |
| **Format** | `{ version: 2, rows: ForYouRow[] }` — validated against `FOR_YOU_AVAILABLE_GENRES` |
| **Sign-out** | `clearForYouRowsOnSignOut()` clears guest + legacy only; **uid keys preserved** for same-device re-login |
| **Cross-device** | Not implemented; `settings.layout.forYouGenres` exists but is **not** wired to Home rails |

**Future improvement:** Sync For You rows through `settingsManager` / Firebase `fullSettings` if product requires cross-device parity.

---

## `netlify/functions` (production)

| Function | Purpose |
|----------|---------|
| `tmdb-proxy.cjs` | TMDB API proxy |
| `dict-proxy.cjs` | Dictionary / FlickWord |
| `goofs-fetch.cjs` | Shows Like This / extras fetch |
| `feedback.cjs` | User feedback → SendGrid |
| `send-email.cjs` | Legacy/alternate email (audit duplicate) |
| `billing/*` | Google Play products, purchase, validate |
| `origin-validation.cjs` | Origin checks (includes Capacitor / mobile UA allowances) |

Redirects: `/api/tmdb-proxy` → `tmdb-proxy`, etc. (`netlify.toml`).

---

## External services

| Service | Status | Integration |
|---------|--------|-------------|
| Firebase | Live | Auth, Firestore, settings sync |
| TMDB | Live | `tmdb-proxy.cjs` |
| SendGrid | Live (code path) | `feedback.cjs` — prod verification pending |
| Google Play Billing | One-time INAPP wired; stub validate | `billing/*` + `BillingPlugin` — **internal testing E2E pending** |
| Apple Sign-In / IAP | Deferred | Not Android-first |

---

## Known path confusion risks

1. **Two function trees:** `netlify/functions` (production) vs `functions/` (Firebase/admin — audit before delete).
2. **Two env locations:** `apps/web/.env` vs repo-root `.env`.
3. **Legacy roots:** `_legacy_v1`, `legacy/`, `_repo_cleanup_archive/` — easy to edit wrong files; use `apps/web/src` only for active UI.
4. **Capacitor vs web API base:** Relative `/api/*` only works with a real HTTP origin; native needs `apiConfig` fallback or mobile env.
5. **For You storage vs settings:** Home rails use `forYouRowsStorage`; not `settings.layout.forYouGenres`.

---

## Source-of-truth rules (quick reference)

| Question | Answer |
|----------|--------|
| Where is the active app UI? | `apps/web/src` |
| Where do I run dev? | Repo root → `npx netlify dev` |
| Where are production functions? | `netlify/functions` |
| Where are prod env vars? | Netlify dashboard |
| Where are local frontend env vars? | `apps/web/.env` |
| What branch is production? | `simplify/try-before-buy-v1` |
| What terms do we use? | Trial / Read-Only / Full Access |
| How does Android call APIs? | `apiConfig` → production Netlify when native |
| Where are For You genres stored? | `flicklet:forYouRows:v2:{uid}` locally |

---

## Near-term milestone

**Play Store internal testing** with working Android install, Google login, TMDB/search/posters, on-device For You persistence, and validated billing/feedback paths. Core product build-out: **personality layer**, **Unified Library**, **confirmation/feedback UX**.
