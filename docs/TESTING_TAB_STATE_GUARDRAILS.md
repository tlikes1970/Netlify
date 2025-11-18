# Testing Guide: Tab State Guardrails (Prompt 5)

**Date:** 2025-01-30  
**Feature:** State and Persistence Guardrails for Tabbed Lists  
**Scope:** Testing unified tab state management, confirmations, reset functionality, and guardrails

---

## Quick Start

### 1. Start the Development Server

```bash
cd apps/web
npm run dev
# or
pnpm dev
```

Open your browser to `http://localhost:5173` (or the port shown in terminal).

---

## Manual Testing Checklist

### ✅ Test 1: Sort Mode Change with Confirmation

**Goal:** Verify confirmation dialog appears when changing from custom to another sort mode.

**Steps:**
1. Navigate to a tabbed list (Watching, Want, or Watched)
2. Drag a card to reorder it (this activates "Custom" mode)
3. Open the sort dropdown
4. Try to change from "Custom Order" to any other option (e.g., "Date Added (newest → oldest)")

**Expected:**
- ✅ Confirmation dialog appears: "Changing the sort mode will reset your custom order. Continue?"
- ✅ If you click "Cancel", sort mode stays as "Custom"
- ✅ If you click "OK", sort mode changes and custom order is reset
- ✅ Check browser console for: `📊 Analytics: tab_sort_changed`

**Verify in localStorage:**
```javascript
// Open DevTools Console and run:
localStorage.getItem('flk.tab.watching.sort')
// Should show the new sort mode (not "custom")
```

---

### ✅ Test 2: Unified "Reset to Default" Button

**Goal:** Verify the unified reset button appears and works correctly.

**Steps:**
1. Navigate to a tabbed list
2. Apply any custom state:
   - Change sort mode to something other than default
   - OR apply a filter (type or provider)
   - OR drag to create custom order
3. Look for "Reset to Default" button next to sort dropdown

**Expected:**
- ✅ Button appears when ANY custom state exists
- ✅ Button shows: "Reset to Default"
- ✅ Click button → confirmation dialog appears
- ✅ If confirmed, all state resets:
  - Sort → "date-newest"
  - Filters → "all" type, no providers
  - Custom order → cleared
- ✅ Check console for: `📊 Analytics: tab_state_reset`

**Verify in localStorage:**
```javascript
// After reset, check:
localStorage.getItem('flk.tab.watching.sort')           // Should be "date-newest"
localStorage.getItem('flk.tab.watching.filter.type')    // Should be "all"
localStorage.getItem('flk.tab.watching.filter.providers') // Should be "[]"
localStorage.getItem('flk.tab.watching.order.custom')    // Should be null
```

---

### ✅ Test 3: Filter Validation Guardrails

**Goal:** Verify filters are validated against available providers.

**Steps:**
1. Navigate to a tabbed list with items that have providers (e.g., Netflix, Hulu)
2. Apply a provider filter (e.g., select "Netflix")
3. Save state
4. Remove all items with that provider (or switch to a different list)
5. Return to the original list
6. Check if the filter still includes the removed provider

**Expected:**
- ✅ Stale providers are automatically removed from filters
- ✅ Only valid providers remain in the filter
- ✅ No console errors about invalid providers

**Verify in code:**
- The `validateFilters()` function should filter out providers not in `availableProviders`

---

### ✅ Test 4: Custom Order Staleness Detection

**Goal:** Verify custom orders with missing IDs are detected and reset.

**Steps:**
1. Navigate to a tabbed list
2. Create a custom order (drag items)
3. Open DevTools Console
4. Manually corrupt the custom order in localStorage:
   ```javascript
   // Add fake IDs that don't exist
   localStorage.setItem('flk.tab.watching.order.custom', JSON.stringify(['fake-id-1', 'fake-id-2']))
   ```
5. Refresh the page

**Expected:**
- ✅ Custom order is detected as stale (< 50% valid IDs)
- ✅ Custom order is automatically reset to default
- ✅ Console warning: `[TabState] Stale custom order detected for watching, resetting`
- ✅ Sort mode switches from "custom" to "date-newest"

**Verify:**
```javascript
// After refresh, check:
localStorage.getItem('flk.tab.watching.order.custom') // Should be null
localStorage.getItem('flk.tab.watching.sort')         // Should be "date-newest"
```

---

### ✅ Test 5: Tab State Persistence

**Goal:** Verify state persists across tab switches and page reloads.

**Steps:**
1. Navigate to "Watching" tab
2. Set custom state:
   - Sort: "alphabetical-az"
   - Filter: Type = "movie", Provider = "Netflix"
3. Switch to "Want" tab
4. Set different custom state:
   - Sort: "date-oldest"
   - Filter: Type = "tv"
5. Switch back to "Watching" tab
6. Refresh the page

