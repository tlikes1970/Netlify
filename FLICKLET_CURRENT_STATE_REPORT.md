# Flicklet — Current-State Report

Read-only analysis of the repo at `c:\Users\likes\Side Projects\TV Tracker\Netlify`. Generated May 30, 2026. No code was modified as part of the analysis.

---

# 1. Current Architecture

## Framework / library stack

| Layer | Technology |
|--------|------------|
| UI | React 18, TypeScript, Vite 4 (`apps/web`) |
| Styling | Global CSS, Tailwind (dev), design tokens (`apps/web/src/styles/`) |
| Data fetching | TanStack React Query (`apps/web/src/lib/query.ts`) |
| Auth / cloud | Firebase Auth, Firestore, Cloud Functions, FCM (`firebase` 12.x) |
| Mobile | Capacitor 7 (`capacitor.config.json` → `apps/web/dist`) |
| Media metadata | TMDB via Netlify proxy |
| Community backend | Express + Prisma (`server/`) synced with Firestore posts |
| Serverless | Netlify Functions (`netlify/functions/`) |
| Error tracking | Sentry (optional, `VITE_SENTRY_DSN`) |
| Tests | Vitest, Playwright, Jest (server) |

Root `package.json` (v28.170.7) wraps tooling; the **shipping app** is `apps/web` (v0.1.174).

## App structure

Single-page app with **no React Router**. Navigation uses:

- **In-app views**: `useState<View>` in `apps/web/src/App.tsx` (`home`, `watching`, `want`, `watched`, `returning`, `mylists`, `discovery`)
- **Path-based “routes”**: `window.location.pathname` for `/admin`, `/debug/auth`, `/unsubscribe`, `/posts/:slug`
- **Hash deep links**: `#settings/...`, `#games/flickword`, show/list deep links

Boot sequence: Firebase bootstrap → auth flow → React mount with first-paint gate (`apps/web/src/main.tsx`).

## Major folders

| Path | Role |
|------|------|
| `apps/web/` | **Primary product** — React app, Vite build, most Netlify function copies |
| `netlify/functions/` | Production Netlify serverless (TMDB proxy, billing, feedback, backend-proxy) |
| `server/` | Community hub API (posts, comments, tags) — PostgreSQL via Prisma |
| `functions/` | Firebase Cloud Functions (digest, goofs ingest, admin, unsubscribe, push) |
| `android/`, `ios/` | Capacitor native shells; Android has custom `BillingPlugin.java` |
| `_legacy_v1/www/` | Old vanilla JS app (large, mostly obsolete) |
| `legacy/mobile-compact-v1-vanilla/` | Compact UI experiments |
| `web/` | Separate **Next.js 16** scaffold — not wired to main deploy |
| `migration/`, `migration-pack/` | Migration inputs and token maps |
| `tests/e2e/` | Playwright compact/mobile specs |
| `docs/`, `*.md` reports | Extensive operational / forensic documentation |

## State management

- **Library (watchlists)**: In-memory + `localStorage` key `flicklet.library.v2` (`apps/web/src/lib/storage.ts`); pub/sub via `useLibrary` hook
- **Settings**: `settingsManager` singleton + `localStorage` (`apps/web/src/lib/settings.ts`)
- **Custom lists**: `customListManager` (`apps/web/src/lib/customLists.ts`)
- **Server state**: React Query for TMDB/rails
- **Auth**: `authManager` class + `useAuth` hook (`apps/web/src/lib/auth.ts`, `hooks/useAuth.ts`)
- **Actions bridge**: `apps/web/src/state/actions.ts` (toasts, card actions)
- **Feature flags**: Static JSON + `localStorage` overrides (`apps/web/src/lib/FEATURE_FLAGS.json`, `flags.tsx`)

## Backend / services

