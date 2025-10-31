# Phase 3 Test Checklist - iOS Safari Scroll Lock Fixes

**Phase:** 3 - iOS Safari Scroll Lock Fixes  
**Feature Flag:** `flag:ios-scroll-fix` (iOS devices only)  
**Date:** _______________  
**Tester:** _______________  
**Browser/Device:** iOS Safari (iPhone/iPad)

**⚠️ IMPORTANT: These tests MUST be run on actual iOS Safari device. Desktop Safari or iOS Chrome will NOT work.**

---

## Pre-Test Setup

- [ ] Testing on actual iOS Safari device (iPhone or iPad)
- [ ] Feature flag is enabled: `localStorage.setItem('flag:ios-scroll-fix', 'true')`
- [ ] Phase 1 flag also enabled: `localStorage.setItem('flag:scroll-lock-safety', 'true')`
- [ ] Scroll logging enabled (optional): `localStorage.setItem('flag:scroll-logging', 'true')`
- [ ] Page refreshed after flags enabled
- [ ] Browser console open (if possible via Mac Safari Web Inspector)
- [ ] Device ready for testing

**Verify Setup:**
```javascript
// In browser console (via Safari Web Inspector):
isFeatureEnabled('ios-scroll-fix')  // Should return true
// Check device:
navigator.userAgent  // Should show Safari on iOS
```

---

## Test Cases

### Test 1: iOS Safari Modal Lock
**Expected:** Background page is COMPLETELY locked, position preserved exactly

**Steps:**
1. On iOS Safari device, scroll page down (note position: `window.scrollY`)
2. Open Episode Tracking modal
3. Try to scroll background page (drag up/down on background)
4. Verify background page does NOT move AT ALL
5. Scroll modal content (if it has scrollable content)
6. Close modal
7. Verify page returns to EXACT scroll position

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Position Check:**
- Before Modal: `window.scrollY = _____`
- After Modal: `window.scrollY = _____`
- Exact Match: ✅ Yes / ❌ No (difference: _____ px)

**Observations:**
- [ ] Background completely locked (zero movement)
- [ ] Modal scrolls correctly
- [ ] Position preserved exactly
- [ ] No visual jumps or glitches

**Notes:**
```
(Record any issues, background scroll leakage, position mismatches)
```

---

### Test 2: iOS Keyboard Interaction
**Expected:** Keyboard doesn't break scroll lock, position preserved

**Steps:**
1. On iOS Safari, scroll page down
2. Open Episode Tracking modal (or Settings modal with text input)
3. Tap a text input field
4. Keyboard slides up
5. Try to scroll background page while keyboard is open
6. Verify background is STILL locked (try scrolling it)
7. Dismiss keyboard (tap outside or close button)
8. Verify modal still scrollable (if applicable)
9. Close modal
10. Verify scroll position correct

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Position Check:**
- Before Modal: `window.scrollY = _____`
- After Keyboard: Background locked? ✅ Yes / ❌ No
- After Modal Close: `window.scrollY = _____`
- Position Match: ✅ Yes / ❌ No (difference: _____ px)

**Observations:**
- [ ] Keyboard doesn't break scroll lock
- [ ] Background stays locked during keyboard
- [ ] Position preserved after keyboard dismiss
- [ ] No visual glitches during keyboard animation

**Notes:**
```
(Record keyboard behavior, any lock failures, position issues)
```

---

### Test 3: iOS Orientation Change
**Expected:** Orientation change handled gracefully, scroll position preserved