**Expected:**
- ✅ "Watching" tab restores: alphabetical-az, movie, Netflix
- ✅ "Want" tab restores: date-oldest, tv
- ✅ Each tab maintains its own independent state
- ✅ State persists after page reload

**Verify in localStorage:**
```javascript
// Check Watching tab:
localStorage.getItem('flk.tab.watching.sort')           // "alphabetical-az"
localStorage.getItem('flk.tab.watching.filter.type')    // "movie"
localStorage.getItem('flk.tab.watching.filter.providers') // ["Netflix"]

// Check Want tab:
localStorage.getItem('flk.tab.want.sort')                // "date-oldest"
localStorage.getItem('flk.tab.want.filter.type')          // "tv"
```

---

### ✅ Test 6: Telemetry Tracking

**Goal:** Verify all state changes are tracked.

**Steps:**
1. Open DevTools Console
2. Clear console
3. Perform actions:
   - Change sort mode
   - Apply/remove filters
   - Drag to reorder
   - Reset to default

**Expected Console Output:**
```
📊 Analytics: tab_sort_changed { tabKey: "watching", sortMode: "alphabetical-az", previousMode: "date-newest" }
📊 Analytics: tab_filter_changed { tabKey: "watching", filterType: "movie", providerCount: 1 }
📊 Analytics: tab_reorder_completed { tabKey: "watching", fromIndex: 0, toIndex: 2 }
📊 Analytics: tab_state_reset { tabKey: "watching" }
```

---

### ✅ Test 7: Broken State Recovery

**Goal:** Verify the system handles corrupted localStorage gracefully.

**Steps:**
1. Open DevTools Console
2. Corrupt localStorage:
   ```javascript
   // Invalid sort mode
   localStorage.setItem('flk.tab.watching.sort', 'invalid-mode')
   
   // Invalid filter type
   localStorage.setItem('flk.tab.watching.filter.type', 'invalid-type')
   
   // Invalid provider filter (not an array)
   localStorage.setItem('flk.tab.watching.filter.providers', 'not-an-array')
   ```
3. Refresh the page

**Expected:**
- ✅ Page loads without errors
- ✅ Default values are used (sort: "date-newest", filters: all)
- ✅ Console warnings may appear (but no crashes)
- ✅ Corrupted values are replaced with valid defaults

**Verify:**
```javascript
// After refresh:
localStorage.getItem('flk.tab.watching.sort')           // "date-newest" (default)
localStorage.getItem('flk.tab.watching.filter.type')     // "all" (default)
localStorage.getItem('flk.tab.watching.filter.providers') // "[]" (default)
```

---

## Automated Testing (Optional)

If you want to run automated tests, you can create test files:

### Test File Structure

```typescript
// apps/web/src/lib/__tests__/tabState.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { restoreTabState, saveTabState, resetTabState, validateFilters } from '../tabState';

describe('Tab State Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should restore default state when no stored state exists', () => {
    const state = restoreTabState('watching', new Set());
    expect(state.sort).toBe('date-newest');
    expect(state.filter.type).toBe('all');
    expect(state.filter.providers).toEqual([]);
  });

  it('should validate filters against available providers', () => {
    const filters = { type: 'all', providers: ['Netflix', 'InvalidProvider'] };
    const available = ['Netflix', 'Hulu'];
    const validated = validateFilters(filters, available);
    expect(validated.providers).toEqual(['Netflix']);
  });

  // Add more tests...
});
```

### Run Tests

```bash
cd apps/web
npm run test
# or
pnpm test
```

---

## Common Issues & Troubleshooting

### Issue: "Reset to Default" button doesn't appear

**Check:**
- Is custom state active? (sort mode, filters, or custom order)
- Are you on a tabbed list? (not "Discovery" or "Returning")

### Issue: Confirmation dialog doesn't appear

**Check:**
- Are you changing FROM "custom" mode TO another mode?
- Browser popup blocker might be blocking the dialog

### Issue: State doesn't persist

**Check:**
- Browser localStorage is enabled
- No browser extensions blocking localStorage
- Check DevTools Console for errors

### Issue: Filters show invalid providers

**Check:**
- `validateFilters()` should remove invalid providers on mount
- Check console for warnings about stale filters

---

## Testing Checklist Summary

- [ ] Sort mode change confirmation works
- [ ] Unified "Reset to Default" button appears and works
- [ ] Filter validation removes invalid providers
- [ ] Custom order staleness detection works
- [ ] State persists across tab switches
- [ ] State persists after page reload
- [ ] Telemetry tracking works (console logs)
- [ ] Broken state recovery works
- [ ] No console errors during normal use
- [ ] No layout regressions

---

## Notes

- All tests should be run on **localhost** (not production)
- Check the browser console for analytics logs and warnings
- Use DevTools to inspect localStorage values
- Test on both desktop and mobile views if possible



