1. **Firebase** — auth, Firestore user docs, watchlist sync, community posts in Firestore, FCM
2. **Netlify Functions** — TMDB/dict/goofs proxies, billing APIs, SendGrid feedback, optional `backend-proxy` to Express
3. **Express server** (`server/`) — community posts API at `/api/v1/*` (dev proxy in Vite; production via Netlify)
4. **Firebase Functions** (`functions/`) — weekly digest, goofs ingestion, admin tools, push on reply
5. **External APIs** — TMDB, Trivia API, Wordnik/dict (games), YouTube (extras; partial)

## Local storage, database, sync

| Data | Primary store | Cloud sync |
|------|---------------|------------|
| Watchlists, ratings, notes, tags | `localStorage` (`flicklet.library.v2`) | Firestore `users/{uid}` watchlists via `firebaseSync.ts` when signed in |
| Settings | `localStorage` | Partial sync paths in settings modules |
| Custom lists | `localStorage` + manager | Included in Firebase lean watchlists |
| Community posts | Firestore (+ Prisma mirror via server) | Requires auth + backend |
| Pro billing | Firestore `users/{uid}/billing/status` | Updated by Netlify billing functions (placeholder validation) |

**Offline-first**: Library works without login; sync is best-effort on `library:changed` events. Sign-out clears local library (`library:cleared`).

## External APIs

- **TMDB** — search, discovery, posters, in-theaters (`apps/web/src/lib/tmdb.ts`, `netlify/functions/tmdb-proxy.cjs`)
- **Firebase** — auth, Firestore, Functions, Messaging
- **Google Play Billing** — Android Pro (product IDs in `proUpgrade.ts`)
- **SendGrid** — feedback email (`netlify/functions` / `apps/web/netlify/functions/send-email.cjs`)
- **Trivia / FlickWord** — game content APIs (`apps/web/src/lib/triviaApi.ts`, lexicon shards under `apps/web/public/words/`)
- **YouTube** — extras/bloopers (gated; API key optional in `apps/web/src/lib/extras/config.ts`)

No LLM/AI integrations found in `apps/web/src`.

---

# 2. Routes / Pages / Screens

Routing is **hybrid**: pathname for special pages; `view` state for main tabs.

| Route / screen | File(s) | Purpose | Status | Data / deps |
|----------------|---------|---------|--------|-------------|
| **Home** | `App.tsx` (view `home`) | Marquee, Your Shows rails, Community, For You, In Theaters, Feedback | **Working** (core) | `useLibrary`, TMDB, `useForYouRows` |
| **Currently Watching** | `pages/ListPage.tsx`, `App.tsx` (`watching`) | List of `watching` items | **Working** | `Library`, TMDB refresh |
| **Want to Watch** (wishlist) | `ListPage.tsx`, `App.tsx` (`want`) | Internal list `wishlist` | **Working** | Same |
| **Watched** | `ListPage.tsx`, `App.tsx` (`watched`) | Completed list | **Working** | Same |
| **Returning** | `App.tsx`, `state/selectors/useReturningShows.ts` | Smart subset of library | **Working** | TMDB/status fields |
| **My Lists** | `pages/MyListsPage.tsx` | Custom lists (Pro-limited count) | **Working** | `customLists.ts`, Pro limits |
| **Discovery** | `pages/DiscoveryPage.tsx` | Recommendations + search overlap | **Partial** | Requires auth for recs; `useSmartDiscovery` |
| **Search results** | `search/SearchResults.tsx` | Overlay when search active | **Working** | TMDB, `smartSearch.ts` |
| **Settings (desktop)** | `components/SettingsPage.tsx` | Full settings UI | **Working** | Many sections in `settingsSections.tsx` |
| **Settings (mobile sheet)** | `components/settings/SettingsSheet.tsx` | Bottom sheet settings | **Working** | Feature flag `settings_mobile_sheet_v1` |
| **Post detail** | `components/PostDetail.tsx` | `/posts/:slug` | **Partial** | Firestore + optional Prisma API |
| **Admin dashboard** | `pages/AdminPage.tsx` | `/admin` | **Working** (admin only) | Firebase admin claims |
| **Admin extras** | `pages/AdminExtrasPage.tsx` | Embedded in Settings → Admin | **Working** (admin) | Large admin surface (~3k lines) |
| **Auth debug** | `debug/AuthDebugPage.tsx` | `/debug/auth` | **Working** (dev) | Auth logs, bypass env |
| **Unsubscribe** | `pages/UnsubscribePage.tsx` | `/unsubscribe?token=` | **Working** | Firebase callable `unsubscribe` |
| **Holidays** | `pages/HolidaysPage.tsx` | Holiday-themed UI | **Likely dead** | **Not imported anywhere** |
| **Auth modal** | `components/AuthModal.tsx` | Sign-in overlay | **Working** | Google/Apple/email Firebase |
| **Games modals** | `components/games/*` | FlickWord, Trivia | **Working** | API + local lexicon |
| **Extras modals** | Goofs, Bloopers, Extras | Card actions | **Partial** | Pro-gated; YouTube assist flag off |
| **Onboarding** | `components/onboarding/OnboardingCoachmarks.tsx` | First-run tips | **Working** | localStorage |
| **Help** | `components/HelpModal.tsx` | Help overlay | **Working** | Static |

