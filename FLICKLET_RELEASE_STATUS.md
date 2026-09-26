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
| 1 | Known Android defects | Complete through Fix 5 (`04fbc38`) |
| 2 | Device stress testing | **COMPLETE** — real API 23/33/35/36 phone and API 33/36 tablet matrix exercised; DST-07 and DST-08 resolved in the platform-correction gate |
| 3 | AI black-box usability testing | **COMPLETE** — all ten missions attempted on Pixel 9 / API 35; findings UX-01 through UX-10 documented below |
| 4 | Visual/design acceptance | **DIAGNOSTIC REVIEW COMPLETE** — findings VIS-01 through VIS-16 recorded; final acceptance remains open |
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

#### Fix 5 — Settings layout shell does not follow rotation

- **Problem:** SettingsPage/SettingsSheet snapshotted `isMobileNow()` once. `App` chose sheet vs page only at open. Rotating across the mobile/desktop breakpoint left a frozen shell (full-screen portrait chrome in landscape, or desktop split leftover in portrait).
- **Expected:** Open in portrait then rotate landscape, or the reverse, adopts the current layout without close/reopen.
- **Commit:** recorded in §11 after this checkpoint is committed (`Make Settings follow viewport breakpoint on rotation`).
- **Correction:**
  - `useIsMobileScreen()` inside SettingsPage and SettingsSheet.
  - Shared `useShouldUseMobileSettings()` plus an App effect that swaps sheet ↔ page when that result changes while Settings is open.
  - Desktop Settings chrome used `hidden lg:flex` (1024px) even after JS treated the view as desktop (`isMobile` false above 768px). On Pixel 9 landscape (~924px) that hid Close and the section list. Removed the extra `lg` gate so the already-selected desktop shell is visible.
  - SettingsPage overlay/header now consume `--safe-*` so Fix 3/4 insets still apply on the production Settings path (`settings_mobile_sheet_v1` remains off by default).
- **Evidence (Pixel 9 / API 35, `emulator-5554`, gesture `navigation_mode=2` and three-button `navigation_mode=0`):**
  - Pre-fix: portrait Settings full-screen; rotate landscape → leftover column / empty region (stale `100vh`/`100vw` snapshot).
  - Post-fix portrait: mobile header + section control; close `y≈72.9` clears `--safe-top=54.1`.
  - Post-fix landscape: desktop header + sidebar; card `x=54.1` matches `--safe-left`; three-button close `right=851.4` stays left of `--safe-right=48` (protected from `x=876`).
  - Portrait ↔ landscape both directions; close/reopen; scroll `scrollTop=400`; three rotation cycles; no extra side inset accumulation (`left/right` return to `0` in portrait).
  - Tests 225 passing; typecheck; production + mobile production builds; Android debug APK install/launch.
- **Not changed:** exact-768px JS vs Tailwind `md` disagreement (see below). Settings sheet vs page still uses 744px **and** the sheet flag, which defaults off, so the live Android path is SettingsPage reacting to 768px via `useIsMobileScreen`.

#### DST-05 — Settings body under three-button navigation in portrait

- **Original reproduction:** Pixel 9 / API 35 / three-button / portrait Settings. Personality copy and last controls sat under the system nav pills (`--safe-bottom=48px`). Gesture portrait cleared the handle more cleanly. Evidence: `p4-settings-p.png`, `dst05-before.png`.
- **Root cause:** SettingsPage is a `100vh` overlay. The header consumed `--safe-top`. The scroll body used `p-4` only and never consumed `--safe-bottom`, so the last rows painted into the three-button reserved strip.
- **Correction:** Mobile `.settings-page-body` padding-bottom `calc(16px + var(--safe-bottom, 0px))` (inline + Capacitor CSS). Sheet body already had the same contract; production path (sheet flag off) now matches. Desktop overlay still uses `max(1rem, var(--safe-bottom))` on the card padding.
- **Verification (Pixel 9 / API 35, `emulator-5554`):**
  - Three-button portrait: `--safe-bottom=48`; body `padding-bottom=64px`; scrolled last content `bottom≈859` vs viewport `924` (clears nav starting ~876). Reset Settings fully visible above pills. `dst05-3b-p.png`, `dst05-3b-p2.png`, `dst05-3b-p3.png`.
  - Three-button landscape: desktop shell; `--safe-right=48`, `--safe-left=54.1`; `padBottom=16px` (`safe-bottom=0`). `dst05-3b-l.png`.
  - Gesture portrait: `--safe-bottom=24`; `padding-bottom=40px`; last content `bottom≈883` vs viewport `924`. Visually unchanged vs prior gesture inset. `dst05-g-p-ok.png`.
  - Gesture landscape: desktop shell; `--safe-left=54.1`. `dst05-g-l-ok.png`.
  - Portrait ↔ landscape both directions with Settings remaining open (Fix 5 preserved).
  - Tests: `capacitorSafeArea` 6/6; `settingsApprovalPaths` 4/4.
- **Commit:** `ad20f49d85bdd523b7367aa403165de1cf6d4233` — `Keep Settings content above Android bottom inset`
- **Final status:** FIXED.

#### DST-03 — Font scale 1.3–2.0 clips primary chrome

- **Original reproduction:** Pixel 9 / API 35. 1.15 usable; 1.3 search placeholder clips; 1.5–2.0 logo, Search, Manage, and card actions clip/truncate. Settings body and nav labels stayed readable. Evidence: `font-1.3-home.png` through `font-2.0-settings.png`.
- **Root cause:** Chrome used fixed pixel heights (`h-9`, `min-h-[44px]`, `--flicklet-sticky-search-row-height: 44px`, `--mobile-nav-base-height: 56px`), a 1/3 header grid that squeezed the wordmark, nowrap/truncate on titles and actions, and a search row that could not wrap when Filters/Search grew with font scale.
- **Correction:** Content-responsive min-heights (rem), wrapping action labels, two-line card titles, header `auto` center column so the wordmark stays one word, search row wrap with `min-w-[12rem]` field, Library segment labels wrap, nav min-height in rem. Did **not** disable Android font scaling.
- **Verification:**
  - 1.0: wordmark/search/Manage unchanged and unclipped (`fontv2-1.0-home.png`).
  - 1.3: full “Flicklet”; Manage wraps inside the button; search still operable.
  - 2.0: full “Flicklet”; Search control wraps onto a second row; placeholder may ellipsize but starts with “Search movies”; Manage text complete; nav Home/Library/Discovery readable (`fontv2-2.0-home.png`). Settings at 2.0 still readable.
  - Remaining overlap of FABs on card actions is DST-02 (not this commit).
  - Tests: SearchRow mobile 6/6; capacitorSafeArea 6/6; mobile production build.
- **Commit:** `c93db0cb460bd54f64aa7ffad791807951055065` — `Let primary chrome grow and wrap with font scale`
- **Final status:** FIXED.

#### DST-06 — Exact 768px JS vs Tailwind disagreement in Settings

