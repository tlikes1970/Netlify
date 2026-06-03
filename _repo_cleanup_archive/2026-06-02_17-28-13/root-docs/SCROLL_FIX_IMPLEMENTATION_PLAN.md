# Mobile Scroll & Swipe Fixes - Phased Implementation Plan

**Branch:** `swipe-and-scroll-fixes`  
**Status:** Planning Phase  
**Created:** 2025-01-15

---

## Overview

This plan addresses 8 critical issues identified in the forensic review while minimizing risk through phased, feature-flagged implementation with clear user-level test gates.

---

## Phase Gates

Each phase must pass all user-level test cases before proceeding. A phase cannot begin until the previous phase is 100% green.

---

## Phase 0: Foundation & Testing Infrastructure ✅ PREREQUISITE

**Goal:** Establish baseline behavior, create testing tools, and document current state.

**Deliverables:**

1. Baseline behavior documentation (what works today)
2. Automated test suite for scroll/swipe behavior
3. Manual test checklist template
4. Feature flag infrastructure
5. Monitoring/logging for scroll events

**User-Level Test Cases:**

- [ ] Can scroll main page vertically on mobile device
- [ ] Can swipe cards horizontally without page scrolling
- [ ] Can open modal without background scrolling
- [ ] Can scroll content inside modal
- [ ] Can close modal and return to original scroll position
- [ ] Can use pull-to-refresh on main page (if applicable)

**Success Criteria:**

- All baseline tests pass
- Test infrastructure ready
- Feature flags can be toggled without deployment
- Monitoring captures scroll-related events

**Risk Level:** LOW (no behavior changes)

**Estimated Duration:** 2-3 days

---

## Phase 1: Scroll Lock Safety Improvements 🟡 LOW RISK

**Goal:** Fix critical scroll lock issues without changing behavior (defensive improvements).

**Changes:**

1. Add re-entrancy protection (prevent double-lock)
2. Add unlock safety checks (prevent unlock when not locked)
3. Add scroll position validation before restore
4. Add logging for debugging
5. Add error boundaries for scroll lock failures

**Feature Flag:** `flag:scroll-lock-safety`

**User-Level Test Cases:**

### Test 1: Single Modal

1. Open any modal (Episode Tracking, Settings, FlickWord, Trivia)
2. Verify background page does NOT scroll
3. Verify modal content CAN scroll if needed
4. Close modal
5. Verify page returns to original scroll position
6. Repeat 5 times

**Expected:** ✅ All 6 steps work perfectly every time

### Test 2: Rapid Modal Open/Close

1. Open Episode Tracking modal
2. Immediately close it
3. Immediately open Settings modal
4. Immediately close it
5. Open FlickWord modal
6. Close it
7. Verify page is at original scroll position

**Expected:** ✅ No scroll position jumps, all modals work

### Test 3: Modal During Page Scroll

1. Scroll page down 50% of the way
2. Open Episode Tracking modal
3. Scroll modal content
4. Close modal
5. Verify page is exactly where it was before opening modal

**Expected:** ✅ Scroll position preserved exactly

### Test 4: Navigation During Modal

1. Open Settings modal
2. While modal is open, try to navigate (if possible) or refresh page
3. Modal should handle gracefully (either stay open or close cleanly)
4. No scroll position errors

**Expected:** ✅ Graceful handling, no errors

### Test 5: Multiple Modals (if supported)

1. Open Episode Tracking modal
2. Try to open another modal (if app allows)
3. Verify only one modal is locked at a time
4. Close modal
5. Verify unlock works correctly

**Expected:** ✅ Proper locking/unlocking chain

### Test 6: Keyboard Opening (Mobile)

1. On mobile device, open modal
2. Tap text input field
3. Keyboard appears
4. Verify modal stays locked, no background scroll
5. Close keyboard
6. Close modal
7. Verify scroll position correct

**Expected:** ✅ Keyboard doesn't break scroll lock

**Success Criteria:**

- All 6 test cases pass 100% of the time
- No console errors related to scroll lock
- Scroll position always restored correctly
- Zero user-reported scroll issues in this phase

**Risk Level:** LOW (defensive code, no behavior changes)

**Estimated Duration:** 3-4 days

**Rollback Plan:** Single feature flag flip or revert commit

