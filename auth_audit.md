# Flicklet Auth Audit Report

## A) SDK Usage Map

### Firebase Loads/Imports
1. **CDN v8 Compat (Legacy)**: `firebase-app.js`, `firebase-auth.js`, `firebase-firestore.js`
   - Loaded in: `staging/www/index.html` lines 1043-1098
   - Initializes: `firebase.initializeApp(window.FIREBASE_CONFIG)`
   - Sets persistence: `auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)`

2. **CDN v9 Compat Bridge**: `firebase-init.js`
   - Loaded in: `staging/www/index.html` line 1042
   - Exposes v9 APIs on window: `window.auth`, `window.onAuthStateChanged`, etc.
   - **CRITICAL**: This creates a second Firebase initialization path

3. **Inline Script v8**: `inline-script-02.js` lines 18-57
   - Hardcoded config: `firebase.initializeApp({apiKey: "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM", ...})`
   - **CRITICAL**: This creates a THIRD Firebase initialization path

### Duplicate Inits Identified
- **Path 1**: `index.html` inline script (lines 1043-1098) - uses `window.FIREBASE_CONFIG`
- **Path 2**: `firebase-init.js` - uses `window.FIREBASE_CONFIG` 
- **Path 3**: `inline-script-02.js` - uses hardcoded config
- **Path 4**: `app.js` `initFirebase()` method - waits for Firebase ready event

### Mixed SDK Versions
- v8 CDN compat loaded first
- v9 CDN compat bridge overlays v8 APIs
- Multiple initialization guards but no coordination between them

## B) Observer Map

### onAuthStateChanged Registrations
1. **Primary Observer**: `staging/www/js/auth.js` lines 25-62
   - Guard: `window.__authObserverRegistered`
   - Counter: `window.__authObserverCount = 1`
   - **CRITICAL**: This is the ONLY observer that should exist

2. **Legacy Observer**: `www/js/app.js` lines 172-364 (in www/ but not staging/)
   - **CRITICAL**: This creates a duplicate observer in www/ version
   - No guard against multiple registrations

3. **Staging Observer**: `staging/www/js/app.js` lines 238-268
   - **SAFE**: This method is disabled and only calls `UserViewModel.update()`
   - No actual observer registration

### Global Counters/Guards
- `window.__authObserverRegistered` (auth.js)
- `window.__authObserverCount` (auth.js) 
- `window.__authBridgeReady` (auth.js)
- `window.__authReady` (auth.js)

### Double-Registration Risk
- **HIGH RISK**: Multiple initialization paths could create multiple observers
- **MITIGATED**: auth.js has proper guards, but other paths don't check these guards

## C) Sign-in Flows

### Providers/Methods Present
1. **Google Popup**: `staging/www/scripts/auth.js` `loginWithGoogle()`
   - Uses: `firebase.auth().signInWithPopup(provider)`
   - Error handling: Yes, with popup fallback to redirect
   - **CRITICAL**: Calls `ensureFirebase()` which checks `window.firebaseInitialized`

2. **Google Redirect**: `www/scripts/inline-script-02.js` `login()`
   - Fallback when popup fails
   - Uses: `auth.signInWithRedirect(provider)`

3. **Email/Password**: `staging/www/scripts/auth.js` `emailLogin()`
   - **DISABLED**: Function returns early without implementation

### Wrapper Helpers
- `ensureFirebase()`: Checks `window.firebaseInitialized` and `window.firebase`
- `loginWithGoogle()`: Main sign-in wrapper with error handling
- `closeAuthModal()`: UI cleanup after sign-in

### Error Handling Analysis
- **GOOD**: Popup errors trigger redirect fallback
- **GOOD**: Firebase availability is checked before sign-in
- **BAD**: No retry logic for failed sign-ins
- **BAD**: Error messages are generic and not user-friendly

## D) UI Binding Points

### Auth State Visibility Toggles
- **Signed In**: `[data-auth="signed-in-visible"]` (staging/www/index.html line 122)
- **Signed Out**: `[data-auth="signed-out-visible"]` (staging/www/index.html line 117)
- **Handler**: `setAuthUI()` in `staging/www/js/auth.js` lines 66-80

### Profile Display Elements
- **Username**: `#usernameDisplay` and `[data-username-display]` (staging/www/index.html line 125)
- **Snark**: `.snark` and `[data-snark]` (referenced but not found in HTML)
- **Handler**: `setAuthUI()` updates both elements