**Steps:**
1. On iOS device, scroll page down (note position)
2. Open Episode Tracking modal
3. Rotate device from portrait to landscape (or vice versa)
4. Wait for rotation to complete
5. Verify modal stays locked (background doesn't scroll)
6. Verify scroll position preserved after rotation
7. Rotate back to original orientation
8. Verify still locked, position preserved
9. Close modal
10. Verify scroll position correct

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Position Check:**
- Before Modal: `window.scrollY = _____`
- After Rotation 1: Locked? ✅ Yes / ❌ No
- After Rotation 2: Locked? ✅ Yes / ❌ No
- After Modal Close: `window.scrollY = _____`
- Position Match: ✅ Yes / ❌ No (difference: _____ px)

**Observations:**
- [ ] Modal stays locked during rotation
- [ ] Position preserved after each rotation
- [ ] No visual glitches
- [ ] Smooth rotation handling

**Notes:**
```
(Record rotation behavior, any lock failures, position jumps)
```

---

### Test 4: iOS Momentum Scroll
**Expected:** Momentum scroll handled, position correct

**Steps:**
1. On iOS device, quickly flick scroll page (momentum scroll)
2. While page is still momentum scrolling, open Episode Tracking modal
3. Verify modal opens immediately
4. Verify background locks (momentum should stop)
5. Close modal
6. Verify scroll position correct (accounting for momentum that occurred)

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Position Check:**
- Before Flick: `window.scrollY = _____`
- Momentum started: Yes / No
- Modal opened during momentum: Yes / No
- After Modal Close: `window.scrollY = _____`
- Position reasonable: ✅ Yes / ❌ No

**Observations:**
- [ ] Momentum scroll stops when modal opens
- [ ] Modal opens immediately (not delayed by momentum)
- [ ] Position is reasonable (may not be exact due to momentum, but should be close)
- [ ] No visual glitches

**Notes:**
```
(Record momentum scroll handling, any delays, position accuracy)
```

---

### Test 5: iOS Multiple Modals
**Expected:** Smooth modal transitions, no scroll jumps

**Steps:**
1. Open Episode Tracking modal
2. Note scroll position
3. Close modal
4. Immediately open Settings modal
5. Verify no scroll jumps between modals
6. Close Settings modal
7. Immediately open FlickWord modal
8. Verify no scroll jumps
9. Close FlickWord modal
10. Verify scroll position correct

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Position Check:**
- Starting: `window.scrollY = _____`
- After Modal 1: `window.scrollY = _____`
- After Modal 2: `window.scrollY = _____`
- After Modal 3: `window.scrollY = _____`
- Final Match: ✅ Yes / ❌ No

**Observations:**
- [ ] No scroll jumps between modals
- [ ] Smooth transitions
- [ ] Position preserved throughout
- [ ] All modals work correctly

**Notes:**
```
(Record modal transitions, any jumps, position issues)
```

---

### Test 6: iOS Safari Toolbar
**Expected:** Toolbar state doesn't affect scroll lock

**Steps:**
1. Scroll page down (toolbar hides automatically)
2. Open Episode Tracking modal
3. Verify lock works (background doesn't scroll)
4. While modal open, scroll page up (if possible) to show toolbar
5. Verify lock still works
6. Close modal
7. Verify scroll position correct

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Toolbar States Tested:**
- [ ] Toolbar hidden when modal opened
- [ ] Toolbar shown when modal opened
- [ ] Toolbar state change during modal

**Observations:**
- [ ] Lock works regardless of toolbar state
- [ ] Position preserved
- [ ] No visual glitches with toolbar animations

**Notes:**
```
(Record toolbar behavior, any lock failures related to toolbar)
```

---

## Regression Tests

### Non-iOS Browsers Still Work
- [ ] Test on Chrome Android (should use standard lock, not iOS fix)
- [ ] Test on Firefox Mobile (should use standard lock)
- [ ] Test on Desktop Safari (should use standard lock)
- [ ] Verify non-iOS browsers unaffected by iOS fixes

**Notes:**
```
(Any issues on non-iOS browsers?)
```

---

## Console Checks

### iOS-Specific Logging
- [ ] Open Safari Web Inspector (on Mac, connect iOS device)
- [ ] Check console for iOS-specific log messages
- [ ] Verify "iOS-specific lock applied" messages (if logging enabled)
- [ ] No errors related to iOS fixes

### Errors
- [ ] No console errors
- [ ] Errors found:
  ```
  (Paste errors here)
  ```

---

## Performance

- [ ] No performance regression on iOS
- [ ] Modal open/close feels smooth
- [ ] Scroll position restoration is quick
- [ ] No jank during keyboard animations
- [ ] No jank during orientation changes

---

## iOS-Specific Edge Cases

### Safe Area Handling
- [ ] Test on iPhone with notch (safe area insets)
- [ ] Verify scroll calculations account for safe areas
- [ ] Position restored correctly with safe areas

### Visual Viewport API
- [ ] Visual Viewport API supported? ✅ Yes / ❌ No
- [ ] Viewport resize handling works
- [ ] Keyboard handling uses Visual Viewport

---

## Overall Assessment

**Phase Status:** ✅ Ready to Proceed / ❌ Needs Fixes / ⚠️ Minor Issues

**Summary:**
```
(Overall assessment, iOS-specific issues found)
```

**Critical iOS Issues:**
1. 
2. 
3. 

**Minor Issues:**
1. 
2. 
3. 

---

## Sign-Off

- [ ] All 6 iOS-specific tests pass
- [ ] Non-iOS browsers unaffected
- [ ] Performance acceptable
- [ ] Console clean (no errors)
- [ ] Ready for Phase 4

**Approved by:** _______________  
**Date:** _______________  
**Device Tested:** iPhone / iPad (specify model): _______________

---

## Debugging Tips for iOS

If tests fail on iOS:

1. **Enable verbose logging:**
   ```javascript
   localStorage.setItem('flag:scroll-logging', 'true');
   localStorage.setItem('flag:scroll-lock-safety', 'true');
   // Refresh page
   ```

2. **Check iOS detection:**
   ```javascript
   // Should return true on iOS Safari:
   navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
   navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('CriOS')
   ```

3. **Check Visual Viewport:**
   ```javascript
   // Should exist on iOS Safari 13+
   window.visualViewport !== undefined
   window.visualViewport?.height
   ```

4. **Monitor scroll position:**
   ```javascript
   // Before opening modal
   const before = window.scrollY;
   // After closing modal
   const after = window.scrollY;
   console.log('Position difference:', Math.abs(after - before));
   ```

---

## Notes

**⚠️ Critical:** These tests MUST be run on actual iOS Safari. Desktop Safari or iOS Chrome will NOT trigger iOS-specific fixes.

**Visual Viewport API:**
- Available on iOS Safari 13+
- May not be available on older iOS versions
- Fallback handling should work