---

## Phase 2: Touch Event Audit & Standardization 🟡 MEDIUM-LOW RISK

**Goal:** Document and standardize touch event handling without breaking existing behavior.

**Changes:**

1. Audit all touch event listeners (passive vs non-passive)
2. Document why each listener uses its current configuration
3. Create touch event handling guidelines
4. Add warnings for improper passive/non-passive usage
5. Create shared touch handler utilities (no breaking changes)

**Feature Flag:** `flag:touch-event-audit` (logging only, no behavior change)

**User-Level Test Cases:**

### Test 1: Card Swipe Still Works

1. Find a swipeable card
2. Swipe horizontally left
3. Swipe horizontally right
4. Verify swipes work smoothly
5. Verify page doesn't scroll during horizontal swipe

**Expected:** ✅ Swipes work perfectly, no page scroll interference

### Test 2: Vertical Page Scroll

1. Scroll page vertically up and down
2. Verify smooth scrolling
3. Verify no jank or stuttering
4. Verify momentum scrolling works (iOS)

**Expected:** ✅ Smooth, native-feeling scroll

### Test 3: Pull-to-Refresh (if applicable)

1. If pull-to-refresh exists, pull down from top
2. Verify refresh triggers
3. Verify page doesn't scroll during pull
4. Verify smooth release after refresh

**Expected:** ✅ Pull-to-refresh works perfectly

### Test 4: Modal Touch Interactions

1. Open modal with scrollable content
2. Touch and drag to scroll modal content
3. Verify only modal scrolls, background stays locked
4. Verify smooth scrolling in modal

**Expected:** ✅ Modal scrolling isolated, smooth

### Test 5: Mixed Touch Gestures

1. Start vertical scroll on page
2. While scrolling, try horizontal swipe on card
3. Verify both gestures work without conflict
4. Try rapid touch interactions

**Expected:** ✅ No gesture conflicts, smooth handling

**Success Criteria:**

- All existing touch behaviors work identically
- Performance metrics unchanged (use Chrome DevTools Performance)
- No new console warnings (except our audit warnings)
- Documentation complete

**Risk Level:** LOW (audit only, no behavior changes)

**Estimated Duration:** 2-3 days

**Rollback Plan:** N/A (no behavior changes)

---

## Phase 3: iOS Safari Scroll Lock Fixes 🟠 MEDIUM RISK

**Goal:** Fix iOS Safari-specific scroll lock issues while maintaining other browser behavior.

**Changes:**

1. Add iOS Safari detection
2. Apply iOS-specific scroll lock implementation
3. Handle iOS viewport resize events
4. Fix iOS momentum scroll interference
5. Add safe area consideration in scroll calculations

**Feature Flag:** `flag:ios-scroll-fix` (iOS devices only)

**User-Level Test Cases:**

### Test 1: iOS Safari Modal Lock

1. On iOS Safari device, scroll page down
2. Open Episode Tracking modal
3. Verify background page is COMPLETELY locked (try to scroll it)
4. Scroll modal content
5. Close modal
6. Verify page returns to exact scroll position

**Expected:** ✅ Background completely locked, position preserved exactly

### Test 2: iOS Keyboard Interaction

1. On iOS Safari, open modal
2. Tap text input
3. Keyboard slides up
4. Verify background still locked (try scrolling)
5. Dismiss keyboard
6. Verify modal still scrollable
7. Close modal
8. Verify scroll position correct

**Expected:** ✅ Keyboard doesn't break lock, position preserved

### Test 3: iOS Orientation Change

1. On iOS device, scroll page down
2. Open modal
3. Rotate device (portrait ↔ landscape)
4. Verify modal stays locked
5. Verify scroll position preserved after rotation
6. Close modal
7. Verify scroll position correct

**Expected:** ✅ Orientation change handled gracefully

### Test 4: iOS Momentum Scroll

1. On iOS device, scroll page with quick flick (momentum scroll)
2. While momentum scrolling, open modal
3. Verify modal opens, background locks
4. Close modal
5. Verify scroll position correct (accounting for momentum)

**Expected:** ✅ Momentum scroll handled, position correct

### Test 5: iOS Multiple Modals

