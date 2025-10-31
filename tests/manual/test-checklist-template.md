# Test Checklist Template - Phase [NUMBER]

**Phase:** [Phase Name]  
**Feature Flag:** `flag:[flag-name]`  
**Date:** _______________  
**Tester:** _______________  
**Browser/Device:** _______________

---

## Pre-Test Setup

- [ ] Feature flag is enabled: `localStorage.setItem('flag:[flag-name]', 'true')`
- [ ] Page refreshed after flag enabled
- [ ] Browser console open for error checking
- [ ] Test device/emulator ready

---

## Test Cases

### Test 1: [Test Name]
**Expected:** [What should happen]

**Steps:**
1. 
2. 
3. 

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Notes:**
```
(Record observations, issues, unexpected behavior)
```

**Screenshots/Evidence:**
- (Attach if needed)

---

### Test 2: [Test Name]
**Expected:** [What should happen]

**Steps:**
1. 
2. 
3. 

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Notes:**
```
(Record observations, issues, unexpected behavior)
```

---

### Test 3: [Test Name]
**Expected:** [What should happen]

**Steps:**
1. 
2. 
3. 

**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Notes:**
```
(Record observations, issues, unexpected behavior)
```

---

## Regression Tests

### Existing Functionality Still Works
- [ ] Test 1 from baseline still passes
- [ ] Test 2 from baseline still passes
- [ ] Test 3 from baseline still passes
- [ ] (Add more baseline tests as needed)

**Notes:**
```
(Any regressions found?)
```

---

## Browser Compatibility

### iOS Safari
- [ ] All tests pass
- [ ] Issues found: _________________________________

### Chrome Android
- [ ] All tests pass
- [ ] Issues found: _________________________________

### Firefox Mobile
- [ ] All tests pass
- [ ] Issues found: _________________________________

### Desktop (touch emulation)
- [ ] All tests pass
- [ ] Issues found: _________________________________

---

## Performance

- [ ] No performance regression observed
- [ ] Scroll smoothness: Excellent / Good / Fair / Poor
- [ ] Touch responsiveness: Excellent / Good / Fair / Poor
- [ ] Animation smoothness: Excellent / Good / Fair / Poor
- [ ] Jank observed: Yes / No

---

## Console Errors

- [ ] No console errors
- [ ] Console errors found: (list below)
  ```
  (Paste errors here)
  ```

---

## Overall Assessment

**Phase Status:** ✅ Ready to Proceed / ❌ Needs Fixes / ⚠️ Minor Issues

**Summary:**
```
(Overall assessment, major issues, blockers)
```

**Blockers (if any):**
1. 
2. 
3. 

**Minor Issues:**
1. 
2. 
3. 

---

## Sign-Off

- [ ] All test cases passed
- [ ] No regressions found
- [ ] Performance acceptable
- [ ] Ready for next phase

**Approved by:** _______________  
**Date:** _______________

