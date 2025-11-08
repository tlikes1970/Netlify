# Sign-On Process Forensic Report

## Executive Summary

This report documents the complete sign-on process for Google, Apple, and Email authentication methods, including all data written to and received from Firebase, and the username handling flow.

---

## Authentication Methods Overview

### 1. Google Sign-In
**Entry Point:** `AuthModal.tsx` → `googleLogin()` in `authLogin.ts`

**Flow Selection:**
- **Localhost:** Always uses popup (immediate completion)
- **Production:** Uses redirect on canonical domains, popup on preview/unknown domains
- **iOS/Safari:** Always uses popup (better compatibility)
- **Android/Desktop:** Redirect on webview, popup otherwise

**What Happens:**
1. User clicks "Sign in with Google"
2. System checks environment and device type
3. Opens popup OR redirects to Google OAuth
4. User authenticates with Google
5. Google redirects back to app (redirect flow) OR popup closes (popup flow)
6. Firebase processes OAuth result
7. `onAuthStateChanged` fires in `auth.ts`

---

### 2. Apple Sign-In
**Entry Point:** `AuthModal.tsx` → `signInWithProvider('apple')` in `auth.ts`

**Flow:**
- Always uses redirect (never popup)
- Requires verified domains in Apple Developer Console
- Shows warning on localhost

**What Happens:**
1. User clicks "Sign in with Apple"
2. System ensures persistence is set
3. Cleans URL of debug params
4. Checks for rapid retry attempts (30-second window)
5. Redirects to Apple OAuth
6. Apple redirects back to app
7. Firebase processes OAuth result
8. `onAuthStateChanged` fires

---

### 3. Email/Password Sign-In
**Entry Point:** `AuthModal.tsx` → `signInWithEmail()` or `createAccountWithEmail()` in `auth.ts`

**What Happens:**
1. User clicks "Sign in with Email"
2. Modal shows email/password form
3. User can toggle between "Sign In" and "Create Account"
4. On submit:
   - **New Account:** `createUserWithEmailAndPassword()` called
   - **Existing Account:** `signInWithEmailAndPassword()` called
5. Firebase authenticates
6. `onAuthStateChanged` fires

---

## Complete Sign-On Flow (All Methods)

### Phase 1: Authentication Initiation

**Stage Setup (Firebase Bootstrap)**
- Location: `firebaseBootstrap.ts`
- Sets Firebase persistence to `indexedDBLocalPersistence`
- Initializes Firebase Auth, Firestore, and Functions
- Creates `firebaseReady` promise that resolves when auth state initializes

**What's Written to Browser:**
- Nothing yet (just initialization)

**What's Read from Firebase:**
- Nothing yet (just initialization)

---

### Phase 2: User Initiates Sign-In

**Google Sign-In Specific:**
- Location: `authLogin.ts:43` - `googleLogin()`
- Checks for `?authMode=popup` or `?authMode=redirect` query params (overrides)
- Validates OAuth origin
- Sets redirect guard in sessionStorage to prevent loops
- Persists status to localStorage: `flicklet.auth.status = "redirecting"`

**What's Written to Browser:**
- `localStorage.flicklet.auth.status = "redirecting"` (redirect flow only)
- `localStorage.flicklet.auth.stateId = "auth_{timestamp}_{random}"` (redirect flow only)
- `localStorage.flicklet.auth.redirect.start = "{timestamp}"` (redirect flow only)
- `sessionStorage` redirect guard flag

**What's Sent to Firebase:**
- OAuth redirect request to Google/Apple (via Firebase Auth SDK)
- No direct Firestore writes yet

**What's Received from Firebase:**
- OAuth redirect URL (user is sent to Google/Apple)

---

### Phase 3: OAuth Provider Authentication

**What Happens:**
- User authenticates with Google/Apple
- Provider redirects back to app with OAuth tokens

**What's Written to Browser:**
- OAuth state/code in URL query params (temporary, cleaned after processing)

**What's Sent to Firebase:**
- OAuth tokens via redirect callback

**What's Received from Firebase:**
- OAuth result with user credentials
- Firebase Auth user object