1. Open modal A
2. Close modal A
3. Immediately open modal B
4. Verify no scroll jumps between modals
5. Verify position preserved

**Expected:** ✅ Smooth modal transitions, no jumps

### Test 6: iOS Safari Toolbar

1. Scroll down (toolbar hides)
2. Open modal
3. Verify lock works regardless of toolbar state
4. Close modal
5. Verify scroll position correct

**Expected:** ✅ Toolbar state doesn't affect lock

**Success Criteria:**

- All 6 iOS-specific tests pass 100%
- Other browsers (Chrome, Firefox) unaffected
- No performance regression
- iOS-specific fixes isolated (other browsers use original code)

**Risk Level:** MEDIUM (iOS-specific, affects behavior)

**Estimated Duration:** 4-5 days

**Rollback Plan:** Feature flag flip (iOS devices only)

---

## Phase 4: Modal Scroll Isolation Improvements 🟠 MEDIUM RISK

**Goal:** Ensure modals have completely isolated scroll contexts, no background scroll leakage.

**Changes:**

1. Improve modal scroll container isolation
2. Add overscroll-behavior enforcement
3. Fix touch event propagation in modals
4. Add scroll boundary detection
5. Improve keyboard-aware scroll handling

**Feature Flag:** `flag:modal-scroll-isolation`

**User-Level Test Cases:**

### Test 1: Modal Scroll Boundaries

1. Open modal with tall content
2. Scroll to top of modal content
3. Try to scroll past top (overscroll)
4. Verify NO background scroll happens
5. Scroll to bottom of modal content
6. Try to scroll past bottom
7. Verify NO background scroll happens

**Expected:** ✅ Modal scroll boundaries respected, no background scroll

### Test 2: Fast Scroll in Modal

1. Open modal with scrollable content
2. Rapidly scroll up and down in modal
3. Verify background page stays COMPLETELY still
4. No visual movement of background at all

**Expected:** ✅ Background absolutely locked during fast modal scroll

### Test 3: Modal Touch Edge Cases

1. Open modal
2. Touch near edge of modal (where background is visible)
3. Drag toward background area
4. Verify background does NOT scroll
5. Drag back into modal, continue scrolling modal

**Expected:** ✅ Edge touches don't affect background

### Test 4: Nested Scrollable Areas

1. Open modal with nested scrollable content (if any)
2. Scroll inner scrollable area
3. Scroll outer modal area
4. Verify both scroll independently
5. Verify background never scrolls

**Expected:** ✅ Nested scrolling works, background locked

### Test 5: Modal with Keyboard

1. Open modal with text input at bottom
2. Tap input (keyboard opens)
3. Input moves into view (normal behavior)
4. Try to scroll background while keyboard open
5. Verify background still locked
6. Close keyboard, close modal
7. Verify scroll position correct

**Expected:** ✅ Keyboard handling doesn't break lock

### Test 6: Modal Scroll Performance

1. Open modal with lots of content (100+ items)
2. Rapidly scroll through content
3. Verify smooth 60fps scrolling
4. Verify no jank or stuttering
5. Verify background still locked throughout

**Expected:** ✅ Smooth scrolling, no performance regression

**Success Criteria:**

- All 6 tests pass 100%
- Background scroll completely prevented in all scenarios
- Modal scrolling smooth and responsive
- No performance regression

**Risk Level:** MEDIUM (affects modal behavior)

**Estimated Duration:** 4-5 days

**Rollback Plan:** Feature flag flip

---

## Phase 5: Swipe Gesture Timing Improvements 🟠 MEDIUM RISK

**Goal:** Fix swipe gesture preventDefault timing to eliminate page scroll during swipes.

**Changes:**

1. Improve axis detection timing
2. Add immediate touch-action enforcement
3. Fix preventDefault timing in useSwipe
4. Add gesture state reset on axis change
5. Improve pointer capture handling

**Feature Flag:** `flag:swipe-timing-fix`

**User-Level Test Cases:**

### Test 1: Horizontal Swipe No Scroll

1. Find swipeable card
2. Start horizontal swipe
3. Verify page does NOT scroll vertically AT ALL during swipe
4. Complete swipe
5. Verify card swiped correctly

**Expected:** ✅ Zero vertical page scroll during horizontal swipe

