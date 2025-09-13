# Flicklet Auth Test Plan

## Test Environment Setup
- **URL**: `staging/www/index.html`
- **Browser**: Chrome DevTools Console
- **Test State**: Fresh page load, no cached auth state

## Test 1: Signed OUT State Verification

### Console Command
```javascript
(() => {
  const out = {};
  out.singleAuthObserver = (window.__authObserverCount ?? 1) === 1;
  out.signedOutUI = !!document.querySelector('[data-auth="signed-out-visible"], #signIn, [data-action="sign-in"]');
  out.signedInUI  = !!document.querySelector('[data-auth="signed-in-visible"], #usernameDisplay, .snark');
  console.table(out);
  return out;
})();
```

### Expected Results
- `singleAuthObserver`: `true`
- `signedOutUI`: `true` 
- `signedInUI`: `false`

### What This Tests
- Only one auth observer is registered
- Signed-out UI elements are visible
- Signed-in UI elements are hidden

## Test 2: Signed IN State Verification

### Console Command
```javascript
(() => {
  const out = {};
  out.singleAuthObserver = (window.__authObserverCount ?? 1) === 1;
  out.signedOutUI = !!document.querySelector('[data-auth="signed-out-visible"], #signIn, [data-action="sign-in"]');
  out.signedInUI  = !!document.querySelector('[data-auth="signed-in-visible"], #usernameDisplay, .snark');
  const nameEl = document.querySelector('#usernameDisplay, [data-username-display]');
  const snark  = document.querySelector('.snark, [data-snark]');
  out.headerBindingPresent = !!nameEl;
  out.snarkPresent = !!snark;
  console.table(out);
  return out;
})();
```

### Expected Results
- `singleAuthObserver`: `true`
- `signedInUI`: `true`
- `signedOutUI`: `false`
- `headerBindingPresent`: `true`
- `snarkPresent`: `true` (after Fix 2 is applied)

### What This Tests
- Auth observer count remains at 1 after sign-in
- UI state correctly toggles to signed-in
- Profile elements exist and can be bound

## Test 3: Live Edit Verification (No Reload)

### Console Command
```javascript
(() => {
  const nameEl = document.querySelector('#usernameDisplay, [data-username-display]');
  const snark  = document.querySelector('.snark, [data-snark]');
  return {
    headerText: nameEl?.textContent?.trim() || null,
    snarkText:  snark?.textContent?.trim() || null
  };
})();
```

### Expected Results
- `headerText`: User's display name or email
- `snarkText`: Welcome message with user's name

### What This Tests
- Profile VM binding works without page reload
- Username changes are reflected immediately
- Snark text updates correctly

## Test 4: Observer Count Verification

### Console Command
```javascript
(() => {
  const observers = [];
  // Check for multiple observer registrations
  if (window.__authObserverCount !== 1) {
    console.warn('Multiple observers detected:', window.__authObserverCount);
  }
  
  // Check Firebase auth state
  const auth = window.auth || window.firebase?.auth();
  if (auth) {
    const currentUser = auth.currentUser;
    return {
      observerCount: window.__authObserverCount ?? 1,
      firebaseUser: currentUser ? currentUser.email : null,
      authReady: window.__authReady ?? false,
      bridgeReady: window.__authBridgeReady ?? false
    };
  }
  return { error: 'Firebase auth not available' };
})();
```

### Expected Results
- `observerCount`: `1`
- `firebaseUser`: User email when signed in, `null` when signed out
- `authReady`: `true`
- `bridgeReady`: `true`

### What This Tests
- Single observer pattern is working
- Firebase auth state is accessible
- Auth bridge is properly initialized

## Test 5: Sign-in Flow Verification

### Manual Test Steps
1. Click "Sign In" button
2. Complete Google OAuth flow
3. Run Test 2 immediately after sign-in
4. Run Test 3 to verify profile binding
5. Sign out and run Test 1

### Expected Behavior
- Sign-in modal opens
- Google OAuth popup/redirect works
- UI immediately updates to signed-in state
- Profile elements show user information
- Sign-out returns to signed-out state

## Test 6: Persistence Verification

### Console Command
```javascript
(() => {
  const auth = window.auth || window.firebase?.auth();
  if (auth) {
    return {
      persistence: auth._delegate._config?.persistence || 'unknown',
      currentUser: auth.currentUser ? auth.currentUser.email : null,
      isSignedIn: !!auth.currentUser
    };
  }
  return { error: 'Auth not available' };
})();
```

### Expected Results
- `persistence`: `"local"` or similar
- `currentUser`: User email if signed in
- `isSignedIn`: `true` if user should be signed in

### What This Tests
- Auth persistence is set to LOCAL
- User remains signed in after page refresh
- Auth state persists across sessions

## Test 7: Error Handling Verification

### Console Command
```javascript
(() => {
  const errors = [];
  
  // Check for missing elements
  const requiredElements = [
    '[data-auth="signed-in-visible"]',
    '[data-auth="signed-out-visible"]', 
    '#usernameDisplay',
    '.snark, [data-snark]'
  ];
  
  requiredElements.forEach(selector => {
    const el = document.querySelector(selector);
    if (!el) {
      errors.push(`Missing element: ${selector}`);
    }
  });
  
  // Check for auth state consistency
  const signedInEls = document.querySelectorAll('[data-auth="signed-in-visible"]');
  const signedOutEls = document.querySelectorAll('[data-auth="signed-out-visible"]');
  
  if (signedInEls.length === 0) errors.push('No signed-in elements found');
  if (signedOutEls.length === 0) errors.push('No signed-out elements found');
  
  return {
    errors: errors,
    elementCounts: {
      signedIn: signedInEls.length,
      signedOut: signedOutEls.length
    }
  };
})();
```

### Expected Results
- `errors`: Empty array `[]`
- `elementCounts.signedIn`: `1` or more
- `elementCounts.signedOut`: `1` or more

### What This Tests
- All required UI elements exist
- Auth state toggles work properly
- No missing dependencies

## Test Execution Order
1. **Test 1** - Verify signed-out state
2. **Test 6** - Check persistence settings
3. **Test 7** - Verify no errors
4. **Test 5** - Manual sign-in flow
5. **Test 2** - Verify signed-in state
6. **Test 3** - Verify profile binding
7. **Test 4** - Verify observer count
8. **Test 1** - Verify signed-out after sign-out

## Success Criteria
- All tests pass with expected results
- No console errors during auth flow
- UI updates immediately without page reload
- Auth state persists across page refreshes
- Single observer pattern is maintained
