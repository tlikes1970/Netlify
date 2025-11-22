# Firebase & Netlify Integration Landscape Report

**Generated:** 2025-11-02  
**Scan Type:** Read-only inventory  
**Purpose:** Map existing Firebase/Firestore and Netlify infrastructure for Phase 1 Community Hub migration from Postgres-Prisma

---

## 1. Firebase Projects Already Wired

### firebase.json Files

- **Not found:** No `firebase.json` configuration files detected
- **Command to verify:** `Get-ChildItem -Recurse -Filter firebase.json`

### .firebaserc Files

- **Not found:** No `.firebaserc` project alias files detected
- **Command to verify:** `Get-ChildItem -Recurse -Filter .firebaserc`

### Mobile App Configuration Files

- **google-services.json:** Not found (no Android Firebase config)
- **GoogleService-Info.plist:** Not found (no iOS Firebase config)
- **Command to verify:** `Get-ChildItem -Recurse -Filter google-services.json`

### Firebase Client Configuration Files

- **`apps/web/src/lib/firebaseBootstrap.ts`** (primary config)
  - Initializes Firebase app with config from env vars
  - Exports: `auth`, `db` (Firestore), `googleProvider`, `appleProvider`
- **`apps/web/src/lib/firebase.ts`** (deprecated, re-exports from bootstrap)
  - File: `/apps/web/src/lib/firebase.ts`
  - Status: DEPRECATED - re-exports from `firebaseBootstrap.ts`
- **`apps/web/src/lib/firebaseSync.ts`** (Firestore sync manager)
  - File: `/apps/web/src/lib/firebaseSync.ts`
  - Purpose: Syncs user watchlists to/from Firestore
- **Legacy files (not in active use):**
  - `_legacy_v1/www/js/firebase-init.js`
  - `_legacy_v1/www/firebase-config.js`

---

## 2. Firebase SDKs Already Installed

### Client SDK (apps/web)

- **Package:** `apps/web/package.json` line 26
- **Dependency:** `"firebase": "^12.4.0"`
- **Lockfile:** `/apps/web/package-lock.json` (npm)
- **Usage:** Client-side only (Firebase Auth + Firestore client SDK)

### Firebase Admin SDK

- **Not found:** No `firebase-admin` package detected
- **Command to verify:** `grep -r "firebase-admin" apps/web/package.json`
- **Verdict:** Admin SDK not installed - needed for server-side REST API

### Firebase Functions SDK

- **Not found:** No `firebase-functions` package detected
- **Verdict:** No Firebase Cloud Functions used

### Firebase CLI Tools

- **Not found:** No `firebase-tools` in devDependencies
- **Verdict:** Firebase CLI not used for deployments

---

## 3. Authentication Status Quo

### Firebase Auth Usage

- **`apps/web/src/lib/auth.ts`** lines 195, 466, 429:
  ```typescript
  onAuthStateChanged(auth as any, async (user) => { ... })
  await signInWithEmailAndPassword(auth, email, password)
  await signInWithRedirect(auth, appleProvider)
  ```
- **`apps/web/src/lib/firebaseBootstrap.ts`** lines 129:
  ```typescript
  const unsubscribe = onAuthStateChanged(auth, () => { ... })
  ```
- **`apps/web/src/lib/authLogin.ts`** lines 55, 72, 181, 218, 222, 257:
  ```typescript
  await signInWithPopup(auth, googleProvider);
  await signInWithRedirect(auth, googleProvider);
  ```

### Netlify Identity Integration

- **Not found:** No `netlifyIdentity.js` files
- **Not found:** No `/.netlify/identity/*` redirects in `netlify.toml`
- **Verdict:** Using Firebase Auth only, not Netlify Identity

---

## 4. Firestore Data Model Already Used

### Firestore Client Usage

- **`apps/web/src/lib/auth.ts`** (client-side):
  - Line 333: `doc(db, 'users', authUser.uid)` - collection: **`users`**
  - Line 532: `doc(db, 'users', uid)` - collection: **`users`**
  - Line 549: `doc(db, 'users', uid)` - collection: **`users`**
  - Operations: `getDoc()`, `setDoc()`, `updateDoc()`, `serverTimestamp()`