- **Original reproduction:** Forcing `innerWidth=768` made `max-width: 768px` and `min-width: 768px` both true. Settings showed mobile header (`Select section`) plus desktop two-column stats. Evidence: `w768.json`, `w768-settings.png`.
- **Root cause:** `isMobileQuery` was `(max-width: 768px)` while Tailwind `md` is `(min-width: 768px)`, so exactly 768px was mobile in JS and desktop in CSS. SettingsPage shell follows JS; stats/grid `md`/`sm` follow CSS.
- **Correction:** Canonical JS query is now `(max-width: 767px)`, so 768px is desktop in both. Did not rewrite other CSS `max-width: 768px` card files or the 744px sheet-flag path.
- **Verification (Pixel 9 WebView CDP metrics):**
  - 767: desktop Settings shell (sidebar + “Settings” heading), not mixed mobile header. `dst06-w767.png`.
  - 768: `mdMin768=true`, `mobileHeader=false`, desktop heading. `dst06-w768.png`.
  - 769: same coherent desktop shell.
  - Pixel 9 native 412 remains below 767 (JS mobile). Landscape ~924 remains JS desktop (Fix 5 live switch).
- **Commit:** `d3cb221` — `Align JS mobile breakpoint with Tailwind md`
- **Final status:** FIXED.

#### DST-04 — Filters overlay survives rotation / Android Back exits app

- **Original reproduction:** Pixel 9 / API 35 / gesture / portrait. Open the Filters menu and rotate to landscape: the portrait-anchored menu remained over the newly selected desktop shell. Open Filters and press Android Back: Flicklet exited to the launcher instead of dismissing the menu.
- **Root cause:** SearchRow sampled the mobile breakpoint only during render and kept the portaled overlay state/anchor alive across orientation changes. It had no Android hardware-Back contract. The inherited WIP attempted to centralize closing and add history handling, but its `closeFilters` callback called itself recursively and generic `resize` listeners would also have mistaken keyboard viewport changes for rotation.
- **Correction:** SearchRow now follows the reactive mobile query, has one non-recursive dismiss path, closes only on the orientation lifecycle event, and can be reopened after dismissal. Browser/PWA Back uses a temporary same-document history entry. Android MainActivity dispatches a cancelable `flicklet:android-back` event and falls back to normal Back only when web content does not handle it; Filters handles that event while open.
- **Verification (Pixel 9 / API 35):**
  - Gesture portrait → landscape and landscape → portrait: Filters closes, responsive chrome settles, content remains interactive, and Filters reopens.
  - Android Back with Filters open in portrait and landscape: one Back closes Filters and MainActivity remains resumed; Filters reopens afterward.
  - Three-button portrait/landscape: same rotation, Back, and reopen behavior.
  - UI dismissal still closes the menu; body scroll lock is released by state cleanup.
  - SearchRow mobile tests 9/9 (including browser Back, Android Back, rotation, and reopen); typecheck; mobile production build; Capacitor sync; Android debug build/install/launch.
- **Commit:** `443b124eb104518de7e7d25f67a7aebe18e1f3dc` — `Fix Filters rotation and Android Back handling`
- **Final status:** FIXED.

#### DST-02 — Settings cog overlaps Library posters

- **Original reproduction:** Pixel 9 / API 35 / gesture and three-button / portrait Library. The fixed Settings and theme controls floated above the mobile nav and covered poster/list content as it scrolled beneath them.
- **Root cause:** Both utility controls used the mobile content-clearance offset (`--mobile-nav-height + extra`) while remaining fixed above the nav. That placed them in the scrollable content viewport instead of reserving space within stable chrome.
- **Correction:** The Settings control is docked inside a reserved left edge of the mobile nav and follows `--safe-bottom`; the three primary tabs consume the remaining width. Mobile keeps theme selection in Settings and removes the redundant floating theme shortcut. Desktop FAB behavior is unchanged.
- **Verification (Pixel 9 / API 35):**
  - Gesture portrait, Home and Library: Settings remains reachable in the nav; no utility control covers cards, posters, titles, or Library controls.
  - Three-button portrait, Library: the Settings control and tabs remain above the 48px system inset; scrollable content has no fixed control floating over it.
  - Font scale 1.0 and 2.0: Home, Library, and Discovery labels remain complete; the reserved Settings slot does not collide with labels.
  - Theme remains available in Settings; the desktop theme FAB is unchanged.
- **Commit:** `ce2acf91ad6bed36e06ab9f88ede59d1c07bb0c5` — `Dock mobile Settings control in navigation`
- **Final status:** FIXED.

#### DST-01 — Home personality line clips at default size

- **Original reproduction:** Pixel 9 / API 35 / gesture / portrait / font 1.0. Home screenshots repeatedly captured the personality message beginning or ending mid-sentence.
- **Root cause:** HomeMarquee always translated its single-line track from completely off-screen right to completely off-screen left. Mobile therefore displayed only a moving fragment for nearly the entire animation, even when the complete message fit the viewport.
- **Correction:** At the canonical mobile breakpoint, the message is static, centered, and allowed to wrap. Desktop retains the existing scrolling ticker behavior.
- **Verification (Pixel 9 / API 35):**
  - Gesture portrait, font 1.0: full “Flicklet tracks habits, not hype.” is visible at once and remains stable.
  - Gesture portrait, font 2.0: the full message remains readable without clipping or horizontal overflow.
  - Focused HomeMarquee test 1/1; TypeScript check; mobile production build; Capacitor sync; Android debug build/install/launch.
- **Commit:** `99a3b338aeedbfb8619abb16df8f772fbe206baa` — `Keep mobile personality messages fully readable`
- **Final status:** FIXED.

### AUTHORIZED IN THIS CORRECTION BATCH

Order: DST-05 (done) → DST-03 (done) → DST-06 (done) → DST-04 (done) → DST-02 (done) → DST-01 (done).

The authorized correction pause is complete. Device stress testing remains in progress; UX testing and Maestro have not started.

### CONFIRMED NEXT

Resume the remaining device/configuration matrix. Do not begin black-box UX testing yet.

### DEVICE STRESS TESTING — NEW DEFECTS (do not fix this phase)

#### DST-07 — Declared API 23 baseline cannot execute the current web bundle

- **Status:** RESOLVED — supported Android floor raised to API 31; historical failures retained below.
- **Resolution:** `minSdkVersion=31` (Android 12). No legacy transpilation, polyfill, or WebView-management layer was added.
- **Severity before resolution:** **RELEASE BLOCKER for the former `minSdk 23` support claim**.
- **Class:** WebView / JavaScript runtime compatibility.
- **Configuration:** `Flicklet_P1_API23_Default`, Android 6.0 / API 23, AOSP default x86_64 image, 480×800 physical/logical at 240 dpi, three-button navigation, AOSP WebView `44.0.2403.119`.
- **Repro:** Cold boot the clean default API 23 image → install the current debug APK → launch Flicklet.
- **Expected:** Onboarding/Home renders and core navigation is reachable on the declared minimum API.
- **Actual:** Native activity and inset bridge start, but the WebView remains a blank dark surface. Logcat reports `Uncaught SyntaxError: Unexpected token =>` at `https://localhost/` line 45.
- **Comparison:** The same APK renders on API 33 WebView 109, API 35 reference WebView, and API 36 WebView 133. The API 23 Google APIs image is even less usable because it contains no WebView provider (`Chromium WebView package does not exist`).
- **Reproduced:** Yes, across both available API 23 image variants; only the default image had a provider capable of reaching the JavaScript parse failure.
- **Evidence:** `%TEMP%/flicklet-p1-api23-default-launch.png`, `%TEMP%/flicklet-p1-api23-launch.png`; Logcat parse error above. Evidence remains local and is not committed.
- **Interpretation limit:** A real API 23 device with a Play-updated WebView may execute the bundle. The clean base OS image—the defensible minimum-runtime baseline—does not.
- **Boundary evidence:**
  - API 24 stock WebView: parse failure (`Unexpected token (`).
  - API 26 and API 28 Google image, Chrome/WebView 69: bundle parses, then startup fails because `globalThis` is undefined.
  - API 29 / WebView 74 and API 30 / WebView 83: application starts, but the wordmark or primary dark-theme controls render incorrectly, so these are not clean product support floors.
  - API 31 / WebView 91: launch and current dark-theme chrome render correctly without compatibility machinery.
