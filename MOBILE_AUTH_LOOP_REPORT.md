# Mobile Sign-On Loop Analysis

## 🔴 Critical Mobile Loop Issues

### Root Cause
Multiple mobile detection mechanisms, sessionStorage manipulation, and timing issues create cascading authentication failures on mobile devices.

### Loop Triggers

#### 1. **SessionStorage Race Condition** (MOST LIKELY)
```typescript:112:127:apps/web/src/lib/auth.ts
// Check if there's a pending redirect
if (key && key.includes('pendingRedirect')) {
  sessionStorage.removeItem(key); // ❌ BREAKS FIREBASE AUTH
}
```
**Why it loops:**
- Firebase stores auth state in sessionStorage
- Manual removal breaks Firebase's auth state tracking
- Page thinks it needs to redirect again → infinite loop

#### 2. **Mobile Detection Confusion**
- `isMobileNow()` uses viewport width (768px breakpoint)
- `isBlockedOAuthContext()` uses user agent detection
- Different results can trigger multiple auth attempts

#### 3. **Retry Timing on Slow Networks**
```typescript:188:218:apps/web/src/lib/auth.ts
// DEBUG: Try one more time after a short delay
await new Promise(resolve => setTimeout(resolve, 500));
const retryResult = await getRedirectResult(auth);
```
- 500ms retry happens before redirect completes on slow mobile networks
- Second attempt triggers another redirect while first is still pending
- Creates overlapping auth flows

#### 4. **Service Worker Interception**
- SW caches redirect URLs
- Returns stale auth state
- App tries to complete auth with expired credentials

#### 5. **URL Cleanup Timing Race**
- Cleanup happens multiple times
- `getRedirectResult()` changes URL during cleanup window
- Another redirect triggers

#### 6. **Modal Auto-Reopen After Failed Auth**
```typescript:127:135:apps/web/src/App.tsx
if (!authLoading && authInitialized && !isAuthenticated && !isReturningFromRedirect) {
  setTimeout(() => setShowAuthModal(true), 1000);
}
```
- If auth fails silently, modal reopens
- User clicks sign-in again → new redirect
- Loop continues

---

## 🎭 The Mobile Theater Loop

**Scene 1: User Taps Sign In**
- Curtain opens (AuthModal)
- Usher (auth.ts) checks if phone is a real device
- Three different ushers check the same phone, get different answers

**Scene 2: The Redirect Happens**
- App redirects to Google
- User signs in successfully
- Google tries to send user back

**Scene 3: The Return**
- App loads after redirect
- First usher removes the ticket stub from your pocket (sessionStorage cleanup)
- Second usher checks your pocket (getRedirectResult) - stub is gone!
- "You don't have a ticket, go buy another one"
- Loop back to Scene 1

**On Mobile Specifically:**
- Phone is slow to process (network latency)
- 500ms later, second usher checks again while first is still searching
- Service worker cached an old showtime
- Multiple ushers are checking at once
- They trip over each other

---

## ⚡ Immediate Fix Required

### Priority 1: Remove SessionStorage Cleanup
```typescript
// REMOVE THIS ENTIRE SECTION from auth.ts initialize()
// Check if there's a pending redirect
const pendingRedirectKeys = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && key.includes('pendingRedirect')) {
    sessionStorage.removeItem(key); // ❌ DELETE THIS LINE
  }
}
```

### Priority 2: Fix Mobile Detection
Create single source:
```typescript
// Create apps/web/src/lib/mobileAuthDetection.ts
export function shouldUsePopupMethod(): boolean {
  const isLocalhost = window.location.hostname === 'localhost';
  const ua = navigator.userAgent;
  const isMobileUA = /iPhone|iPad|iPod|Android/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isWebView = /* your webview checks */;
  
  return isLocalhost || (!isMobileUA && !isStandalone && !isWebView);
}
```

### Priority 3: Increase Retry Delay for Mobile
```typescript
// Only retry on desktop, not mobile
const isMobile = navigator.userAgent.match(/iPhone|iPad|iPod|Android/i);
const retryDelay = isMobile ? 2000 : 500; // Longer delay for slow networks
```

### Priority 4: Skip Retry if URL Already Cleaned
```typescript
const hasAuthParams = window.location.hash || window.location.search;
if (!hasAuthParams && !result) {
  // URL is clean and no result - don't retry, user is not signing in
  return;
}
```

---

## 🛡️ Defense Strategy

1. **Never touch sessionStorage** that Firebase uses
2. **Single mobile detection** function
3. **Longer retry delays** on mobile devices
4. **One attempt only** - if redirect fails, show error
5. **Track auth attempts** in localStorage to prevent infinite loops

---

## 📊 Mobile Loop Prevention

Add to `auth.ts`:
```typescript
// Track recent auth attempts to prevent loops
const AUTH_ATTEMPT_KEY = 'flicklet.auth.attempt.timestamp';
const AUTH_ATTEMPT_WINDOW = 30000; // 30 seconds

function shouldBlockAuthAttempt(): boolean {
  const lastAttempt = localStorage.getItem(AUTH_ATTEMPT_KEY);
  if (!lastAttempt) return false;
  
  const timeSince = Date.now() - parseInt(lastAttempt);
  return timeSince < AUTH_ATTEMPT_WINDOW;
}

function recordAuthAttempt(): void {
  localStorage.setItem(AUTH_ATTEMPT_KEY, Date.now().toString());
}
```

Then check before initiating redirect:
```typescript
if (shouldBlockAuthAttempt()) {
  throw new Error('Authentication attempt blocked - too frequent');
}
recordAuthAttempt();
```

---

## Summary

**Mobile loops are caused by:**
1. ❌ Removing Firebase sessionStorage state
2. ❌ Conflicting mobile detection (3 different methods)
3. ❌ Retry happening too fast on slow networks
4. ❌ Service worker caching redirect responses
5. ❌ URL cleanup triggering new redirects
6. ❌ Modal auto-reopening after silent failures

**Fix immediately:**
- Remove ALL sessionStorage manipulation
- Unify mobile detection
- Increase retry delays for mobile
- Add attempt tracking to prevent loops

---

**Test This On Real Mobile:**
1. Safari on iPhone
2. Chrome on Android
3. Samsung Internet
4. With poor network conditions (slow 3G)

