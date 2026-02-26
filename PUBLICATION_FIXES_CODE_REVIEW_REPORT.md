# Publication Fixes — Code Review Report

**Date:** February 25, 2026  
**Scope:** Fixes only — no adds, no scope creep  
**Focus Areas:** Currently Watching UX, Pro propagation, Trivia/FlickWord repeats, Move logic

---

## 1. CURRENTLY WATCHING ROW ON HOME PAGE

### Issue
Buttons on cards in the home-page "Currently Watching" row confuse users. They perform list actions (Want, Watched, Not Interested, Delete) but don’t navigate to the Currently Watching tab. Users see two overlapping concepts: list actions vs. tab navigation.

### Current Implementation
- **File:** `apps/web/src/components/rails/HomeYourShowsRail.tsx`
- Cards use `context="tab-watching"` with full action set:
  - `onWant`, `onWatched`, `onNotInterested`, `onDelete`
- **File:** `apps/web/src/components/cards/CardV2.tsx` lines 326–336
  - For `tab-watching`, `CardActions` shows 4 buttons (Want, Watched, Not Interested, Delete)

### Recommended Fix
1. Introduce a new card context: `home-cw-preview`.
2. In `HomeYourShowsRail.tsx`:
   - Use `context="home-cw-preview"` instead of `context="tab-watching"`.
   - Pass a single navigation action: e.g. `onOpen` or a dedicated callback that triggers `setView("watching")`.
3. In `CardV2.tsx` `CardActions`:
   - For `home-cw-preview`, render only a single "View Currently Watching" (or "Go to Currently Watching") button.
4. Navigation:
   - `HomeYourShowsRail` does not receive `setView`. Options:
     - Dispatch a custom event (e.g. `navigate-to-tab` with payload `"watching"`) that App.tsx listens to.
     - Or pass `onNavigateToTab` from App.tsx into `HomeYourShowsRail` if that fits the existing patterns.

### Files to Touch
- `apps/web/src/components/rails/HomeYourShowsRail.tsx`
- `apps/web/src/components/cards/CardV2.tsx` (new branch in `CardActions`)
- `apps/web/src/App.tsx` (wire navigation: listener or prop)

### Caveat
`CompactPrimaryAction` and `CompactOverflowMenu` are currently disabled in HomeYourShowsRail (`disableOverflow={true}`). With the new context, consider also disabling these if they would reintroduce list actions on the home preview.

---

## 2. PRO vs NON-PRO SETTINGS PROPAGATION

### Issue
Pro status changes (especially via admin) do not propagate reliably. Components that rely on Pro status continue to show the old state after an update.

### Root Cause
Two separate Pro status sources are not aligned:

1. **Billing (primary):** `users/{uid}/billing/status`
   - Read by `getProStatus()` in `proStatus.ts` (via `getBillingStatus()`)
   - Used by: `useProStatus()` hook (games, TabCard, etc.)

2. **Settings:** `users/{uid}/settings.pro`
   - Updated by `manageProStatus` Cloud Function (admin)
   - Loaded on login via `loadSettingsFromFirebase()`
   - Used by: `settings.pro.isPro` in settingsSections, LibraryActions, TabCard, NewPostModal, FlickWordReview, ReplyList, CommentComposer

### Bug
- `manageProStatus` updates only `users/{uid}/settings`, not `users/{uid}/billing/status`.
- `getProStatus()` reads only from `users/{uid}/billing/status`.
- Components using `useProStatus()` therefore never see admin grants.
- Components using `settings.pro.isPro` only see updates after `loadSettingsFromFirebase()` runs (e.g. on login), and the client does not listen for remote settings changes.

### Recommended Fix

**Option A (preferred):** Make `manageProStatus` the single source of truth by writing to both:
1. Keep writing to `users/{uid}/settings` (for backward compatibility).
2. Add a write to `users/{uid}/billing/status` with the same Pro status.

**File:** `functions/src/manageProStatus.ts`

After updating the user document, add:

```ts
// Also update billing/status so proStatus.ts (getBillingStatus) reflects the change
await db.doc(`users/${userId}/billing/status`).set({
  isPro,
  source: isPro ? 'manual' : null,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
}, { merge: true });
```

**Option B (fallback):** In `proStatus.ts`, if billing says `!isPro`, also check `settingsManager.getSettings().pro?.isPro` and treat Pro as true when either source says so. This keeps two sources but avoids ignoring admin grants.

