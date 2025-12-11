# Android API Connection Diagnosis Report

## Executive Summary

**Problem**: Capacitor-based Android app fails to connect to production backend APIs because API calls use relative URLs (`/api/...`) which fail in the native Android environment (`capacitor://localhost`), instead of using the absolute production URL (`https://flicklet.netlify.app`).

**Root Cause**: The `VITE_API_BASE_URL` environment variable is not set during mobile builds, causing `API_BASE` to default to an empty string, resulting in relative URLs that cannot resolve in the Capacitor environment.

**Solution**: Set `VITE_API_BASE_URL=https://flicklet.netlify.app` during the mobile build process (either via `.env.mobile` file or build script).

---

## 1. API Request Logic

### Core API Configuration

**File**: `apps/web/src/lib/apiConfig.ts`

```typescript
// NOTE: API_BASE lets mobile builds hit the production backend instead of localhost/capacitor://localhost.
// When VITE_API_BASE_URL is set (e.g., in .env.mobile), API calls will use that base URL.
// When empty (dev mode), relative URLs work with netlify dev proxy.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim() || '';

export { API_BASE };
```

**Analysis**: This is the critical file. When `VITE_API_BASE_URL` is not set, `API_BASE` becomes an empty string, causing all API calls to use relative URLs.

### Files Using API_BASE

#### 1.1 TMDB Proxy Calls

**File**: `apps/web/src/lib/tmdb.ts` (Lines 108, 112)
- Uses: `${API_BASE}/api/tmdb-proxy`
- Used in: `get()`, `fetchGenreContent()`, `getTVShowDetails()`, etc.

**File**: `apps/web/src/search/api.ts` (Lines 147, 265)
- Uses: `${API_BASE}/api/tmdb-proxy`
- Used in: `searchMulti()`, `discoverByGenre()`

**File**: `apps/web/src/tmdb/tv.ts` (Lines 4, 22, 35)
- Uses: `${API_BASE}/api/tmdb-proxy`
- Used in: `fetchNextAirDate()`, `fetchShowStatus()`, `fetchCurrentEpisodeInfo()`

**File**: `apps/web/src/search/enhancedAutocomplete.ts` (Line 15)
- Uses: `${API_BASE}/api/tmdb-proxy`

**File**: `apps/web/src/search/smartSearch.ts` (Line 93)
- Uses: `${API_BASE}/api/tmdb-proxy`

**File**: `apps/web/src/search/autocomplete.ts` (Line 12)
- Uses: `${API_BASE}/api/tmdb-proxy`

#### 1.2 Other API Calls

**File**: `apps/web/src/api/notifications.ts` (Line 39)
- Uses: `${API_BASE}/.netlify/functions/send-email`
- Note: This uses `/.netlify/functions/` directly, not `/api/` proxy

---

## 2. Environment Variable Configuration

### Current State

**No `.env` files found** in:
- Project root
- `apps/web/` directory

**Expected Files** (not present):
- `.env` (general)
- `.env.local` (local overrides)
- `.env.production` (production)
- `.env.mobile` (mobile builds) ⚠️ **CRITICAL MISSING FILE**

### Vite Configuration

**File**: `apps/web/vite.config.ts`

```typescript
export default defineConfig(({ mode }) => {
  // Load VITE_* from both places; app wins.
  const envApp  = loadEnv(mode, __dirname, 'VITE_');
  const envRoot = loadEnv(mode, repoRoot, 'VITE_');
  const env = { ...envRoot, ...envApp };
  // ...
  envDir: __dirname,
  envPrefix: ['VITE_'],
```

**Analysis**: Vite loads environment variables from:
1. `apps/web/` directory (app-level)
2. Project root (root-level)
3. App-level wins if both exist

**Build Mode**: According to `package.json` comment (line 13):
```json
"// NOTE: mobile builds use --mode mobile so API_BASE points at production backend."
```

