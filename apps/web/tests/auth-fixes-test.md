# Authentication Fixes - Test Cases

## Test Environment Setup
- Branch: `login-fixes`
- Target: Localhost (port 8888) and Production

---

## Test Case 1: Environment Variables
**Goal**: Verify Firebase config uses environment variables instead of hardcoded values

### Steps:
1. Check `.env` file has `VITE_FIREBASE_*` variables defined
2. Build the app: `npm run build`
3. Inspect `dist/assets/*.js` - should NOT contain hardcoded API keys
4. Verify Firebase still initializes correctly

### Expected Result:
- ✅ No hardcoded credentials in built files
- ✅ Firebase initializes successfully
- ✅ Authentication works normally

### Test Command:
```bash
cd apps/web
npm run build
grep -r "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM" dist/ || echo "✅ No hardcoded keys found"
```

---

## Test Case 2: Production Logging Suppression
**Goal**: Verify console.log is suppressed in production builds

### Steps:
1. Build for production: `npm run build`
2. Check built JS files for console.log statements
3. Start production server and open browser console
4. Attempt to sign in

### Expected Result:
- ✅ No `console.log()` calls in production build
- ✅ Only errors appear in console (via `logger.error()`)
- ✅ Development mode still shows all logs

### Test Commands:
```bash
# Build
npm run build

# Check for console.log in built files
grep -r "console.log" dist/assets/*.js | head -5

# Should show minimal to no results
```

---

## Test Case 3: Email/Password Auto-Creation Vulnerability
**Goal**: Verify email/password no longer auto-creates accounts

### Steps:
1. Navigate to sign-in modal
2. Enter email that does NOT exist: `nonexistent@test.com`
3. Enter any password: `testpass123`
4. Click Sign In

### Expected Result:
- ✅ Error message: "No account found with this email. Please check your email or sign up."
- ❌ Should NOT create a new account
- ❌ Should NOT sign in successfully

### Test Data:
```
Email: nonexistent@test.com
Password: testpass123
```

---

## Test Case 4: Origin Validation
**Goal**: Verify origin validation blocks unauthorized origins

### Test 4a: Authorized Origin (localhost:8888)
**Steps:**
1. Open app at `http://localhost:8888`
2. Attempt Google sign-in
3. Check console for "Origin validated" message

**Expected Result:**
- ✅ Sign-in proceeds normally
- ✅ No origin validation errors

### Test 4b: Unauthorized Origin
**Steps:**
1. Open app at unauthorized URL (e.g., `http://localhost:3000` if not in allowed list)
2. Attempt Google sign-in
3. Check for error

**Expected Result:**
- ✅ Error thrown: "Unauthorized origin: http://localhost:3000"
- ✅ Sign-in blocked
- ✅ Error logged to console

---

## Test Case 5: Provider Selection (Desktop)
**Goal**: Verify Google sign-in uses redirect on desktop

### Steps:
1. Open desktop browser (not in standalone/PWA mode)
2. Click "Sign in with Google"
3. Observe method used
4. Check console logs

### Expected Result:
- ✅ Uses `redirect` method (not popup)
- ✅ Console shows: "Google sign-in method: redirect"
- ✅ User redirected to Google OAuth page
- ✅ Returns to app after authentication

---

## Test Case 6: Provider Selection (Mobile)
**Goal**: Verify Google sign-in uses redirect on mobile

### Steps:
1. Open mobile browser
2. Click "Sign in with Google"  
3. Observe method used
4. Check console logs

### Expected Result:
- ✅ Uses `redirect` method
- ✅ Console shows: "Google sign-in method: redirect"
- ✅ User redirected to Google OAuth page
- ✅ Returns to app after authentication

---

## Test Case 7: Provider Selection (Standalone PWA)
**Goal**: Verify OAuth is blocked in standalone PWA mode

### Steps:
1. Install app as PWA
2. Launch in standalone mode (not in browser)
3. Click "Sign in with Google"

### Expected Result:
- ✅ Shows "Open in Browser" message
- ✅ Error logged: "OAuth blocked - standalone mode"
- ❌ Does not attempt OAuth in standalone mode

---

## Test Case 8: Apple Sign-In (Redirect)
**Goal**: Verify Apple sign-in uses redirect method

### Steps:
1. Click "Sign in with Apple"
2. Observe method used
3. Check console logs

### Expected Result:
- ✅ Uses `redirect` method (only option for Apple)
- ✅ User redirected to Apple sign-in page
- ✅ Returns to app after authentication

---

## Test Case 9: Error Handling
**Goal**: Verify improved error messages for different error codes

### Test 9a: Wrong Password
**Steps:**
1. Enter valid email
2. Enter incorrect password
3. Click Sign In

**Expected Result:**
- ✅ Error: "Incorrect password. Please try again."

### Test 9b: Invalid Email
**Steps:**
1. Enter invalid email: `notanemail`
2. Enter any password
3. Click Sign In

