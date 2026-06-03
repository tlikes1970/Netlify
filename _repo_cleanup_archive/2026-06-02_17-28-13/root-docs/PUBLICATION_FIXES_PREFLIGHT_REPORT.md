# Publication Fixes — Preflight Review Report (READ-ONLY)

**Date:** February 25, 2026  
**Scope:** Validation before implementation  
**Task:** Confirm file locations, secondary surfaces, architecture fit, risks, verification checklist

---

## To-Do List Validated

1. **Currently Watching home rail UX** — Remove card buttons, add single "Go to Currently Watching" button  
2. **Pro propagation** — manageProStatus also write to billing/status  
3. **Trivia repeats** — NO_REPEAT_DAYS = 14, API dedup, recordUsedQuestions alignment  
4. **FlickWord repeats** — Fix final fallback to respect problematic letters/words  
5. **Discovery move bug** — TabCard "Watching" button calls onWant (wishlist) instead of watching  
6. **Trivia error banner** — Clear error when falling back successfully  

---

## Section 1: Currently Watching Home Rail UX

### 1.1 File/Location Confirmation

| Location | Status | Notes |
|----------|--------|------|
| `HomeYourShowsRail.tsx` | ✅ Exists | Lines 18–29: CardV2 with `context="tab-watching"`, `disableSwipe={true}`, `disableOverflow={true}` |
| `CardV2.tsx` lines 326–336 | ✅ Matches | CardActions for `tab-watching` shows 4 buttons (Want, Watched, Not Interested, Delete) |
| `card.types.ts` CardContext | ⚠️ Update needed | Type does NOT include `home-cw-preview` — must add |

### 1.2 Secondary UI Action Surfaces

| Surface | Location | Could Undermine Fix? |
|---------|----------|----------------------|
| **CompactPrimaryAction** | CardV2 lines 209–215 | Gate: `isCompactMobileV1()` + `isActionsSplit`. If both true, shows primary action. For `context='tab'` (derived from tab-watching), `getPrimaryAction` uses `item.status` — watching items get "Mark Watched". **Yes** — would still show list action when flags are on. |
| **CompactOverflowMenu** | CardV2 lines 214–218 | **No** — `disableOverflow={true}` hides it. |
| **SwipeableCard** | CardV2 lines 228–239 | **No** — `disableSwipe={true}` skips wrapper; card renders without swipe. |
| **MyListToggle** | CardV2 lines 121–131 | **Yes** — `showMyListBtn` is true for `tab-watching`. Opens ListSelectorModal for list changes. Would still allow list changes from poster overlay. |
| **Poster onClick** | CardV2 lines 91–99 | Opens TMDB link — no list action. |

**Hidden-surfaces summary:** With `home-cw-preview`, must either:
- Exclude `home-cw-preview` from `showMyListBtn`, or
- Pass `currentListContext` so MyListToggle shows "My List +" and the single CTA is the only list-related action.
- For CompactPrimaryAction: when context is `home-cw-preview`, `getPrimaryAction` must not return a list action, or CompactPrimaryAction must be disabled for this context.

### 1.3 Architecture Pattern Match

- **Navigation:** App uses `setView(tab)` and listens for `pushstate`/`popstate`. No existing `navigate-to-tab` event. Sections use `onChange` with `setView`.  
- **Suggested approach:** Add `navigate-to-tab` custom event from HomeYourShowsRail; App subscribes and calls `setView(detail.tab)`. Matches existing `onboarding:navigate-to-search`, `navigate-to-settings-section`.

### 1.4 Risks and Gotchas

- Adding `home-cw-preview` to CardContext may affect `shouldShowMembershipBadge` and `getListContextFromCardContext` — ensure default branches handle it.
- HomeYourShowsRail is rendered inside Section (App.tsx ~1618); it does not receive `setView` or any callback. Custom event is the only prop-free option unless Section/App is refactored to pass a callback.

### 1.5 Verification Checklist

- [ ] Add `home-cw-preview` to CardContext in card.types.ts  
- [ ] HomeYourShowsRail: `context="home-cw-preview"`, pass `onOpen` or fire `navigate-to-tab`  
- [ ] CardV2 CardActions: add `if (context === 'home-cw-preview')` with single nav button  
- [ ] App.tsx: add listener for `navigate-to-tab` → `setView(detail.tab)`  
- [ ] Ensure MyListToggle and CompactPrimaryAction do not reintroduce list actions for home-cw-preview  
- [ ] Manually: home rail shows one button; button switches to Watching tab  

---

## Section 2: Pro Propagation

### 2.1 Firestore Paths