- **Decision rationale:** API 31 is the first tested stock environment that runs and renders the existing modern bundle correctly. Supporting lower versions would require new legacy-browser behavior or accepting known visual/runtime failures, contrary to the low-maintenance one-time-purchase strategy.

#### DST-08 — Maximum font scale clipped primary chrome on narrower phones

- **Status:** RESOLVED — verified through Android `font_scale=2.0` on API 33, API 35, and API 36 phones.
- **Severity:** HIGH at 2.0×; observation/crowding only at 1.5×.
- **Class:** accessibility / font scaling / responsive component layout.
- **Configurations:**
  - Pixel 5 profile, Android 13 / API 33, 1080×2340 at 440 dpi (effective ~393×851), gesture navigation, WebView `109.0.5414.123`.
  - Pixel 7 Pro profile, Android 16 / API 36, 1440×3120 at 560 dpi (effective ~411×891), gesture navigation, WebView `133.0.6943.137`.
- **Repro:** Set Android `font_scale=2.0` → cold launch Home.
- **Expected:** Wordmark/version, Search controls, and Home/Library/Discovery navigation remain complete and non-overlapping, as they do on the wider Pixel 9 verification case.
- **Actual:** `Flicklet` overlaps the version string; Search wraps into an abnormally tall two-row control; the rightmost `Discovery` label reaches/clips the viewport edge. API 33 shows the same header/version collision and right-edge navigation loss. At 1.5× the version is crowded but remains readable; 1.3× passes.
- **Comparison:** Pixel 9/API 35 at 2.0× passed DST-03 verification. API 33 and API 36 at 1.0×/1.3× are usable.
- **Reproduced:** Yes on two Android versions and two actual phone profiles.
- **Evidence:** `%TEMP%/flicklet-p2-api33-font2-retry.png`, `%TEMP%/flicklet-p5-api36-font2.0.png`, with 1.3×/1.5× comparison captures. Evidence remains local and is not committed.
- **Root cause:** Three independent intrinsic-size constraints remained after the earlier rem-height correction: the symmetric mobile header grid could not yield when the wordmark and utility group exceeded the row; the Search input retained a 12-rem minimum while the action group could not grow on a wrapped line; and the three equal navigation columns gave the longest label no more space than shorter labels.
- **Correction:** Mobile header chrome now uses a wrapping flex row (the existing centered grid remains at `md` and above); Search uses a bounded minimum plus weighted flex sizing and a full-width action when it wraps; navigation columns use their labels' intrinsic widths with the remaining space assigned to the final tab. Font scaling remains enabled and no essential controls are hidden.
- **Post-fix verification:**
  - API 33 Pixel 5 profile: 1.0×, 1.3×, 1.5×, and 2.0× launch/Home chrome pass. At 2.0×, Home, Library, Search with keyboard/suggestions, Settings and scrolling, portrait, and landscape remained operable; no header collision or right-edge navigation clipping.
  - API 35 Pixel 9: 1.0×, 1.3×, 1.5×, and 2.0× launch/Home chrome pass; the established reference layout remains intact at 1.0× and adapts without clipped primary controls at 2.0×.
  - API 36 Pixel 7 Pro profile: 1.0×, 1.3×, 1.5×, and 2.0× launch/Home chrome pass; the original 2.0× collision/clipping is no longer present.
- **Post-fix evidence:** `%TEMP%/flicklet-dst08-api33-2.0-final.png`, `%TEMP%/flicklet-dst08-api33-2.0-library.png`, `%TEMP%/flicklet-dst08-api33-2.0-search-keyboard.png`, `%TEMP%/flicklet-dst08-api33-2.0-settings-final.png`, `%TEMP%/flicklet-dst08-api33-2.0-landscape.png`, `%TEMP%/flicklet-dst08-api35-2.0-loaded.png`, and `%TEMP%/flicklet-dst08-api36-2.0-final.png`. Evidence remains local and is not committed.

#### DST-01 — Home personality line clips at default size

- **Status:** FIXED — see §3 FIXED. Original history retained.
- **Severity:** MEDIUM
- **Class:** component-specific / visual density
- **Configuration:** Pixel 9 / API 35 / gesture / portrait / font 1.0
- **Repro:** Cold launch Home.
- **Expected:** Full sentence readable.
- **Actual:** Line starts mid-word (`lore hours than several completed series` / earlier `Browsing has consumed more h`).
- **Comparison:** Settings body copy at default size is readable.
- **Reproduced:** Yes (multiple Home screenshots).
- **Evidence:** `smoke-home-p.png`, `restore2.png` (local TEMP `flicklet-stress`, not committed).

#### DST-02 — Settings cog overlaps Library posters

- **Status:** FIXED — see §3 FIXED. Original history retained.
- **Severity:** MEDIUM
- **Class:** shared layout / FAB
- **Configuration:** Pixel 9 / API 35 / gesture and three-button / portrait
- **Repro:** Open Library → Currently Watching list.
- **Expected:** Cog does not cover titles or artwork.
- **Actual:** Cog sits on The Office poster / list row; theme FAB also crowds the row.
- **Comparison:** Home rails keep FABs in the bottom inset more clearly.
- **Reproduced:** Yes.
- **Evidence:** `p3-library-settled.png`, `p4-library-p.png`.

#### DST-03 — Font scale 1.3–2.0 clips primary chrome

- **Status:** FIXED — see §3 FIXED. Original history retained.
- **Severity:** HIGH at 1.5× and 2.0×; MEDIUM at 1.3×
- **Class:** accessibility/font scaling
- **Configuration:** Pixel 9 / API 35 / `font_scale` 1.15, 1.3, 1.5, 2.0 (cold launch each)
- **Repro:** `settings put system font_scale <n>` → relaunch → Home / Library / Settings.
- **Expected:** Logo, search, nav labels, and card actions remain usable.
- **Actual:**
  - 1.15: minor wrapping; still usable.
  - 1.3: search placeholder clips (`Search movies, shows,`); Manage Currently Watching wraps.
  - 1.5: logo reads `Flickle`; search `Search movies, sh`; Manage buttons clip (`Watchingq`).
  - 2.0: logo `Flick`; search `Search mo`; FABs overlap Manage Currently Watching; card title `Slow Hor...`.
- **Nav labels** Home/Library/Discovery remain readable at 2.0.
- **Settings** at 2.0 remains readable (header + fields).
- **Reproduced:** Yes.
- **Evidence:** `font-1.3-home.png`, `font-1.5-home.png`, `font-2.0-home.png`, `font-2.0-library.png`, `font-2.0-settings.png`.

#### DST-04 — Filters overlay + Back/rotation leaves unusable chrome

- **Status:** FIXED — see §3 FIXED. Original history retained.

- **Severity:** MEDIUM
- **Class:** component-specific / overlay
- **Configuration:** Pixel 9 / API 35 / gesture
- **Repro:** Open Filters menu; rotate to landscape; or Back while overlay open.
- **Expected:** Overlay dismisses or follows the new stage size.
- **Actual:** Filters panel can remain while Home paints a portrait-width column in landscape; extra Back can leave the app (launcher).
- **Comparison:** Settings landscape (no Filters) settles to a full desktop modal.
- **Reproduced:** Yes for overlay+rotate (`p3-kb-landscape.png`). App-exit via double-Back is Android-typical, recorded as observation.

