# Phase 5 Test Checklist - Swipe Gesture Timing Improvements

**Phase:** 5 - Swipe Gesture Timing Improvements  
**Feature Flag:** `flag:swipe-timing-fix`  
**Date:** _______________  
**Tester:** _______________  
**Browser/Device:** _______________

---

## Pre-Test Setup

- [ ] Feature flag is enabled: `localStorage.setItem('flag:swipe-timing-fix', 'true')`
- [ ] Phase 1 flag also enabled: `localStorage.setItem('flag:scroll-lock-safety', 'true')` (recommended)
- [ ] Page refreshed after flags enabled
- [ ] Browser console open for debugging
- [ ] Device ready for testing

**Verify Setup:**
```javascript
// In browser console:
isFeatureEnabled('swipe-timing-fix')  // Should return true
```

---

## Test Cases

### Test 1: Horizontal Swipe No Scroll

**Expected:** Zero vertical page scroll during horizontal swipe

**Steps:**
1. Find a swipeable card (e.g., on Watching tab)
2. Start a horizontal swipe (swipe left or right)
3. While swiping, observe the background page
4. Verify page does NOT scroll vertically AT ALL during swipe
5. Complete the swipe
6. Verify card swiped correctly
7. Verify page scroll position unchanged

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Observations:**
- [ ] Zero vertical scroll during horizontal swipe
- [ ] Card swipes correctly
- [ ] Page position unchanged after swipe
- [ ] Smooth swipe animation

**Notes:**
```
(Record any vertical scroll during horizontal swipe)
```

---

### Test 2: Vertical Scroll No Swipe

**Expected:** Vertical scroll doesn't trigger swipes

**Steps:**
1. Navigate to area with swipeable cards
2. Start vertical page scroll (scroll up/down)
3. While scrolling, verify cards do NOT trigger swipe gesture
4. Verify smooth vertical scroll continues
5. Verify swipe gesture doesn't activate
6. Scroll rapidly up and down
7. Verify no swipes accidentally triggered

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Observations:**
- [ ] No accidental swipes during vertical scroll
- [ ] Smooth vertical scrolling
- [ ] Cards remain stable during scroll
- [ ] Rapid scrolling doesn't trigger swipes

**Notes:**
```
(Record any accidental swipe triggers during scrolling)
```

---

### Test 3: Diagonal Gesture Handling

**Expected:** Quick axis detection, no scroll

**Steps:**
1. Start touch at a 45-degree angle (diagonal)
2. Move horizontally (intended swipe)
3. Verify axis locks quickly to horizontal
4. Verify no vertical scroll happens
5. Complete swipe
6. Verify swipe registers correctly

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Observations:**
- [ ] Quick axis detection (locks to horizontal fast)
- [ ] No vertical scroll during diagonal-to-horizontal gesture
- [ ] Swipe completes correctly
- [ ] No interference with intended gesture

**Notes:**
```
(Record axis detection speed, any scroll interference)
```

---

### Test 4: Gesture Switching

**Expected:** Smooth gesture switching, no conflicts

**Steps:**
1. Start vertical page scroll
2. Mid-gesture (while scrolling), switch to horizontal swipe on a card
3. Verify vertical scroll stops immediately
4. Verify horizontal swipe activates
5. Complete swipe
6. Verify both gestures worked correctly

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Observations:**
- [ ] Vertical scroll stops when horizontal swipe starts
- [ ] Horizontal swipe activates correctly
- [ ] Smooth transition between gestures
- [ ] No conflicts or jank

**Notes:**
```
(Record gesture switching behavior, any conflicts)
```

---

### Test 5: Fast Swipes

**Expected:** Fast swipes work perfectly, no scroll

**Steps:**
1. Perform a very fast horizontal swipe (quick flick)
2. Verify swipe registers correctly
3. Verify no page scroll occurs
4. Verify smooth animation
5. Try multiple fast swipes in succession
6. Verify all register correctly

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Observations:**
- [ ] Fast swipes register correctly
- [ ] No page scroll during fast swipes
- [ ] Smooth animations
- [ ] No lag or delays
- [ ] Multiple fast swipes work

