# Current Task — Flicklet TV Tracker

Last updated: 2026-06-02

---

## Standing documentation rule (read first)

**Before any scoped Cursor/AI change**, review these three control docs:

1. [CURRENT_TASK.md](./CURRENT_TASK.md) (this file)
2. [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
3. [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md)

**After a meaningful change**, update whichever docs are affected if the work touches product direction, architecture, priorities, known issues, env/runtime behavior, or release status. These files exist to prevent drift — not as one-time notes.

**AI behavior:** Act as mentor, reviewer, coach, and goalkeeper. Do not blindly implement a requested solution if a safer, simpler, or more standard approach exists. Push back with evidence. Prefer established mobile/web practices. Explain risks in plain language. Keep the app focused, stable, low-support, and Play Store–testable.

---

## Current branch

`simplify/try-before-buy-v1` — matches Netlify production deploy branch.

**Recent push:** `9da7424` — Android TMDB API routing, For You row persistence, trial/Full Access copy, repo cleanup archive.

**In progress (local, may be uncommitted):** One-time Full Access billing migration — INAPP `flicklet_full_access`, subscription SKUs removed from purchase path; see `tests/manual/PLAY_BILLING_ONE_TIME.md`.

---

## Sprint goal

**Play Store testing readiness.**

Success looks like: Android build installs cleanly, Google login works, TMDB/search/posters work on device, Trial → Read-Only → Full Access is understandable, For You genres persist per account on-device, feedback reaches the owner inbox, and no show-stoppers from deprecated Pro/subscription/community paths.

---

## Recently verified (2026-06-03)

| Area | Status |
|------|--------|
| Android install / debug run on phone | ✅ Works |
| Google native sign-in (Android) | ✅ Works after `VITE_GOOGLE_WEB_CLIENT_ID` + Firebase/Google auth config |
| TMDB / search / posters (Android) | ✅ Works after `apiConfig` Capacitor → production Netlify `/api/*` fallback |
| For You row persistence (same device) | ✅ Versioned uid-scoped storage; survives sign-out/sign-in for same account |
| Trial / Read-Only / Full Access copy | ✅ Centralized; user-facing Pro/subscription/premium-theme wording removed from active UI |
| Android TMDB routing / stale For You rows | ✅ No longer Play Store test blockers |

---

## Current workflow (human + AI)

1. **ChatGPT** provides a Cursor prompt (scoped, evidence-based).
2. **User** runs it in Cursor.
3. **User** pastes results back to ChatGPT.
4. **ChatGPT** reviews (accept / revise / reject with reasons).
5. **Next action** is selected from the lists below.
6. **Proceed item by item** — no parallel “drive-by” refactors.

---

## Action list

### Critical (block Play Store test or revenue path)

- [ ] Validate **Google Play Billing** + **Full Access** one-time INAPP end-to-end per `tests/manual/PLAY_BILLING_ONE_TIME.md` (trial expiry, read-only, purchase, reinstall/Firestore).
- [ ] **Signed release / internal testing track** — build, upload, install from Play Console (not only debug APK).
- [ ] Verify **feedback** reaches Travis inbox in **production** (`POST /api/feedback` → SendGrid; Netlify env vars set).
- [ ] Smoke-test **Trial / Read-Only / Full Access** gating and copy on Android release build.

### High — core product direction (not “polish later”)

- [ ] **WTForecast-style rotating personality system** — curated/static pools (not runtime AI). Surfaces: home headers, recommendation intros, empty states, toasts, confirmations, reminders, errors, fake motivational/context cards. Support intensity levels in settings. Tone: witty, short, memorable, app-store safe — not cruel, not repetitive, not generic. **This is core product identity** (screenshot-worthy, discussion-worthy).
- [ ] **Unified Library (mobile)** — consolidate Currently Watching / Want To Watch / Watched into one Library-style experience; reduce tab clutter; preserve quick status moves and custom lists; avoid a cluttered mega-dashboard.
- [ ] **Confirmation + action feedback layer** — “Are you sure?” before destructive/meaningful actions (delete, remove, clear, destructive move/reset, delete list, remove reminder data). Confirmation toasts/snackbars after meaningful actions (add, move, delete, reminder saved/removed, import/export, restore, Full Access state changes). **No silent state changes.**

### High — likely tester-visible bugs

- [ ] Fix **Flicklet banner disappears** after returning home.
- [ ] **TMDB/poster fragility** (caching/fallback) — distinct from resolved Android API-base routing; empty/broken posters still possible on slow/error paths.
- [ ] Audit **username / full-name display** — legal names must not appear in UI.
- [ ] Remove **Apple login** from Android-first surfaces.
- [ ] Confirm **SendGrid** prod keys (`SENDGRID_API_KEY`, `FEEDBACK_EMAIL`, `FROM_EMAIL`) in Netlify dashboard.
- [ ] Sweep **games/community** stale remnants if still visible in user-facing UI (feature removed from scope).

### Medium (quality + support burden)

- [ ] **For You / Discovery logic audit** — ratings, Not Interested, genres/subgenres, watch history, list membership (scoring; separate from row persistence fix).
- [ ] **For You cross-device sync** — rows are uid-local only today; optional future: sync via settings/Firebase.
- [ ] **Scroll-to-top arrow** — still not working after 2026-06-02 attempt.
- [ ] **Scroll-to-bottom arrow** — only flashes at bottom; should appear while above bottom.
- [ ] **Discovery cards** — expose Not Interested action or overflow option.
- [ ] **For You / horizontal rails** — rows not scrollable; posters clipped at row ends.
- [ ] **Not Interested** — add restore/return action.
- [ ] **Reminders** — redesign (current UX insufficient).
- [ ] **Spanish localization** — complete or gate incomplete strings.
- [ ] Scrub remaining **Pro terminology** in code keys/docs (user-facing copy largely done).
- [ ] **Admin** — prove necessity or remove routes/UI.

### Lower (cleanup + tech debt)

- [ ] Finish **repo cleanup**; keep `_repo_cleanup_archive/` as quarantine only.
- [ ] Audit **`functions/`** tree vs `netlify/functions` — document owners, delete only with proof.
- [ ] Deduplicate **`send-email.cjs`** vs **`feedback.cjs`** if redundant.
- [ ] **Caching strategy** doc + implementation for TMDB/metadata hot paths.
- [ ] iOS folder: leave dormant until Apple billing/login revival.
- [ ] Update `docs/ENV.md` / README if they contradict `apps/web/.env` policy.

---

## Decisions already directionally set

| Topic | Decision |
|-------|----------|
| Terminology | Trial / Read-Only / Full Access (not Pro / Premium / Subscription in user copy) |
| Expired trial message | Library still yours; export/restore; one-time Full Access; no subscriptions/ads/data selling |
| Auth | Google only (Android-first) |
| Billing | Google Play **one-time** Full Access INAPP (`flicklet_full_access`); stub server validate until Play API; Apple later |
| Username | Optional forever |
| Legal names | Never in UI |
| Admin | Remove unless proven necessary |
| Coming Soon (monetization) | Removed from settings/marketing copy |
| Feedback | Netlify function + SendGrid (`/api/feedback`) |
| For You rows (current) | Local `flicklet:forYouRows:v2:{uid}`; guest separate; legacy key migrated; not cross-device yet |
| Capacitor API | Production Netlify origin fallback via `apiConfig` when env unset |
| Personality | WTForecast-style **curated rotating pools** — core differentiator, in scope |
| Mobile nav | Unified Library direction — core UX, in scope |

---

## Out of scope for this sprint (unless blocking)

- iOS App Store revival
- Apple IAP / Sign in with Apple
- **Uncurated / runtime-AI personality generation** or broad copy churn unrelated to the approved WTForecast-style rotating personality system
- Deleting `functions/` without audit
- Large Firebase/settings architecture migration for For You rows (unless blocking cross-device expectation)

---

## References

- Architecture: [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md)
- Known bugs/debt: [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
- Local dev: repo root → `npx netlify dev`; frontend env → `apps/web/.env`; mobile build → `npm run mobile:build` (`--mode mobile` optional; runtime Capacitor fallback in `apiConfig`)