### Mount Order Issues
- **CRITICAL**: `setAuthUI()` runs before DOM elements may be ready
- **CRITICAL**: No null checks for missing elements
- **CRITICAL**: Snark element referenced but doesn't exist in HTML

## E) Log Correlation

### Reference Log Strings Mapped
1. **"Flicklet safe mode loaded"**: NOT FOUND - may be from removed code
2. **"Auth Observer Registered"**: NOT FOUND - replaced with `__authObserverRegistered` guard
3. **"Auth Observer Count"**: `window.__authObserverCount = 1` (auth.js line 27)
4. **"Auth Ready"**: `window.__authReady = true` (auth.js line 29)
5. **"Current User: undefined"**: `console.log('🔥 Auth state changed:', user ? \`User: ${user.email}\` : 'No user')` (auth.js line 30)

### Code Paths That Emit Logs
- **Auth state changes**: `staging/www/js/auth.js` line 30
- **Firebase init**: `staging/www/index.html` lines 1003, 1070
- **Sign-in processing**: `staging/www/js/app.js` lines 48, 55
- **User data loading**: `staging/www/js/app.js` lines 270-400

## F) Changes This Cycle That Touch Auth

### New Auth Bridge System
- **File**: `staging/www/js/auth.js` - Single observer pattern
- **File**: `staging/www/js/firebase-init.js` - v9 CDN compat bridge
- **Impact**: Creates additional initialization paths

### Safe Mode/Bridges
- **Auth Bridge**: `initAuthBridge()` in auth.js - coordinates with Firebase init
- **Firebase Bridge**: `initFirebaseV9Bridge()` in firebase-init.js - exposes v9 APIs
- **Risk**: Multiple bridges could conflict or create race conditions

### New Listeners
- **Single Observer**: Replaces multiple observers with one centralized observer
- **UI Binding**: `setAuthUI()` centralizes all auth UI updates
- **UserViewModel**: Centralized user state management

## G) Root-Cause Hypotheses (Ranked)

### 1. **Multiple Firebase Initialization Race Condition** (HIGH CONFIDENCE)
- **Evidence**: 4 different Firebase init paths with no coordination
- **Impact**: Auth state may not persist if wrong instance is used
- **Fix**: Consolidate to single initialization path

### 2. **Missing Snark Element in HTML** (HIGH CONFIDENCE)  
- **Evidence**: `setAuthUI()` references `.snark, [data-snark]` but element doesn't exist
- **Impact**: Profile VM binding fails silently
- **Fix**: Add snark element to HTML or remove reference

### 3. **Observer Registration Timing** (MEDIUM CONFIDENCE)
- **Evidence**: Auth bridge waits for Firebase APIs but may register before DOM ready
- **Impact**: UI updates may fail if elements don't exist
- **Fix**: Add DOM ready checks to `setAuthUI()`

### 4. **Persistence Setting Conflicts** (MEDIUM CONFIDENCE)
- **Evidence**: Multiple places set persistence (index.html, auth.js)
- **Impact**: Last setting wins, may not be LOCAL as intended
- **Fix**: Set persistence in one place only

## H) Minimal Fix Plan (REPORT-ONLY)

### Fix 1: Remove Duplicate Firebase Initialization
- **File**: `staging/www/scripts/inline-script-02.js` lines 27-34
- **Change**: Remove hardcoded `firebase.initializeApp()` call
- **Why**: Eliminates third initialization path
- **Rollback**: Restore hardcoded config

### Fix 2: Add Snark Element to HTML
- **File**: `staging/www/index.html` after line 125
- **Change**: Add `<div class="snark" data-snark></div>`
- **Why**: Fixes missing element referenced by `setAuthUI()`
- **Rollback**: Remove the div

### Fix 3: Add DOM Ready Check to setAuthUI
- **File**: `staging/www/js/auth.js` lines 66-80
- **Change**: Wrap `setAuthUI()` body in `if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => setAuthUI(isIn, displayName)); return; }`
- **Why**: Ensures elements exist before updating
- **Rollback**: Remove DOM ready check

### Fix 4: Consolidate Persistence Setting
- **File**: `staging/www/js/auth.js` lines 16-22
- **Change**: Remove `setPersistence` call (already set in index.html)
- **Why**: Eliminates duplicate persistence setting
- **Rollback**: Restore setPersistence call

### Fix 5: Add Error Handling to setAuthUI
- **File**: `staging/www/js/auth.js` lines 76-79
- **Change**: Add null checks: `if (nameEl) nameEl.textContent = ...`
- **Why**: Prevents errors if elements don't exist
- **Rollback**: Remove null checks