---

# 3. Auth / User Model / Data Model

## Auth exists?

**Yes.** Firebase Authentication with Google (popup/redirect), Apple, and email/password (`apps/web/src/lib/auth.ts`, `authLogin.ts`, `AuthModal.tsx`). Native Android uses Capacitor Google Auth plugin.

Kill switch: `iauth:off` in `runtime/switches.ts` forces signed-out state.

## Where implemented

- Core: `apps/web/src/lib/auth.ts`, `authFlow.ts`, `firebaseBootstrap.ts`
- Hooks: `hooks/useAuth.ts`
- UI: `AuthModal.tsx`, `AuthConfigError.tsx`, `DebugAuthHUD.tsx`
- Admin role: custom JWT claim `role === 'admin'` (`hooks/useAdminRole.ts`)

## How user data is stored

- **Firestore** `users/{uid}` — profile, settings, watchlists (lean), billing subdoc
- **localStorage** — library v2, settings, flags, community topic filters, tab order
- **Prisma DB** (server) — community posts/comments mirror (not end-user watchlists)

## Main entities

```typescript
// apps/web/src/state/library.types.ts
ListName = 'watching' | 'wishlist' | 'watched' | 'not' | `custom:${string}`

// apps/web/src/lib/storage.ts — LibraryEntry extends MediaItem
{ list, addedAt, userRating?, userNotes?, tags?, isFavorite?, nextAirDate?, ... }
```

**Naming note:** UI tab `want` maps to storage list **`wishlist`** (“Want to Watch”). There is no separate “watchlist” list name; “watchlist” in docs often means the whole library.

## Watchlist / wishlist / watching / completed / ratings

| Concept | Storage key | UI label |
|---------|-------------|----------|
| Currently watching | `watching` | Currently Watching |
| Wishlist / want | `wishlist` | Want to Watch (tab `want`) |
| Completed | `watched` | Watched |
| Not interested | `not` | Via modal (removed from main tabs) |
| User rating | `userRating` (1–5) | Star rating on cards |
| Notes / tags | `userNotes`, `tags` | `NotesAndTagsModal.tsx` |
| Custom lists | `custom:{id}` | My Lists (Pro limits) |

## Cloud sync vs local-only

- **Anonymous / signed out**: Fully local library; no cloud sync
- **Signed in**: Upserts dispatch `library:changed` → `firebaseSync.ts` debounced upload; download on login (merge logic in sync manager)
- **Backup/restore**: Manual JSON download/upload in Settings → Data (`settingsSections.tsx`) — **device-local overwrite**, not cloud backup service

## Privacy / security concerns

