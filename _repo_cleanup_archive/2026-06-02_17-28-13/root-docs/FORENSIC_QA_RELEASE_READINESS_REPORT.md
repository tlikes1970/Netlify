# FORENSIC QA RELEASE READINESS REPORT
**App:** Flicklet (TV Tracker)  
**Date:** 2025-01-27  
**Scope:** Functional issues that could block or embarrass App Store/Play Store submission  
**Method:** READ-ONLY codebase forensic analysis

---

## 1. RELEASE-STOPPER ISSUES (Must Fix)

### Issue 1.1: Trivia Question Deduplication Window Too Short for Pro Users
**Severity:** Stopper  
**User Impact:** Pro users playing multiple games per day will see repeated questions within the same day, breaking the "no duplicates" promise. This directly contradicts Pro value proposition.

**Repro Steps:**
1. Sign in as Pro user
2. Play Trivia Game 1 (10 questions)
3. Play Trivia Game 2 (should get 10 different questions)
4. Observe: Questions from Game 1 appear again in Game 2

**Root-Cause Hypothesis:**
- `triviaDedup.ts` line 37: `NO_REPEAT_DAYS = 7` (reduced from 14)
- `getUsedQuestionHashes()` (line 122) only excludes questions from EARLIER games today, but Pro users play 3 games per day
- If question pool is exhausted or cache is stale, deduplication may fail
- `triviaApi.ts` line 375: Regular users always start at index 0, Pro users get slices `(gameNumber - 1) * 10` - if cache has <30 questions, Pro games 2-3 may overlap

**Evidence:**
- File: `apps/web/src/lib/triviaDedup.ts` lines 37, 122-146
- File: `apps/web/src/lib/triviaApi.ts` lines 374-379
- File: `apps/web/src/components/games/TriviaGame.tsx` lines 312-334
- Comment in code: "Reduced from 14 to be more realistic with limited pool" (line 37) - indicates known limitation

**Fix Recommendation:**
1. Increase `NO_REPEAT_DAYS` back to 14 or implement per-game tracking
2. Ensure cache always has 30+ unique questions before serving to Pro users
3. Add validation: If `usedHashes.size` + `questionsNeeded` > available pool, log warning and supplement with hardcoded questions
4. Test: Pro user plays 3 games in sequence, verify no duplicates

**Regression Risks:**
- May cause slower question loading if pool is exhausted
- Hardcoded fallback questions may repeat if not properly tracked

**Suggested Test After Fix:**
- Pro user: Play games 1, 2, 3 in sequence on same day
- Verify: No question appears twice
- Free user: Play game 1, verify no duplicates from previous 7 days

---

### Issue 1.2: FlickWord Deterministic Word Selection Fallback Can Repeat Problematic Letters
**Severity:** Stopper  
**User Impact:** Users experience 4+ consecutive days with words starting with the same letter, breaking the "avoid same-letter runs" guarantee. Documented in `FLICKWORD_PATTERN_BUG_CRITICAL.md`.

**Repro Steps:**
1. Play FlickWord for 3+ consecutive days
2. Observe: Words start with same letter (e.g., C, C, C, C)
3. User frustration: Game feels broken/predictable

**Root-Cause Hypothesis:**
- `dailyWordApi.ts` line 230: Final fallback returns `validWords[baseIndex]` without checking problematic letters
- Fallback loop (lines 192-227) may exhaust attempts and still return problematic word
- `getDeterministicWordForDate()` pattern detection (lines 78-129) identifies problematic letters but fallback ignores them

**Evidence:**
- File: `apps/web/src/lib/dailyWordApi.ts` lines 191-230
- File: `FLICKWORD_PATTERN_BUG_CRITICAL.md` (documents this exact issue)
- File: `apps/web/scripts/calculate-flickword-words-fixed.js` (contains fix attempt, but not integrated)

**Fix Recommendation:**
1. Modify final fallback (line 230) to explicitly exclude problematic letters
2. If no word found after maxAttempts, use secondary pool or different selection strategy
3. Add logging when fallback is used to track frequency
4. Integrate fix from `calculate-flickword-words-fixed.js` if validated

