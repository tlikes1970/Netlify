# Flicklet Release Status

**Authoritative release-control document.**  
Last updated: 2026-09-25

Technical detail continues to live in [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md), [CURRENT_TASK.md](./CURRENT_TASK.md), and [KNOWN_ISSUES.md](./KNOWN_ISSUES.md). Those files must not contradict this document.

---

## Change-control rule (read first)

**Finding a defect does not automatically authorize fixing it.**

Required workflow:

`Find → Document → Classify → Prioritize against release criteria → Authorize → Fix → Verify → Record evidence`

- New feature ideas go to **Deferred / backlog** unless they are necessary to satisfy release acceptance.
- Do not expand scope during defect correction.
- Do not add features merely because they are possible.

---

## 1. Release objective

Flicklet is being finished as a **stable Android consumer application** intended for a **one-time purchase** (Full Access INAPP `flicklet_full_access`).

The objective is a **defensible Google Play submission**, not an indefinitely expanding SaaS product.

Prioritize:

- reliability
- usability
- visual polish
- understandable architecture where it affects reliability/UX
- low ongoing maintenance
- low recurring operational cost
- release/security correctness

---

## 2. Locked release sequence

Authorized order. Do not skip ahead.

| # | Phase | Status |
|---|--------|--------|
| 1 | Known Android defects | **In progress** — Fixes 1–4 complete; Fix 5 authorized next |
| 2 | Device stress testing | Not started |
| 3 | AI black-box usability testing | Not started |
| 4 | Visual/design acceptance | Not started |
| 5 | Maestro automated user journeys | Not started — do not install/configure until this phase |
| 6 | Accessibility/usability testing | Not started |
| 7 | Human usability testing | Not started |
| 8 | Release/security/commercial validation | Not started |
| 9 | Final release acceptance | Not started |
| 10 | Google Play submission and GTM | Not started |

**BrowserStack is excluded** pending a separate cost/use evaluation. Do not add it to required testing.

---

## 3. Defect register

### FIXED

#### Fix 1 — Android physical-pixel / CSS-pixel inset conversion

- **Problem:** Native WindowInsets were physical pixels interpreted as CSS pixels (wrong stage measurements).
- **Commit:** `48a36d805e27c0d17860b2b93d0020aa2b72a56b` — `Fix Android inset CSS unit conversion`
- **Evidence:** Density conversion once at the native-to-web boundary. Pixel 9 density `2.625`: physical top `142` → CSS `54.095238`.

#### Fix 2 — WebView startup safe-area synchronization race

- **Problem:** Insets could be injected into a transient WebView document during startup.
- **Commit:** `5fdefe0553cf32a3804e6ff8502a026c0f958e50` — `Synchronize Android insets after WebView load`
- **Evidence:** Capacitor `onPageLoaded` plus the existing native bridge re-sync the active document.

#### Fix 3 — Settings status-bar / top safe-area overlap

- **Problem:** Mobile Settings header did not consume `--safe-top`.
- **Commit:** `4a6ab90c7d52756e0d373ab0d2a801cbdce5a6e2` — `Respect Android safe area in Settings`
- **Evidence:** Settings header uses the shared `--safe-top` contract once.

#### Fix 4 — Missing horizontal safe-area / landscape cutout and side-navigation collisions

- **Problem:** Contract transported only top/bottom. Gesture landscape cutout and three-button landscape right nav overlapped interactive chrome (Filters, Account, Clear Search, Full Access, Theme FAB).
- **Commit:** `c89d3c1019bef485302b78e15119ae90c648687f` — `Add Android left and right safe-area insets`
- **Evidence (Pixel 9 / API 35):**
  - Gesture landscape: `--safe-left=54.095px`; Filters `x=70.86` (clears cutout `0–54.1`).
  - Three-button landscape: `--safe-right=48px`; Theme FAB right `860.19` (protected from `x=876`); Account right `852.18`; Full Access right `526.51`.
  - Portrait gesture after rotation returned to `left=0, top=54.095, right=0, bottom=24` with no accumulated side values.
  - Tests 222 passing; typecheck; production + mobile production builds; Android debug APK install/launch.

### CONFIRMED NEXT

#### Fix 5 — Settings does not reactively change layout shell on rotation

- **Problem:** Settings chooses mobile full-screen sheet vs desktop/modal shell from viewport width at render/open time, and does not subscribe to breakpoint changes.
- **Expected:** Opening Settings in portrait then rotating landscape (or the reverse) must adopt the current layout **without** close/reopen.
- **Status:** Confirmed by Gate 1B / Fix 4 notes. Authorized after this document is committed. **Not started at document creation.**

### INVESTIGATE / DO NOT AUTOMATICALLY FIX

#### 768px JavaScript vs CSS/Tailwind disagreement

- JavaScript `isMobileNow()` uses `max-width: 768px`.
- Tailwind `md` is `min-width: 768px`, so **exactly 768px** is mobile in JS and desktop in Tailwind.
- Settings shell selection in `App.tsx` / `settingsNavigation.ts` uses **744px**, a third number.
- **Not authorized** unless a user-visible defect is demonstrated. Document findings; do not “unify for elegance.”

### TESTING REQUIRED (not complete)

Track evidence before marking pass:

| Area | Status |
|------|--------|
| Android soft keyboard / viewport | Required — not verified this checkpoint |
| API 23 small-screen | Required — not verified |
| API 36 | Required — not verified |
| Font scaling | Required — not verified |
| Display scaling | Required — not verified |
| Tablet / large-screen | Required — not verified |
| Gesture navigation | Partial — Pixel 9 API 35 Fixes 1–4 |
| Three-button navigation | Partial — Pixel 9 API 35 Fixes 1–4 |
| Portrait / landscape | Partial — Pixel 9 API 35 Fixes 1–4 |
| Cold launch | Partial — debug APK launch on emulator |
| Warm resume | Required — not systematically verified |
| Themes (light/dark) | Required — not verified this checkpoint |
| Major modal/overlay behavior | Partial — Settings/search overlays during inset work only |