1. **Hardcoded Firebase client config fallbacks** in `firebaseBootstrap.ts`, `firebase-messaging-sw.js`, docs — client keys are public by design but domain restrictions matter
2. **`.env.bak` at repo root** — should not be committed; verify contents not tracked
3. **Billing validation placeholder** accepts purchases without real Google Play verification (`netlify/functions/billing/validate.cjs`)
4. **Verbose auth/debug logging** in production paths (`App.tsx` modal logs, `authManager` console logs)
5. **CORS `*` on billing functions** with origin check helper — review `origin-validation.cjs`
6. **Community** exposes usernames, posts, voting — social surface area
7. **Admin pages** at `/admin` — gated by claim, but URL is guessable

---

# 4. Feature Status

| Feature | File(s) | Status | Notes | “Try before you buy” fit |
|---------|---------|--------|-------|--------------------------|
| **Search** | `SearchBar.tsx`, `UnifiedSearch.tsx`, `search/smartSearch.ts`, `SearchResults.tsx` | **Working** | TMDB multi/people; ranking debug in dev | **Keep** (core) |
| **Watchlists (3 main lists)** | `storage.ts`, `ListPage.tsx`, cards | **Working** | Reorder, move between lists | **Keep** |
| **Wishlist** | `wishlist` list + tab `want` | **Working** | Same as want-to-watch | **Keep** |
| **Currently watching** | `watching`, episode progress UI | **Working** | Episode tracking flag default **off** | **Keep** |
| **Watched / completed** | `watched` list | **Working** | | **Keep** |
| **Ratings** | `ratingSystem.ts`, `storage.ts`, `StarRating.tsx` | **Partial** | **3 unit test failures** in `ratingSystem.state.test.ts` | **Keep** (fix tests) |
| **Notes & tags** | `NotesAndTagsModal.tsx`, `storage.updateNotesAndTags` | **Working** | | **Keep** |
| **Discovery / recommendations** | `smartDiscovery.ts`, `DiscoveryPage.tsx` | **Partial** | Requires auth; rule-based scoring, not AI | **Lock** or simplify for paid |
| **For You genre rails** | `useForYouRows`, `Rail.tsx`, home | **Working** | TMDB genre rows | **Defer** or trim |
| **In theaters** | `TheaterInfo.tsx`, `useTmdb` | **Working** | Location/theater info | **Defer** |
| **Returning shows** | `useReturningShows.ts` | **Working** | Extra tab | **Keep** or merge into watching |
| **Custom lists** | `customLists.ts`, `MyListsPage.tsx` | **Working** | Free: 3 lists (`proConfig.ts`) | **Lock** unlimited behind purchase |
| **Import/export** | `settingsSections.tsx` backup/restore | **Working** | Local JSON only | **Keep** |
| **Reminders / notifications** | `notifications.ts`, modals, FCM | **Partial** | Pro vs free timing; `handleSimpleReminder` is **alert stub** in `App.tsx` | **Simplify** — basic free, advanced behind purchase |
| **Push / email digest** | `firebase-messaging.ts`, `functions/weeklyDigest.ts` | **Partial** | Needs FCM + backend | **Defer** for v1 simple app |
| **Pro / Premium gating** | `proStatus.ts`, `proConfig.ts`, `billing.ts` | **Partial** | Subscriptions, not one-time; web/iOS purchase TODO | **Replace** with trial + unlock |
| **Community feed** | `CommunityPanel.tsx` | **Working** but heavy | Always on home; posts from Firestore | **Remove** for simplified product |
| **Games (FlickWord, Trivia)** | `components/games/*`, `triviaApi.ts` | **Working** | Pro affects question counts | **Remove** |
| **Goofs / bloopers / extras** | `extras/*`, `goofsStore.ts` | **Partial** | Pro-gated; bloopers YouTube TODO | **Remove** or **Lock** |
| **Social (posts, comments, votes)** | `CommunityPanel`, `NewPostModal`, server | **Partial** | Needs backend in prod | **Remove** |
| **Personality / i18n** | `settings.ts`, `translationStore.ts` | **Working** | EN/ES, sarcasm levels | **Keep** minimal (EN only?) |
| **PWA / install** | `pwa/`, service worker | **Working** | SW complexity in boot | **Keep** |
| **Admin tools** | `AdminPage`, `AdminExtrasPage` | **Working** | Not for end users | **Keep** internal only |
| **AI features** | — | **None** | Smart discovery is heuristic | N/A |
| **Voice search** | `VoiceSearch.tsx` | **Unclear** | Component exists | **Remove** |
| **Holidays** | `HolidaysPage.tsx` | **Dead** | Unused | **Remove** |
| **Screenshot mode** | `useScreenshotMode.ts` | **Temporary** | Dev/marketing | **Remove** |