**Notes:**
```
(Record fast swipe performance, any missed swipes)
```

---

### Test 6: Multiple Swipes Rapidly

**Expected:** Rapid swipes don't cause scroll

**Steps:**
1. Swipe a card left
2. Immediately swipe another card right
3. Verify both swipes register correctly
4. Verify no page scroll between swipes
5. Try rapid swipes on same card (left, right, left)
6. Verify all swipes work

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Observations:**
- [ ] Multiple swipes register correctly
- [ ] No page scroll between swipes
- [ ] Rapid swipes work smoothly
- [ ] No conflicts between swipes

**Notes:**
```
(Record rapid swipe behavior, any scroll issues)
```

---

### Test 7: Quick Touch Scroll Start (Regression Test)

**Expected:** Quick touches can start scrolling immediately

**Steps:**
1. Quickly touch and start scrolling on a container area
2. Verify scroll starts immediately (no delay)
3. Verify smooth scrolling
4. Try rapid up/down scrolling
5. Verify no interference from swipe detection

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Observations:**
- [ ] Quick touches start scroll immediately
- [ ] No delay or lag
- [ ] Smooth scrolling
- [ ] No swipe interference

**Notes:**
```
(Record quick touch scroll behavior)
```

---

## Regression Tests

### Previous Phases Still Work
- [ ] Phase 1: Scroll lock safety (test modal scroll lock)
- [ ] Phase 3: iOS Safari fixes (if testing on iOS)
- [ ] Phase 4: Modal scroll isolation
- [ ] Verify all previous improvements still work

**Notes:**
```
(Any regressions in previous phases?)
```

---

## Console Checks

### Debugging
- [ ] Check console for any errors related to swipe timing
- [ ] Verify no warnings about preventDefault on passive listeners
- [ ] Check swipe detection is working:
  ```javascript
  // Monitor swipe state
  // (May need to add debug logging if issues found)
  ```

### Errors
- [ ] No console errors
- [ ] Errors found:
  ```
  (Paste errors here)
  ```

---

## Performance

- [ ] Swipe gestures feel responsive (no lag)
- [ ] Scroll performance maintained
- [ ] No jank during swipe animations
- [ ] No performance regression vs. before Phase 5

**Notes:**
```
(Record performance observations)
```

---

## Cross-Browser Testing

- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop (if available)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile (if applicable)

**Notes:**
```
(Any browser-specific issues?)
```

---

## Overall Assessment

**Phase Status:** ✅ Ready to Proceed / ❌ Needs Fixes / ⚠️ Minor Issues

**Summary:**
```
(Overall assessment, swipe timing issues found)
```

**Critical Issues:**
1. 
2. 
3. 

**Minor Issues:**
1. 
2. 
3. 

---

## Sign-Off

- [ ] All 7 swipe timing tests pass
- [ ] Regression tests pass (previous phases work)
- [ ] Performance acceptable
- [ ] Console clean (no errors)
- [ ] Cross-browser testing complete
- [ ] Ready for Phase 6

**Approved by:** _______________  
**Date:** _______________

---

## Debugging Tips

If tests fail:

1. **Enable verbose logging:**
   ```javascript
   localStorage.setItem('flag:scroll-logging', 'true');
   localStorage.setItem('flag:swipe-timing-fix', 'true');
   // Refresh page
   ```

2. **Check swipe state:**
   ```javascript
   // May need to add debug logging to useSwipe hook
   // Check if swipe activates when it shouldn't
   // Check if axis detection is working correctly
   ```

3. **Monitor touch events:**
   ```javascript
   // Check if preventDefault is called at right times
   // Verify axis detection thresholds
   ```

---

## Notes

**Key Improvements:**
- Deferred swipe activation (waits for movement intent)
- Improved axis detection (1.5x ratio, 10-15px thresholds)
- Vertical scroll preference (allows quick scroll starts)
- Better preventDefault timing (only when definitely horizontal)

**Feature Flag:** `flag:swipe-timing-fix` - Can be disabled to revert to original behavior if needed.