#### DST-05 — Settings body can sit under three-button nav in portrait

- **Status:** FIXED — see §3 FIXED. Original history retained.
- **Severity:** MEDIUM
- **Class:** Android/WebView inset
- **Configuration:** Pixel 9 / API 35 / three-button / portrait Settings
- **Repro:** Enable three-button nav; open Settings; scroll to Personality.
- **Expected:** Last controls clear `--safe-bottom` (48px).
- **Actual:** Personality copy sits under the system nav pills.
- **Comparison:** Gesture portrait Settings clears the gesture handle more cleanly.
- **Reproduced:** Yes (`p4-settings-p.png`).

#### DST-06 — Exact 768px JS vs Tailwind disagreement is user-visible in Settings

- **Status:** FIXED — see §3 FIXED. Original history retained.

- **Severity:** MEDIUM
- **Class:** responsive/breakpoint
- **Configuration:** API 35 viewport simulation `wm size 2016x2424` density 420 → `innerWidth=768`
- **Repro:** Force CSS width 768; open Settings.
- **Expected:** One consistent mobile or desktop Settings shell.
- **Actual:** `matchMedia('(max-width: 768px)')` **and** `min-width: 768px` both true. Settings shows **mobile header** (`Select section` / Account & Profile ▾) **and** **desktop two-column** TV/Movies stats.
- **Not fixed** (unauthorized this phase).
- **Evidence:** `w768.json` (`mq768: true`, `mdMin768: true`); `w768-settings.png`.

### INVESTIGATE / DO NOT AUTOMATICALLY FIX

#### 768px JavaScript vs CSS/Tailwind disagreement

- JavaScript `isMobileNow()` now uses `max-width: 767px` (DST-06).
- Tailwind `md` is `min-width: 768px`, so **exactly 768px** is desktop in both.
- Settings sheet vs page in `settingsNavigation.ts` still uses **744px** when `settings_mobile_sheet_v1` is on (default off).
- **Fix 5 finding:** Pixel 9 portrait 412px and landscape 924px never sit on exactly 768px.
- **Stress-test finding (DST-06):** Forcing `innerWidth=768` on API 35 made both JS mobile and Tailwind `md` true, and Settings mixed mobile header with two-column stats. **Fixed** by moving JS mobile to `max-width: 767px`.
- A related **1024px Tailwind `lg`** gate on Settings desktop chrome **did** become user-visible once Settings started reacting at 768px (landscape phone had no Close / no sidebar). That `lg` gate was removed as part of Fix 5.

### DEVICE STRESS TESTING COMPLETION EVIDENCE

Track evidence before marking pass:

| Area | Status |
|------|--------|
| Android soft keyboard / viewport | PASS on API 33 and API 36 phones — Search input remained visible, live suggestions usable, bottom navigation cleared the IME, and dismissal restored layout. Settings username was exercised visually but not treated as a full data-entry acceptance test. |
| API 23 small-screen | FAIL — real API 23 AVDs exercised. Google APIs image has no WebView provider; default image reaches DST-07 JavaScript parse failure. |
| API 36 | PASS — real large/tall phone and Pixel Tablet AVDs exercised with WebView 133; DST-08 retest passes through 2.0×. |
| Font scaling | PASS through 2.0× on API 33, API 35, and API 36 phone profiles after the DST-08 correction. API 23 remains historical unsupported evidence; tablet 2.0× was exercised in the matrix. |
| Display scaling | PASS at default plus smaller/larger density on API 33; API 36 default and font/display reconfiguration exercised. `wm density` was used because reliable headless Settings UI automation for named display-size presets was unavailable. |
| Tablet / large-screen | PASS — real API 33 7-inch WSVGA tablet (1024×600 / 600×1024) and real API 36 Pixel Tablet (2560×1600 at 320 dpi, effective 1280×800) exercised. |
| Gesture navigation | PASS — API 33, API 35, API 36 phones. |
| Three-button navigation | PASS where applicable — API 23 baseline and Pixel 9/API 35 reference; live Pixel 9 inset change 24px → 48px verified. |
| Portrait / landscape | PASS — phone and both tablet profiles; Settings changes shell and four-sided inset values resynchronize. |
| Cold launch | PASS API 33/35/36; FAIL API 23 per DST-07. |
| Warm resume | PASS API 33/API 36; Settings state remained open on API 36 phone resume. |
| Themes (light/dark) | Representative PASS — dark phone/tablet on API 33/36 and light tablet on API 33. API 23 theme UI unreachable because of DST-07. |
| Major modal/overlay behavior | PASS — onboarding dialog and Settings overlay/sheet on phone/tablet; Filters Back/rotation remains covered by fixed DST-04 evidence. |

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

Installed for this gate with Android command-line tools 22.0 (`commandlinetools-win-15859902_latest.zip`, SHA-256 `90AE805D20434428BFFCB699C290860F19BB5F66A67E6B330067E3DE801FB04A`):

- API 23 `default;x86_64` (AOSP WebView 44) and `google_apis;x86_64` (no provider)
- API 33 `google_apis_playstore;x86_64` (WebView 109)
- existing API 35 `google_apis_playstore;x86_64`
- API 36 `google_apis_playstore;x86_64` (WebView 133)

The API 36 headless AVD initially produced black WebView frames with deprecated `-gpu swiftshader_indirect`; relaunching the same AVD with supported `-gpu swiftshader` rendered normally. This was a test-environment graphics-path issue, not recorded as an application defect.

| Configuration | Status | Evidence |
|---------------|--------|----------|
| P1 Android 6 / API 23 minimum phone / three-button | **FAIL** | `Flicklet_P1_API23_Default`, default x86_64, 480×800 at 240 dpi, WebView 44: blank app with `Unexpected token =>` (DST-07). Google APIs x86_64 variant has no WebView provider. Target 320×568 could not be represented by an installed real hardware profile without artificial resizing. |
| P2 Android 13 / API 33 ~393×851 gesture | **PASS** | `Flicklet_P2_API33_Pixel5`, Play Store x86_64, 1080×2340 at 440 dpi, WebView 109. Home, Library, Search/IME, Settings, Back, rotation, and resume pass; DST-08 retest passes through 2.0× font. |
| P3 Pixel 9 / API 35 ~412×924 gesture | **PASS** | Existing `Pixel_9`, Play Store x86_64, 1080×2424 at 420 dpi. Final reference launch reports CSS insets top 54.095 / bottom 24. |
| P4 Pixel 9 / API 35 three-button | **PASS** | Live mode switch reports CSS bottom inset 48 (physical 126 / density 2.625), with stable app chrome. |
| P5 large/tall Android 16 / API 36 phone | **PASS** | `Flicklet_P5_API36_Large`, Pixel 7 Pro profile, Play Store x86_64, 1440×3120 at 560 dpi (~411×891), WebView 133. Home, Library, Search/IME, Settings, rotation, and resume pass; DST-08 retest passes through 2.0× font. |
| P6 short landscape | **PASS** | Actual API 33 phone landscape (~851×393) plus API 35 reference (~924×412) and API 36 phone rotation. Desktop chrome/Settings settle; Insets re-synchronize. |
| P7 real 7-inch tablet | **PASS** | `Flicklet_P7_API33_SmallTablet`, actual 7-inch WSVGA tablet profile, API 33 Google Play x86_64, 1024×600 at 160 dpi and portrait 600×1024. Home, Library, Settings, rotation, theme/font checks pass. |
| P8 real Pixel Tablet | **PASS** | `Flicklet_P8_API36_PixelTablet`, API 36 Play Store x86_64, 2560×1600 at 320 dpi (1280×800 logical), WebView 133. Onboarding, Home, Library, Settings, portrait/landscape, Back and resume pass. |
| Font scaling | **PASS through maximum tested** | 1.0×, 1.3×, 1.5×, and 2.0× pass on API 33, API 35, and API 36 phone profiles after DST-08. API 23 is outside the supported API 31+ floor. |
| Display scaling | **PASS / METHOD LIMITED** | API 33 default 440, smaller 400, and larger 480 dpi all rendered after clean relaunch. These were controlled density settings, not manually selected Settings-app labels. |
| Keyboard | **PASS** | Normal Gboard Search flow with results on API 33 and API 36; dismissal restores viewport/navigation. |
| Tablet / large-screen | **PASS** | P7 and P8 are real tablet AVD profiles, not resized phones. |