- **`apps/web/src/lib/firebaseSync.ts`** (client-side):
  - Line 179: `doc(firebaseDb, 'users', uid)` - collection: **`users`**
  - Line 202: `doc(firebaseDb, 'users', uid)` - collection: **`users`**
  - Operations: `getDoc()`, `setDoc()`, `serverTimestamp()`
  - Document structure: `users/{uid}` contains `{ watchlists, uid, lastUpdated }`

### Firestore Collections in Use

- **`users`** collection:
  - Document ID: User UID from Firebase Auth
  - Document structure: `{ uid, email, displayName, photoURL, watchlists: { tv: {...}, movies: {...} }, settings: {...}, profile: {...}, lastLoginAt }`
  - File examples: `/apps/web/src/lib/auth.ts`, `/apps/web/src/lib/firebaseSync.ts`

### Server-Side Firestore Access

- **Not found:** No `firebase-admin` usage detected
- **Verdict:** All Firestore access is client-side only

---

## 5. Netlify Hosting & Redirects

### netlify.toml Configuration

- **File:** `/netlify.toml` (root)
- **Build command:** `"npm run build"` (line 8)
- **Publish directory:** `"dist"` (line 7)
- **Base directory:** `"apps/web"` (line 6)
- **Functions directory:** `"netlify/functions"` (line 15)

### API Redirect Rules

- **`/api/tmdb-proxy`** → `/.netlify/functions/tmdb-proxy` (line 29-31)
- **`/api/dict/entries`** → `/.netlify/functions/dict-proxy` (line 34-36)
- **No `/api/v1` or `/posts/*` redirects found**

### Firebase Auth Redirect Rules

- **`/__/auth/*`** → `/__/auth/:splat` (line 46-49)
  - Purpose: Preserve Firebase auth handler paths

### SPA Fallback

- **`/*`** → `/index.html` (line 52-55)
  - Status: 200 (SPA routing)

### Build Configuration

- **Command:** `npm run build` (from `apps/web` directory)
- **Script location:** `/apps/web/package.json` line 12: `"build": "tsc && vite build"`
- **Output:** `/apps/web/dist/`

---

## 6. Cloud/Google Bindings

### GOOGLE_APPLICATION_CREDENTIALS

- **Not found:** No usage of `GOOGLE_APPLICATION_CREDENTIALS` env var
- **Verdict:** No service account authentication configured

### Service Account Keys

- **Not found:** No `*.json` service account key files in repo
- **Command to verify:** `Get-ChildItem -Recurse -Filter "*service*account*.json"`
- **Verdict:** No service account keys stored (secure)

### Google Cloud Build Files

- **Not found:** No `cloudbuild.yaml` or `*.cloudbuild.yaml` files
- **Verdict:** No Google Cloud Build configuration

---

## 7. Existing Environment-Variable Pattern

### Firebase Environment Variables

- **Pattern:** `VITE_FIREBASE_*` (Vite client-side)
- **Variables expected:**
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID`
- **Default values:** Hardcoded in `/apps/web/src/lib/firebaseBootstrap.ts` lines 21-30
- **Project ID:** `flicklet-71dff` (from hardcoded defaults)

### Netlify Environment Variable Management

- **Location:** Netlify Dashboard (mentioned in `netlify.toml` line 12)
- **Comment:** `# VITE_FIREBASE_* live in the Netlify dashboard`
- **Documentation:** `/NETLIFY_ENV_SETUP.md` contains setup instructions

### .env Files

- **Not found:** No `.env.production` files in repo
- **Pattern:** Environment variables managed via Netlify UI, not committed files

---

## 8. Re-use Verdict for Phase 1 (Read-only)

- **Firestore client:** ✅ Yes, use existing (`apps/web/src/lib/firebaseBootstrap.ts`) - client SDK already configured and working
- **Firebase Admin SDK:** ⚠️ Not found – needed for server-side REST API to read Firestore data securely
- **Netlify hosting:** ✅ Yes, keep (`netlify.toml` configured, build command: `npm run build`)
- **Custom domain:** Already on `flicklet.netlify.app` (mentioned in `firebaseBootstrap.ts` line 23, auth-diagnostics.md)
- **Functions directory:** Use `/netlify/functions` (already configured in `netlify.toml` line 15)
- **Firebase project:** Reuse `flicklet-71dff` project - already has `users` collection structure

---

## 9. Other SaaS / Cloud Tie-ins (Scan Everything)

### SUPABASE