### Additional Cleanup
- Reduce split usage of Pro: standardize on `useProStatus()` (backed by billing) and optionally have Pro gating fall back to `settings.pro` when billing is missing/outdated.
- Ensure `clearBillingCache()` is called after admin changes so the next `getProStatus()` call refetches.

---

## 3. TRIVIA GAME — QUESTION REPETITION

### Issue
Users see repeated questions across games (especially for Pro users with multiple games per day).

### Current Flow
1. **TriviaGame.tsx:** Tries `getCachedTrivia()` first, then supplements from hardcoded pool via `getUniqueQuestionsForGame()` + `filterDuplicates()`.
2. **triviaDedup.ts:** Tracks used question hashes in localStorage; `NO_REPEAT_DAYS = 7`.
3. **triviaApi.ts:** Caches 30 questions per day; Pro games use slices `(gameNumber - 1)*10` to `(gameNumber)*10`.

### Gaps
1. **`NO_REPEAT_DAYS = 7` (triviaDedup.ts line 37):**
   - Short window increases repeats, especially when the pool is small.
   - **Fix:** Restore to 14 or otherwise increase to reduce repetition.

2. **Cache vs. dedup:**
   - `getCachedTrivia()` returns a fixed 30-question set; slices are disjoint only if all 30 are unique.
   - If the API returns fewer than 30 or duplicates, slices can overlap.
   - `filterDuplicates(apiFormatted, usedHashes)` is applied, but if the API set itself has repeats, some users may still see them.

3. **Pool size:**
   - `SAMPLE_TRIVIA_QUESTIONS` is used as fallback; limited size increases overlap risk for Pro users (3×10 per day).

### Recommended Fixes (Fixes Only)
1. In `triviaDedup.ts` line 37:
   - Change `NO_REPEAT_DAYS` from `7` to `14`.
2. In `triviaApi.ts`:
   - When building the daily question set, deduplicate before slicing (e.g. hash-based) so each of the 30 positions is unique.
3. In `TriviaGame.tsx`:
   - Ensure `recordUsedQuestions()` is called with the exact questions shown (including any last-resort force-fill) so dedup history matches reality.

---

## 4. FLICKWORD — WORD REPETITION

### Issue
Same-letter runs and other patterns recur despite previous mitigations.

### Current Logic
- **File:** `apps/web/src/lib/dailyWordApi.ts`
- `getDeterministicWordForDate()`:
  - Avoids recent words and problematic letters.
  - Uses two fallback passes before final fallback.

### Bug (line 230)
```ts
return validWords[baseIndex].toUpperCase();
```
The final fallback returns `validWords[baseIndex]` without checking:
- `problematicLetters`
- `problematicWords`
- Recent words

If `baseIndex` points to a word that fails those checks, it can still be returned and cause repeats or pattern violations.

### Recommended Fix
Replace the final fallback with a pass that explicitly avoids problematic letters and words:

```ts
// Final fallback: find any word not starting with problematic letter
for (let i = 0; i < validWords.length; i++) {
  const idx = (baseIndex + i) % validWords.length;
  const w = validWords[idx].toUpperCase();
  const first = w.charAt(0).toLowerCase();
  if (!problematicLetters.has(first)) {
    return w;
  }
}
return validWords[baseIndex].toUpperCase(); // absolute last resort
```

Or, if the second-pass fallback (lines 193–226) already covers this, extend it so it never falls through to line 230 when `problematicLetters` is non-empty; only use the raw `baseIndex` word when no problematic constraints exist.

---

## 5. MOVE LOGIC — TAB-SPECIFIC ACTIONS

### Current State
Move logic is generally correct for most tabs.

| Tab        | Move to Watching | Move to Want | Move to Watched | Move to Not Interested |
|-----------|------------------|--------------|-----------------|------------------------|
| Want      | ✅ (Library.move) | N/A          | ✅ (onWatched)  | ✅ (onNotInterested)    |
| Watched   | ✅ (Library.move) | ✅ (onWant)  | N/A             | ✅ (onNotInterested)    |
| Discovery | ❌ Bug            | ✅ (onWant)  | ✅ (onWatched)  | ✅ (onNotInterested)    |

### Bug
**File:** `apps/web/src/components/cards/TabCard.tsx` lines 371–382

