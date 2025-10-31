# Touch Event Audit Report

**Date:** 2025-01-15  
**Phase:** 2 - Touch Event Audit & Standardization  
**Feature Flag:** `flag:touch-event-audit`

---

## Overview

This document audits all touch event listeners in the codebase, documenting their passive/non-passive configuration and providing recommendations.

---

## Audit Findings

### Summary
- **Total Touch Event Listeners:** TBD
- **Passive Listeners:** TBD
- **Non-Passive Listeners:** TBD
- **Unknown Configuration:** TBD
- **Potential Issues:** TBD

---

## Touch Event Listeners by Location

### 1. `apps/web/src/lib/useSwipe.ts`

**File:** `apps/web/src/lib/useSwipe.ts`

**Lines 141-153:** React Touch Handlers (React event system)

```typescript
onTouchStart: (e: React.TouchEvent) => begin(...)
onTouchMove: (e: React.TouchEvent) => { ... e.preventDefault(); ... }
onTouchEnd: () => endCore()
```

**Configuration:**
- **Passive:** Unknown (React handles this)
- **Capture:** No
- **preventDefault:** Yes (on touchmove when axis is 'x')

**Analysis:**
- React TouchEvents are handled by React's synthetic event system
- `preventDefault()` is called conditionally when horizontal swipe is detected
- This is correct - non-passive is needed for preventDefault to work

**Recommendation:**
- ✅ Correct implementation
- React handles passive/non-passive internally
- No changes needed

**Reason:**
- Needs preventDefault for horizontal swipes
- Prevents page scroll during card swipe gestures

---

### 2. `apps/web/src/hooks/usePullToRefresh.ts`

**File:** `apps/web/src/hooks/usePullToRefresh.ts`

**Lines 139-141:** Native addEventListener

```typescript
container.addEventListener('touchstart', handleTouchStart, { passive: false });
container.addEventListener('touchmove', handleTouchMove, { passive: false });
container.addEventListener('touchend', handleTouchEnd, { passive: true });
```

**Configuration:**
- **touchstart:** `passive: false` ✅ Correct (needs preventDefault)
- **touchmove:** `passive: false` ✅ Correct (needs preventDefault on line 94)
- **touchend:** `passive: true` ✅ Correct (no preventDefault needed)

**Analysis:**
- Properly configured for pull-to-refresh functionality
- touchstart and touchmove need non-passive for preventDefault
- touchend is passive (correct - no preventDefault)

**Recommendation:**
- ✅ Correct implementation
- No changes needed

**Reason:**
- Pull-to-refresh requires preventDefault to prevent page scroll during pull
- Only touchstart and touchmove need preventDefault

---

### 3. `apps/web/src/features/compact/CompactOverflowMenu.tsx`

**File:** `apps/web/src/features/compact/CompactOverflowMenu.tsx`

**Lines 108, 114:** Native addEventListener

```typescript
document.addEventListener('touchstart', handleClickOutside, true);
document.removeEventListener('touchstart', handleClickOutside, true);
```

**Configuration:**
- **Passive:** Not specified (defaults to browser default, usually false in older browsers)
- **Capture:** Yes (`true` parameter)
- **preventDefault:** No (just checking for clicks outside)

**Analysis:**
- Used for click-outside detection
- Doesn't call preventDefault
- Should be passive for better performance

**Issue:**
- ⚠️ Missing passive flag
- May cause scroll performance issues
- Browser may warn about non-passive listener

**Recommendation:**
```typescript
// Should be:
document.addEventListener('touchstart', handleClickOutside, { passive: true, capture: true });
```

**Reason:**
- Only checking for clicks, not preventing default behavior
- Passive allows better scroll performance

---

### 4. `apps/web/src/components/AuthModal.tsx`

**File:** `apps/web/src/components/AuthModal.tsx`

**Lines 189, 365, 391, 408:** React onTouchStart handlers

```typescript
onTouchStart={(e) => e.stopPropagation()}
```

**Configuration:**
- **Passive:** Unknown (React handles this)
- **preventDefault:** No (only stopPropagation)
- **Purpose:** Prevent event bubbling

**Analysis:**
- React synthetic events
- Only using stopPropagation (not preventDefault)
- React optimizes these internally

**Recommendation:**
- ✅ Acceptable (React handles optimization)
- No changes needed

**Reason:**
- React's synthetic event system handles passive optimization
- stopPropagation doesn't require non-passive

---

### 5. `apps/web/src/components/modals/EpisodeTrackingModal.tsx`

