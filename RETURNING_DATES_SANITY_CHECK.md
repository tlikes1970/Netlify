# Returning / Up Next Sanity Check Guide

**Purpose:** Quick verification that the new date validation rules work as intended  
**Status:** Ready for manual testing

---

## Quick Code Review ✅

**Validation Logic:**
- ✅ `getValidatedNextAirDate()` rejects past dates (line 38)
- ✅ `getValidatedNextAirDate()` rejects dates >365 days (line 42)
- ✅ `HomeUpNextRail` filters out Ended/Canceled shows (line 22-25)
- ✅ Both selectors use validated dates consistently
- ✅ Sorting prioritizes "soon" dates first

**Code looks correct.** Now verify with real data.

---

## A. Home → Up Next Rail

### 1. No Past Dates Show

**Test:**
- Look for any show that previously showed a date like "Returns Jan 2024" or any date in the past
- **Expected:** Either:
  - Show disappears from Up Next rail entirely, OR
  - Show appears but shows "TBA" or status-based label ("Returning Soon") instead of the old date

**How to verify:**
1. Open Home page
2. Scroll to "Up Next" rail
3. Check each show's date label
4. If you see a date, verify it's in the future (not last month/year)

**Code path:** `HomeUpNextRail.tsx:35` filters out shows where `airStatus === 'tba'`, which includes past dates.

---

### 2. No Obviously-Too-Far Future Dates

**Test:**
- Look for any show showing dates like "2027" or more than 1 year away
- **Expected:** Either:
  - Show is treated as TBA (shows "TBA" or status label), OR
  - Show is excluded from Up Next rail

**How to verify:**
1. Check Up Next rail
2. If a show has a date, calculate: Is it more than 365 days from today?
3. If yes, it should show as TBA or be excluded

**Code path:** `metadata.ts:42` rejects dates >365 days, treating them as TBA.

---

### 3. Ended / Canceled Shows

**Test:**
- Find a show in your library marked "Ended" or "Canceled"
- Check if it appears in Up Next rail
- **Expected:** Should NOT appear, even if TMDB still has a stale `next_episode_to_air` date

**How to verify:**
1. Find a show with status "Ended" or "Canceled" in your library
2. Check if it appears in Up Next rail
3. If it does, that's a bug (should be filtered out)

**Code path:** `HomeUpNextRail.tsx:22-25` filters out shows where `isCompleted === true`.

---

### 4. Sorting

**Test:**
- Look at shows with known upcoming episodes
- **Expected:**
  - Shows within ~2 weeks appear at the very top ("soon" status)
  - Shows further out but <1 year appear after those ("future" status)
  - Alphabetical tie-break when dates are similar

**How to verify:**
1. Identify 2-3 shows with known upcoming dates:
   - One within 14 days
   - One 15-30 days away
   - One 2-3 months away
2. Check their order in Up Next rail
3. "Soon" dates should be first, then "future" dates

**Code path:** `HomeUpNextRail.tsx:36-45` sorts by status ("soon" first), then by date.

---

## B. Returning Shows Rail / View

### 1. Shows with Valid Dates

**Test:**
- Find shows with confirmed return dates
- **Expected:**
  - Dates within 14 days: Show humanized text ("Today", "Tomorrow", "In 3 days")
  - Dates 15-365 days: Show formatted date ("Jan 14")
  - No year shown for dates within 1 year

**How to verify:**
1. Find a show returning within 14 days
2. Check if it shows "Today", "Tomorrow", or "In X days"
3. Find a show returning 1-2 months away
4. Check if it shows "Jan 14" format (no year)

**Code path:** `UpNextCard.tsx:68-82` uses `getHumanizedAirDate()` for "soon" dates, `formatUpNextDate()` for "future" dates.

---

### 2. TBA Behavior

**Test:**
- Find shows with no usable date (truly TBA)
- **Expected:**
  - Shows as "TBA" or status-based label ("Returning Soon", "In Production")
  - Only appears where TBA is expected (not in "next X days" logic)

**How to verify:**
1. Find a show with status "Returning Series" but no `nextAirDate`
2. Check if it shows "TBA" or "Returning Soon"
3. Verify it doesn't appear in dated lists (only in TBA section)

**Code path:** `useReturningShows.ts:55` filters out TBA shows (only shows with confirmed dates).

---

### 3. No Stale-Corpse Dates

**Test:**
- Look for any show showing a date that's clearly in the past
- **Expected:** Should NOT show "returns [old date]" - should show TBA or be excluded

**How to verify:**
1. Check all shows in Returning/Up Next rails
2. If any show has a date, verify it's not in the past
3. Past dates should be filtered out automatically

**Code path:** `metadata.ts:38` rejects past dates in `getValidatedNextAirDate()`.

---

## Quick Test Checklist

Print this and check off as you test:

- [ ] No past dates visible in Up Next rail
- [ ] No dates >1 year visible (treated as TBA)
- [ ] Ended/Canceled shows don't appear in Up Next
- [ ] "Soon" dates (within 14 days) appear first
- [ ] "Future" dates (15-365 days) appear after "soon"
- [ ] Humanized dates work ("Today", "Tomorrow", "In X days")
- [ ] Formatted dates work ("Jan 14" for far dates)
- [ ] TBA shows show appropriate labels
- [ ] No stale dates from months/years ago

---

## If Something Looks Wrong

**Common issues to check:**

1. **Past date still showing:**
   - Check if `getValidatedNextAirDate()` is being called
   - Verify the date is actually in the past (timezone issues?)

2. **Ended show still appearing:**
   - Check if `getShowStatusInfo()?.isCompleted` is working
   - Verify the show's `showStatus` field is set correctly

3. **Sorting looks wrong:**
   - Check if `airStatus` is being calculated correctly
   - Verify dates are being compared properly

4. **TBA shows appearing in dated lists:**
   - Check if filter `airStatus !== 'tba'` is working
   - Verify `getNextAirStatus()` is returning 'tba' for invalid dates

---

## Expected Behavior Summary

| Scenario | Up Next Rail | Returning Shows | Display |
|----------|-------------|-----------------|---------|
| Past date | ❌ Excluded | ❌ Excluded | N/A |
| Date >365 days | ❌ Excluded (TBA) | ❌ Excluded (TBA) | "TBA" or status label |
| Date within 14 days | ✅ Included | ✅ Included | "Today/Tomorrow/In X days" |
| Date 15-365 days | ✅ Included | ✅ Included | "Jan 14" |
| No date (TBA) | ✅ Included (if active) | ❌ Excluded | "TBA" or status label |
| Ended/Canceled | ❌ Excluded | ❌ Excluded | N/A |

---

**Ready for testing!** ✅