| Component | Path | Confirmed |
|-----------|------|-----------|
| **manageProStatus** (Cloud Function) | `users/{userId}` document, field `settings` (nested: `settings.pro`) | ✅ `userRef.set({...existingData, settings: updatedSettings}, {merge: true})` — writes to user doc |
| **getBillingStatus** (client) | `users/{userId}/billing/status` | ✅ `doc(db, 'users', userId, 'billing', 'status')` — subcollection `billing`, doc `status` |
| **Proposed write** | `users/{userId}/billing/status` | Same path as getBillingStatus ✅ |

### 2.2 Will Billing Write Be Read Without Other Changes?

**Yes.** `getBillingStatus()` reads `doc(db, 'users', userId, 'billing', 'status')`. Writing that document from manageProStatus will be visible on the next read.

**Caveats:**
- **Cache:** `getProStatus()` uses `billingCache` (60s TTL). After the write, the client may still use cached `{isPro: false}` for up to 60 seconds.
- **No listener:** Client does not listen for Firestore changes on billing/status. User must wait for next `getProStatus()` (interval or settings change). Optional improvement: Firestore listener to call `clearBillingCache()` on change.

### 2.3 Cloud Function Write Syntax

Report proposes:
```ts
await db.doc(`users/${userId}/billing/status`).set({
  isPro,
  source: isPro ? 'manual' : null,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
}, { merge: true });
```

**Issue:** `admin` is not imported in `manageProStatus.ts`. Use:
```ts
import { FieldValue } from 'firebase-admin/firestore';
// ...
updatedAt: FieldValue.serverTimestamp(),
```

### 2.4 Verification Checklist

- [ ] Add `import { FieldValue } from 'firebase-admin/firestore'` (or equivalent)
- [ ] After user doc update, add billing write:
  `db.collection('users').doc(userId).collection('billing').doc('status').set({...}, {merge: true})`
- [ ] Deploy function and test admin grant
- [ ] Confirm: within ~60s or after settings change, useProStatus reflects Pro
- [ ] Optional: Admin UI calls `clearBillingCache()` after grant to force immediate refresh

---

## Section 3: Trivia Repeats

### 3.1 NO_REPEAT_DAYS

| Location | Value | Confirmed |
|----------|-------|-----------|
| `triviaDedup.ts` line 37 | `NO_REPEAT_DAYS = 7` | ✅ |

### 3.2 Hash Computation

| Location | Function | Notes |
|----------|----------|-------|
| `triviaDedup.ts` lines 48–65 | `hashQuestion(questionText)` | Normalizes (lowercase, trim, whitespace, punctuation), djb2 hash, `.toString(36)` ✅ |
| Used by | `getUsedQuestionHashes`, `selectUniqueQuestions`, `filterDuplicates`, `recordUsedQuestions` | ✅ |

### 3.3 recordUsedQuestions() Call Sites

| Location | When | Confirmed |
|----------|------|-----------|
| `TriviaGame.tsx` line 480 | `handleNextQuestion` when last question answered (game complete) | ✅ `recordUsedQuestions(currentGame, questions)` |
| Error catch path (lines 400–412) | Fallback questions loaded | Does NOT call recordUsedQuestions at load time — correct. Recording happens at game completion. ✅ |

### 3.4 API Dedup-Before-Slicing

| Location | Behavior | Dedup? |
|----------|----------|--------|
| `triviaApi.ts` lines 484–489 | Accumulating from API: `existingQuestions = new Set(allApiQuestions.map(q => q.question))`; adds only if `!existingQuestions.has(q.question)` | ✅ Dedup by exact question text |
| `triviaApi.ts` lines 522–524 | Fallback: `existingQuestionTexts = new Set(apiQuestions.map(q => q.question))`; filters `!existingQuestionTexts.has(q.question)` | ✅ Fallback does not duplicate API questions |
| `triviaApi.ts` lines 595–598 | `finalQuestions.slice(startIndex, endIndex)` | No hash-based dedup before slice. Dedup is by exact string. Slightly different punctuation could allow duplicates. |

**Conclusion:** API path dedupes by exact `question` string. Hash-based dedup (like triviaDedup) would be stricter but is not currently used in triviaApi. Report’s “deduplicate before slicing” would mean applying `hashQuestion`+Set before slicing; current logic is acceptable but not as strict as triviaDedup.

### 3.5 Verification Checklist

- [ ] triviaDedup.ts line 37: `NO_REPEAT_DAYS = 14`
- [ ] (Optional) triviaApi: dedup `finalQuestions` by `hashQuestion` before slicing
- [ ] Pro flow: play 3 games in one day, confirm no duplicate questions
- [ ] Regular flow: play 1 game, confirm no duplicates from prior 14 days

