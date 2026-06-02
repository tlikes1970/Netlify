# Known Issues — Flicklet TV Tracker

Last updated: 2026-06-02 (For You rail scroll issue added)

Tracked problems, uncertainties, and tech debt. **Do not modify app code from this file alone** — use it to prioritize fixes. See [CURRENT_TASK.md](./CURRENT_TASK.md) for sprint actions.

---

## Runtime / data

### TMDB and poster fragility

- Posters and metadata sometimes fail or load inconsistently (proxy errors, missing paths, cache misses).
- **Impact:** Broken or blank cards, Discovery/For You feels unreliable.
- **Direction:** Stronger caching and fallbacks via `tmdb-proxy`; reduce client assumptions about always-fresh TMDB.

### Caching strategy needed

- No single documented caching policy for TMDB, show metadata, and images.
- **Risk:** Rate limits, cold-start slowness, and fragile retries under Play Store test traffic.

### For You / Discovery logic unclear

- Uncertain whether scoring correctly uses: ratings, Not Interested, genres/subgenres, watch history, list membership.
- **Needs:** Audit of `discoveryScoring`, For You rails, and related hooks — document expected behavior then fix gaps.

---

## Configuration / repo

### Env source confusion (mostly resolved — must stay documented)

- **Resolved policy:** Local frontend → `apps/web/.env`; production → Netlify dashboard only.
- **Residual risk:** Root `.env` vs `apps/web/.env` vs README/`docs/ENV.md` may still disagree; developers set wrong vars locally.
- **Mitigation:** [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md) is source of truth; align README when touched.

### Repo cleanup in progress

- Large doc/script trees moved to `_repo_cleanup_archive/` (quarantine).
- **Risk:** Accidentally restoring or referencing archived forensic docs as current truth.
- **Do not delete** archive until cleanup is signed off.

### Separate `functions/` tree

- `functions/` (Firebase / admin / goofs ingestion) exists alongside `netlify/functions` (production Netlify).
- **Status:** **Needs audit before deletion** — may still power admin or batch jobs.
- **Risk:** Deleting wrong tree breaks admin or ingestion.

---

## Product / terminology

### Pro terminology remnants

- “Pro” is deprecated; use **Trial**, **Read-Only**, **Full Access**.
- Remnants may exist in UI strings, settings keys, scripts (`set-pro-status`), and archived docs.
- **Risk:** Confusing testers and violating new product model.

### Billing / Full Access implementation needs validation

- Google Play Billing path exists under `netlify/functions/billing/*`.
- **Uncertain:** Trial countdown, read-only enforcement, purchase restore, and edge cases on Android WebView/Capacitor.
- Apple billing intentionally deferred.

---

## Auth / identity

### Android Google login flow history

- Past mobile auth loops and token gate issues (see archived `MOBILE_AUTH_LOOP_*` reports).
- **Watch:** Release builds vs `localhost:8888` behavior; native Google auth bridge (`googleAuthNative.ts`).

### Apple login should be removed (Android-first)

- iOS/deferred Apple Sign-In may still surface in code or settings.
- **Target:** Google only for Play Store testing.

### Username / full-name display risk

- Username is optional forever.
- **Requirement:** Full legal names must **not** appear anywhere in the UI (profile, cards, settings, share).
- **Needs:** Audit display name sources (Google profile, Firestore user doc).

---

## UX bugs / features

### Scroll-to-top arrow — not working (2026-06-02 attempt failed)

- **Symptom:** Scroll-to-top control does not behave correctly in manual testing despite viewport-based threshold + opacity fade change in `ScrollToTopArrow.tsx`.
- **Attempted (2026-06-02):** ~1× / ~1.25× viewport `clientHeight` threshold, fade transition; placement unchanged above theme FAB.
- **Needs:** Debug scroll container detection (`body` vs `documentElement` on mobile), threshold tuning, and verify `scroll` listeners fire on the actual scrolling element.
- **Likely touchpoints:** `apps/web/src/components/ScrollToTopArrow.tsx`, `App.tsx`, mobile body-scroll CSS.
- **Status:** **Open — fix did not land.**

### Scroll-to-bottom arrow — useless timing

- **Symptom:** Down arrow briefly appears when the user **already reached the bottom** — intended to jump to list end without scrolling, but it only shows once you're there.
- **Expected:** Show scroll-to-bottom while user is **above** the bottom (with scroll-to-top stacked above theme FAB), hide at bottom.
- **Likely touchpoints:** `ScrollToTopArrow.tsx` — `showDownArrow` / `isAtBottom` logic (`shouldShowDown = !isAtBottom && !isAtTop` may be inverted or threshold too strict).
- **Status:** Logged; **not fixed yet.**