### RELEASE BLOCKERS TO VALIDATE

Do **not** mark complete without evidence.

| Blocker | Status |
|---------|--------|
| Play Billing purchase (INAPP `flicklet_full_access`) | Not verified end-to-end |
| Entitlement persistence | Implementation present; production/device proof open |
| Purchase restoration | Not verified |
| Server-side/secure purchase validation | Not verified |
| Production Firebase / trial configuration | Repo implementation present; deployment not verified from this checkout |
| Release signing | No verified signed release / keystore in this checkout |
| Production AAB | Not built/verified |
| Credential/secrets cleanup | Historical credentials in repo history must be treated as exposed and rotated |
| Current Google Play / API requirements | Not validated |

See also: `tests/manual/PLAY_BILLING_ONE_TIME.md`, [CURRENT_TASK.md](./CURRENT_TASK.md), [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

---

## 4. Device / configuration matrix

| Configuration | Status | Evidence |
|---------------|--------|----------|
| Android 6 / API 23 small phone | Not tested | |
| Android 13 / API 33 representative phone | Not tested this checkpoint | Historical 2026-06 physical-device notes exist for install/auth/TMDB; re-verify on this baseline |
| Android 15 / API 35 Pixel 9 | Active test device | Fixes 1–4 on emulator `emulator-5554` |
| Android 16 / API 36 | Not tested | |
| Gesture navigation | Partial pass (API 35) | Fix 4 landscape/portrait |
| Three-button navigation | Partial pass (API 35) | Fix 4 landscape/portrait |
| Portrait | Partial pass (API 35) | Fixes 1–4 |
| Landscape | Partial pass (API 35) | Fix 4 |
| Font scaling | Not tested | |
| Display scaling | Not tested | |
| Keyboard | Not tested this checkpoint | Out of Fix 4 scope |
| Tablet / large-screen | Not tested | |

---

## 5. UX acceptance missions (locked)

Black-box missions. On the first run, **do not** use source-code knowledge to complete the task.

1. Find a specific show and begin tracking it.
2. Determine what to watch next.
3. Mark an episode watched / update progress.
4. Discover something new to watch.
5. Save something for later.
6. Find previously saved content.
7. Rate something watched.
8. Change a user preference.
9. Determine what Full Access means.
10. Remove or undo something added accidentally.

For each future capture record:

- success/failure
- completion time
- actions/taps
- wrong turns
- hesitation/confusion
- terminology problems
- discoverability
- system feedback
- confidence the task completed
- visual/usability problems

Results: **not yet run.**

---

## 6. Visual / design acceptance

Evaluate major screens **as a system**, not one isolated screenshot.

Track: visual hierarchy, typography, spacing rhythm, alignment, visual density, card proportions, icon consistency, button/control hierarchy, color/contrast, light/dark themes, screen-to-screen consistency, responsive composition, modal/overlay consistency, perceived polish, unnecessary clutter, discoverability of primary actions.

Architecture may be investigated when it produces UX/design inconsistency. **Do not authorize architectural rewrites merely for code elegance.**

Status: **not started.**

---

## 7. Maestro user journeys

Maestro is authorized for repeatable external Android UI testing.

**Do not install or configure until phase 5** unless explicitly necessary earlier.

Planned critical journeys (not implemented):

- launch → search → add → Library
- update episode progress
- discovery → save for later
- Settings → change preference/theme → return
- remove/undo tracked item
- purchase/entitlement journey where technically appropriate

---

## 8. Accessibility acceptance

Track: touch-target sizing, labels, contrast, font scaling, TalkBack/navigation order, reachable controls, focus behavior, modal accessibility, orientation/responsive accessibility.

Status: **not started.**

---

## 9. Human usability acceptance

Plan approximately **5–8 people** unfamiliar with Flicklet.

Use the same core missions with minimal instruction. Capture **observed behavior**, not primarily “do you like it?”

Status: **not started.**

---

## 10. Deferred / backlog (not authorized now)

These remain product/tech items from existing control docs. They are **not** the current authorized task:

- Unified Library device QA
- WTForecast-style personality system
- Confirmation / action-feedback layer
- TMDB/poster fragility and caching strategy
- For You cross-device sync and scoring audit
- Scroll-to-top / scroll-to-bottom arrow behavior
- Codetrix → Capgo Google auth migration (after Play/internal sign-in pass)
- Incomplete Spanish localization
- BrowserStack (excluded until cost/use evaluation)

---

## 11. Current checkpoint

| Field | Value |
|-------|--------|
| Branch | `codex/establish-baseline` |
| Verified HEAD | `c89d3c1019bef485302b78e15119ae90c648687f` |
| HEAD message | Add Android left and right safe-area insets |
| Current phase | 1 — Known Android defects |
| Current authorized task | After this document is committed: **Fix 5** (Settings shell on rotation) |
| Emulator starting condition | Pixel 9, Android 15 / API 35, gesture navigation, portrait, auto-rotate unlocked, `navigation_mode=2`, `wm user-rotation=free` |
| Latest test evidence | Fix 4 four-sided insets verified on Pixel 9 emulator; 222 automated tests; typecheck; production + mobile builds; debug APK |

---

## 12. Living-document rules

Update this file:

- after every confirmed defect
- after every fix
- after each testing gate
- when a release blocker changes
- when something is deliberately deferred
- when the verified Git checkpoint changes

Completed items **remain** with evidence. Do not delete history to shorten the document.

This file is the **source of truth for release status**.
