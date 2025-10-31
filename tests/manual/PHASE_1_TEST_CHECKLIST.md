# Phase 1 Test Checklist - Scroll Lock Safety Improvements

**Phase:** 1 - Scroll Lock Safety Improvements  
**Feature Flag:** `flag:scroll-lock-safety`  
**Date:** _______________  
**Tester:** _______________  
**Browser/Device:** _______________

---

## Pre-Test Setup

- [ ] Feature flag is enabled: `localStorage.setItem('flag:scroll-lock-safety', 'true')`
- [ ] Scroll logging enabled (optional): `localStorage.setItem('flag:scroll-logging', 'true')`
- [ ] Page refreshed after flags enabled
- [ ] Browser console open for error checking
- [ ] Test device/emulator ready

**Verify Setup:**
```javascript
// In browser console:
isFeatureEnabled('scroll-lock-safety')  // Should return true
window.scrollFeatures.list()  // Verify flag shows as enabled
```

---

## Test Cases

### Test 1: Single Modal
**Expected:** Background page does NOT scroll, modal content CAN scroll, page returns to original position

**Steps:**
1. Note current scroll position (scrollY value from console: `window.scrollY`)
2. Open Episode Tracking modal
3. Try to scroll background page (should NOT move)
4. Scroll modal content if it has scrollable content (should work)
5. Close modal
6. Verify page is at original scroll position
7. Repeat 5 times with same modal
8. Test with Settings modal
9. Test with FlickWord modal
10. Test with Trivia modal

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Scroll Position Verification:**
| Attempt | Starting Position | After Close | Correct? | Notes |
|---------|-------------------|-------------|----------|-------|
| 1       |                   |             |          |       |
| 2       |                   |             |          |       |
| 3       |                   |             |          |       |
| 4       |                   |             |          |       |
| 5       |                   |             |          |       |

**Notes:**
```
(Record any issues, unexpected behavior, scroll position mismatches)
```

---

### Test 2: Rapid Modal Open/Close
**Expected:** No scroll position jumps, all modals work correctly

**Steps:**
1. Note starting scroll position: `window.scrollY`
2. Open Episode Tracking modal
3. Immediately close it
4. Immediately open Settings modal
5. Immediately close it
6. Open FlickWord modal
7. Close it
8. Verify page is at original scroll position

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Position Check:**
- Starting: `window.scrollY = _____`
- After Test: `window.scrollY = _____`
- Match: ✅ Yes / ❌ No (difference: _____ px)

**Notes:**
```
(Record any position jumps, modal issues, errors)
```

---

### Test 3: Modal During Page Scroll
**Expected:** Scroll position preserved exactly when modal opens during scroll

**Steps:**
1. Scroll page down to approximately 50% (note exact position)
2. Open Episode Tracking modal
3. Scroll modal content (if applicable)
4. Close modal
5. Verify page is EXACTLY where it was before opening modal

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Position Check:**
- Before Modal: `window.scrollY = _____`
- After Modal: `window.scrollY = _____`
- Exact Match: ✅ Yes / ❌ No (difference: _____ px)

**Test at Different Positions:**
| Position | Before | After | Match? | Notes |
|----------|--------|-------|--------|-------|
| 25% down |        |       |        |       |
| 50% down |        |       |        |       |
| 75% down |        |       |        |       |
| Near bottom |      |       |        |       |

**Notes:**
```
(Record exact positions and any mismatches)
```

---

### Test 4: Navigation During Modal
**Expected:** Graceful handling, no errors, no scroll position issues

**Steps:**
1. Open Settings modal
2. While modal is open, check if background page can be interacted with
3. If possible, try to navigate (check if navigation is blocked)
4. Refresh page (if needed to test)
5. Verify no scroll position errors in console
6. Verify modal handles gracefully

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Console Errors:**
- [ ] No errors
- [ ] Errors found: (list below)
  ```
  (Paste errors here)
  ```

**Notes:**
```
(Record behavior, any issues with navigation or refresh)
```

---

### Test 5: Multiple Modals (if supported)
**Expected:** Proper locking/unlocking chain, only one modal locked at a time

**Steps:**
1. Open Episode Tracking modal
2. Check if another modal can be opened (if app allows)
3. If yes, try to open Settings modal
4. Verify scroll lock behavior (should be locked for active modal)
5. Close active modal
6. Verify unlock works correctly
7. Close remaining modal if any
8. Verify scroll position correct

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial / ❌ Not Applicable

**Notes:**
```
(Record behavior with multiple modals, if applicable)
```

---

### Test 6: Keyboard Opening (Mobile)
**Expected:** Keyboard doesn't break scroll lock, scroll position correct

**Steps:**
1. On mobile device, scroll page to middle
2. Open Episode Tracking modal (or Settings modal)
3. Tap text input field
4. Keyboard appears
5. Verify background page does NOT scroll (try scrolling it)
6. Close/dismiss keyboard
7. Verify modal still scrollable (if it has scrollable content)
8. Close modal
9. Verify scroll position correct

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial / ❌ Not Mobile

**Mobile Device:** _________________

**Notes:**
```
(Mobile-specific issues, keyboard behavior, scroll position)
```

---

## Regression Tests

### Existing Functionality Still Works
- [ ] Main page scrolling still works
- [ ] Card swipes still work
- [ ] Modal content scrolling still works
- [ ] All modals open/close correctly

**Notes:**
```
(Any regressions found?)
```

---

## Console Checks

### Scroll Lock State (Dev Tools)
```javascript
// Check scroll lock state
window.getScrollLockState?.()  // If exposed
```

- [ ] No console errors related to scroll lock
- [ ] No warnings about scroll lock
- [ ] Scroll logger works (if enabled)

### Console Errors
- [ ] No errors
- [ ] Errors found:
  ```
  (Paste errors here)
  ```

---

## Performance

- [ ] No performance regression observed
- [ ] Modal open/close feels smooth
- [ ] Scroll position restoration is instant
- [ ] No jank or stuttering

---

## Browser Compatibility

### iOS Safari (if available)
- [ ] All tests pass
- [ ] Issues found: _________________________________

### Chrome Android
- [ ] All tests pass
- [ ] Issues found: _________________________________

### Desktop (touch emulation)
- [ ] All tests pass
- [ ] Issues found: _________________________________

---

## Overall Assessment

**Phase Status:** ✅ Ready to Proceed / ❌ Needs Fixes / ⚠️ Minor Issues

**Summary:**
```
(Overall assessment, major issues, blockers)
```

**Critical Issues Found:**
1. 
2. 
3. 

**Minor Issues:**
1. 
2. 
3. 

---

## Sign-Off

- [ ] All 6 test cases passed
- [ ] No regressions found
- [ ] Performance acceptable
- [ ] Console clean (no errors)
- [ ] Ready for Phase 2

**Approved by:** _______________  
**Date:** _______________

---

## Debugging Tips

If tests fail, check:

1. **Scroll position mismatch:**
   ```javascript
   // Before opening modal
   const before = window.scrollY;
   // After closing modal
   const after = window.scrollY;
   console.log('Position difference:', Math.abs(after - before));
   ```

2. **Scroll lock state:**
   ```javascript
   // Check if scroll is actually locked
   const bodyStyle = window.getComputedStyle(document.body);
   console.log('Body position:', bodyStyle.position);
   console.log('Body overflow:', bodyStyle.overflow);
   ```

3. **Enable verbose logging:**
   ```javascript
   localStorage.setItem('flag:scroll-logging', 'true');
   window.scrollLogger?.setLevel('debug');
   // Refresh page, then test
   window.scrollLogger?.getLogs();
   ```