---

# 5. TODOs / Errors / Broken Areas

## Code search highlights

| Type | Location | Issue |
|------|----------|--------|
| **TODO** | `proUpgrade.ts` | iOS/web Stripe not implemented; Android product picker |
| **TODO** | `netlify/functions/billing/validate.cjs` | **Placeholder** Google Play validation (always valid) |
| **TODO** | `App.tsx:873` | Returning rail episodes empty |
| **TODO** | `SettingsSheet.tsx` | Sharing modal stub |
| **TODO** | `bloopersSearchAssist.ts` | YouTube API not integrated |
| **TEMP** | `App.tsx` | Red debug banner “MODAL SHOULD BE VISIBLE” for extras |
| **TEMP** | `useScreenshotMode.ts`, `FlickletHeader.tsx` | Screenshot mode |
| **Stub** | `App.tsx` `handleSimpleReminder` | `alert()` only, not real notifications |

## TypeScript / build

- `npm run typecheck` in `apps/web`: **passes** (exit 0)

## Tests

- Vitest: **7 failed / 81 passed** (3 files)
  - `ratingSystem.state.test.ts` — 3 failures (normalize/clamp behavior drift)
  - Likely 2 other files in the 3 failed count
- Deprecation warning: `baseline-browser-mapping` outdated

## Debug noise

- Extensive `console.log` in `App.tsx` for modals, extras, help
- `DragHandle` logs in tests (verbose)

## Duplication / dead code

- **Duplicate Netlify functions**: `netlify/functions/` vs `apps/web/netlify/functions/`
- **`_legacy_v1/`** entire tree
- **`HolidaysPage.tsx`** — no imports
- **`web/`** Next.js app — parallel experiment
- Root `package.json` `"main": "www/index.html"` — legacy path

## Likely broken in production without full stack

- Community when `VITE_API_URL` points to localhost (documented fallback error in community fetch paths)
- Web Pro purchase (opens settings only)
- iOS billing (not implemented)

---

# 6. Payment / Pro / Premium Gating Status

## Payment exists?

**Partially.** Infrastructure is present; end-to-end purchase is **not production-ready** for all platforms.

## Provider

| Platform | Provider | Status |
|----------|----------|--------|
| Android | Google Play Billing via Capacitor `Billing` plugin + Netlify validate | **Wired** but validation **stubbed** |
| Web | Stripe mentioned | **Not implemented** (`startWebPurchase` TODO) |
| iOS | App Store | **Not implemented** |
| Admin | `manageProStatus` Firebase callable | Manual grant |

Product IDs: `pro_subscription_monthly`, `pro_subscription_yearly` — **subscriptions**, $2.99/mo and $19.99/yr (`netlify/functions/billing/products.cjs`).

## Pro concept

**Yes.** `BillingStatus.isPro` in Firestore; `useProStatus()` merges billing (no alpha toggle in sync path).

## Gated features (current)

From `proConfig.ts`, `settingsProConfig.ts`, `notifications.ts`, `communitySorting.ts`, extras copy:

- Unlimited custom lists (free: 3)
- Community post/comment daily limits
- Pro-only community sort modes
- Advanced notifications (timing 1–24h, email)
- Bloopers & extras / goofs access
- Episode tracking in condensed view
- Trivia: more questions for Pro (`triviaApi.ts`)

## Gating logic locations