This suggests mobile builds should use `--mode mobile`, which would load `.env.mobile` file.

---

## 3. Firebase and Backend Configuration

### Firestore Rules

**File**: `firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }

    // Posts collection - read for all, write for authenticated users
    match /posts/{postId} {
      allow read: if true;
      allow create: if isAuthenticated() 
        && request.resource.data.authorId == request.auth.uid
        // ... validation rules
      allow update: if (isOwner(resource.data.authorId) || isAdmin())
      allow delete: if isOwner(resource.data.authorId) || isAdmin();
      
      // Votes sub-collection
      match /votes/{userId} {
        allow read: if true;
        allow write: if isAuthenticated() 
          && userId == request.auth.uid
          && request.resource.data.value is int
          && (request.resource.data.value == 1 || request.resource.data.value == -1);
      }

      // Comments sub-collection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated()
          && request.resource.data.authorId == request.auth.uid
          // ... validation rules
        allow update, delete: if isAuthenticated()
          && (resource.data.authorId == request.auth.uid || /* admin checks */);
        
        // Replies sub-collection
        match /replies/{replyId} {
          allow read: if true;
          allow create: if isAuthenticated()
            && request.resource.data.authorId == request.auth.uid
            // ... validation rules
          allow update, delete: if isAuthenticated()
            && request.auth.uid == resource.data.authorId;
        }
      }
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && userId == request.auth.uid
        && request.resource.data.uid == request.auth.uid;
      allow update: if isAuthenticated()
        && userId == request.auth.uid
        && request.resource.data.uid == resource.data.uid;
      allow delete: if isAuthenticated()
        && userId == request.auth.uid;
    }

    // Reports collection
    match /reports/{reportId} {
      allow create: if isAuthenticated()
        && request.resource.data.reportedBy == request.auth.uid
        // ... validation rules
      allow read, update: if isAdmin();
      allow delete: if false;
    }

    // Username claiming rules
    match /usernames/{handle} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && !exists(/databases/$(database)/documents/usernames/$(handle));
      allow delete: if request.auth != null
                    && resource.data.uid == request.auth.uid;
    }

    match /users/{userId}/settings/{doc=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admin rules
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Netlify Configuration

**File**: `netlify.toml`

```toml
[build]
  base    = "apps/web"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"
  # VITE_FIREBASE_* live in the Netlify dashboard

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  external_node_modules = ["@sendgrid/mail"]

[dev]
  framework  = "#custom"
  command    = "npm run dev --prefix apps/web -- --port 4173 --strictPort"
  targetPort = 4173
  port       = 8888
  functions  = "netlify/functions"
  autoLaunch = false

# API proxies
[[redirects]]
  from = "/api/tmdb-proxy"
  to   = "/.netlify/functions/tmdb-proxy"
  status = 200

[[redirects]]
  from = "/api/dict/entries"
  to   = "/.netlify/functions/dict-proxy"
  status = 200

[[redirects]]
  from = "/api/goofs-fetch"
  to   = "/.netlify/functions/goofs-fetch"
  status = 200

# Backend API proxy
[[redirects]]
  from = "/api/v1/*"
  to   = "/.netlify/functions/backend-proxy/api/v1/:splat"
  status = 200
  force = true

# Hide a path
[[redirects]]
  from = "/emails"
  to   = "/404.html"
  status = 404
  force = true

# ⚠️ CRITICAL: preserve Firebase auth handler paths (must be above catch-all)
[[redirects]]
  from = "/__/auth/*"
  to   = "/__/auth/:splat"
  status = 200

# SPA fallback
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200

# Headers configuration
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/__/auth/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin-allow-popups"
    Cache-Control = "no-cache, must-revalidate, max-age=0"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "no-cache, must-revalidate, max-age=0"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Analysis**: Netlify redirects `/api/tmdb-proxy` to `/.netlify/functions/tmdb-proxy`. These redirects work in the web environment but **do not work in Capacitor Android** because there's no Netlify server to handle the redirects.

