# Next-Air-Date Implementation Summary

**Branch:** `next-air-date`  
**Date:** Implementation complete  
**Status:** ✅ All fixes applied, TypeScript compiles, no linting errors

---

## Files Modified

### 1. `apps/web/src/lib/constants/metadata.ts`

**Changes:**
- ✅ Added `getValidatedNextAirDate()` - Validates dates (rejects past dates and dates >365 days)
- ✅ Added `getNextAirStatus()` - Returns "soon", "future", or "tba" based on date
- ✅ Added `NextAirStatus` type export
- ✅ Updated `getDisplayAirDate()` - Now uses validated dates
- ✅ Added `formatUpNextDate()` - Centralized formatting for UpNextCard (no year)
- ✅ Added `getHumanizedAirDate()` - Returns relative dates ("Today", "Tomorrow", "In X days") or formatted date

**Key Logic:**
- Past dates → rejected (return null)
- Dates >365 days → rejected (treated as TBA)
- Dates within 14 days → status "soon"
- Dates 15-365 days → status "future"
- No date → status "tba"

---

### 2. `apps/web/src/state/selectors/useReturningShows.ts`

**Changes:**
- ✅ Imports new validation functions
- ✅ Filters out shows with `airStatus === 'tba'` (only shows with confirmed dates)
- ✅ Updated sorting logic:
  - "soon" dates first
  - Then "future" dates
  - Then alphabetical for undated (shouldn't happen now due to filter)
- ✅ Uses validated dates for all comparisons

**Behavior:**
- Only includes shows with `status === "Returning Series"` AND valid future dates
- Excludes TBA shows (no confirmed date)
- Excludes past dates automatically

---

### 3. `apps/web/src/components/rails/HomeUpNextRail.tsx`

**Changes:**
- ✅ Imports validation functions
- ✅ Filters out completed shows (Ended/Canceled) - even if they have dates
- ✅ Uses validated dates instead of raw `nextAirDate` checks
- ✅ Filters out stale dates (past dates automatically excluded)
- ✅ Filters out dates >365 days (treated as TBA)
- ✅ Updated sorting:
  - "soon" dates first
  - Then "future" dates
  - Then TBA shows by status priority

**Behavior:**
- Only shows active TV shows (not Ended/Canceled)
- Only shows shows with valid future dates (or TBA)
- Excludes past dates
- Excludes dates too far in future (>365 days)

---

### 4. `apps/web/src/components/cards/UpNextCard.tsx`

**Changes:**
- ✅ Imports validation and formatting functions
- ✅ Removed duplicate `formatAirDate()` function
- ✅ Uses centralized `formatUpNextDate()` and `getHumanizedAirDate()`
- ✅ Updated `getStatusMessage()`:
  - "soon" dates → "Up Next: Today/Tomorrow/In X days"
  - "future" dates → "Up Next: Jan 14" (formatted)
  - TBA → Status-based label ("Returning Soon", etc.)
- ✅ Updated `getStatusColor()`:
  - Uses validated date instead of raw `nextAirDate`
  - Green for "soon" dates
  - Blue for "future" dates
  - Status colors for TBA

**Behavior:**
- Shows humanized dates for near-future episodes ("Today", "Tomorrow", "In 3 days")
- Shows formatted dates for far-future episodes ("Jan 14")
- Shows status labels for TBA shows
- Never displays stale/past dates

---

## Fixes Applied

### ✅ 1. Centralized next-air-date logic
- Single source of truth: `getValidatedNextAirDate()`
- All components use the same validation
- Consistent date handling across the app

### ✅ 2. Stale-date handling
- Past dates automatically rejected
- Dates >365 days treated as TBA
- No stale dates shown to users

### ✅ 3. Returning-window logic
- `RETURNING_NEAR_WINDOW_DAYS = 14` now actively used
- "soon" status for dates within 14 days
- Prioritized sorting (soon first)
- TBA shows handled separately

### ✅ 4. Selector inconsistencies fixed
- `useReturningShows`: Filters by status AND validates dates
- `HomeUpNextRail`: Filters by status AND validates dates
- Both exclude Ended/Canceled shows
- Both exclude past dates
- Consistent behavior across components

### ✅ 5. UI inconsistency fixed
- Single formatting function: `formatUpNextDate()`
- Single humanization function: `getHumanizedAirDate()`
- Consistent date display across all components
- No duplicate formatting logic

### ⚠️ 6. Auto-refresh mechanism
- **NOT IMPLEMENTED** - This requires a background job or periodic refresh
- Current behavior: Dates only update when show is added to library
- **Recommendation:** Add refresh mechanism in separate PR/phase

---

## Testing Checklist

- [ ] Verify past dates are filtered out
- [ ] Verify dates >365 days are treated as TBA
- [ ] Verify "soon" dates show humanized format ("Today", "Tomorrow", "In X days")
- [ ] Verify "future" dates show formatted date ("Jan 14")
- [ ] Verify TBA shows show status labels
- [ ] Verify Ended/Canceled shows don't appear in Up Next
- [ ] Verify sorting: soon first, then future, then TBA
- [ ] Verify `useReturningShows` only shows shows with valid dates
- [ ] Verify `HomeUpNextRail` filters correctly

---

## Breaking Changes

**None** - All changes are backward compatible:
- Existing date fields still work
- Validation is additive (doesn't break existing data)
- UI changes are improvements, not removals

---

## Next Steps (Future)

1. **Auto-refresh mechanism:**
   - Add periodic refresh for `nextAirDate` fields
   - Or refresh on app open
   - Or refresh when date becomes stale (>30 days old)

2. **Enhanced date display:**
   - Consider showing "Aired X days ago" for past dates (if needed)
   - Consider showing year for dates >1 year away

3. **Performance:**
   - Consider memoizing date validations
   - Consider batch date validation

---

## Summary

All surgical fixes have been applied successfully:
- ✅ Centralized date validation
- ✅ Stale date filtering
- ✅ Window-based logic
- ✅ Consistent selectors
- ✅ Unified UI formatting
- ⚠️ Auto-refresh deferred (requires separate implementation)

**TypeScript:** ✅ Compiles  
**Linting:** ✅ No errors  
**Ready for:** Testing and validation











