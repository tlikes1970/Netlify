# D3 – Mobile Feature Gaps

## Summary

Completed mobile UX pass focused on pull-to-refresh, search bar stability, greeting readability, and safe-area verification.

---

## Pull-to-refresh

**Status:** ✅ Complete

**Screens with pull-to-refresh:**

- ✅ Home / For You (already had it)
- ✅ Search Results (already had it)
- ✅ Currently Watching (added)
- ✅ Want to Watch (added)
- ✅ Watched (added)
- ✅ Returning (added)
- ✅ Community feed (added via force-refresh event listener)

**Implementation:**

- Used existing `PullToRefreshWrapper` component
- Wrapped ListPage views in App.tsx
- Added `force-refresh` event listener to CommunityPanel to trigger `fetchPosts(true)` on refresh
- All refresh handlers dispatch `force-refresh` event for components that need it

**Games:** Not added (games are modals, not scrollable lists that need refresh)

---

## One-handed adjustments

**Status:** ✅ Verified - No changes needed

**Findings:**

- Primary navigation (MobileTabs) is already at bottom with proper safe-area handling
- ListPage filters/sort controls are secondary actions at top (appropriate for discovery/filtering)
- Primary actions (viewing items, adding to lists) are on cards within scrollable lists
- No key mobile screens have primary actions stranded in top-right corners

**Touch targets:** Verified sufficient (44px+ where needed)

---

## Search bar behavior

**Status:** ✅ Fixed

**Issue:** Search bar could cause layout jumpiness on focus/blur

**Fix:**

- Added `minHeight: "48px"` to sticky search bar container
- Ensures stable height regardless of focus state
- Prevents content shifting when keyboard appears

**Before:** Search bar container could resize on focus
**After:** Stable height prevents jumpiness

---

## Greeting readability

**Status:** ✅ Fixed

**Issue:** Snarky greeting was truncated to `max-w-[100px]` on mobile, making it hard to read

**Fix:**

- Removed `truncate` and `max-w-[100px]` constraints on mobile
- Added `wordBreak: 'break-word'` for proper wrapping
- Added `lineHeight: '1.4'` for better readability
- Kept truncation on desktop (`md:truncate md:max-w-none`)

**Before:** Greeting truncated to 100px width, often cut off
**After:** Full-width with proper word wrapping, readable on small screens

---

## Safe-area insets

**Status:** ✅ Verified - Already properly implemented

**Verified areas:**

- ✅ **MobileTabs** (bottom nav): Uses `env(safe-area-inset-bottom)` in padding
- ✅ **SettingsSheet**: Uses `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` in CSS
- ✅ **SettingsSheet body**: Has visualViewport handling for keyboard + safe-area

**Implementation locations:**

- `apps/web/src/components/MobileTabs.tsx` - Line 202: `paddingBottom: 'calc(8px + env(safe-area-inset-bottom))'`
- `apps/web/src/styles/settings-sheet.css` - Multiple safe-area references
- `apps/web/src/components/settings/SettingsSheet.tsx` - Visual viewport handling

**No changes needed:** Safe-area handling is consistent and properly implemented across mobile components.

---

## Known follow-ups

- [ ] Test pull-to-refresh on actual iOS devices to verify gesture recognition
- [ ] Monitor for any edge cases with search bar height on different mobile browsers
- [ ] Consider adding pull-to-refresh to MyListsPage if it becomes scrollable with many lists

---

## Files Modified

1. `apps/web/src/App.tsx` - Added PullToRefreshWrapper to ListPage views
2. `apps/web/src/components/CommunityPanel.tsx` - Added force-refresh event listener
3. `apps/web/src/components/SnarkDisplay.tsx` - Improved mobile readability
4. `apps/web/src/components/FlickletHeader.tsx` - Added stable min-height to search bar

---

## Testing Recommendations

1. **Pull-to-refresh:**
   - Test on iOS Safari (most critical)
   - Test on Android Chrome
   - Verify it doesn't interfere with normal scrolling
   - Check that refresh actually updates data

2. **Search bar:**
   - Focus/unfocus search on mobile
   - Verify no layout shift
   - Test with keyboard appearing/disappearing

3. **Greeting:**
   - Check on small mobile viewports (320px width)
   - Verify text wraps properly
   - Check contrast/readability

4. **Safe-area:**
   - Test on iPhone with notch (iPhone X and later)
   - Verify bottom nav doesn't collide with home indicator
   - Check SettingsSheet on devices with notches