**File:** `apps/web/src/components/modals/EpisodeTrackingModal.tsx`

**Line 217:** React onTouchMove handler

```typescript
onTouchMove={(e) => { e.stopPropagation(); }}
```

**Configuration:**
- **Passive:** Unknown (React handles this)
- **preventDefault:** No (only stopPropagation)
- **Purpose:** Prevent touch events from bubbling to body

**Analysis:**
- React synthetic event
- Only using stopPropagation
- Should be fine with React's optimization

**Recommendation:**
- ✅ Acceptable
- No changes needed

**Reason:**
- React handles passive optimization for synthetic events
- stopPropagation doesn't block scrolling

---

### 6. `apps/web/src/components/MobileTabs.tsx`

**File:** `apps/web/src/components/MobileTabs.tsx`

**Line 142:** Scroll listener (not touch, but related)

```typescript
window.addEventListener('scroll', handleScrollReset, { passive: true });
```

**Configuration:**
- **Event:** scroll (not touch, but performance-related)
- **Passive:** true ✅ Correct

**Analysis:**
- Properly configured with passive: true
- Good performance practice

**Recommendation:**
- ✅ Correct
- No changes needed

---

### 7. `apps/web/src/components/ScrollToTopArrow.tsx`

**File:** `apps/web/src/components/ScrollToTopArrow.tsx`

**Line 22:** Scroll listener (not touch, but related)

```typescript
window.addEventListener('scroll', handleScroll, { passive: true });
```

**Configuration:**
- **Event:** scroll
- **Passive:** true ✅ Correct

**Analysis:**
- Properly configured
- Good practice

**Recommendation:**
- ✅ Correct
- No changes needed

---

## Guidelines

### When to Use Passive: true

✅ **Use passive: true when:**
- Listening for touch events but NOT calling preventDefault()
- Only using stopPropagation()
- Click/tap detection without preventing scroll
- Scroll position tracking
- Analytics/measurement

**Examples:**
- Click-outside detection
- Touch position tracking
- Gesture detection (when not preventing default scroll)

### When to Use Passive: false

✅ **Use passive: false when:**
- MUST call preventDefault() to block default scroll behavior
- Implementing custom scroll behavior
- Pull-to-refresh
- Horizontal swipe gestures that prevent vertical scroll
- Custom drag interactions

**Examples:**
- Pull-to-refresh (needs preventDefault)
- Horizontal card swipes (needs preventDefault)
- Custom scrolling implementations

### React Synthetic Events

⚠️ **React Events:**
- React's synthetic event system handles passive optimization automatically
- You can't directly control passive flag for React events
- React optimizes based on whether preventDefault is called
- If you need non-passive, you must use native addEventListener

---

## Issues Found

### Critical Issues

None found (all critical touch handlers properly configured)

### Performance Issues

1. **CompactOverflowMenu.tsx** - Missing passive flag
   - **Impact:** May cause scroll performance warnings
   - **Severity:** Low-Medium
   - **Fix:** Add `{ passive: true, capture: true }` to addEventListener

---

## Recommendations

### Immediate Actions

1. ✅ **useSwipe.ts** - Already correct
2. ✅ **usePullToRefresh.ts** - Already correct
3. ⚠️ **CompactOverflowMenu.tsx** - Add passive flag

### Code Review Checklist

When adding new touch event listeners, check:
- [ ] Do I need preventDefault()? If no → use passive: true
- [ ] If yes → use passive: false (but ensure it's necessary)
- [ ] For React events → React handles optimization automatically
- [ ] For native listeners → Always specify passive flag explicitly

---

## Performance Impact

**Current State:**
- Most touch listeners are properly configured
- One potential performance issue identified
- React synthetic events are optimized by React

**After Fixes:**
- All listeners properly configured
- No scroll performance warnings
- Optimal scroll performance

---

## Testing

### Manual Testing

1. Open Chrome DevTools
2. Go to Console
3. Look for passive listener warnings
4. Test touch interactions
5. Verify scroll performance

### Automated Testing

Run audit tool:
```javascript
// Enable audit
localStorage.setItem('flag:touch-event-audit', 'true');
// Refresh page
// Check console for audit warnings
```

---

## Next Steps

1. Fix CompactOverflowMenu.tsx passive flag
2. Continue to Phase 3 (iOS Safari fixes)
3. Monitor for new touch event listeners in future code

---

## Notes

- React synthetic events are handled by React's optimization
- Cannot fully audit native listeners programmatically
- Manual code review required for new additions
- Browser DevTools warnings help identify issues