- `apps/web/src/lib/proStatus.ts` — resolve Pro
- `apps/web/src/lib/proConfig.ts` — limits
- `apps/web/src/lib/proUpgrade.ts` — purchase entry
- `apps/web/src/lib/billing.ts` — Firestore billing doc
- `netlify/functions/billing/*` — server validation (stub)
- UI: `UpgradeToProCTA.tsx`, Settings Pro section, `ProBadge.tsx`

## Free trial logic?

**No.** No time-boxed trial, trial SKU, or local trial expiry found in `apps/web/src`.

## Changes needed for target model

> Free trial for a few weeks → one-time unlock ~$4.99 → no subscription → no social/advanced features

| Area | Change |
|------|--------|
| Products | Replace subscription SKUs with **non-consumable** or **lifetime** one-time product in Play Console |
| `proUpgrade.ts` | `productType: 'inapp'` / one-time; remove monthly default |
| `billing/validate.cjs` | Implement real Play **product** validation (not subscription renewal) |
| `billing.ts` / Firestore | Drop `currentPeriodEnd` subscription semantics; use `purchasedAt` / `owned: true` |
| `proStatus.ts` | Remove subscription period checks |
| Trial | New fields: `trialStartedAt`, `trialEndsAt` or local + server clock; gate **full** features until trial ends, then paywall |
| Feature scope | Strip community, games, extras, advanced discovery from trial/paid UX per product decision |
| Web | Stripe **Payment Link** or Play-only mobile strategy |
| Settings Pro copy | Rewrite `settingsProConfig.ts` and marketing strings |

---

# 7. Deployment Config

## Where deployed

- **Primary web**: **Netlify** (`netlify.toml` — site likely `flicklet.netlify.app` per config comments)
- **Android**: Capacitor build → Play Store (`com.TravisL.tvtracker`)
- **Firebase**: `flicklet-71dff` project (from fallbacks)
- **Express community server**: Separate deploy (env `BACKEND_API_URL` for Netlify proxy)

## Netlify config (`netlify.toml`)

| Setting | Value |
|---------|--------|
| Base | `apps/web` |
| Build | `npm run build` → `tsc && vite build` |
| Publish | `dist` |
| Node | 20 |
| Functions dir | `netlify/functions` |

Redirects: TMDB/dict/goofs/billing APIs, `/api/v1/*` → backend-proxy, SPA fallback `/*` → `index.html`, Firebase auth handler preserved.

## Build commands

- Web production: `cd apps/web && npm run build`
- Mobile: `npm run mobile:build` (Vite `--mode mobile`) + `cap sync`
- Root `npm run build` delegates to Vite at root (legacy; Netlify uses `apps/web`)

## Environment variables (referenced)

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase client |
| `VITE_TMDB_KEY` | TMDB (also inlined in vite `define`) |
| `VITE_API_BASE_URL` / `VITE_API_URL` | Backend/community |
| `VITE_PUBLIC_BASE_URL` | Canonical URL |
| `VITE_SENTRY_DSN` | Error tracking |
| `VITE_FCM_VAPID_KEY` | Push |
| `VITE_YOUTUBE_API_KEY` | Extras |
| `VITE_AUTH_DEFAULT_POPUP` | Auth mode |
| `VITE_AUTHORIZED_DOMAINS` | OAuth allowlist |
| `VITE_BYPASS_USERNAME` | Auth debug |
| Netlify server | `FIREBASE_SERVICE_ACCOUNT`, `BACKEND_API_URL`, SendGrid keys, etc. |

Documented in `migration/inputs/ENV_KEYS.json`, `NETLIFY_ENV_SETUP.md`.

## Deployment risks

1. **Auth domain mismatch** if `VITE_FIREBASE_AUTH_DOMAIN` ≠ deployed hostname (called out in `firebaseBootstrap.ts`)
2. **Stub billing validation** — fraudulent Pro activation possible
3. **Duplicate function paths** — risk deploying stale copies under `apps/web/netlify/functions`
4. **Android assets** in git — large hashed bundles from last sync (noise, merge conflicts)
5. **Service worker + SPA cache headers** — correct in toml but sensitive to mis-deploys
6. **Community requires live backend** — broken experience if proxy/env wrong

