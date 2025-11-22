## Admin Settings Cleanup

### Summary

Cleaned up the Admin settings page to improve clarity, consistency, and usability. Made tabs/pills more obvious, separated Content Management from Moderation, and improved layout consistency.

---

### ✅ Completed

#### Admin pills/tabs
- **Active state improved**: Active tab now uses `var(--accent-primary)` with box-shadow for better visibility
- **Reports tab clearly visible**: "Moderation" tab shows pending count badge `(N)` when there are pending reports
- **Mobile support**: Tabs scroll horizontally on narrow screens without being cut off
- **Consistent styling**: Tabs use consistent pill styling with clear hover and active states

#### Content vs Moderation separation
- **Dynamic heading**: Page heading changes based on active tab:
  - "Moderation Queue" for moderation tab
  - "Community Content Management" for community tab
  - "Admin" for other tabs
- **Helper text added**: 
  - Community tab: "Manage community posts and comments. This shows all content, not just reported items."
  - Moderation tab: "Review reported items. Items hidden here are removed from Community for regular users."
- **Content Management tab**: Shows all posts with View Comments / Delete actions
- **Reports/Moderation tab**: Shows only reported items from `reports` collection with hide/unhide and status actions

#### Layout
- **Single main scroll**: Removed nested scrollbars, content flows naturally
- **Spacing aligned**: Uses consistent spacing (`space-y-4`, `mb-3`, etc.) matching other Settings sections
- **Removed extra padding**: Admin root no longer adds extra padding when inside Settings
- **Compact sections**: Reduced padding and margins for better density
- **Removed max-height constraints**: Posts and comments lists no longer have forced scroll containers

---

### Changes Made

**File Modified:**
- `apps/web/src/pages/AdminExtrasPage.tsx`

**Key Updates:**

1. **Tab Styling**
   - Enhanced active tab styling with `var(--accent-primary)` and box-shadow
   - Added pending reports count badge to Moderation tab
   - Improved hover states

2. **Dynamic Heading**
   - Heading changes based on `activeTab` state
   - Shows "Moderation Queue" or "Community Content Management" appropriately

3. **Helper Text**
   - Added contextual helper text below heading for Community and Moderation tabs
   - Clarifies purpose and behavior of each section

4. **Layout Improvements**
   - Removed `max-h-96 overflow-y-auto` from posts/comments lists
   - Reduced padding and margins for better consistency
   - Changed section spacing from `space-y-6` to `space-y-4`
   - Reduced heading sizes from `text-2xl` to `text-lg` for better hierarchy

5. **Moderation Queue Component**
   - Updated spacing and padding to match other sections
   - Reduced padding from `p-6` to `p-3` for report cards
   - Changed section wrapper to use transparent background

---

### Notes

- Reports tab uses `reports` collection and only shows reported items
- Content Management tab still provides full post list with View Comments / Delete
- Pending reports count updates when reports are loaded
- All tabs are accessible on both desktop and mobile
- Layout is consistent with other Settings sections (Account, Notifications, etc.)

---

### Testing Checklist

- [x] Active tab is clearly highlighted
- [x] Reports/Moderation tab is visible and shows pending count
- [x] Tabs scroll horizontally on mobile without being cut off
- [x] Heading changes based on active tab
- [x] Helper text appears for Community and Moderation tabs
- [x] Content tab shows all posts (not just reported)
- [x] Moderation tab shows only reported items
- [x] No double scrollbars in Admin section
- [x] Spacing matches other Settings sections
- [x] TypeScript compiles without errors
- [x] No linter errors




