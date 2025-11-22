# Overflow Menu Audit & Fix Plan

**Date:** 2025-01-XX  
**Scope:** All overflow/ellipsis menus across Flicklet  
**Goal:** Fix missing items, improve visibility, ensure consistency

---

## Phase 1: Component Inventory

### Primary Overflow Menu Component
- **`apps/web/src/features/compact/CompactOverflowMenu.tsx`**
  - Used by: CardV2 (rails), TvCardMobile, MovieCardMobile
  - Contexts: `tab-watching`, `tab-want`, `tab-watched`, `home`, `search`, `tab-foryou`

### Desktop Tab Cards
- **`apps/web/src/components/cards/TabCard.tsx`**
  - Uses inline action buttons (NOT CompactOverflowMenu)
  - Has full action set visible on desktop

---

## Phase 2: Current Menu Contents by Context

### Context: `tab-watching`
**Current Actions:**
- ✅ Want to Watch
- ✅ Not Interested
- ✅ Episodes (TV only, if enabled)
- ✅ Notes & Tags
- ✅ Goofs
- ✅ Extras
- ✅ Advanced Notifications
- ✅ Delete

**Missing Actions:**
- ❌ Open Details (`onOpen`)
- ❌ Rate (`onRatingChange`) - may be intentional if StarRating shown inline
- ❌ Tags (`onTagsEdit`) - only Notes & Tags together
- ❌ Simple Reminder (`onSimpleReminder`) - shown in TabCard but not in overflow menu

### Context: `tab-watched`
**Current Actions:**
- ✅ Want to Watch
- ✅ Not Interested
- ✅ Episodes (TV only, if enabled)
- ✅ Notes & Tags
- ✅ Goofs
- ✅ Extras
- ✅ Advanced Notifications
- ✅ Delete

**Missing Actions:**
- ❌ Open Details
- ❌ Rate
- ❌ Tags
- ❌ Simple Reminder

### Context: `tab-want`
**Current Actions:**
- ✅ Mark Watched
- ✅ Remove from Want to Watch
- ✅ Not Interested
- ✅ Notes & Tags
- ✅ Goofs
- ✅ Extras
- ✅ Advanced Notifications
- ✅ Delete

**Missing Actions:**
- ❌ Open Details
- ❌ Rate
- ❌ Tags
- ❌ Simple Reminder

### Context: `home` / `search` / `tab-foryou`
**Current Actions:**
- ✅ Want to Watch
- ✅ Mark Watched

**Missing Actions:**
- ❌ Open Details
- ❌ Not Interested
- ❌ Notes & Tags
- ❌ Rate
- ❌ Tags
- ❌ Episodes (for TV shows)
- ❌ Goofs
- ❌ Extras
- ❌ Advanced Notifications
- ❌ Simple Reminder

**Issue:** These contexts have very limited actions compared to tab contexts.

---

## Phase 3: Available Actions (from CardActionHandlers)

All available handlers:
- `onWant` ✅ Used
- `onWatching` ❌ Not in overflow menu
- `onWatched` ✅ Used
- `onNotInterested` ✅ Used (but missing in home/search/foryou)
- `onDelete` ✅ Used
- `onOpen` ❌ **MISSING** - Open Details
- `onRatingChange` ❌ **MISSING** - Rate
- `onNotesEdit` ✅ Used (but missing in home/search/foryou)
- `onTagsEdit` ❌ **MISSING** - Tags (separate from Notes)
- `onEpisodeTracking` ✅ Used (but missing in home/search/foryou)
- `onNotificationToggle` ✅ Used (but missing in home/search/foryou)
- `onSimpleReminder` ❌ **MISSING** - Simple Reminder
- `onGoofsOpen` ✅ Used (but missing in home/search/foryou)
- `onExtrasOpen` ✅ Used (but missing in home/search/foryou)

---

## Phase 4: Fix Plan

### Priority 1: Add Missing Core Actions
1. **Open Details** - Add to ALL contexts (should always be available)
2. **Not Interested** - Add to `home`/`search`/`tab-foryou` contexts
3. **Notes & Tags** - Add to `home`/`search`/`tab-foryou` contexts

### Priority 2: Add Context-Appropriate Actions
4. **Episodes** - Add to `home`/`search`/`tab-foryou` for TV shows
5. **Goofs** - Add to `home`/`search`/`tab-foryou` (if Pro or available)
6. **Extras** - Add to `home`/`search`/`tab-foryou` (if Pro or available)
7. **Advanced Notifications** - Add to `home`/`search`/`tab-foryou` (if Pro)
8. **Simple Reminder** - Add to all tab contexts for TV shows

### Priority 3: Visual Improvements
9. Improve trigger visibility (size, contrast, hover states)
10. Improve menu contrast and readability
11. Fix menu placement to avoid obscuring content
12. Ensure Pro gating is correct

### Priority 4: Optional Enhancements
13. Consider adding `onRatingChange` to overflow menu (if StarRating not shown inline)
14. Consider adding separate `onTagsEdit` action (currently only Notes & Tags together)

---

## Phase 5: Pro Gating Check

Actions that should be Pro-gated:
- ✅ Goofs - Check if Pro
- ✅ Extras - Check if Pro  
- ✅ Advanced Notifications - Check if Pro

Current implementation: Uses `handlers.onGoofsOpen` etc. - need to verify Pro checks are in handlers.

---

## Next Steps

1. Update `CompactOverflowMenu.tsx` to add missing actions
2. Improve visual styling (trigger, menu, contrast)
3. Test all contexts to ensure consistency
4. Verify Pro gating works correctly