---

## Section 4: FlickWord Repeats

### 4.1 Final Fallback

| Location | Code | Confirmed |
|----------|------|-----------|
| `dailyWordApi.ts` line 230 | `return validWords[baseIndex].toUpperCase();` | ✅ |

### 4.2 Does It Bypass Checks?

**Yes.** The final fallback (line 230) returns `validWords[baseIndex]` with no checks for:
- `problematicLetters`
- `problematicWords`
- `chronologicalRecentWords`

The second-pass fallback (lines 192–226) does check these but can exhaust `maxAttempts` and fall through to line 230 without finding a valid candidate.

### 4.3 Proposed Fix Accuracy

The suggested loop (find first word not starting with problematic letter) is correct. The second-pass fallback already covers `problematicWords` and `problematicLetter` patterns; the final fallback is the only path that bypasses them.

### 4.4 Verification Checklist

- [ ] Add loop before line 230 to skip words starting with `problematicLetters`
- [ ] Keep `return validWords[baseIndex].toUpperCase()` as last resort
- [ ] Simulate or play 5+ consecutive days, confirm no same-letter runs

---

## Section 5: Discovery Move Bug

### 5.1 Current Handler

| Location | Code | Route |
|----------|------|-------|
| `TabCard.tsx` lines 371–382 | `onClick={() => actions?.onWant?.(item)}` | onWant → wishlist ✅ |

Label shows "Watching" / `translations.currentlyWatchingAction`, but handler is `onWant` → **confirmed bug.**

### 5.2 ListPage Actions

ListPage (lines 717–735) provides `onWant`, `onWatched`, `onNotInterested`, `onDelete` — **no `onWatching`.** TabCard must use `Library.move` directly, same as want/watched tabs.

### 5.3 Is TabCard Discovery Reachable?

Discovery view renders `DiscoveryPage`, which uses `CardV2` (not ListPage/TabCard). ListPage is never used with `mode="discovery"`, so TabCard’s `case "discovery"` is currently dead. Fix is still correct for future use or if routing changes.

### 5.4 Verification Checklist

- [ ] TabCard.tsx lines 371–382: replace `actions?.onWant?.(item)` with  
  `if (item.id && item.mediaType) Library.move(item.id, item.mediaType, "watching");`
- [ ] TabCard already imports Library (line 5) — no import change needed
- [ ] If discovery ever uses ListPage+TabCard, verify Watching moves to watching list

---

## Section 6: Trivia Error Banner

### 6.1 Current Behavior

| Location | Code | Confirmed |
|----------|------|-----------|
| `TriviaGame.tsx` lines 400–412 | catch: `setErrorMessage(ERROR_MESSAGES.game.loadFailed)`, `setQuestions(fallbackQuestions)`, `setGameState("playing")` — no `setErrorMessage(null)` | ✅ |
| Success path lines 390–392 | `setErrorMessage(null)` called before play | ✅ |
| `TriviaGame.tsx` lines 842–847 | `{errorMessage && (...)}` renders banner | ✅ |

Error is set but not cleared when fallback succeeds; banner persists during play even though the game runs normally.

### 6.2 Fix

Add `setErrorMessage(null)` in the catch block after setting fallback questions and `setGameState("playing")`.

### 6.3 Verification Checklist

- [ ] In catch block, add `setErrorMessage(null)` before or with `setGameState("playing")`
- [ ] Simulate API failure, confirm game plays with fallback and no error banner

---

## Recommended Implementation Order

| Order | Fix | Rationale |
|-------|-----|-----------|
| 1 | TabCard Discovery "Watching" bug | Simple, localized, no dependencies |
| 2 | Trivia error banner (setErrorMessage null) | One-line fix |
| 3 | Trivia NO_REPEAT_DAYS = 14 | One-line fix |
| 4 | FlickWord final fallback | Localized, no dependencies |
| 5 | Pro propagation (manageProStatus → billing) | Enables correct Pro UX, no client changes |
| 6 | Home CW preview context | Most complex; touches CardV2, types, App, HomeYourShowsRail |

---

## Final Recommendation

**Proceed with plan.** All referenced files and lines exist and match the described behavior. Adjustments:

1. **Pro propagation:** Use `FieldValue` from `firebase-admin/firestore`, not `admin.firestore.FieldValue`.
2. **Home rail:** Add `home-cw-preview` to CardContext; handle MyListToggle and CompactPrimaryAction so they do not reintroduce list actions.
3. **TabCard Discovery:** Fix is correct even if branch is currently dead.

**Defer to post-launch:** triviaApi hash-based dedup, Firestore listener for billing, and full Pro-source standardization.