---

## 4. Web App Build and Entrypoint

### Vite Configuration

**File**: `apps/web/vite.config.ts`

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../');
const inputsPath = path.resolve(__dirname, '../../migration/inputs');

export default defineConfig(({ mode }) => {
  // Load VITE_* from both places; app wins.
  const envApp  = loadEnv(mode, __dirname, 'VITE_');
  const envRoot = loadEnv(mode, repoRoot, 'VITE_');
  const env = { ...envRoot, ...envApp };

  return {
    plugins: [
      react(),
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    envDir: __dirname,
    envPrefix: ['VITE_'],
    define: {
      'import.meta.env.VITE_TMDB_KEY': JSON.stringify((env.VITE_TMDB_KEY || '').trim())
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '#inputs': inputsPath
      }
    },
    server: {
      fs: { allow: [inputsPath, path.resolve(__dirname, '..'), repoRoot] },
      // Proxy API requests to backend server in dev mode
      proxy: {
        '/api/v1': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        }
      },
      // Configure HMR to work through Netlify dev proxy
      hmr: process.env.NETLIFY_DEV || process.argv.some(arg => arg.includes('4173'))
        ? { clientPort: 8888 }
        : undefined,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Firebase chunks
            'firebase-auth': ['firebase/auth'],
            'firebase-firestore': ['firebase/firestore'],
            'firebase-app': ['firebase/app'],
            
            // React vendor chunk
            'react-vendor': ['react', 'react-dom'],
            
            // Game components - lazy loaded
            'games': [
              './src/components/games/TriviaGame.tsx',
              './src/components/games/FlickWordModal.tsx',
              './src/components/games/TriviaModal.tsx',
              './src/components/games/FlickWordStats.tsx',
              './src/components/games/TriviaStats.tsx'
            ],
            
            // Modal components - lazy loaded
            'modals': [
              './src/components/modals/NotificationSettings.tsx',
              './src/components/modals/NotificationCenter.tsx',
              './src/components/modals/EpisodeTrackingModal.tsx',
              './src/components/modals/NotesAndTagsModal.tsx',
              './src/components/modals/NotInterestedModal.tsx'
            ],
            
            // Page components - lazy loaded
            'pages': [
              './src/pages/ListPage.tsx',
              './src/pages/MyListsPage.tsx',
              './src/pages/DiscoveryPage.tsx'
            ],
            
            // Settings - heavy component
            'settings': [
              './src/components/SettingsPage.tsx'
            ],
            
            // Community features
            'community': [
              './src/components/CommunityPanel.tsx',
              './src/components/CommunityPlayer.tsx'
            ]
          }
        }
      }
    }
  };
});
```

### Index HTML

**File**: `apps/web/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="description" content="Track your favorite TV shows and movies with Flicklet. Discover new content, manage your watchlist, and never miss an episode." />
    <meta name="theme-color" content="#3b82f6" />
    <meta name="color-scheme" content="light dark" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.png" />
    <link rel="apple-touch-icon" sizes="120x120" href="/icon-120.png" />
    <link rel="preconnect" href="https://image.tmdb.org" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>Flicklet V2</title>
    
    <!-- TMDB API Key for local development -->
    <meta name="tmdb-api-key" content="b7247bb415b50f25b5e35e2566430b96" />
    
    <!-- First-Paint Gate CSS: kills transitions while gated -->
    <style id="fp-gate-css">
      html.fp-gate * { transition: none !important; animation: none !important; }
      html.fp-gate body { visibility: hidden; }
      html.fp-gate .app-splash { visibility: visible; }
    </style>
    
    <!-- Mark the page as gated as early as possible -->
    <script>
      try {
        if (localStorage.getItem('app:primed') !== '1') {
          document.documentElement.classList.add('fp-gate');
        }
      } catch {}
    </script>
  </head>
  <body>
    <!-- Optional: tiny splash so users don't see a blank -->
    <div class="app-splash" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;visibility:hidden;">
      <div style="font: 600 14px/1.2 system-ui, sans-serif;opacity:.7;">Loading…</div>
    </div>
    <div id="root"></div>
    
    <!-- Hidden form for Netlify Forms detection -->
    <form name="feedback" netlify netlify-honeypot="bot-field" hidden>
      <input type="text" name="message" />
      <input type="text" name="theme" />
      <input type="text" name="timestamp" />
    </form>
    
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Package.json

