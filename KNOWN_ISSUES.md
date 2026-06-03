# Known Issues — Flicklet TV Tracker

Last updated: 2026-06-02

Tracked problems, uncertainties, and tech debt. **Do not modify app code from this file alone** — use it to prioritize fixes. See [CURRENT_TASK.md](./CURRENT_TASK.md) for sprint actions.

---

## Resolved (keep for context)

### Android TMDB / search / posters — API base routing (2026-06-03)

- **Was:** Capacitor loads from `capacitor://localhost`; relative `/api/tmdb-proxy` hit local WebView, not Netlify — search empty, posters broken.
- **Fix:** `apps/web/src/lib/apiConfig.ts` — native Capacitor uses production Netlify origin fallback; build-time `VITE_API_BASE_URL` / `VITE_TMDB_PROXY_BASE` still override.
- **Status:** ✅ Resolved on device testing. **Not** the same as TMDB caching/fallback fragility below.

### For You stale / orphan row labels (2026-06-03)

- **Was:** Home used legacy global `flicklet:forYouRows`; sign-out cleared all keys; drama choices lost after re-login.
- **Fix:** `apps/web/src/lib/forYouRowsStorage.ts` — version 2, validated rows, `flicklet:forYouRows:v2:{uid}`, guest key separate, legacy key migrated/removed, per-user keys preserved on sign-out.
- **Status:** ✅ Same-account sign-out/sign-in on same device retains rows. **Still open:** cross-device sync (see below).

### Google native sign-in on Android (2026-06-03)

- **Was:** Missing/wrong OAuth client config for WebView native flow.
- **Fix:** `VITE_GOOGLE_WEB_CLIENT_ID` (e.g. `apps/web/.env.mobile`) + Firebase/Google auth alignment.
- **Status:** ✅ Verified on device/debug build.

---

## Runtime / data

### TMDB and poster fragility (still open)

- Posters and metadata can still fail on proxy errors, missing paths, or cache misses — **separate from** resolved Android API-base routing.
- **Impact:** Broken or blank cards, Discovery/For You feels unreliable under bad network or TMDB errors.
- **Direction:** Stronger caching and fallbacks via `tmdb-proxy`; client fallbacks for missing `poster_path`.

### Caching strategy needed

- No single documented caching policy for TMDB, show metadata, and images.
- **Risk:** Rate limits, cold-start slowness, fragile retries under Play Store test traffic.

### For You row persistence — cross-device not implemented

- **Current:** Local `flicklet:forYouRows:v2:{uid}` (validated, version 2); guest `...:guest`; legacy `flicklet:forYouRows` migrated then removed.
- **Works:** Same Google account on same device after sign-out/sign-in.
- **Does not work:** Genre choices on phone ≠ choices on web/other device (not in Firebase `fullSettings` yet; `layout.forYouGenres` in settings is legacy/unwired for Home rails).
- **Future:** Optional sync through settings/Firebase if product requires cross-device For You.

### For You / Discovery scoring logic unclear

- Uncertain whether scoring fully uses: ratings, Not Interested, genres/subgenres, watch history, list membership.
- **Needs:** Audit of `discoveryScoring`, smart discovery hooks — document expected behavior then fix gaps.

---

## Core product gaps (not yet implemented)

### WTForecast-style rotating personality system

- **Status:** Not implemented. **Core product differentiator** — not cosmetic.
- **Intent:** Curated/static rotating copy pools (not runtime AI). Surfaces: headers, recommendation intros, empty states, toasts, confirmations, reminders, errors, motivational/context cards. Personality intensity in settings.
- **Tone:** Witty, short, memorable, app-store safe; avoid cruel, repetitive, or generic voice.
- **Risk:** App feels like “another tracker” without this layer.

### Unified Library / mobile tab consolidation

- **Status:** Not implemented. **Core mobile UX direction.**
- **Intent:** One Library-style surface for Currently Watching / Want To Watch / Watched; less tab clutter; room for personality surfaces; keep quick status changes and custom lists without a mega-dashboard.

### Confirmation and action feedback layer

- **Status:** Not implemented. **High priority for trust.**
- **Missing:** Destructive “Are you sure?” prompts (delete, remove, clear, reset, delete list, reminder removal). Post-action confirmation toasts (add, move, delete, reminder save/remove, import/export, restore, Full Access changes).
- **Risk:** Silent state changes confuse testers and increase support burden.

---

## Configuration / repo

### Env source confusion (mostly resolved — must stay documented)

- **Resolved policy:** Local frontend → `apps/web/.env`; production → Netlify dashboard only. Mobile: `apps/web/.env.mobile` or runtime `apiConfig` Capacitor fallback.
- **Residual risk:** Root `.env` vs `apps/web/.env` vs README/`docs/ENV.md` may still disagree.
- **Mitigation:** [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md) is source of truth.