## Secrets in repo

- Firebase **web API keys** hardcoded as fallbacks (public client keys, still in source)
- `NETLIFY_ENV_SETUP.md` contains example key values
- `.env` / `.env.bak` exist locally — `.gitignore` covers `.env`; **verify `.env.bak` is not tracked**
- `android/app/google-services.json` — expected for Android, contains API keys

---

# 8. Cleanup / Bloat Inventory

| Path | Why unnecessary | Risk if removed | Recommendation |
|------|-----------------|-----------------|----------------|
| `_legacy_v1/www/` | Pre-React app | Low (if V2 complete) | **Archive** then delete |
| `legacy/mobile-compact-v1-vanilla/` | Old compact experiments | Low | **Archive** |
| `web/` | Unused Next.js scaffold | Low | **Delete** or archive |
| `HolidaysPage.tsx` | Zero references | Low | **Delete** |
| `apps/web/netlify/functions/` | Duplicates root `netlify/functions` | Medium (if something references them) | **Investigate** → consolidate |
| `Lighthouse Reports/`, `.lighthouseci/` | Generated reports | Low | **Delete** or gitignore |
| `android/app/src/main/assets/public/assets/*` | Built bundles in VCS | Medium for Android builds | **Stop committing**; build in CI |
| `tatus`, `tatus --porcelain` | Accidental files at root | Low | **Delete** |
| `apps/web/docs/forensics/`, many `*_REPORT.md` | Historical audits | Low | **Archive** off-repo |
| `migration-pack/`, `reports/` | One-time migration artifacts | Low | **Archive** |
| `debug/` (`AuthDebugPage`, `fwTuner`, `fwProbe`) | Dev-only | Low in prod if routes blocked | **Keep** gated; remove from prod builds optional |
| `useScreenshotMode.ts` | Marketing temp | Low | **Delete** |
| `App.tsx` debug red banner | Dev leak to users | Low | **Delete** |
| Root `www/` if empty/stale | Old main in package.json | Medium | **Investigate** |
| `console.log` spam in `App.tsx` | Noise / perf | Low | **Delete** in stabilize phase |
| `.env.bak` | Backup secrets risk | High if secrets inside | **Investigate** → delete locally, never commit |

---

# 9. Simplified Product Fit

**Target:** Personal tracker, full trial → $4.99 one-time, no subs, no social, no AI, minimal support.

**Distance today:** Medium-large gap. Core lists + search + local library are strong; product is weighed down by community, games, subscription Pro, multi-backend ops, and admin surface.

### Feature classification

| Feature | Classification |
|---------|------------------|
| 3-list tracking + ratings + notes + tags | **Keep** |
| Search (TMDB) | **Keep** |
| Local backup/restore | **Keep** |
| Firebase sign-in + sync | **Keep** (simplifies multi-device) |
| Returning tab | **Keep** or merge into Watching |
| Custom lists | **Lock** behind one-time purchase (or limit hard in free) |
| Discovery / smart recommendations | **Lock** or **Defer** |
| For You / In theaters rails | **Defer** or **Remove** from home |
| Community, posts, comments, votes | **Remove** |
| FlickWord, Trivia | **Remove** |
| Goofs, bloopers, extras | **Remove** |
| Advanced notifications, email digest, FCM | **Defer**; ship simple reminders first |
| Pro subscription flow | **Remove** → replace with trial + one-time |
| Admin / moderation tools | **Keep** internal (not in consumer app) |
| Personality / bilingual | **Defer** (EN-only reduces support) |
| PWA install | **Keep** |
| Android/iOS native shells | **Keep** if mobile is a ship target |
| Voice search | **Remove** |
| Holidays page | **Remove** |
| Screenshot/debug modes | **Remove** |

---

# 10. Recommended Next Steps

## Phase 1: Stabilize / build health