**File**: `apps/web/package.json`

```json
{
  "name": "flicklet-web",
  "private": true,
  "version": "0.1.171",
  "type": "module",
  "engines": {
    "node": ">=18 <21"
  },
  "scripts": {
    "dev": "vite",
    "prebuild": "npm run lexicon:build",
    "build": "tsc && vite build",
    "// NOTE: mobile builds use --mode mobile so API_BASE points at production backend.": "",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "check-all": "npm run typecheck && npm run lint",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:e2e": "cross-env VITEST=false playwright test",
    "test:e2e:ui": "cross-env VITEST=false playwright test --ui",
    "analyze:bundle": "npm run build && node scripts/bundle-budget-check.js",
    "lexicon:build": "node scripts/build-lexicon.mjs"
  },
  "dependencies": {
    "@sendgrid/mail": "^8.1.6",
    "@sentry/react": "^7.0.0",
    "@tanstack/react-query": "^5.56.2",
    "firebase": "^12.4.0",
    "firebase-admin": "^11.11.1",
    "lucide-react": "^0.546.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "rollup-plugin-visualizer": "^6.0.4"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^8.46.2",
    "@typescript-eslint/parser": "^8.46.2",
    "@vitejs/plugin-react": "^4.7.0",
    "autoprefixer": "^10.4.21",
    "cross-env": "^7.0.3",
    "eslint": "^8.57.1",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.1.0",
    "jsdom": "^23.0.1",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.18",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "vitest": "^1.6.1"
  }
}
```

**Key Finding**: Line 13 comment indicates mobile builds should use `--mode mobile`, which would load `.env.mobile` file.

---

## 5. Android Native Configuration

### Capacitor Configuration

**File**: `capacitor.config.json`

```json
{
  "appId": "com.TravisL.tvtracker",
  "appName": "tv-tracker",
  "webDir": "apps/web/dist",
  "bundledWebRuntime": false
}
```