**Regression Risks:**
- May fail to return a word if pool is too constrained (should never happen with 2000+ common words)
- Fallback words may be less familiar to users

**Suggested Test After Fix:**
- Simulate 30 consecutive days of word selection
- Verify: No 3+ day runs of same starting letter
- Verify: No alphabetical patterns in first letters

---

### Issue 1.3: Drag & Drop Reorder May Fail Silently on Mobile Touch Events
**Severity:** Stopper  
**User Impact:** Users drag items to reorder, but order doesn't persist. No error feedback. User thinks app is broken.

**Repro Steps:**
1. On mobile device (<744px width)
2. Long-press drag handle on a list item
3. Drag to new position
4. Release
5. Observe: Item may revert to original position OR order doesn't save

**Root-Cause Hypothesis:**
- `DragHandle.tsx` line 148-479: Complex touch event handling with multiple timers and refs
- `useDragAndDrop.ts` line 58-118: `handleDragEnd` uses `setTimeout` with 0ms delay, may race with touch events
- `ListPage.tsx` line 401-412: `flushPendingSaves()` called after drag end, but if drag end doesn't fire, saves never flush
- Touch events may not properly trigger `onDragStart` callback (line 100-108 checks `isDesktop` which may be false during touch)

**Evidence:**
- File: `apps/web/src/components/cards/DragHandle.tsx` lines 89-479 (complex touch handling)
- File: `apps/web/src/hooks/useDragAndDrop.ts` lines 58-118 (async reorder logic)
- File: `apps/web/src/pages/ListPage.tsx` lines 401-412 (save flushing)
- File: `DRAG_HANDLE_FORENSIC_REVIEW.md` (documents known issues)