---

### Phase 4: Redirect Result Processing

**Location:** `auth.ts:190-290` (in `initialize()`) and `authFlow.ts:20-101`

**What Happens:**
1. `getRedirectResult(auth)` is called (exactly once, guarded by session flag)
2. If result exists, Firebase Auth user is created
3. Redirect guard is cleared
4. URL params are cleaned (after 500ms delay)

**What's Written to Browser:**
- Redirect guard cleared from sessionStorage
- URL cleaned (OAuth params removed)

**What's Received from Firebase:**
- `UserCredential` object containing:
  - `user.uid` - Unique user ID
  - `user.email` - Email address
  - `user.displayName` - Display name (from provider)
  - `user.photoURL` - Profile photo URL
  - `user.emailVerified` - Email verification status
  - `user.providerData` - Provider information (google.com, apple.com, password)

---

### Phase 5: Auth State Change Handler

**Location:** `auth.ts:314-450` - `onAuthStateChanged` callback

**What Happens:**
1. Firebase fires `onAuthStateChanged` event
2. User object is converted to `AuthUser` format
3. Status set to `'authenticated'`
4. `ensureUserDocument()` is called
5. `firebaseSyncManager.loadFromFirebase()` is called
6. All listeners are notified

**What's Written to Browser:**
- `localStorage.flicklet.auth.status` cleared (auth complete)
- `localStorage.flicklet.auth.resolving.start` cleared
- `localStorage.flicklet.auth.stateId` cleared
- `localStorage.flicklet.auth.redirect.start` cleared
- `localStorage.flicklet.auth.broadcast` cleared

**What's Sent to Firebase:**
- See Phase 6 below

**What's Received from Firebase:**
- Firebase Auth `User` object (already received, this is the callback)

---

### Phase 6: User Document Creation/Update

**Location:** `auth.ts:464-521` - `ensureUserDocument()`

#### For NEW Users:

**What's Written to Firestore:**
```javascript
// Collection: users
// Document ID: {uid}
{
  uid: "{user.uid}",
  email: "{user.email}",
  displayName: "{user.displayName}",
  photoURL: "{user.photoURL}",
  lastLoginAt: "{ISO timestamp}",
  profile: {
    email: "{user.email}",
    displayName: "{user.displayName}",
    photoURL: "{user.photoURL}"
  },
  settings: {
    usernamePrompted: false,  // ⚠️ CRITICAL: Default is false
    theme: "light",
    lang: "en"
  },
  watchlists: {
    tv: { watching: [], wishlist: [], watched: [] },
    movies: { watching: [], wishlist: [], watched: [] }
  }
}
```

**What's Read from Firestore:**
- Document existence check: `getDoc(userRef)` - returns `null` if new user

#### For EXISTING Users:

**What's Written to Firestore:**
```javascript
// Collection: users
// Document ID: {uid}
// Operation: updateDoc (merge)
{
  lastLoginAt: serverTimestamp(),
  profile: {
    email: "{user.email}",
    displayName: "{preserved or new displayName}",  // Preserves custom username if exists
    photoURL: "{user.photoURL}"
  }
}
```

**What's Read from Firestore:**
- Existing document: `getDoc(userRef)` - returns existing data
- Checks for:
  - `existingData.profile.displayName` (custom display name)
  - `existingData.settings.username` (username)
- **Preservation Logic:** If user has custom username or displayName, it's preserved and NOT overwritten by provider's displayName

---

### Phase 7: Cloud Data Loading

**Location:** `firebaseSync.ts:196-228` - `loadFromFirebase()`

**What's Read from Firestore:**
```javascript
// Collection: users
// Document ID: {uid}
// Reads entire document
{
  watchlists: {
    tv: { watching: [...], wishlist: [...], watched: [...] },
    movies: { watching: [...], wishlist: [...], watched: [...] }
  },
  // ... other user data
}
```

**What's Written to Browser:**
- Merged watchlist data into `localStorage.flicklet.library.v2`
- Duplicates are removed during merge

**What's Sent to Firebase:**
- Nothing (read-only operation)

---

### Phase 8: Username State Loading