---

## 5. Phase 3 — black-box usability testing

**Status: COMPLETE.** All ten locked missions were attempted before source inspection. Test state was emulator-local, signed out, and reset with `pm clear`; no production data was used. Configuration: Pixel 9 AVD, Android 15 / API 35, 1080×2424 at 420 dpi, three-button navigation for the final recovery checks. Product source was not changed.

### First-launch impression

- Flicklet presents itself as a TV/movie tracker centered on Currently Watching, Want to Watch, Watched, Returning, ratings, custom lists, recommendations, and optional episode-oriented Full Access features.
- Search is the clearest primary action. Home, Library, and Discovery are visible in bottom navigation; Settings is a gear FAB.
- The opening coachmark was clipped substantially off the left edge, making first-run copy partially unreadable. Later coachmarks explained Search and adding a title, but did not guide the user through a real add/progress action.
- Full Access was not explained during onboarding. Its Settings section later communicated a 21-day trial and one-time unlock, but not the price.

### Mission results

| Mission | Result | Time | Meaningful actions | Wrong turns | Main friction | Confidence |
|---------|--------|------|--------------------|-------------|---------------|------------|
| 1. Find `Tulsa King` and begin tracking | PASS | ~0:35 | 3 | 0 | Search and add were direct; toast plus Home/Library state confirmed success | HIGH |
| 2. Determine what to watch next | PARTIAL | ~0:08 | 0–1 | 0 | Up Next named `Tulsa King` but supplied no episode/progress detail | MEDIUM |
| 3. Mark an episode watched / update progress | FAIL | ~4:00 | ~8 | 3 | Card tap did nothing; ellipsis only said “Swipe for actions”; unlabeled grid control did not expose progress; swipes silently changed list state | LOW |
| 4. Discover something new | PARTIAL | ~0:15 | 1 | 0 | Dedicated Discovery was sign-in gated without a visible body CTA; a generic Home rail was usable instead | MEDIUM |
| 5. Save something for later | PASS, high friction | ~2:00 | ~7 | 1 | `My List +` opened custom lists; search lacked a direct Want to Watch action; required add-as-watching then an undocumented swipe | LOW–MEDIUM |
| 6. Find saved content | PASS | ~0:05 | 1 | 0 | Library’s Want tab and count made the saved title immediately findable | HIGH |
| 7. Rate watched content | PASS | ~0:10 | 2 | 0 | Five-star control and `(4/5)` feedback were obvious and immediate | HIGH |
| 8. Change a preference | PASS | ~0:35 | 3 | 0 | Settings section and Personality choices were understandable; selection feedback was immediate | HIGH |
| 9. Understand Full Access | PARTIAL | ~0:40 | ~4 | 0 | Benefits, trial, sign-in requirement, and one-time model were clear; price was absent | MEDIUM |
| 10. Remove/undo an accidental add | FAIL | ~2:00 | ~5 | 2 | No swipe undo; Manage contained Remove from List only beneath app/system navigation, and tapping the visible sliver invoked Android Back and exited Flicklet | HIGH (failure confirmed) |

### Confirmed Phase-3 findings

#### UX-01 — First-launch coachmark is clipped

- **Category / severity:** ACCESSIBILITY-ADJACENT, INFORMATION HIERARCHY / HIGH
- **Missions:** first launch
- **Behavior:** The opening “Welcome to Flicklet” coachmark extends off the left edge, hiding part of the message. The CTA remains reachable.
- **Expected:** All onboarding copy is readable within the viewport.
- **Evidence:** `%TEMP%/flicklet-phase3-first-launch.png` (local, not committed).
- **Repeated:** Observed on the clean first launch; not applicable after dismissal.

#### UX-02 — List-state gestures are undiscoverable and provide inadequate recovery

- **Category / severity:** DISCOVERABILITY, FEEDBACK / SYSTEM STATUS, ERROR RECOVERY / HIGH
- **Missions:** 3, 5, 10
- **Behavior:** The card ellipsis says only “Swipe for actions.” A left swipe silently moved a title from Currently Watching to Want; the opposite swipe advanced it to Seen rather than undoing. There was no direction legend, confirmation, or undo.
- **Expected:** State-changing gestures communicate direction/outcome before use and offer confirmation or immediate undo.
- **Evidence:** `%TEMP%/flicklet-phase3-m3-menu.png`, `m3-swiped.png`, `recovery-swipe.png`.
- **Repeated:** Yes, across progress, save-later, and recovery missions.

#### UX-03 — Save-for-later workflow is indirect and misleading

- **Category / severity:** WORKFLOW COMPLEXITY, DISCOVERABILITY, TERMINOLOGY / HIGH
- **Missions:** 5, 6
- **Behavior:** `My List +` means custom lists, not Want to Watch. An untracked search result offered Currently Watching, Watched, Not Interested, and My List+, but no Want to Watch. The successful path required adding as Currently Watching, navigating to Library, then using the undocumented swipe.
- **Expected:** “Save for later” maps directly to Want to Watch from discovery/search results.
- **Evidence:** `%TEMP%/flicklet-phase3-m5-mylist.png`, `m5-overflow.png`, `m5-saved.png`.
- **Repeated:** The ambiguity appeared in Home, Search, and Library.

#### UX-04 — Signed-out Discovery is a dead end

- **Category / severity:** NAVIGATION, DISCOVERABILITY / MEDIUM
- **Missions:** 4
- **Behavior:** Discovery shows “Sign In to Discover Content” but no visible sign-in CTA in the page body. Generic Home rails remain available as a substitute.
- **Expected:** The destination either provides useful signed-out discovery or a clear next action.
- **Evidence:** `%TEMP%/flicklet-phase3-m4-discovery.png`.
- **Repeated:** No.

#### UX-05 — Episode progress is not discoverable from tracked content

- **Category / severity:** DISCOVERABILITY, FUNCTIONAL DEFECT / HIGH
- **Missions:** 2, 3
- **Behavior:** Neither the Home Up Next card, Library card, card tap, ellipsis hint, nor unlabeled grid control exposed an understandable episode/progress workflow. Full Access later claims Episode Tracking is available, increasing the mismatch.
- **Expected:** A tracked TV title exposes current/next episode and a clear watched/progress action, or clearly identifies a locked prerequisite.
- **Evidence:** `%TEMP%/flicklet-phase3-m3-manage.png`, `m3-menu.png`, `m3-grid-control.png`.
- **Repeated:** Yes, across Home and Library.