### Repo cleanup in progress

- Large doc/script trees under `_repo_cleanup_archive/` (quarantine).
- **Risk:** Treating archived forensic docs as current truth.
- **Do not delete** archive until cleanup is signed off.

### Separate `functions/` tree

- `functions/` (Firebase / admin / goofs ingestion) alongside `netlify/functions` (production Netlify).
- **Status:** **Needs audit before deletion.**

---

## Product / terminology

### Pro terminology remnants (code / docs)

- User-facing copy largely migrated to Trial / Read-Only / Full Access (`lib/copy/access.ts`, settings, help).
- Remnants may remain in internal keys (`isPro`, `UpgradeToProCTA`), archived docs, admin scripts.
- **Risk:** Confusing testers if new “Pro” strings appear in UI.

### Billing / Full Access — code migrated; E2E validation still open

- **Migrated (2026-06-02):** Subscription SKUs removed from active path. Single INAPP `flicklet_full_access` (`apps/web/src/lib/billingProducts.ts`); Android `BillingPlugin` uses INAPP; `validate.cjs` writes `purchaseType: one_time` to Firestore `users/{uid}/billing/status` (internal `isPro` unchanged).
- **Stub validation:** `validate.cjs` does **not** call Google Play Developer API yet — not fraud-safe for production.
- **Uncertain on device:** Trial countdown, read-only enforcement, internal-testing purchase, reinstall entitlement, second-account isolation.
- **No Settings “Restore purchases” button** — reinstall + Firestore read is v1 recovery; native `restorePurchases` exists in plugin only.
- **Manual test doc:** `tests/manual/PLAY_BILLING_ONE_TIME.md`
- **Status:** **Critical open** for Play Store internal testing (Play Console INAPP product + signed track required).
- Apple billing intentionally deferred.

---

## Auth / identity

### Apple login should be removed (Android-first)

- iOS/deferred Apple Sign-In may still surface in code or settings.
- **Target:** Google only for Play Store testing.

### Username / full-name display risk

- Username optional forever.
- **Requirement:** Full legal names must **not** appear in UI.
- **Needs:** Audit display name sources (Google profile, Firestore user doc).

---

## UX bugs / features

### Scroll-to-top arrow — not working (2026-06-02 attempt failed)

- **Status:** Open.

### Scroll-to-bottom arrow — useless timing

- **Status:** Open.

### Discovery cards lack Not Interested action

- **Status:** Open — blocks manual Discovery QA.

### For You / horizontal rails not scrollable; posters clipped

- **Status:** Open.

### Flicklet banner disappears after returning home

- **Status:** Open.

### Reminders need redesign

- **Status:** Open.

### Not Interested needs restore/return action

- **Status:** Open.

### Goofs / Extras labeling

- User-facing copy largely updated to **Shows Like This** / **Extras**; sweep any stale “bloopers” / “goofs” labels if still visible.

### Games / community (removed from product scope)

- Feature removed from user-facing scope; stale UI/routes may remain — sweep if visible to testers.

### Spanish localization incomplete

- **Status:** Open.

### Settings cleanup (ongoing)

- Premium themes / Coming Soon marketing blocks removed from Full Access settings.
- Dead toggles or legacy flags may remain — align with Trial / Read-Only / Full Access only.

---

## Admin / infrastructure

### Admin likely removable

- Admin UI and `functions/` admin scripts may be unnecessary for consumer Play Store build.
- **Prove necessity** or remove from Android release.

---

## Feedback / email

### Feedback email path — production verification open

| Path | Status |
|------|--------|
| **SendGrid** | `netlify/functions/feedback.cjs` |
| **Client** | `FeedbackPanel.tsx` → `POST /api/feedback` |

**Production requirements:** `SENDGRID_API_KEY`, `FEEDBACK_EMAIL`, `FROM_EMAIL` (or `SENDGRID_FROM`) in Netlify dashboard.

**Status:** Path confirmed in code; **end-to-end production send not yet verified** after deploy.

**Note:** Audit `send-email.cjs` vs `feedback.cjs` for duplication.

---

## Platform

### iOS dormant

- Not in near-term scope.

### Play Store readiness unknowns

- Signed release / internal testing track validation in progress.
- Data safety form, billing disclosure copy may lag code.

---

## How to use this file

1. Review [CURRENT_TASK.md](./CURRENT_TASK.md) + [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md) before scoped work.
2. Pick an item by priority; reproduce on `npx netlify dev` or Android build as appropriate.
3. Fix with minimal diff; update this file when status changes (date + one-line note).
