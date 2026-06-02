# Current Task — Flicklet TV Tracker

Last updated: 2026-06-02

---

## Standing instruction (read first)

**AI assistants working on this repo must act as mentors, reviewers, coaches, and goalkeepers.** Do not blindly implement the user’s requested solution if there is a safer, simpler, more standard, or more scalable approach. Push back with evidence. Prefer globally accepted app-development best practices over one-off hacks. Explain risks in plain language. Keep the app focused, stable, low-support, and ready for Play Store testing.

---

## Current branch

`simplify/try-before-buy-v1` — matches Netlify production deploy branch.

---

## Sprint goal

**Play Store testing readiness within one week.**

Success looks like: Android build installs cleanly, Google login works, Trial → Read-Only → Full Access flows are understandable, feedback reaches the owner inbox, TMDB/posters fail gracefully, and no show-stoppers from deprecated Pro/Apple/Coming Soon/admin paths.

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

### Critical (block Play Store test or data loss)

- [ ] Validate **Google Play Billing** + **Full Access** unlock end-to-end (trial expiry, read-only, purchase restore).
- [ ] Confirm **Google login** on Android release build (no Apple login dependency).
- [ ] Verify **feedback** reaches Travis inbox in production (`/api/feedback` → SendGrid; env vars set in Netlify).
- [ ] Smoke-test **Trial / Read-Only / Full Access** copy and gating (no new “Pro” strings in user-facing UI).
- [ ] Android release build: `apps/web` build → Capacitor sync → signed APK/AAB for internal testing track.

### High (likely tester-visible bugs)

- [ ] Fix **Flicklet banner disappears** after returning home.
- [ ] **TMDB/poster fragility** — caching or fallback so empty/broken posters don’t break cards.
- [ ] Audit **username / full-name display** — legal names must not appear in UI.
- [ ] Remove **Apple login** from Android-first surfaces.
- [ ] **Settings cleanup** — remove dead toggles, align with Trial/Read-Only/Full Access.
- [ ] Confirm **SendGrid** prod keys (`SENDGRID_API_KEY`, `FEEDBACK_EMAIL`, `FROM_EMAIL`) in Netlify dashboard.

### Medium (quality + support burden)

- [ ] **For You / Discovery logic audit** — ratings, Not Interested, genres/subgenres, watch history, list membership.
- [ ] **Scroll-to-top arrow** — still not working after 2026-06-02 attempt; debug scroll container + threshold.
- [ ] **Scroll-to-bottom arrow** — only flashes at bottom; should appear while above bottom to jump down.
- [ ] **Discovery cards** — expose Not Interested action or overflow option (blocks manual Not Interested / cache QA).
- [ ] **For You / horizontal rails** — rows not scrollable; posters cut off at row ends (mobile + desktop overflow review).
- [ ] **Not Interested** — add restore/return action.
- [ ] **Reminders** — redesign (current UX insufficient).
- [ ] **Goofs** → **Shows Like This** (rename UX); keep **Extras** as separate surface.
- [ ] Remove **Coming Soon** feature/surfaces.
- [ ] **Spanish localization** — complete or gate incomplete strings.
- [ ] Scrub **Pro terminology** remnants in UI, settings, and docs.
- [ ] **Admin** — prove necessity or remove routes/UI (`AdminExtrasPage`, admin functions).

### Lower (cleanup + tech debt)

- [ ] Finish **repo cleanup**; keep `_repo_cleanup_archive/` as quarantine only.
- [ ] Audit **`functions/`** tree vs `netlify/functions` — document owners, then delete only with proof.
- [ ] Deduplicate **`send-email.cjs`** vs **`feedback.cjs`** if redundant.
- [ ] **Caching strategy** doc + implementation for TMDB/metadata hot paths.
- [ ] iOS folder: leave dormant until Apple billing/login revival.
- [ ] Update `docs/ENV.md` / README if they still contradict `apps/web/.env` as local frontend truth.

---

## Decisions already directionally set

| Topic | Decision |
|-------|----------|
| Terminology | Full Access / Trial / Read-Only (not Pro) |
| Auth | Google only (Android-first) |
| Billing | Google Play now; Apple later |
| Username | Optional forever |
| Legal names | Never in UI |
| Admin | Remove unless proven necessary |
| Coming Soon | Remove |
| Feedback | Netlify function + SendGrid (not Netlify Forms) |

---

## Out of scope for this sprint (unless blocking)

- iOS App Store revival
- Apple IAP / Sign in with Apple
- Large personality/copy rewrites unrelated to gating or Play Store review
- Deleting `functions/` without audit

---

## References

- Architecture: [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md)
- Known bugs/debt: [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
- Local dev: repo root → `npx netlify dev`; env → `apps/web/.env`