#### UX-06 — Android Back behavior is inconsistent across overlays

- **Category / severity:** NAVIGATION, ERROR RECOVERY, CONSISTENCY / MEDIUM
- **Missions:** 8, 9, 10; navigation evaluation
- **Behavior:** Android Back from Settings exited to the launcher instead of closing Settings. Back from the Filters menu correctly dismissed Filters and kept Flicklet foregrounded.
- **Expected:** Back first dismisses the active sheet/menu consistently.
- **Evidence:** `%TEMP%/flicklet-phase3-settings-back.png`, `flicklet-phase3-filters-open.png`, `flicklet-phase3-filters-back.png`; `dumpsys window` confirmed the foreground activity.
- **Repeated:** Settings behavior is a previously documented deferred technical observation; cross-surface inconsistency was reconfirmed here.

#### UX-07 — Full Access omits price at the decision point

- **Category / severity:** INFORMATION HIERARCHY / MEDIUM
- **Missions:** 9
- **Behavior:** The section lists benefits, a 21-day trial, sign-in requirement, and one-time unlock, but no price through the bottom of the page.
- **Expected:** Users can understand the price before starting an unlock/authentication path.
- **Evidence:** `%TEMP%/flicklet-phase3-m9-full-access.png`, `m9-full-access-lower.png`, `m9-full-access-price.png`.
- **Repeated:** No purchase flow was entered.

#### UX-08 — `My List +` and custom-list creation copy are ambiguous

- **Category / severity:** TERMINOLOGY, WORKFLOW COMPLEXITY / MEDIUM
- **Missions:** 5
- **Behavior:** `My List +` was reasonably interpreted as save-for-later, but opened an empty custom-list modal with both “Create Your First List” and “Create New List.”
- **Expected:** The label distinguishes custom lists from Want to Watch, and the empty state presents one clear primary action.
- **Evidence:** `%TEMP%/flicklet-phase3-m5-mylist.png`.
- **Repeated:** The naming conflict also contributes to UX-03.

#### UX-09 — Library terminology changes between navigation and content

- **Category / severity:** TERMINOLOGY, CONSISTENCY / MEDIUM
- **Missions:** 3, 5, 6, 7
- **Behavior:** Tabs read Watch / Want / Seen / Return while headings and actions use Currently Watching / Want to Watch / Watched / Returning.
- **Expected:** Status names remain stable, or abbreviations are unambiguously explained.
- **Evidence:** Library screenshots including `%TEMP%/flicklet-phase3-m6-found.png` and `m7-seen.png`.
- **Repeated:** Yes, throughout Library workflows.

#### UX-10 — Remove control is obscured by app and system navigation

- **Category / severity:** FUNCTIONAL DEFECT, ERROR RECOVERY / RELEASE BLOCKER for three-button removal
- **Missions:** 10
- **Behavior:** Manage exposes `Remove from List` only at the bottom of a tall sheet. In Pixel 9 API 35 three-button mode, Flicklet’s bottom navigation and the Android navigation area cover it. Dragging the sheet did not bring it clear; tapping the visible sliver hit Android Back and exited the app.
- **Expected:** Removal is fully visible/reachable above both navigation layers and gives clear completion feedback/undo.
- **Evidence:** `%TEMP%/flicklet-phase3-m10-manage.png`, `m10-remove-visible.png`, `m10-after-remove-tap.png`.
- **Repeated:** Reachability remained blocked after an additional sheet drag.

### Recurring themes and comprehension

- **Strong paths:** Search/add, Library retrieval, rating, and ordinary preference changes provide clear controls and immediate state feedback.
- **Weak paths:** List-state transitions depend on hidden gestures, use inconsistent terminology, and lack recovery. Episode progress—the behavior most likely to distinguish Flicklet from a simple list—was not discoverable.
- **Navigation:** Bottom-nav destination state is clear. Filters Back behaves as expected; Settings Back does not. Search text persists across destinations, which is functional but visually persistent.
- **First-time-user understanding:** Flicklet is understandable as a TV/movie tracking organizer for regular viewers. Its 3–5 clearest functions are search/add, status lists, saved-content retrieval, ratings, and preference/personalization controls. Recommendations, Shows Like This, Extras, reminders, and episode tracking appear intended to differentiate it from a static list, but signed-out Discovery and undiscoverable progress prevent that value from being demonstrated. Full Access appears to be a 21-day trial followed by a one-time purchase; the price is not understandable from the tested interface.
- **Still unclear to a new user:** swipe directions, Return/Returning semantics, My List versus Want to Watch, how to update episode progress, which capabilities require sign-in versus payment, and the purchase price.

Temporary screenshots remain local and are intentionally not committed. Formal visual/design acceptance has not begun.

---

## 6. Visual / design acceptance

Evaluate major screens **as a system**, not one isolated screenshot.

Track: visual hierarchy, typography, spacing rhythm, alignment, visual density, card proportions, icon consistency, button/control hierarchy, color/contrast, light/dark themes, screen-to-screen consistency, responsive composition, modal/overlay consistency, perceived polish, unnecessary clutter, discoverability of primary actions.

Architecture may be investigated when it produces UX/design inconsistency. **Do not authorize architectural rewrites merely for code elegance.**

Status: **PHASE 4 — VISUAL/DESIGN ACCEPTANCE: DIAGNOSTIC REVIEW COMPLETE.** This records completion of the review, not final visual acceptance.

- Package: `C:\Users\Likes\Documents\Flicklet_Phase4_Visual_Audit.zip`
- Contents: 39 native-resolution screenshots plus `manifest.md` covering Pixel 9 / API 35 phone dark/light and portrait/landscape states, API 33 7-inch tablet portrait/landscape, and API 36 Pixel Tablet portrait/landscape.
- Requested screenshot 17 (episode/progress state) was not captured because no such state was discoverable through the black-box UI. No substitute was fabricated.
- Screenshots and manifest remain outside Git.

### Phase 4 findings