### Test 2: Vertical Scroll No Swipe

1. Start vertical page scroll on area with swipeable cards
2. Verify cards do NOT trigger swipe gesture
3. Verify smooth vertical scroll continues
4. Verify swipe gesture doesn't activate

**Expected:** ✅ Vertical scroll doesn't trigger swipes

### Test 3: Diagonal Gesture Handling

1. Start touch at 45-degree angle (diagonal)
2. Move horizontally (intended swipe)
3. Verify axis locks quickly to horizontal
4. Verify no vertical scroll happens
5. Complete swipe

**Expected:** ✅ Quick axis detection, no scroll

### Test 4: Gesture Switching

1. Start vertical scroll
2. Mid-gesture, switch to horizontal swipe
3. Verify vertical scroll stops immediately
4. Verify horizontal swipe activates
5. Complete swipe

**Expected:** ✅ Smooth gesture switching, no conflicts

### Test 5: Fast Swipes

1. Perform very fast horizontal swipe
2. Verify swipe registers correctly
3. Verify no page scroll occurs
4. Verify smooth animation

**Expected:** ✅ Fast swipes work perfectly, no scroll

### Test 6: Multiple Swipes Rapidly

1. Swipe card left
2. Immediately swipe another card right
3. Verify both swipes register correctly
4. Verify no page scroll between swipes

**Expected:** ✅ Rapid swipes don't cause scroll

**Success Criteria:**

- All 6 tests pass 100%
- Zero vertical scroll during ANY horizontal swipe
- Smooth gesture detection and execution
- No performance regression

**Risk Level:** MEDIUM (affects swipe behavior)

**Estimated Duration:** 3-4 days

**Rollback Plan:** Feature flag flip

---

## Phase 6: Pull-to-Refresh Improvements 🟡 LOW-MEDIUM RISK

**Goal:** Fix pull-to-refresh scroll detection and preventDefault reliability.

**Changes:**

1. Improve container scroll position detection
2. Add negative scroll position handling
3. Fix RTL layout support
4. Improve preventDefault timing
5. Add scrollable container validation

**Feature Flag:** `flag:pull-refresh-fix`

**User-Level Test Cases:**

### Test 1: Standard Pull-to-Refresh

1. Scroll page to very top (scrollTop = 0)
2. Pull down to refresh
3. Verify refresh triggers at correct threshold
4. Verify page doesn't scroll during pull
5. Verify smooth release animation

**Expected:** ✅ Refresh works perfectly, no scroll interference

### Test 2: Edge Cases

1. Page at top, but content has padding (not exactly scrollTop = 0)
2. Pull to refresh
3. Verify refresh still works
4. Verify no scroll happens

**Expected:** ✅ Refresh works even with padding/margins

### Test 3: Rapid Pull

1. Quickly pull down from top
2. Verify refresh still triggers
3. Verify smooth handling
4. Verify no page scroll

**Expected:** ✅ Fast pulls work smoothly

### Test 4: Partial Pull Release

1. Pull down partially (not to threshold)
2. Release
3. Verify no refresh triggered
4. Verify page returns smoothly
5. Verify no scroll position change

**Expected:** ✅ Partial pulls handled correctly

### Test 5: Pull During Content Load

1. Start pull-to-refresh
2. While pulling, new content loads
3. Verify refresh completes correctly
4. Verify no scroll issues

**Expected:** ✅ Works correctly during content changes

**Success Criteria:**

- All 5 tests pass 100%
- Reliable refresh triggering
- No unwanted page scrolling
- Smooth user experience

**Risk Level:** LOW-MEDIUM (isolated feature)

**Estimated Duration:** 2-3 days

**Rollback Plan:** Feature flag flip

---

## Phase 7: CSS Touch-Action Consolidation 🟠 MEDIUM RISK

**Goal:** Centralize and standardize touch-action CSS declarations without breaking existing behavior.

**Changes:**

1. Audit all touch-action declarations
2. Create centralized touch-action system
3. Remove inline style overrides
4. Document touch-action usage patterns
5. Add CSS custom properties for touch-action

**Feature Flag:** `flag:css-touch-action-consolidation`

**User-Level Test Cases:**

### Test 1: All Swipe Gestures