**Analysis**: Standard Capacitor config. No server URL configuration here (expected - this is handled by the web app's API_BASE).

### AndroidManifest.xml

**File**: `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

**Analysis**: 
- ✅ `INTERNET` permission is present (required for network requests)
- No network security config issues visible
- Standard Capacitor setup

### Build.gradle

**File**: `android/app/build.gradle`

```gradle
apply plugin: 'com.android.application'

// Version properties with fallbacks
def VERSION_CODE = project.hasProperty("VERSION_CODE") ? project.VERSION_CODE.toInteger() : 1
def VERSION_NAME = project.hasProperty("VERSION_NAME") ? project.VERSION_NAME : "0.1.0"

android {
    namespace "com.TravisL.tvtracker"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.TravisL.tvtracker"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode VERSION_CODE
        versionName VERSION_NAME
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
             // Default: https://android.googlesource.com/platform/frameworks/base/+/282e181b58cf72b6ca770dc7ca5f91f135444502/tools/aapt/AaptAssets.cpp#61
            ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }

    signingConfigs {
        release {
            // Configure only when provided via gradle.properties or -P
            if (project.hasProperty("RELEASE_STORE_FILE")) {
                storeFile file(RELEASE_STORE_FILE)
                storePassword RELEASE_STORE_PASSWORD
                keyAlias RELEASE_KEY_ALIAS
                keyPassword RELEASE_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            // Use release signing if it exists
            if (signingConfigs.findByName("release") != null) {
                signingConfig signingConfigs.release
            }
        }
    }
}

repositories {
    flatDir{
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

**Analysis**: Standard Android build configuration. No issues found that would prevent API calls.

---

## 6. Root Cause Analysis

### The Problem Flow

1. **Build Process**: When building for Android, the web app is built using Vite
2. **Environment Variable**: `VITE_API_BASE_URL` is not set during the build
3. **API_BASE Calculation**: `API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim() || ''` results in empty string
4. **API Calls**: All API calls become relative URLs:
   - `${API_BASE}/api/tmdb-proxy` → `/api/tmdb-proxy`
   - `${API_BASE}/.netlify/functions/send-email` → `/.netlify/functions/send-email`
5. **Capacitor Environment**: In Android, the app runs at `capacitor://localhost`
6. **Request Failure**: Relative URLs like `/api/tmdb-proxy` resolve to `capacitor://localhost/api/tmdb-proxy`, which doesn't exist
7. **Result**: All API calls fail with network errors

### Why This Works in Web but Not Android

- **Web (Netlify)**: Netlify's redirect rules handle `/api/tmdb-proxy` → `/.netlify/functions/tmdb-proxy`
- **Android (Capacitor)**: No server to handle redirects; relative URLs fail

---

## 7. Solution

### Option 1: Create `.env.mobile` File (Recommended)

Create `apps/web/.env.mobile`:

```bash
VITE_API_BASE_URL=https://flicklet.netlify.app
```

Then build with:
```bash
npm run build -- --mode mobile
```

### Option 2: Set Environment Variable in Build Script

Modify the build command to set the variable:

```bash
VITE_API_BASE_URL=https://flicklet.netlify.app npm run build
```

### Option 3: Update Capacitor Sync/Build Process

If you have a script that runs `npx cap sync` or `npx cap copy`, ensure it sets the environment variable:

```bash
cd apps/web
VITE_API_BASE_URL=https://flicklet.netlify.app npm run build
cd ../..
npx cap sync android
```

### Verification

After implementing the fix, verify that:
1. `API_BASE` is set to `https://flicklet.netlify.app` in the built code
2. API calls use absolute URLs: `https://flicklet.netlify.app/api/tmdb-proxy`
3. Android app can successfully make API calls

---

## 8. Additional Notes

### API Endpoints Used

1. **TMDB Proxy**: `/api/tmdb-proxy` → `/.netlify/functions/tmdb-proxy`
2. **Dictionary Proxy**: `/api/dict/entries` → `/.netlify/functions/dict-proxy`
3. **Goofs Fetch**: `/api/goofs-fetch` → `/.netlify/functions/goofs-fetch`
4. **Backend API**: `/api/v1/*` → `/.netlify/functions/backend-proxy/api/v1/:splat`
5. **Email Function**: `/.netlify/functions/send-email` (direct, not proxied)

### Files That Need API_BASE

All these files import and use `API_BASE`:
- `apps/web/src/lib/tmdb.ts`
- `apps/web/src/search/api.ts`
- `apps/web/src/tmdb/tv.ts`
- `apps/web/src/search/enhancedAutocomplete.ts`
- `apps/web/src/search/smartSearch.ts`
- `apps/web/src/search/autocomplete.ts`
- `apps/web/src/api/notifications.ts`

---

## 9. Next Steps

1. ✅ **Create `.env.mobile` file** with `VITE_API_BASE_URL=https://flicklet.netlify.app`
2. ✅ **Update build process** to use `--mode mobile` or set environment variable
3. ✅ **Rebuild web app** with the environment variable set
4. ✅ **Sync Capacitor** to copy updated web assets to Android
5. ✅ **Test Android app** to verify API calls work
6. ✅ **Monitor logs** for any remaining API connection issues

---

**Report Generated**: $(date)
**Project**: TV Tracker / Flicklet
**Issue**: Android API Connection Failures
**Status**: Root cause identified, solution provided