Discovery tab’s "Watching" button calls `actions?.onWant?.(item)`, which moves to wishlist instead of Currently Watching.

**Fix:**
```ts
onClick={() => {
  if (item.id && item.mediaType) {
    Library.move(item.id, item.mediaType, "watching");
  }
}}
```

Same pattern as the "want" and "watched" tabs.

### Search Results
Search result cards use `handleAction("currently-watching")`; that handler performs `Library.upsert(..., "watching")` (or equivalent). Move logic from search is correct.

### ListPage Actions
ListPage does not provide `onWatching`; it provides `onWant`, `onWatched`, `onNotInterested`, `onDelete`. Discovery uses TabCard with these, so the "Watching" action must use `Library.move` directly in TabCard (as above), not `actions?.onWatching`.

---

## 6. ADDITIONAL OBSERVATIONS

### Pro Status Consistency
- Some components use `settings.pro.isPro` (e.g. settingsSections, LibraryActions, TabCard for bloopers/extras).
- Others use `useProStatus()` (games, TabCard for episode tracking).
- After fixing propagation, consider gradually standardizing on `useProStatus()` for all Pro checks so there is a single source of truth.

### Drag & Drop
- `FORENSIC_QA_RELEASE_READINESS_REPORT.md` notes possible touch/drag issues on mobile.
- Not included in this fixes-only scope but worth testing before release.

### Trivia API Fallback
- When the API fails, TriviaGame falls back to `SAMPLE_TRIVIA_QUESTIONS`.
- Ensure `recordUsedQuestions()` is always called with the final question set so dedup history stays accurate.

---

## 7. FIX PRIORITY ORDER

| # | Fix                             | File(s)                                      | Effort |
|---|---------------------------------|----------------------------------------------|--------|
| 1 | TabCard Discovery "Watching" bug| TabCard.tsx                                 | Low    |
| 2 | Pro propagation (billing update)| manageProStatus.ts                           | Low    |
| 3 | FlickWord final fallback        | dailyWordApi.ts                              | Low    |
| 4 | Trivia NO_REPEAT_DAYS           | triviaDedup.ts                               | Trivial|
| 5 | Home CW preview context         | HomeYourShowsRail, CardV2, App.tsx           | Medium |

---

## 8. SUMMARY

- **Currently Watching home row:** Introduce `home-cw-preview` context and a single "Go to Currently Watching" button; remove list action buttons.
- **Pro propagation:** Make `manageProStatus` also write to `users/{uid}/billing/status` so `getProStatus()` sees admin changes.
- **Trivia repeats:** Increase `NO_REPEAT_DAYS` to 14 and ensure cache/dedup alignment.
- **FlickWord repeats:** Fix final fallback so it respects problematic letters/words.
- **Discovery move logic:** Fix "Watching" button in TabCard to call `Library.move(..., "watching")` instead of `onWant`.

All changes are fixes only; no new features or scope creep.

---

## 9. NEW ISSUES (ADDITIONAL FINDINGS)

These issues were found during a deeper review beyond the original four focus areas.

### 9.1 Trivia Error State UX — Confusing Message While Playing

**File:** `apps/web/src/components/games/TriviaGame.tsx` lines 400–412, 842–847

**Issue:** When question loading fails, the catch block sets `setErrorMessage(ERROR_MESSAGES.game.loadFailed)` but also sets `setGameState("playing")` with fallback questions. The game continues, but `errorMessage` persists. A persistent error banner (`{errorMessage && (...)}`) can show "Couldn't load the game. Try refreshing." while the user is actively playing.

**Fix:** Clear the error message when falling back successfully:
```ts
} catch (error) {
  logErrorDetails('TriviaGame', error, { context: 'loadQuestions' });
  trackGameError('trivia', 'load_questions_failed', { error: String(error) });
  const fallbackQuestions = getUniqueQuestionsForGame(gameNumber, 10);
  setQuestions(fallbackQuestions);
  setGameState("playing");
  setErrorMessage(null);  // Clear - we recovered with fallback
  // ...
}
```

### 9.2 clearBillingCache Never Called on Admin Grant

**File:** `apps/web/src/lib/proStatus.ts`