**Location:** `useUsername.ts:103-191` - `loadUsername()`

**What Happens:**
1. Hook subscribes to `authManager` changes
2. When auth state changes, `loadUsername()` is called
3. Calls `authManager.getUserSettings(uid)`

**What's Read from Firestore:**
```javascript
// Collection: users
// Document ID: {uid}
// Path: data.settings
{
  username: "{username}" or null,
  usernamePrompted: true or false,
  theme: "light",
  lang: "en"
}
```

**What's Written to Browser:**
- `usernameStateManager` state updated:
  - `username` - The username value (or empty string)
  - `usernamePrompted` - Whether user has been prompted (or skipped)
  - `loading` - Set to false after load completes
- Debug logs to `localStorage.flicklet.username.logs` (last 20 entries)

**What's Sent to Firebase:**
- Nothing (read-only operation)

---

### Phase 9: Username Prompt (If Needed)

**Location:** `useUsername.ts:269-290` - `updateUsername()`

**Trigger:** User is authenticated, has no username, and `usernamePrompted === false`

**What Happens:**
1. User enters username in modal
2. `updateUsername()` is called
3. Calls `authManager.updateUserSettings(uid, { username, usernamePrompted: true })`

**What's Written to Firestore:**
```javascript
// Collection: users
// Document ID: {uid}
// Operation: updateDoc (merge)
{
  settings: {
    username: "{chosen username}",
    usernamePrompted: true,
    // ... other existing settings preserved
  }
}
```

**What's Read from Firestore:**
- Existing settings: `getDoc(userRef)` to read current settings before merge

**What's Written to Browser:**
- `usernameStateManager` updated with new username
- Local state reflects username immediately

---

### Phase 10: Username Claim (Alternative Flow)

**Location:** `usernameFlow.ts:17-93` - `ensureUsernameChosen()`

**What Happens:**
1. Checks if user already has username
2. If not, prompts for candidate username
3. Uses Firestore transaction to claim username atomically

**What's Written to Firestore:**
```javascript
// Transaction writes TWO documents:

// 1. Collection: usernames
//    Document ID: {username.toLowerCase()}
{
  uid: "{user.uid}",
  createdAt: "{ISO timestamp}"
}

// 2. Collection: users
//    Document ID: {uid}
//    Operation: set (merge: true)
{
  settings: {
    username: "{candidate}",
    usernamePrompted: true,
    // ... other settings preserved
  }
}
```

**What's Read from Firestore:**
- `users/{uid}` - Check for existing username
- `usernames/{candidate.toLowerCase()}` - Check if username is taken (in transaction)

**What's Written to Browser:**
- Nothing (Firestore transaction handles everything)

---

## Data Flow Summary

### What Goes TO Firebase

#### Firebase Auth (Authentication):
- OAuth redirect requests (Google/Apple)
- Email/password credentials (Email sign-in)
- **No direct writes** - Firebase Auth handles internally

#### Firestore (User Data):

**On First Sign-In:**
- `users/{uid}` document created with:
  - Basic profile (email, displayName, photoURL)
  - Settings (usernamePrompted: false, theme, lang)
  - Empty watchlists structure
  - `lastLoginAt` timestamp

**On Subsequent Sign-Ins:**
- `users/{uid}` document updated with:
  - `lastLoginAt` timestamp
  - Profile fields (email, displayName, photoURL) - preserves custom displayName
  - **Does NOT overwrite** existing username or custom displayName

**When Username is Set:**
- `users/{uid}/settings.username` updated
- `users/{uid}/settings.usernamePrompted` set to true
- `usernames/{username.toLowerCase()}` document created (if using transaction flow)

---

### What Comes FROM Firebase

#### Firebase Auth:
- `User` object containing:
  - `uid` - Unique identifier
  - `email` - Email address
  - `displayName` - Name from provider (Google/Apple) or null
  - `photoURL` - Profile photo URL or null
  - `emailVerified` - Boolean
  - `providerData` - Array with provider info (google.com, apple.com, password)

#### Firestore:

**User Document (`users/{uid}`):**
- Complete user profile
- Settings (including username and usernamePrompted)
- Watchlists (TV and movies)
- `lastLoginAt` timestamp

**Username Lookup (`usernames/{handle}`):**
- Only read during username claim transaction
- Contains: `{ uid, createdAt }`

---

## Critical Data Points

### Username Handling

1. **Default State:** New users have `settings.usernamePrompted: false`
2. **Username Storage:** Stored in `users/{uid}/settings/username`
3. **Username Uniqueness:** Enforced via `usernames/{handle}` collection
4. **Preservation:** Custom usernames are preserved across sign-ins
5. **Display Name:** Can differ from Firebase Auth `displayName` (preserved from Firestore)

### Display Name Logic

**Priority Order:**
1. `settings.username` (if exists) - User's chosen username
2. `profile.displayName` (if different from Firebase Auth) - Custom display name
3. `user.displayName` (from Firebase Auth) - Provider's display name
4. Empty string (fallback)

**Key Behavior:** Google/Apple sign-ins do NOT overwrite custom usernames or display names.

---

## Error Handling

### OAuth Errors:
- `auth/popup-blocked` → Falls back to redirect (if allowed)
- `auth/popup-closed-by-user` → Falls back to redirect (if allowed)
- `auth/network-request-failed` → Logged, user sees error
- `auth/unauthorized-domain` → Logged, shows config error banner

### Email/Password Errors:
- `auth/invalid-credential` → "Invalid email or password"
- `auth/email-already-in-use` → "Email already registered"
- `auth/weak-password` → "Password too weak"
- `auth/too-many-requests` → "Too many requests, try later"

### Username Errors:
- `USERNAME_TAKEN` → Username already exists
- `USERNAME_TIMEOUT` → Transaction took >12 seconds
- `AUTH_NOT_SIGNED_IN` → User not authenticated

---

## Security Considerations

1. **Persistence:** Set to `indexedDBLocalPersistence` before any auth operations
2. **Redirect Guards:** Session-based guards prevent redirect loops
3. **Origin Validation:** OAuth origins are validated before redirect
4. **Transaction Safety:** Username claims use Firestore transactions (atomic)
5. **Rate Limiting:** 30-second window prevents rapid auth retries
6. **Token Handling:** OAuth tokens handled by Firebase SDK (not exposed to app code)

---

## Debugging & Logging

### Auth Logs:
- Stored in `localStorage.auth-debug-logs` (last 10 entries)
- Enabled via `?debug=auth` query param
- Logs include: sign-in start, redirect/popup selection, errors, completion

### Username Logs:
- Stored in `localStorage.flicklet.username.logs` (last 20 entries)
- Includes: username value, prompted status, load time, timestamp
- Errors stored in `localStorage.flicklet.username.errors` (last 10 entries)

### Status Tracking:
- `localStorage.flicklet.auth.status` - Current auth status
- `sessionStorage` - Redirect guards and attempt budgets

---

## Files Involved

### Core Authentication:
- `apps/web/src/lib/firebaseBootstrap.ts` - Firebase initialization
- `apps/web/src/lib/auth.ts` - AuthManager class, user document management
- `apps/web/src/lib/authLogin.ts` - Google sign-in helper
- `apps/web/src/lib/authFlow.ts` - Redirect result processing

### UI Components:
- `apps/web/src/components/AuthModal.tsx` - Sign-in modal
- `apps/web/src/hooks/useAuth.ts` - Auth hook for components

### Username Handling:
- `apps/web/src/hooks/useUsername.ts` - Username state management
- `apps/web/src/features/username/usernameFlow.ts` - Username claim flow

### Data Sync:
- `apps/web/src/lib/firebaseSync.ts` - Watchlist data sync

---

## Conclusion

The sign-on process is a multi-phase operation involving:
1. OAuth/Email authentication via Firebase Auth
2. User document creation/update in Firestore
3. Cloud data loading and merging
4. Username state loading and prompting
5. State synchronization across components

All three methods (Google, Apple, Email) converge at the `onAuthStateChanged` callback, which triggers the same post-authentication flow. Username handling is separate from authentication and occurs after the user is authenticated.