| Task | Files | Risk | Order |
|------|-------|------|-------|
| Fix rating unit tests or implementation | `ratingSystem.ts`, `__tests__/ratingSystem.state.test.ts` | Low | 1 |
| Remove debug UI/logs (red banner, modal logs) | `App.tsx` | Low | 2 |
| Confirm Netlify build + env on deploy branch | `netlify.toml`, dashboard env | Medium | 3 |
| Run full vitest + critical Playwright smoke | `apps/web/tests`, `tests/e2e` | Low | 4 |
| Document canonical env set | `NETLIFY_ENV_SETUP.md` | Low | 5 |
| Audit `.env.bak` / committed secrets | root, docs | High | 6 |

## Phase 2: Remove unnecessary features

| Task | Files | Risk | Order |
|------|-------|------|-------|
| Remove or flag-off Community section on home | `App.tsx`, `CommunityPanel.tsx` | Medium | 1 |
| Remove game modals entry points | `CommunityPanel`, `App.tsx`, settings | Medium | 2 |
| Delete dead `HolidaysPage.tsx` | page + any assets | Low | 3 |
| Archive `_legacy_v1`, `legacy/`, `web/` | folders | Low–Med | 4 |
| Consolidate Netlify functions to single dir | `netlify/functions`, `apps/web/netlify` | Medium | 5 |
| Stop tracking Android built assets | `android/.../assets`, `.gitignore` | Medium | 6 |

## Phase 3: Simplify UX

| Task | Files | Risk | Order |
|------|-------|------|-------|
| Reduce home to Your Shows + search entry | `App.tsx`, `config/structure.ts` | Medium | 1 |
| Merge/remove Returning tab if redundant | `Tabs.tsx`, selectors | Low | 2 |
| Simplify Settings sections (drop Community, trim Pro) | `settingsConfig.ts`, `settingsSections.tsx` | Medium | 3 |
| Replace reminder `alert` stub with minimal real behavior or hide | `App.tsx`, `notifications.ts` | Medium | 4 |
| EN-only or hide personality levels for launch | `settings.ts`, `translations.ts` | Low | 5 |

## Phase 4: Trial + one-time unlock

| Task | Files | Risk | Order |
|------|-------|------|-------|
| Design trial state machine (local + Firestore) | new `trial.ts`, `billing.ts` | High | 1 |
| Play Console one-time product + plugin update | `proUpgrade.ts`, `BillingPlugin.java`, billing functions | High | 2 |
| Implement real purchase validation | `billing/validate.cjs` | High | 3 |
| Replace subscription fields with `owned` / `purchasedAt` | `billing.ts`, `proStatus.ts` | High | 4 |
| Paywall UX after trial | `UpgradeToProCTA`, Settings Pro | Medium | 5 |
| Decide web strategy (mobile-only pay vs Stripe) | `proUpgrade.ts` | Medium | 6 |

## Phase 5: Final QA / deployment prep

| Task | Files | Risk | Order |
|------|-------|------|-------|
| Auth E2E on Netlify URL + Android | auth modules, Capacitor | High | 1 |
| Library sync sign-in/out/sign-up | `firebaseSync.ts`, `auth.ts` | High | 2 |
| Purchase E2E in Play internal testing | Android + Netlify billing | High | 3 |
| Privacy policy / unsubscribe paths | `public/privacy.html`, `UnsubscribePage.tsx` | Medium | 4 |
| Lighthouse + bundle budget | `scripts/bundle-budget-check.js` | Low | 5 |
| Freeze scope — bugs only | — | Low | 6 |

---

## Summary

Flicklet is a **mature React + Firebase TV/movie tracker** with a solid **local-first library** (watching / wishlist / watched / ratings / notes) and **TMDB search**, deployed via **Netlify** with **Capacitor Android**. The codebase also carries a **full social community**, **games**, **subscription Pro** (stub validation), **multiple backends**, and a large **legacy/documentation footprint**.

For the simplified “try before you buy” product, the **core tracker is close**; the main work is **subtraction** (community, games, extras), **payment model replacement** (trial + $4.99 one-time), and **operational hardening** (billing validation, env/auth, test fixes, debug cleanup).
