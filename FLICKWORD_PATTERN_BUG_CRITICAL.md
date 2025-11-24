# CRITICAL: FlickWord Pattern Detection Bug

**Severity:** CRITICAL - Game-Breaking  
**Status:** IDENTIFIED - Fix In Progress

---

## Issue Summary

The word selection algorithm creates **predictable patterns** that make the game solvable:

1. **Alphabetical Order:** Words appear in alphabetical order (VALUE, VIRUS, VOICE, WATER, WHICH, WHOLE)
2. **Repeated First Letters:** Same first letter appears multiple times consecutively (V, V, V then W, W, W)
3. **Predictable Sequences:** Base index calculation selects sequential words from alphabetically-sorted array

---

## Root Causes

### 1. Base Index Creates Sequential Patterns
**File:** `apps/web/src/lib/dailyWordApi.ts`  
**Line:** 78

```typescript
// OLD (BROKEN):
const baseIndex = (cycleDay * 3 + (gameNumber - 1)) % validWords.length;
```

**Problem:** 
- `validWords` array is alphabetically sorted
- Sequential dates create sequential indices
- Results in alphabetical word sequences

**Fix Applied:**
```typescript
// NEW (FIXED):
const seed1 = cycleDay * 7919; // Large prime
const seed2 = (gameNumber - 1) * 9973; // Another large prime
const combinedSeed = (seed1 + seed2) % validWords.length;
const baseIndex = combinedSeed;
```

---

### 2. Pattern Detection Not Aggressive Enough
**File:** `apps/web/src/lib/dailyWordApi.ts`  
**Lines:** 59-95

**Problems:**
- Only checked last 2-3 days for patterns
- Didn't check if WORDS themselves are alphabetical (only first letters)
- Didn't prevent ALL repeated first letters

**Fixes Applied:**
- ✅ Check if WORDS are in alphabetical order (not just first letters)
- ✅ NEVER allow repeated first letters (even once)
- ✅ Check last 3+ words for alphabetical patterns
- ✅ Prevent continuing alphabetical sequences

---

### 3. Progressive Building Logic Issue
**File:** `apps/web/src/lib/dailyWordApi.ts`  
**Lines:** 16-41

**Problem:**
When building `recentWords` progressively, the order might be incorrect, causing pattern detection to fail.

**Status:** Needs verification

---

## Requirements (From User)

1. ✅ **No repeated first letters** - Even once is not allowed
2. ✅ **No alphabetical order** - Words cannot be in alphabetical order
3. ✅ **No patterns** - ANY predictable pattern must be prevented

---

## Test Results

### Before Fix:
- VALUE, VIRUS, VOICE, WATER, WHICH, WHOLE
- ❌ Alphabetical order
- ❌ Repeated first letters (V, V, V and W, W, W)

### After Fix (Testing):
- CRASH, MARIA, ADOPT, AWAKE, GIVEN, AFTER, ACUTE, CRUDE, MIGHT, ADULT
- ✅ Not alphabetical
- ⚠️ Still has repeated first letters (A, A and A, A)

---

## Remaining Issues

1. **Repeated First Letters Still Occurring**
   - ADOPT (A) → AWAKE (A) ❌
   - AFTER (A) → ACUTE (A) ❌
   
2. **Progressive Building May Have Bug**
   - Need to verify `getRecentWords()` correctly tracks selections
   - May need to fix order or logic

---

## Next Steps

1. Fix progressive building to ensure no repeated first letters
2. Add more aggressive pattern detection
3. Test with comprehensive pattern detection
4. Verify no patterns emerge in 30+ day test

---

**Status:** ⚠️ CRITICAL BUG - Pattern detection fixes applied but not fully working. Need to fix progressive building logic.