| ID | Severity | Finding | Classification / correlation | Wave 1 disposition |
|----|----------|---------|------------------------------|--------------------|
| VIS-01 | HIGH | First onboarding coachmark is clipped off-screen. | Visual defect; usability-supporting visual issue; correlates UX-01. | Authorized. |
| VIS-02 | HIGH | Floating Settings gear competes with/overlaps application content and appears where its role is unclear, including Settings itself. | Usability-supporting visual issue; navigation/chrome inconsistency. | Authorized, narrow chrome-ownership correction only. |
| VIS-03 | RELEASE BLOCKER | Bottom-sheet/action content can occupy the same region as Flicklet/Android navigation; Remove is obscured/unreachable in three-button mode. | Visual/layout defect; correlates UX-10. | Authorized. |
| VIS-04 | MEDIUM | Light theme is not strongly differentiated from dark theme. | Design-system/theme inconsistency. | Deferred; do not fix in Wave 1. |
| VIS-05 | MEDIUM | Phone header, Search, and helper copy consume excessive initial vertical space. | Information hierarchy; responsive visual density. | Deferred. |
| VIS-06 | MEDIUM | Home uses nested bordered containers and excess empty space, creating a dashboard/web-app feel. | Composition/visual density. | Deferred. |
| VIS-07 | HIGH | Library is visually overloaded with competing status, filter, metadata, rating, overflow, and manipulation controls. | Correlates UX-02, UX-03, UX-09. | Deferred. |
| VIS-08 | MEDIUM | Search-result cards have weak action hierarchy, oversized repeated status actions, and excessive competing metadata. | Action hierarchy/visual density. | Deferred. |
| VIS-09 | MEDIUM | Overflow/menu treatment and `My List +` use inconsistent visual/action patterns. | Correlates UX-02, UX-03, UX-08. | Deferred. |
| VIS-10 | HIGH | Full Access is a long repetitive feature catalog rather than a clear purchase-decision surface; purchase/price hierarchy is weak or absent. | Correlates UX-07. | Deferred. |
| VIS-11 | MEDIUM | Icons, emoji illustrations, FABs, pills, menus, and buttons do not form one mature component language. | Component-language consistency. | Deferred. |
| VIS-12 | LOW/MEDIUM | Application version is displayed prominently beside consumer branding. | Branding/information hierarchy. | Deferred. |
| VIS-13 | MEDIUM | Signed-out Discovery explains the limitation but provides no strong sign-in action and leaves a visually dead screen. | Correlates UX-04. | Deferred. |
| VIS-14 | MEDIUM | Landscape/tablet layouts often resemble enlarged/rearranged phone or responsive-web layouts rather than space-specific compositions; Settings is notably stronger. | Responsive composition. | Deferred. |
| VIS-15 | MEDIUM / REPRODUCE | Small-tablet portrait Library evidence showed malformed rotated/clipped `Loading Library` text at the extreme left edge. | Possible transient loading/layout defect. | Reproduce first; fix only if confirmed. |
| VIS-16 | MEDIUM | Mobile bottom navigation combines an oversized Settings gear, text-only destinations, active-line treatment, and Android system navigation like layered navigation systems. | Correlates UX-06, UX-10. | Broad navigation redesign deferred. |

### Wave 1 — UX-10 / VIS-03 correction

- **Reproduction:** Pixel 9 / API 35 / three-button / portrait. Search `Tulsa King` → tracked result → Manage. The search-management bottom sheet ended at viewport bottom inside a `z-50` parent, below the higher-z mobile navigation. Its final `Remove from List` action occupied the same bottom region as Flicklet navigation and Android system navigation; tapping the visible sliver could invoke Android Back.
- **Root cause:** The inner sheet declared `zIndex: 10004`, but its parent created a lower `z-50` stacking context, so the complete surface remained below mobile navigation. The fixed overlay also ended at physical viewport bottom without consuming `--safe-bottom`.
- **Correction:** Promote the complete overlay above app navigation, bottom-pad it with the shared `--safe-bottom` contract, use dynamic viewport units, and keep the sheet body independently scrollable with overscroll containment. No device-specific offset was added.
- **Verification:** Rebuilt/synced debug APK on Pixel 9 / API 35. In three-button portrait, the full Remove action is visible and tappable above the 48 CSS-pixel protected navigation area; the sheet covers app navigation instead of competing with it. Gesture-safe spacing uses the same contract. Elevated-font and landscape coverage are included in the Wave 1 regression gate.

### Wave 1 — UX-01 / VIS-01 correction

- **Reproduction:** Fresh app data on Pixel 9 / API 35 placed the first `Welcome to Flicklet` coachmark partly beyond the left viewport edge, clipping its title, body, and container.
- **Root cause:** The coachmark used a fixed 280 CSS-pixel maximum width and `translateX(-50%)` around the header anchor center without constraining the resulting left/right edges to the usable viewport.
- **Correction:** Calculate the coachmark width from the usable viewport and clamp its left edge between 16 CSS-pixel gutters plus the shared `--safe-left` / `--safe-right` values. The onboarding flow and copy are unchanged.
- **Verification:** The entire first coachmark and primary action remain visible on API 31, Pixel 9 / API 35, and an API 36 representative phone. Pixel 9 verification also passed at 2.0× font scale without horizontal clipping or loss of either action.

### Wave 1 — VIS-02 correction

- **Ownership finding:** Settings was globally mounted as a fixed FAB. A prior change visually docked it beside the phone navigation but left it outside the navigation structure, and its visibility state only recognized the optional Settings sheet—not the production full-screen Settings page.
- **Correction:** Settings is now an explicit fourth destination inside phone bottom navigation and a compact header control on tablet/desktop layouts. The independent floating Settings FAB is no longer mounted; Settings remains reachable without occupying poster/card/action content.
- **Verification:** Home, Library, Search, Discovery, and Settings were checked on Pixel 9 gesture/three-button portrait and landscape. The full-screen Settings surface contains no redundant floating gear. API 33 small-tablet Settings uses the header control and retains its existing modal layout.

### Wave 1 — VIS-15 correction

- **Reproduction:** API 33 small tablet, first cold Library entry. At approximately 100 ms, `Loading library...` appeared rotating and clipped at the extreme left edge; the state resolved by approximately 600 ms. Warm Library entry did not show the malformed state.
- **Root cause:** The Suspense fallback applied the reusable `.loading-spinner` class directly to the text container. That class forces a 40×40 circle and applies the `spin` transform, so the entire text node rotated inside a clipped box.
- **Correction:** The Library fallback now uses a centered status container with a separate, aria-hidden spinner element and normally oriented status text.
- **Verification:** Cold/warm entry and portrait/landscape rotation are covered in the final Wave 1 tablet regression gate.

### Wave 1 regression gate

Status: **PASS — WAVE 1 COMPLETE.** No Wave 2 work was started.

- Automated suite: 38 files / 232 tests passed.
- TypeScript checks, production web build, mobile production build, Firebase Functions build, Capacitor Android sync, and Android debug build passed.
- Final debug APK installed and cold-launched successfully.
- Phone smoke coverage: Home, Library, Search, Discovery, Settings, first-launch onboarding, corrected Remove action surface, gesture/three-button navigation, portrait/landscape, and normal/2.0× font.
- Tablet smoke coverage: API 33 small-tablet Library and Settings in portrait/landscape; API 36 large-tablet Home, Library, and Settings representative states.
- Newly discovered / deferred: on a fresh tablet state, opening Settings before dismissing onboarding can leave the active coachmark layered above Settings. Classified as an onboarding/modal layering usability issue; not changed in Wave 1.
- Existing non-blocking warnings remain: stale Browserslist/baseline data, Vite dynamic/static import notices, Capacitor package version mismatch, and Android Gradle deprecation notices.

### Wave 2 — watch-state, episode-progress, and Up Next correction

Status: **PASS — WAVE 2 IMPLEMENTATION COMPLETE.** No Wave 3 or Wave 4 work was started.

- **Authoritative watch state:** `Currently Watching`, `Want to Watch`, and `Watched` are the three primary states. Factual release status such as `RETURNING` remains metadata, and `Not Interested` remains a separate secondary signal.
- **Custom-list model:** custom-list membership is additive through `customListIds`; adding or removing a custom-list membership no longer replaces the title's primary watch state. Legacy custom-only records remain readable.
- **Visible status actions:** mixed cards and mobile cards expose the three primary states through a shared status control. Direct controls and swipe actions route through one transition helper, provide explicit feedback, and offer Undo.
- **Android feedback placement:** the action toast consumes shared top/right safe-area values. Pixel 9 / API 35 evidence placed the toast at physical `y=183–304` and its Undo action at `y=215–270`, below the status/cutout area; tapping Undo restored the prior library state.
- **Episode progress:** episode tracking is available to all users and remains controlled by the existing setting. Card summaries are current-season based (for example, `Up next: S2 E4 · 3/10 watched`). Moving a TV title to `Watched` marks the currently available episodes in its latest season watched; new releases do not silently change the primary watch state.
- **Up Next:** the Home/Library schedule derives from TV titles in `Currently Watching` and `Watched`, excludes `Want to Watch`, and no longer fabricates an episode label before schedule metadata exists.
- **Terminology:** Library segments now use `Currently Watching`, `Want to Watch`, `Watched`, `Up Next`, and `Custom Lists`.