1. Test horizontal swipe on cards
2. Test vertical page scroll
3. Test modal scroll
4. Test pull-to-refresh
5. Verify ALL work exactly as before

**Expected:** ✅ Identical behavior to Phase 6

### Test 2: Touch Interactions

1. Tap buttons - should work instantly
2. Tap links - should navigate
3. Tap inputs - should focus
4. Long press - should work if applicable
5. All touch targets feel responsive

**Expected:** ✅ All touch interactions work perfectly

### Test 3: Performance

1. Rapid touch interactions
2. Verify no lag or jank
3. Verify smooth scrolling
4. Verify smooth swipe animations
5. Chrome DevTools shows no layout thrashing

**Expected:** ✅ Performance maintained or improved

### Test 4: Browser Consistency

1. Test on iOS Safari
2. Test on Chrome Android
3. Test on Firefox Mobile
4. Verify consistent behavior
5. Verify touch-action respected on all

**Expected:** ✅ Consistent across browsers

**Success Criteria:**

- All behaviors identical to Phase 6
- No CSS specificity conflicts
- Performance maintained
- Code cleaner and more maintainable

**Risk Level:** MEDIUM (CSS changes can have cascade effects)

**Estimated Duration:** 3-4 days

**Rollback Plan:** Feature flag flip or CSS revert

---

## Phase 8: Final Integration & Optimization ✅ FINAL PHASE

**Goal:** Remove feature flags, optimize, and prepare for production.

**Changes:**

1. Remove feature flags (all enabled by default)
2. Clean up temporary code
3. Optimize performance
4. Final documentation
5. Update changelog

**User-Level Test Cases:**

### Comprehensive Test Suite

Run ALL test cases from Phases 1-7 in sequence:

- [ ] Phase 1: All 6 scroll lock tests
- [ ] Phase 3: All 6 iOS tests
- [ ] Phase 4: All 6 modal isolation tests
- [ ] Phase 5: All 6 swipe gesture tests
- [ ] Phase 6: All 5 pull-to-refresh tests
- [ ] Phase 7: All 4 CSS consolidation tests

### Cross-Browser Testing

- [ ] iOS Safari (iPhone & iPad)
- [ ] Chrome Android
- [ ] Firefox Mobile
- [ ] Edge Mobile
- [ ] Desktop browsers (touch emulation)

### Performance Testing

- [ ] Lighthouse mobile score unchanged or improved
- [ ] Scroll performance metrics maintained
- [ ] No memory leaks
- [ ] No console errors

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Focus management correct
- [ ] No keyboard traps

**Success Criteria:**

- 100% of all test cases pass
- All browsers tested and working
- Performance maintained or improved
- Documentation complete
- Ready for production merge

**Risk Level:** LOW (final cleanup)

**Estimated Duration:** 3-4 days

**Rollback Plan:** Branch revert if needed

---

## Overall Timeline

- **Phase 0:** 2-3 days (Foundation)
- **Phase 1:** 3-4 days (Scroll Lock Safety)
- **Phase 2:** 2-3 days (Touch Audit)
- **Phase 3:** 4-5 days (iOS Fixes)
- **Phase 4:** 4-5 days (Modal Isolation)
- **Phase 5:** 3-4 days (Swipe Timing)
- **Phase 6:** 2-3 days (Pull Refresh)
- **Phase 7:** 3-4 days (CSS Consolidation)
- **Phase 8:** 3-4 days (Final Integration)

**Total Estimated Duration:** 26-35 days (5-7 weeks)

---

## Risk Mitigation Strategy

1. **Feature Flags:** Every phase behind a flag
2. **Gradual Rollout:** Internal testing → Beta users → 10% → 50% → 100%
3. **Monitoring:** Track scroll-related errors, performance metrics
4. **Quick Rollback:** Single flag flip or commit revert
5. **User Feedback:** Collect feedback at each phase
6. **Automated Testing:** Prevent regressions

---

## Success Metrics

- Zero user-reported scroll/swipe issues
- All test cases passing 100%
- Performance metrics maintained
- Code maintainability improved
- Documentation complete

---

## Notes

- Do NOT skip phases
- Do NOT combine phases
- Do NOT proceed without passing all test cases
- Document all decisions and edge cases encountered
- Keep detailed changelog for each phase