**Fix Recommendation:**
1. Add explicit error handling in `handleDragEnd` - if `draggedOverIndex === null`, show toast "Drag cancelled"
2. Ensure `onDragStart` fires for touch events (verify `isDesktop` check doesn't block mobile)
3. Add persistence verification: After reorder, check localStorage was updated
4. Simplify touch handling: Reduce timer complexity, ensure single source of truth for drag state

**Regression Risks:**
- May break desktop drag if touch handling changes
- FLIP animations may glitch if timing changes

**Suggested Test After Fix:**
- Mobile: Drag item from position 3 to position 1, verify it stays at position 1 after page reload
- Desktop: Drag item, verify same behavior
- Test rapid drags (user drags quickly back and forth)

---

### Issue 1.4: Pro Status Check May Return Stale Cached Value
**Severity:** Stopper  
**User Impact:** User purchases Pro subscription, but app still shows Free features. User paid but doesn't get what they paid for. High risk of refund requests and App Store rejection.

**Repro Steps:**
1. User is Free tier
2. User purchases Pro subscription via in-app purchase
3. App checks Pro status
4. Observe: `getProStatusSync()` returns cached `isPro: false` (cache expires in 60 seconds)
5. User sees Free tier limits despite paying

**Root-Cause Hypothesis:**
- `proStatus.ts` line 19-20: `billingCache` with 60-second expiration
- `getProStatusSync()` (line 75) uses cache only - if cache is stale but not expired, returns old value
- After purchase, cache may not be invalidated immediately
- `getProStatus()` async version (line 26) checks Firestore, but sync version (used by UI) uses cache

**Evidence:**
- File: `apps/web/src/lib/proStatus.ts` lines 18-79
- Cache duration: 60 seconds (line 20)
- `getProStatusSync()` line 75: "Returns false if cache is expired or missing" - but doesn't check if cache is stale after purchase

**Fix Recommendation:**
1. After successful purchase, immediately invalidate cache: `billingCache = null`
2. Add cache invalidation hook in purchase completion handlers
3. Consider reducing cache duration to 10 seconds for more responsive updates
4. Add explicit cache clear in `proUpgrade.ts` after purchase validation

**Regression Risks:**
- More Firestore reads if cache duration reduced (acceptable trade-off)
- May cause brief UI flicker if status changes (acceptable)

**Suggested Test After Fix:**
- Free user purchases Pro → verify Pro features unlock immediately
- Pro user cancels subscription → verify Free limits apply within 60 seconds
- Test with slow network to ensure cache doesn't block updates

---

## 2. HIGH PRIORITY ISSUES (Should Fix Pre-Submit)

### Issue 2.1: Username Prompt May Not Show After Sign-In (Race Condition)
**Severity:** High  
**User Impact:** New users sign in but never prompted for username. Username remains empty, affecting personalization and community features.

**Repro Steps:**
1. New user signs in with Google
2. Auth state changes
3. Observe: Username prompt modal doesn't appear
4. User proceeds without username

**Root-Cause Hypothesis:**
- `useUsername.ts` line 149-157: Subscription callback may fire before Firestore read completes
- `loadUsername()` async operation may be skipped if `initialLoadComplete` is true but data not loaded
- Race condition: Auth state changes → subscription fires → `loadUsername()` called → but Firestore read slow → state stuck in loading

**Evidence:**
- File: `apps/web/docs/SIGN_ON_COMPLETE_CODE.md` lines 35-45 (documents this issue)
- File: `apps/web/USERNAME_FLOW_DIAGRAM.md` lines 37-56 (describes timing issue)
- Log evidence: "⏸️ Skipping loadUsername from auth subscription {skipInProgress: false, initialLoadComplete: true, isLoading: true}"

**Fix Recommendation:**
1. Add timeout to `loadUsername()` - if Firestore read takes >5 seconds, show username prompt anyway
2. Ensure `usernamePrompted` check happens even if username is still loading
3. Add retry logic if Firestore read fails

**Regression Risks:**
- May show prompt twice if timing changes
- May prompt existing users if check fails

**Suggested Test After Fix:**
- New user sign-in on slow network (throttle to 3G)
- Verify username prompt appears within 10 seconds
- Existing user sign-in → verify no prompt

---

### Issue 2.2: Share Links May Not Work in Mobile App Context
**Severity:** High  
**User Impact:** User shares a list or game result, recipient clicks link, but deep link doesn't navigate correctly in mobile app. Link appears broken.

**Repro Steps:**
1. User shares FlickWord result via native share sheet
2. Recipient opens link on mobile device
3. Link format: `?game=flickword&date=2025-01-27&gameNumber=1`
4. Observe: Deep link handler may not fire or navigates incorrectly

**Root-Cause Hypothesis:**
- `App.tsx` line 649-808: Deep link handling checks `viewParam` and `gameParam`
- Query param parsing happens on mount, but if app is already loaded, hash change handler may not fire
- Mobile WebView may not trigger `hashchange` event for query params
- Share link format may not match expected format in `shareLinks.ts`

**Evidence:**
- File: `apps/web/src/App.tsx` lines 649-808 (deep link handling)
- File: `apps/web/src/lib/shareLinks.ts` lines 1-166 (share URL generation)
- Deep link formats documented but not tested in mobile WebView context

**Fix Recommendation:**
1. Add explicit query param check on every route change, not just hash change
2. Test share links in Capacitor Android/iOS WebView
3. Add fallback: If deep link fails, show toast "Opening [item]..." and navigate manually
4. Verify share link format matches deep link parser expectations

**Regression Risks:**
- May break existing deep links if format changes
- May cause navigation loops if not properly guarded

**Suggested Test After Fix:**
- Share FlickWord result → open link in mobile app → verify game opens
- Share list → open link → verify list opens
- Share from web → open in mobile app → verify navigation works

---

### Issue 2.3: Community Post/Comment Limits May Not Enforce Correctly for Pro Users
**Severity:** High  
**User Impact:** Pro user expects 100 posts/day but only gets 3. Or Free user bypasses limit somehow. Entitlement mismatch causes confusion.

**Repro Steps:**
1. Pro user creates 3 posts
2. Try to create 4th post
3. Observe: May be blocked (should allow up to 100)

**Root-Cause Hypothesis:**
- `communityLimitsCheck.ts` (referenced but not found in search results)
- `NewPostModal.tsx` line 73: `checkCanCreatePost(user.uid, settings.pro.isPro)` - uses `settings.pro.isPro` which may be stale
- Pro status check may use cached value instead of fresh billing status
- Limit check happens client-side, could be bypassed

**Evidence:**
- File: `apps/web/src/components/NewPostModal.tsx` lines 71-75
- File: `apps/web/src/lib/proStatus.ts` (Pro status resolution)
- Pro limits: 100 posts/500 comments (documented in `PRICING_PLAN.md`)

**Fix Recommendation:**
1. Use `getProStatus()` async version instead of `settings.pro.isPro` sync check
2. Add server-side validation in Cloud Function (if posts go through function)
3. Verify limit enforcement: Pro = 100, Free = 3
4. Add logging when limit is reached to track if it's working

**Regression Risks:**
- May cause UI delay if async check is slow
- May block legitimate Pro users if check fails

**Suggested Test After Fix:**
- Pro user: Create 100 posts, verify 101st is blocked
- Free user: Create 3 posts, verify 4th is blocked
- Test with Pro status toggle to ensure limits update immediately

---

### Issue 2.4: Service Worker Cache May Serve Stale Content After Deploy
**Severity:** High  
**User Impact:** App updates deployed, but users see old version for hours/days. Critical bug fixes don't reach users. May cause support issues.

**Repro Steps:**
1. Deploy new version of app
2. User visits app (has old service worker cached)
3. Observe: Old JavaScript/CSS served from cache
4. User sees broken UI or old features

**Root-Cause Hypothesis:**
- `sw.js` (service worker) implements cache-first for static assets (lines 167-180)
- HTML uses network-first (line 123) but static assets cached aggressively
- Service worker version (`SW_VERSION = "v4"`) may not trigger update if cache name doesn't change
- Users may not get new version until they clear cache manually

**Evidence:**
- File: `apps/web/public/sw.js` (service worker implementation)
- Cache strategy: Static assets cache-first, HTML network-first
- Service worker update logic may not force refresh of cached assets

**Fix Recommendation:**
1. Add cache-busting query params to static asset URLs on deploy
2. Implement service worker update prompt: "New version available, reload?"
3. Reduce cache duration for JavaScript/CSS to 1 hour instead of indefinite
4. Add version check on app load: Compare `package.json` version with cached version

**Regression Risks:**
- May cause slower loads if cache duration reduced
- Update prompts may annoy users

**Suggested Test After Fix:**
- Deploy new version → verify users get update within 1 hour
- Test service worker update flow: Old SW → New SW → verify assets refresh
- Test offline behavior: Verify cached content still works

---

## 3. MEDIUM PRIORITY ISSUES (Can Ship If Necessary)

### Issue 3.1: FlickWord Keyboard Input May Have Accessibility Issues on Mobile
**Severity:** Medium  
**User Impact:** Mobile users struggle to type guesses. Keyboard may not focus correctly or dismiss properly. Affects game playability.

**Repro Steps:**
1. Open FlickWord game on mobile device
2. Tap input field
3. Observe: Keyboard may not appear, or appears but input doesn't focus
4. After typing, keyboard may not dismiss

**Root-Cause Hypothesis:**
- `FlickWordGame.tsx` input handling (lines 200-1738) may not properly handle mobile keyboard events
- Visual Viewport API may not be used to adjust for keyboard
- Input focus/blur handlers may conflict with game state updates

**Evidence:**
- File: `apps/web/src/components/games/FlickWordGame.tsx` (large component, keyboard handling not explicitly verified)
- Mobile-specific CSS exists (`flickword-mobile.css`) but keyboard behavior not documented

**Fix Recommendation:**
1. Test keyboard behavior on actual iOS/Android devices
2. Add Visual Viewport API to adjust layout when keyboard appears
3. Ensure input field has proper `autofocus` and `inputmode="text"`
4. Add keyboard dismiss on game completion

**Regression Risks:**
- May break desktop keyboard behavior if mobile fixes applied globally
- Visual Viewport API may cause layout shifts

**Suggested Test After Fix:**
- iOS Safari: Open game → tap input → verify keyboard appears and input focuses
- Android Chrome: Same test
- Verify keyboard dismisses after guess submission

---

### Issue 3.2: Trivia Game May Show Duplicate Questions If API Cache Degrades
**Severity:** Medium  
**User Impact:** If OpenTriviaDB API fails or returns degraded cache, users may see duplicate questions even with deduplication logic.

**Repro Steps:**
1. API cache has <20 API questions (degraded state)
2. User plays Trivia game
3. Observe: Questions may repeat if fallback pool is small

**Root-Cause Hypothesis:**
- `triviaApi.ts` line 368: Cache only used if `apiCount >= MIN_API_FOR_CACHE` (20 questions)
- If cache degraded, falls back to API fetch
- If API fails, uses hardcoded questions
- Hardcoded pool may be small and not properly deduplicated against history

**Evidence:**
- File: `apps/web/src/lib/triviaApi.ts` lines 367-387
- `MIN_API_FOR_CACHE = 20` (line 367)
- Fallback to hardcoded questions if API fails

**Fix Recommendation:**
1. Ensure hardcoded question pool is large enough (100+ questions)
2. Apply deduplication to hardcoded questions using `triviaDedup.ts`
3. Add warning log when degraded cache is used
4. Consider increasing `MIN_API_FOR_CACHE` threshold

**Regression Risks:**
- Larger hardcoded pool increases bundle size
- May cause slower question loading if API consistently fails

**Suggested Test After Fix:**
- Simulate API failure → verify hardcoded questions don't repeat
- Test with degraded cache (<20 API questions) → verify deduplication still works

---

### Issue 3.3: Drag Handle May Not Be Accessible on Very Small Mobile Screens
**Severity:** Medium  
**User Impact:** Users on small phones (<375px width) may not be able to access drag handles. Reordering becomes impossible.

**Repro Steps:**
1. Open app on device with <375px width
2. Navigate to list page
3. Try to access drag handle
4. Observe: Handle may be too small or hidden

**Root-Cause Hypothesis:**
- `DragHandle.tsx` touch target size may not meet 44x44px minimum
- Handle visibility may depend on hover state (desktop) which doesn't work on mobile
- Small screens may not have enough space for handle + content

**Evidence:**
- File: `apps/web/src/components/cards/DragHandle.tsx` (touch handling exists but size not verified)
- Mobile breakpoint: 744px (may not account for very small screens)

**Fix Recommendation:**
1. Verify touch target is at least 44x44px on all screen sizes
2. Ensure handle is always visible on mobile (not just on hover)
3. Add alternative: Long-press anywhere on card to start drag (if handle too small)

**Regression Risks:**
- Larger handle may take up too much space on small screens
- Long-press on card may conflict with other gestures

**Suggested Test After Fix:**
- Test on iPhone SE (375px width) → verify handle is accessible
- Test on Android device with 360px width → verify same
- Verify touch target meets accessibility guidelines (44x44px)

---

## 4. UNCONFIRMED, NEEDS RUNTIME TEST

### Issue 4.1: Pro Purchase Flow May Not Complete on iOS
**Test Steps:**
1. On iOS device, open app
2. Navigate to Pro upgrade
3. Tap "Upgrade to Pro"
4. Complete in-app purchase
5. Verify: Pro status updates immediately
6. Verify: Pro features unlock
7. Check: Firestore `users/{uid}/billing` document updated

**Why Unconfirmed:**
- `proUpgrade.ts` line 136-140: iOS purchase marked as "not implemented yet"
- Code comment: "TODO: Implement when iOS app is ready"
- No iOS-specific purchase handler found

**Files to Check:**
- `apps/web/src/lib/proUpgrade.ts` lines 136-140
- `apps/web/src/lib/proStatus.ts` (Pro status resolution)

---

### Issue 4.2: Push Notifications May Not Work on Android
**Test Steps:**
1. On Android device, grant notification permission
2. Sign in to app
3. Verify: FCM token stored in Firestore `users/{uid}/fcmToken`
4. Have another user reply to your comment
5. Verify: Push notification received
6. Tap notification
7. Verify: App opens to comment thread

**Why Unconfirmed:**
- `android/app/build.gradle` line 76: `google-services.json` not found warning
- Push notification implementation exists but config incomplete
- No `google-services.json` file found in codebase

**Files to Check:**
- `apps/web/src/firebase-messaging.ts`
- `android/app/google-services.json` (missing)
- `functions/src/sendPushOnReply.ts`

---

### Issue 4.3: Offline Mode May Break After Service Worker Update
**Test Steps:**
1. Visit app while online (caches content)
2. Go offline
3. Navigate to previously visited pages
4. Verify: Cached content loads
5. Go back online
6. Service worker updates
7. Go offline again
8. Verify: Cached content still loads

**Why Unconfirmed:**
- Service worker update logic may invalidate old cache
- Cache versioning (`CACHE_NAME = "app-assets-v2"`) may cause cache misses
- Offline fallback page exists but not tested

**Files to Check:**
- `apps/web/public/sw.js` (service worker)
- `apps/web/public/offline.html` (offline fallback)

---

### Issue 4.4: Deep Links May Not Work When App Is Already Open
**Test Steps:**
1. Open app (already running)
2. Receive/share deep link: `?game=flickword&date=2025-01-27&gameNumber=1`
3. Paste/open link in same browser tab
4. Verify: Game opens (not just home page)
5. Test with app in background (mobile) → open link → verify app comes to foreground with correct route

**Why Unconfirmed:**
- Deep link handler checks query params on mount/hash change
- If app already loaded, handler may not fire
- Mobile app context (Capacitor) may handle links differently

**Files to Check:**
- `apps/web/src/App.tsx` lines 649-808 (deep link handling)
- Capacitor deep link configuration (not found in search)

---

## 5. RELEASE SURFACE MAP

### User-Facing Feature Areas

#### Authentication & Onboarding
- **Entry:** `AuthModal.tsx`, `OnboardingCoachmarks.tsx`
- **Routes:** `/` (home), `/signin` (implicit via modal)
- **Pro Gating:** None (auth required for Pro features)
- **Key Files:**
  - `apps/web/src/components/AuthModal.tsx`
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/lib/authLogin.ts`
  - `apps/web/src/hooks/useUsername.ts`
  - `apps/web/src/lib/onboarding.ts`

#### Core Library (Lists)
- **Entry:** `ListPage.tsx` (Currently Watching, Want to Watch, Watched, Returning)
- **Routes:** `/watching`, `/want`, `/watched`, `/returning`
- **Pro Gating:** None (all users can use lists)
- **Key Files:**
  - `apps/web/src/pages/ListPage.tsx`
  - `apps/web/src/lib/storage.ts` (localStorage persistence)
  - `apps/web/src/hooks/useDragAndDrop.ts`
  - `apps/web/src/components/cards/DragHandle.tsx`

#### Search & Discovery
- **Entry:** `SearchSuggestions.tsx`, `ForYouGenreConfig.tsx`
- **Routes:** `/` (home page), `/discovery`
- **Pro Gating:** None
- **Key Files:**
  - `apps/web/src/components/SearchSuggestions.tsx`
  - `apps/web/src/hooks/useForYouRows.ts`

#### Ratings
- **Entry:** Card overflow menu → Rate
- **Routes:** Embedded in cards
- **Pro Gating:** None
- **Key Files:**
  - `apps/web/src/lib/ratingSystem.ts` (not found in search, may be inline)

#### Notifications
- **Entry:** Settings → Notifications
- **Routes:** `/settings` (modal/sheet)
- **Pro Gating:** 
  - Free: Vague timing (24h or 7d before)
  - Pro: Precise timing (1-24 hours), email notifications
- **Key Files:**
  - `apps/web/src/components/modals/NotificationSettings.tsx`
  - `apps/web/src/lib/notifications.ts`
  - `apps/web/src/lib/notificationSettingsSync.ts`

#### Community Hub
- **Entry:** `CommunityPanel.tsx`
- **Routes:** `/community`
- **Pro Gating:**
  - Free: 3 posts/day, 10 comments/day
  - Pro: 100 posts/day, 500 comments/day
- **Key Files:**
  - `apps/web/src/components/CommunityPanel.tsx`
  - `apps/web/src/components/NewPostModal.tsx`
  - `apps/web/src/components/CommentComposer.tsx`
  - `apps/web/src/lib/communityReports.ts`
  - `apps/web/src/lib/communityLimitsCheck.ts` (referenced, not found)

#### Settings
- **Entry:** `SettingsPage.tsx`
- **Routes:** `/settings` (mobile: sheet, desktop: page)
- **Pro Gating:** Pro tab shows upgrade options
- **Key Files:**
  - `apps/web/src/components/SettingsPage.tsx`
  - `apps/web/src/components/settingsSections.tsx`
  - `apps/web/src/lib/settings.ts`

#### Games
- **Entry:** `FlickWordModal.tsx`, `TriviaModal.tsx`
- **Routes:** `/games` (implicit via modals)
- **Pro Gating:**
  - FlickWord: Free = 1 game/day, Pro = 3 games/day
  - Trivia: Free = 10 questions/game, Pro = 30 questions/game (3 games/day)
- **Key Files:**
  - `apps/web/src/components/games/FlickWordGame.tsx`
  - `apps/web/src/components/games/TriviaGame.tsx`
  - `apps/web/src/lib/dailyWordApi.ts`
  - `apps/web/src/lib/triviaApi.ts`
  - `apps/web/src/lib/triviaDedup.ts`

#### Share & Deep Links
- **Entry:** Share buttons in cards, games, lists
- **Routes:** Query params (`?view=...`, `?game=...`)
- **Pro Gating:** None
- **Key Files:**
  - `apps/web/src/lib/shareLinks.ts`
  - `apps/web/src/App.tsx` lines 649-808 (deep link handler)

#### Admin Tools
- **Entry:** `AdminExtrasPage.tsx`
- **Routes:** `/admin` (gated by admin role)
- **Pro Gating:** Admin-only (not Pro)
- **Key Files:**
  - `apps/web/src/pages/AdminExtrasPage.tsx`
  - `apps/web/src/hooks/useAdminRole.ts` (referenced, not found)

### Pro-Only Code Paths

1. **FlickWord Game Limits:**
   - `FlickWordGame.tsx` lines 239-241: `MAX_GAMES_FREE = 1`, `MAX_GAMES_PRO = 3`
   - `getGamesCompletedToday()` checks Pro status

2. **Trivia Game Limits:**
   - `TriviaGame.tsx` line 306: Pro gets 30 questions/day, Free gets 10
   - `triviaApi.ts` line 375: Pro gets slices `(gameNumber - 1) * 10`

3. **Community Limits:**
   - `NewPostModal.tsx` line 73: `checkCanCreatePost(user.uid, settings.pro.isPro)`
   - Free: 3 posts/10 comments, Pro: 100 posts/500 comments

4. **Notifications:**
   - `notifications.ts`: Email notifications Pro-only
   - Precise timing (1-24h) Pro-only, vague timing (24h/7d) Free

5. **Bloopers/Extras:**
   - `BloopersModal.tsx`, `ExtrasModal.tsx`: Pro gating (referenced in docs)

6. **Custom Lists:**
   - Free: 3 lists max, Pro: Unlimited (referenced in `PRICING_PLAN.md`)

---

## 6. MINIMAL FIX PLAN

### Phase 1: Critical Blockers (Must Fix Before Submit)
**Estimated Time:** 8-12 hours  
**Code Surface:** Medium  
**Highest Regression Risk:** Pro status checks, drag & drop

1. **Fix Trivia Deduplication for Pro Users** (2-3 hours)
   - File: `apps/web/src/lib/triviaDedup.ts`
   - Change: Increase `NO_REPEAT_DAYS` to 14, ensure 30+ questions in cache
   - Risk: May cause slower loading if pool exhausted
   - Test: Pro user plays 3 games, verify no duplicates

2. **Fix FlickWord Pattern Bug** (2-3 hours)
   - File: `apps/web/src/lib/dailyWordApi.ts`
   - Change: Modify fallback to exclude problematic letters
   - Risk: May fail to return word (shouldn't happen with 2000+ words)
   - Test: Simulate 30 days, verify no 3+ day same-letter runs

3. **Fix Pro Status Cache Invalidation** (1-2 hours)
   - Files: `apps/web/src/lib/proStatus.ts`, `apps/web/src/lib/proUpgrade.ts`
   - Change: Invalidate cache after purchase, reduce cache duration to 10s
   - Risk: More Firestore reads (acceptable)
   - Test: Purchase Pro → verify features unlock immediately

4. **Fix Drag & Drop Persistence** (2-3 hours)
   - Files: `apps/web/src/hooks/useDragAndDrop.ts`, `apps/web/src/pages/ListPage.tsx`
   - Change: Add error handling, ensure persistence on drag end
   - Risk: May break FLIP animations
   - Test: Mobile drag → verify order persists after reload

5. **Fix Username Prompt Race Condition** (1 hour)
   - File: `apps/web/src/hooks/useUsername.ts`
   - Change: Add timeout, ensure prompt shows even if Firestore slow
   - Risk: May show prompt twice
   - Test: New user sign-in on slow network

### Phase 2: High Priority (Should Fix Pre-Submit)
**Estimated Time:** 6-8 hours  
**Code Surface:** Small-Medium  
**Highest Regression Risk:** Deep links, service worker

6. **Fix Share/Deep Links** (2 hours)
   - File: `apps/web/src/App.tsx`
   - Change: Add query param check on route change, test in mobile context
   - Risk: May break existing links
   - Test: Share link → open in mobile app → verify navigation

7. **Fix Community Limits Pro Check** (1 hour)
   - File: `apps/web/src/components/NewPostModal.tsx`
   - Change: Use async `getProStatus()` instead of sync `settings.pro.isPro`
   - Risk: May cause UI delay
   - Test: Pro user creates 100 posts, verify limit enforced

8. **Fix Service Worker Cache Strategy** (2-3 hours)
   - File: `apps/web/public/sw.js`
   - Change: Add cache-busting, reduce cache duration, add update prompt
   - Risk: May cause slower loads
   - Test: Deploy new version → verify users get update

### Phase 3: Medium Priority (Can Ship If Necessary)
**Estimated Time:** 4-6 hours  
**Code Surface:** Small  
**Highest Regression Risk:** Low

9. **Fix FlickWord Mobile Keyboard** (2 hours)
   - File: `apps/web/src/components/games/FlickWordGame.tsx`
   - Change: Add Visual Viewport API, ensure proper focus/blur
   - Risk: May break desktop behavior
   - Test: Mobile device → verify keyboard works

10. **Fix Trivia Degraded Cache Handling** (1 hour)
    - File: `apps/web/src/lib/triviaApi.ts`
    - Change: Ensure hardcoded questions are deduplicated
    - Risk: Larger bundle size
    - Test: Simulate API failure → verify no duplicates

11. **Fix Drag Handle Accessibility** (1-2 hours)
    - File: `apps/web/src/components/cards/DragHandle.tsx`
    - Change: Ensure 44x44px touch target, always visible on mobile
    - Risk: May take up too much space
    - Test: Small screen device → verify handle accessible

### Testing Requirements After Fixes
1. **Pro User Flow:** Sign up → Purchase Pro → Verify all Pro features unlock
2. **Game Repetition:** Play FlickWord 30 days, Trivia 3 games/day for 7 days → Verify no duplicates
3. **Drag & Drop:** Mobile + Desktop → Verify reorder persists
4. **Deep Links:** Share from all surfaces → Verify links work in mobile app
5. **Service Worker:** Deploy update → Verify users get new version within 1 hour

---

**END OF REPORT**