**Expected Result:**
- ✅ Error: "Invalid email address."

### Test 9c: Too Many Attempts
**Steps:**
1. Make 5+ failed sign-in attempts
2. Check error message

**Expected Result:**
- ✅ Error: "Too many failed attempts. Please try again later."

---

## Test Case 10: Localhost Workaround
**Goal**: Verify localhost uses popup instead of redirect

### Steps:
1. Open app at `http://localhost:8888`
2. Click "Sign in with Google"
3. Observe method used

### Expected Result:
- ✅ Uses `popup` method (not redirect)
- ✅ Console shows: "Localhost detected - using popup mode"
- ✅ Popup opens for Google sign-in

---

## Test Case 11: Logging in Development vs Production

### Test 11a: Development
**Steps:**
1. Run `npm run dev`
2. Open browser console
3. Attempt to sign in
4. Observe log output

**Expected Result:**
- ✅ Detailed logs visible: "Starting Google sign-in", "Origin validated", etc.
- ✅ Emoji indicators for different log levels

### Test 11b: Production  
**Steps:**
1. Run `npm run build && npm run preview`
2. Open browser console
3. Attempt to sign in
4. Observe log output

**Expected Result:**
- ✅ No console.log output in production
- ✅ Only errors visible
- ✅ Clean console

---

## Test Case 12: Session Persistence
**Goal**: Verify user stays signed in after page reload

### Steps:
1. Sign in successfully
2. Reload page
3. Check if still signed in

### Expected Result:
- ✅ User remains signed in
- ✅ No need to sign in again
- ✅ User data persists

---

## Test Case 13: Sign Out
**Goal**: Verify sign out clears data properly

### Steps:
1. Sign in successfully
2. Click sign out
3. Check localStorage and sessionStorage
4. Verify user data cleared

### Expected Result:
- ✅ All `flicklet.*` keys removed from localStorage
- ✅ `library:cleared` event dispatched
- ✅ User signed out
- ✅ Account button shows "Sign In"

---

## Test Case 14: Redirect Result Handling
**Goal**: Verify redirect return from OAuth is handled correctly

### Steps:
1. Initiate Google sign-in (redirect flow)
2. Complete authentication on Google's page
3. Verify app processes redirect result
4. Check for URL cleanup

### Expected Result:
- ✅ Successfully signs in after redirect
- ✅ URL cleaned (no `#` or `?` auth parameters)
- ✅ No redirect loops
- ✅ User document created/updated in Firestore

---

## Test Case 15: Firestore Integration
**Goal**: Verify user document created in Firestore

### Steps:
1. Sign in with new Google account
2. Check Firestore console
3. Verify user document exists at `users/{uid}`

### Expected Result:
- ✅ User document created in Firestore
- ✅ Contains: uid, email, displayName, photoURL
- ✅ Has watchlists structure initialized
- ✅ Last login timestamp recorded

---

## Regression Test Checklist

### Old Functionality (Should Still Work):
- [ ] Google sign-in via redirect on production
- [ ] Google sign-in via popup on localhost
- [ ] Apple sign-in via redirect
- [ ] Email/password sign-in (existing accounts)
- [ ] Sign out clears data
- [ ] Auth state persists across reloads
- [ ] Auth modal opens/closes properly

### Security Improvements (New):
- [ ] No auto-account creation via email
- [ ] Origin validation enforced
- [ ] Improved error messages
- [ ] No hardcoded credentials

---

## Manual Testing Commands

```bash
# Test environment variables
cd apps/web
cat .env | grep VITE_FIREBASE

# Test build without hardcoded keys
npm run build
grep -r "AIzaSy" dist/ || echo "✅ No keys in build"

# Test logging behavior
# Development
npm run dev
# Check console for detailed logs

# Production  
npm run build
npm run preview
# Check console for minimal logs

# Test linting
npm run lint:strict

# Test type checking
npx tsc --noEmit
```

---

## Automated Test Commands (TODO)
These would go in `tests/auth.spec.ts` once implemented:

```typescript
// test: auth-fixes-e2e
test('email sign-in does not auto-create accounts', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="sign-in-button"]');
  await page.fill('input[type="email"]', 'nonexistent@test.com');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('[role="alert"]')).toContainText('No account found');
  // Verify NO account was created in Firebase
});

test('origin validation blocks unauthorized origins', async ({ page }) => {
  await page.goto('http://localhost:3000'); // Unauthorized
  await page.click('[data-testid="sign-in-button"]');
  await page.click('[data-testid="google-sign-in"]');
  
  await expect(page.locator('[role="alert"]')).toContainText('Unauthorized origin');
});
```

---

## Notes
- Test in both development and production modes
- Test on actual mobile devices, not just desktop emulation
- Verify Firestore integration separately in Firebase Console
- Check network tab for any unauthorized requests
- Monitor localStorage/sessionStorage during all flows