**Issue:** `clearBillingCache()` is only called in `proUpgrade.ts` after a successful purchase. When an admin grants Pro via `manageProStatus`, the client never clears the billing cache. `useProStatus` refreshes on a 60-second interval, so the user may wait up to 1 minute to see the change—and even then, `getProStatus()` only reads billing, so it will still show false until `manageProStatus` also writes to billing (see §2).

**Fix:** After fixing `manageProStatus` to write to billing (§2), add a mechanism for the client to invalidate the cache when it learns of an admin change. Options: (a) Admin UI could call a small client-side hook to clear cache and refetch after granting; or (b) implement a Firestore listener on `users/{uid}/billing/status` to trigger `clearBillingCache()` when the document changes.

### 9.3 Dual Pro Sources — Inconsistent UI

**Files:** Multiple (LibraryActions, TabCard, NewPostModal, etc.)

**Issue:** Some components use `useProStatus()` (billing), others use `settings.pro.isPro` (settings). For example:
- LibraryActions lines 318–324: `settings.pro.isPro` for episode tracking enable/disable
- TabCard: `useProStatus()` for games/episode tracking, `settings.pro.features` for bloopers/extras
- NewPostModal, CommentComposer, ReplyList: `settings.pro.isPro`

If billing and settings disagree (e.g. admin updated settings but not billing), different parts of the UI will show different Pro states.

**Fix:** Standardize on `useProStatus()` for all Pro checks. After `manageProStatus` writes to both settings and billing (§2), ensure `getProStatus()` remains the single source—or have it fall back to `settings.pro.isPro` when billing is false and settings says true.

### 9.4 TabCard Discovery Case — Possibly Dead Code

**File:** `apps/web/src/components/cards/TabCard.tsx`

**Issue:** `getTabSpecificActions()` has a `case "discovery"`, but `ListPage` is never rendered with `mode="discovery"`. The Discovery view uses `DiscoveryPage`, which renders `CardV2` directly, not `ListPage`/`TabCard`. So the TabCard discovery branch may be unreachable.

**Recommendation:** Fix the "Watching" button bug in that case (§5) for correctness. Consider removing the discovery case if it remains unused, or add a comment that it exists for future use.

### 9.5 Returning Tab — No Explicit Action Buttons

**File:** `apps/web/src/components/cards/TabCard.tsx`

**Issue:** `getTabSpecificActions()` has no `case "returning"`. Returning falls through to `default`, which returns `null`, so no action buttons are rendered. Returning shows are from the watching list; users may expect Want/Watched/Not Interested as on the watching tab.

**Assessment:** Returning items are in watching; they may rely on `LibraryActions` or swipe. Verify whether the lack of buttons is intentional. If users need list actions on Returning, add a `case "returning"` that reuses the watching actions.

### 9.6 Firebase saveToFirebase — Silent Failure on Network Error

**File:** `apps/web/src/lib/firebaseSync.ts` lines 185–191

**Issue:** On `saveToFirebase` failure, the catch block logs and returns `false` but does not surface the error to the user. `syncToFirebase` is debounced and fire-and-forget. Users are not told when sync fails, so they may assume their data is backed up when it is not.

**Fix (minor):** Consider dispatching a non-intrusive event (e.g. `sync:failed`) that a global indicator can use to show "Sync failed—will retry" or similar. Avoid blocking the UI.

### 9.7 FlickWord Cache Version — No Migration on Mismatch

**File:** `apps/web/src/lib/dailyWordApi.ts` lines 313–317

**Issue:** When cache version mismatches, the code removes the key and falls through to fetch a new word. The new word is then cached with the current version. This is correct, but there is no explicit migration for user data. For cache keys, this is likely fine; document for completeness.

---

## 10. UPDATED FIX PRIORITY

| # | Fix                               | File(s)                    | Effort   |
|---|-----------------------------------|----------------------------|----------|
| 1 | TabCard Discovery "Watching" bug | TabCard.tsx                | Low      |
| 2 | Pro propagation (billing update) | manageProStatus.ts         | Low      |
| 3 | FlickWord final fallback         | dailyWordApi.ts            | Low      |
| 4 | Trivia NO_REPEAT_DAYS            | triviaDedup.ts             | Trivial  |
| 5 | Trivia error UX (clear on fallback) | TriviaGame.tsx          | Trivial  |
| 6 | Home CW preview context          | HomeYourShowsRail, CardV2, App.tsx | Medium |
| 7 | Billing cache on admin grant     | proStatus + admin flow     | Low (if §2 done) |