### Wave 2 regression gate

- Automated suite: 40 files / 237 tests passed, including new primary-status, current-season episode-progress, and Up Next coverage.
- TypeScript checks, production web build, mobile production build, Firebase Functions build, Capacitor Android sync, and Android debug build passed.
- Lint completed with 0 errors and 552 pre-existing warnings.
- Final debug APK installed on Pixel 9 / API 35 and representative API 36 phone emulators. API 35 verified the visible three-state selector, state transition feedback, tappable Undo, and Library counts. API 36 cold-launch smoke verification passed without visible system-bar or bottom-navigation overlap.
- Data-dependent external checks not fully exercised in this gate: signed-in cross-device Firebase synchronization for additive custom lists; a live upcoming-episode schedule fixture; and the complete episode modal journey on a populated signed-in account. Their storage/selector paths compile and are covered by focused automated tests, but these are not represented as completed black-box missions.
- Existing non-blocking warnings remain: stale Browserslist/baseline data, Vite dynamic/static import notices, Capacitor package version mismatch, Android Gradle deprecation notices, and existing React test warnings.

### Wave 3 — UX-04 / VIS-13 Discovery signed-out action

- **Root cause:** the signed-out Discovery empty state explained that authentication was required but rendered no actionable control.
- **Correction:** the state now presents a prominent `Sign In` action and dispatches the existing `auth:sign-in-required` contract, preserving the single application authentication flow.
- **Focused verification:** signed-out CTA rendering/event dispatch and unchanged signed-in empty-state behavior are covered by `DiscoveryPage.signedOut.test.tsx`; TypeScript passes.

### Wave 3 — UX-06 Settings Android Back

- **Root cause:** neither responsive Settings shell subscribed to the existing cancellable `flicklet:android-back` event, so `MainActivity` treated Back as unhandled and delegated to the activity dispatcher.
- **Correction:** both `SettingsSheet` and `SettingsPage` use one shared web listener for the existing native contract. Settings-owned transient overlays close first; otherwise Settings closes and returns to the prior Flicklet surface. A previously consumed event is ignored, preserving dismissal precedence and native fallback semantics.
- **Focused verification:** Settings consumes the cancellable event and closes; the existing Filters Android/browser Back suite remains green; TypeScript passes. Native predictive Back still uses the unchanged AndroidX dispatcher integration.

### Wave 3 — UX-07 / VIS-10 Full Access purchase decision

- **Architecture audit:** Full Access is the non-consumable Google Play INAPP product `flicklet_full_access`. `BillingPlugin.getProducts()` already returns Play's localized `SkuDetails.price`, currency, title, and description, but the Settings decision surface never requested those details. Purchase validation and entitlement refresh remain in the existing `startProUpgrade()` path; restore support exists in the billing bridge but is not currently surfaced by this Settings section.
- **Correction:** the native Billing plugin is explicitly registered, and a read-only product-details path loads the configured Play product before purchase. The decision hierarchy is now Full Access identity, localized one-time price/status, entitlement state, primary CTA, then four concise benefits. Android purchase is gated while pricing loads or is unavailable; no fallback dollar amount is fabricated.
- **Paid-copy correction:** Episode Tracking was removed from Full Access benefits because Wave 2 made it available to all users. Repetitive trial/continued-access tiles and per-benefit `INCLUDED / Available Now` labels were removed; Unlimited Custom Lists remains a genuine paid benefit.
- **Focused verification:** localized price/product-ID/type mapping and non-Android no-fabrication behavior are covered by `proUpgrade.productDetails.test.ts`; guest, expired/read-only, paid, and admin entitlement render paths remain covered by `settingsApprovalPaths.test.tsx`.

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
- Settings FAB remains mounted under SettingsPage (it only self-hides for the sheet flag path)
- Phone landscape Settings is the desktop modal (`isMobileNow` false above 767px), not a full-screen mobile layout; accepted as current breakpoint behavior
- Aggressive WebView CDP probing during rotation once surfaced an Android “isn't responding” dialog; not reproduced in this stress pass under normal taps
- Home landscape can look like a portrait column for a few seconds during rotation; **settled 8s cold-launch landscape Home passed** (desktop chrome). Not promoted to a standing defect
- `wm size` / `wm density` emulator overrides often show a blank WebView until process restart — test-method, not classified as a shipping defect
- Discovery posters sometimes grey placeholders (network/cache), not classified this phase
- Double-Back from Search IME can leave the app (launcher) — typical Android, observation only
- Android Back from the Settings sheet exits the activity because Settings does not currently subscribe to `flicklet:android-back`; this behavior predates the API 36 dispatcher migration and is deferred rather than folded into the platform change.

---

## 10A. Android 16 / target API 36 migration

- `compileSdkVersion` and `targetSdkVersion` are now 36; `minSdkVersion` remains 31.
- Google Play requires new apps and updates to target Android 16 / API 36 from August 31, 2026 (phone form factor).
- The Android 16 behavior audit identified predictive Back as the only directly reproduced target-36 break: the legacy `Activity.onBackPressed()` override was no longer invoked, so Back from the Filters overlay left the app instead of closing the overlay.
- `MainActivity` now registers an AndroidX `OnBackPressedCallback`, preserves the existing cancellable `flicklet:android-back` web contract, and temporarily disables that callback before delegating an unhandled Back to the dispatcher.
- Edge-to-edge behavior remains owned by the existing four-sided WindowInsets contract. No orientation restriction or large-screen opt-out is present, so Android 16's large-screen enforcement required no manifest change.
- API 36 phone verification passed gesture/three-button navigation, cold launch, warm resume, Filters Back, Search/IME, portrait/landscape rotation, inset re-synchronization, and 2.0x font scale. Insets observed at 560 dpi: gesture `41.142857 / 24` CSS px top/bottom; three-button `41.142857 / 48` CSS px.
- API 36 Pixel Tablet verification passed Home, Library, Settings, portrait/landscape rotation, and inset re-synchronization at 2560x1600, 320 dpi. Insets were `24 / 32` CSS px top/bottom.
- Post-target smoke launches passed on API 31, 33, 35, and 36. API 31 rendered at 1080x1920 / 420 dpi with `24 / 48` CSS px top/bottom; API 33 also retained a usable 2.0x-font layout.

---

## 11. Current checkpoint

| Field | Value |
|-------|--------|
| Branch | `codex/establish-baseline` |
| Verified application checkpoint | Wave 2 implementation commits `226aa4d`, `5fa8d4f`, and `0867da5`, plus the focused release-status/Android-assets commit containing this update |
| Application source changes in this gate | Watch-state/custom-list separation, shared primary-state transitions and feedback, all-user current-season episode progress, Up Next schedule semantics, terminology, and Android-safe toast placement |
| Current phase | Wave 2 — **IMPLEMENTATION AND REGRESSION GATE COMPLETE** |
| Current authorized task | Wave 2 only; Wave 3 and Wave 4 remain unauthorized. |
| Latest test evidence | 40 files / 237 tests; TypeScript, lint (0 errors), production web/mobile, Functions, Capacitor sync, Android debug; APK launch on API 35 and API 36; API 35 visible status transition and tappable Undo mission passed. |

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