### Discovery cards lack Not Interested action (blocks manual QA)

- **Symptom:** Discovery tab cards do not expose **Not Interested** (no button, no overflow menu entry).
- **Impact:** Cannot manually validate Discovery cache invalidation when marking titles Not Interested (P0.3); automated tests pass but in-app path is untested.
- **Note:** `DiscoveryPage.tsx` defines `actions.onNotInterested`, but `CardV2` with `context="tab-foryou"` may not surface the control — verify overflow/compact action map for Discovery vs For You rails.
- **Needs:** Add Not Interested to Discovery card UI (primary, overflow, or long-press) wired to existing handler.
- **Likely touchpoints:** `apps/web/src/pages/DiscoveryPage.tsx`, `apps/web/src/components/cards/CardV2.tsx`, `apps/web/src/features/compact/CompactOverflowMenu.tsx`, `apps/web/src/features/compact/actionsMap.ts`.
- **Status:** Logged; **not fixed yet**.

### For You / horizontal rails not scrollable; posters clipped at row ends

- **Symptom:** Individual For You (and possibly other horizontal) rails cannot be scrolled; poster cards are cut off at the left/right edges of each row.
- **Surfaces:** Home For You section (`App.tsx` → `Rail.tsx`), mobile and desktop.
- **Needs:** Mobile/desktop rail overflow review — horizontal scroll container, padding/snap, `overflow-x`, card width vs viewport, and any parent `overflow: hidden` clipping.
- **Likely touchpoints:** `apps/web/src/components/Rail.tsx`, home section layout CSS, compact/mobile card styles.
- **Status:** Logged; **not fixed yet**.

### Flicklet banner disappears after returning home

- Repro: navigate away from home and return — banner no longer shows.
- **Needs:** Repro steps + fix in home/marquee boot path.

### Reminders need redesign

- Current reminder UX is insufficient for low-support burden.
- **Status:** Design + implementation TBD.

### Not Interested needs restore/return action

- Users can mark Not Interested but lack a clear way to undo or review dismissed titles.

### Goofs → Shows Like This; Extras stays

- “Goofs” should become **Shows Like This** in product language.
- **Extras** remains a separate concept (`AdminExtrasPage`, extras providers).

### Coming Soon should be removed

- Feature/surfaces still present or referenced; conflicts with focused utility direction.

### Spanish localization incomplete

- i18n gaps leave mixed English/Spanish in settings and core flows.
- **Risk:** Play Store listing locale vs in-app strings mismatch.

### Settings cleanup needed

- Dead toggles, legacy Pro flags, and pre-try-before-buy options likely remain.
- Align with Trial / Read-Only / Full Access only.

---

## Admin / infrastructure

### Admin likely removable

- Admin UI (`useAdminRole`, `AdminExtrasPage`) and `functions/` admin scripts may be unnecessary for consumer Play Store build.
- **Prove necessity** (e.g. content moderation) or remove from Android release.

---

## Feedback / email

### Feedback email path — **confirmed with caveat**

| Path | Status |
|------|--------|
| **Netlify Forms** | Not primary — SPA `/*` catch-all can swallow POST `/` |
| **SendGrid** | **Yes** — `netlify/functions/feedback.cjs` |
| **Client** | `FeedbackPanel.tsx` → `POST /api/feedback` |

**Production requirements:** `SENDGRID_API_KEY`, `FEEDBACK_EMAIL` (Travis inbox), `FROM_EMAIL` or `SENDGRID_FROM` in Netlify dashboard.

**Caveat:** `send-email.cjs` may duplicate `feedback.cjs` — audit and deprecate one.

**Verify:** Send test submission on production deploy after env check.

---

## Platform

### iOS dormant

- `ios/` and Apple billing/login not in near-term scope.

### Play Store readiness unknowns

- Data safety form, billing disclosure copy, and internal testing track setup may lag code.
- Track in [CURRENT_TASK.md](./CURRENT_TASK.md) critical list.

---

## How to use this file

1. Pick an item in [CURRENT_TASK.md](./CURRENT_TASK.md) by priority.
2. Reproduce on `npx netlify dev` or Android build as appropriate.
3. Fix with minimal diff; update this file when resolved (date + one-line resolution note).