- **not detected**

### APPWRITE

- **not detected**

### AWS / AMAZON

- **False positives only:** Found "Amazon Prime" as streaming service in trivia questions:
  - `apps/web/src/components/games/TriviaGame.tsx`: multiple lines with "Amazon Prime" as quiz option
  - `apps/web/src/lib/triviaApi.ts` line 265: "Amazon Prime"
  - `apps/web/src/lib/extras/bloopersSearchAssist.ts` line 26: "Amazon Prime Video"
- **Verdict:** No AWS services detected - only mentions of streaming service name

### AZURE

- **`package-lock.json` lines 20602-20638:** Found `@azure/*` packages but only as transitive dependencies in lockfile
- **Verdict:** No active Azure service usage - transitive dependency only

### CLOUDINARY

- **not detected**

### STRIPE

- **not detected**

### SENDGRID

- **`apps/web/netlify/functions/send-email.cjs` line 47:**
  ```javascript
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  ```
- **`apps/web/package.json` line 24:** `"@sendgrid/mail": "^8.1.6"`
- **Environment variables:**
  - `SENDGRID_API_KEY` (required)
  - `SENDGRID_FROM` (required)
  - `SENDGRID_REPLY_TO` (optional)
- **Documentation:** `/SENDGRID_PRODUCTION_SETUP.md`, `/NETLIFY_ENV_SETUP.md` line 29
- **Verdict:** SendGrid actively used for email notifications via Netlify Functions

### SENTRY

- **`package-lock.json` lines 2635-2723:** Found `@sentry/*` packages (`@sentry/core`, `@sentry/node`, `@sentry/node-core`, `@sentry/opentelemetry`)
- **Package:** Listed in `package-lock.json` line 7799: `"@sentry/node": "^9.28.1"`
- **Verdict:** Sentry packages present in lockfile but no active initialization code found in src files

### DATADOG

- **not detected**

### LOGROCKET

- **not detected**

### SEGMENT

- **not detected**

### PLAUSIBLE / Analytics

- **`_legacy_v1/www/components/home-clean/HomeClean.old` line 681:** `window.gtag('event', 'home_clean_action', {`
- **`_legacy_v1/www/components/home-clean/HomeClean.js` line 717:** `window.gtag('event', 'home_clean_action', {`
- **`_legacy_v1/www/archive/js/performance-monitor.js` line 335:** `window.gtag('event', 'performance_metric', {`
- **Verdict:** Google Analytics (`gtag`) used in legacy V1 code only, not in active apps/web

### GITHUB_TOKEN / GITLAB_TOKEN / DOCKER_TOKEN

- **not detected**

### HEROKU / RENDER / FLY / RAILWAY

- **not detected**

### NETLIFY

- **`netlify.toml`:** Full Netlify configuration file (build, functions, redirects)
- **`apps/web/netlify/functions/`:** Directory with 6 Netlify Functions:
  - `dict-proxy.cjs`
  - `env-dump.cjs`
  - `send-email.cjs`
  - `tmdb-proxy.cjs`
  - `trivia-proxy.cjs`
  - `wordnik-proxy.cjs`
- **Environment variable pattern:** `VITE_*` vars mentioned in `netlify.toml` line 12
- **Verdict:** Netlify is primary hosting platform - fully configured

### VERCEL

- **not detected**

### CRON_JOB / GitHub Actions

- **not detected**

### WEBHOOK_SECRET / PUBSUB / EVENTBRIDGE / QUEUE

- **not detected**

### Risk Summary

- **SendGrid:** ✅ Active service in use - API key managed via Netlify Dashboard env vars (`SENDGRID_API_KEY`, `SENDGRID_FROM`) - secure, no keys in repo
- **Sentry:** ⚠️ Packages installed but not initialized - potential for error tracking if configured
- **Google Analytics:** ⚠️ Legacy code only (`_legacy_v1` directory) - not in active use, can be ignored
- **Azure packages:** ⚠️ Transitive dependencies only - no active Azure service usage
- **Firebase:** ✅ Active and configured - project `flicklet-71dff` with `users` collection, client SDK working
- **Netlify:** ✅ Primary hosting - functions directory at `/netlify/functions`, build configured, domain `flicklet.netlify.app`

---

**Report written to `/reports/firebase-netlify-landscape.md` – Firebase & Netlify scan complete.**




























