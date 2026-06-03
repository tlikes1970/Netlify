# iOS App Store Readiness Report

## Flicklet - Diagnostic Audit

**Date:** 2024  
**Scope:** iOS App Store submission readiness assessment  
**Status:** READ-ONLY diagnostic (no code changes made)

---

## Executive Summary

**Overall Readiness Score: ~65%**

The app has a solid foundation with Capacitor iOS wrapper infrastructure in place, but several critical gaps must be addressed before App Store submission. The primary blockers are missing iOS-specific PWA configurations, incomplete icon sets, and potential service worker risks. Mobile UX appears functional but needs polish verification.

**Top 3 Blocking Issues:**

1. Missing iOS-specific meta tags and touch icons in HTML shell
2. Incomplete PWA manifest (missing 384px icon, no maskable icons)
3. Service worker complexity may cause issues in iOS WebView environment

**Top 3 Non-Blocking Polish Items:**

1. Verify all mobile breakpoints render correctly on actual iOS devices
2. Test admin/debug routes are properly gated from public access
3. Complete App Store Connect privacy questionnaire using data collection audit below

---

## 1. PWA Manifest Status

### What's Implemented

- ✅ Basic manifest exists: `apps/web/public/manifest.webmanifest`
- ✅ Core fields present:
  - `name`: "Flicklet"
  - `short_name`: "Flicklet"
  - `start_url`: "/"
  - `display`: "standalone" (correct for iOS)
  - `background_color`: "#ffffff"
  - `theme_color`: "#000000"
- ✅ Icon set includes: 192x192, 512x512 PNGs

### What's Missing or Non-Compliant

- ❌ **Missing 384x384 icon** (recommended for iOS)
- ❌ **No maskable icons** (required for proper iOS home screen appearance)
- ❌ **No `screenshots` array** (optional but recommended for App Store)
- ⚠️ **Theme color mismatch**: Manifest says `#000000`, but `index.html` meta tag says `#3b82f6` (blue) - inconsistency may cause visual issues

### Risk Assessment

**Risk Level: MEDIUM**

The manifest is functional but incomplete. iOS will fall back to available icons, but the missing 384px icon and lack of maskable icons may result in suboptimal home screen appearance. The theme color inconsistency could cause status bar styling issues.

**Files to Review:**

- `apps/web/public/manifest.webmanifest`
- `apps/web/public/icon-192.png`
- `apps/web/public/icon-512.png`

---

## 2. HTML Shell & iOS Meta Tags

### What's Implemented

- ✅ Basic viewport meta tag with mobile constraints
- ✅ Manifest link present: `<link rel="manifest" href="/manifest.webmanifest" />`
- ✅ Theme color meta tag (though value differs from manifest)
- ✅ Description meta tag
- ✅ Service worker registration in `main.tsx` (line 537)

### What's Missing

- ❌ **`apple-mobile-web-app-capable`** meta tag (critical for iOS standalone mode)
- ❌ **`apple-mobile-web-app-status-bar-style`** meta tag (controls status bar appearance)
- ❌ **Apple touch icon links** (180x180, 152x152, 120x120 sizes)
- ❌ **Apple touch icon precomposed** (prevents iOS from adding effects)

### Risk Assessment

**Risk Level: HIGH**

Without `apple-mobile-web-app-capable`, iOS Safari will not launch the app in standalone mode. Users will see browser chrome (address bar, navigation) which degrades the native app experience. This is a hard blocker for App Store submission if the goal is a native-like experience.

**File to Review:**

- `apps/web/index.html` (lines 1-50)

**Required Additions:**

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>
<link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/icon-152.png" />
<link rel="apple-touch-icon" sizes="120x120" href="/icon-120.png" />
```

---

## 3. Service Worker Status

### Caching Strategy Summary

The service worker (`apps/web/public/sw.js`) implements a hybrid strategy:

1. **Auth Routes**: Network-only with `cache: 'no-store'` (lines 68-73, 115-119)
   - Detects `/__/auth/`, `code=`, `state=`, `oauth`, `redirect` patterns
   - Bypasses cache completely for OAuth flows

2. **HTML Navigation**: Network-first with cache fallback (lines 112-146)
   - Tries network first, falls back to cache, then offline page
   - Prevents stale HTML during updates

3. **API Routes (`/api/*`)**: Stale-while-revalidate (lines 98-109)
   - Returns cached immediately, updates in background

4. **Post Routes (`/posts/*`)**: Cache-first (lines 76-94)
   - Serves cached, updates in background

5. **Static Assets**: Cache-first (lines 167-180)
   - JS, CSS, images, fonts cached aggressively

### Specific Risks

#### Risk 1: Auth Redirect Loops (MITIGATED)

- **Status**: Appears handled
- **Evidence**: Multiple auth URL detection patterns, explicit `cache: 'no-store'` for auth requests
- **Concern**: Complex detection logic (lines 51-56) may miss edge cases
- **Risk Level**: LOW (appears well-handled, but needs iOS WebView testing)

#### Risk 2: Stale UI After Deploy (MODERATE RISK)

- **Status**: Partially mitigated
- **Evidence**: Network-first for HTML (line 123), cache versioning (`CACHE_NAME = "app-assets-v2"`, `SW_VERSION = "v4"`)
- **Concern**: Cache-first for static assets means old JS/CSS may persist after deploy until SW updates
- **Risk Level**: MEDIUM (iOS WebView may handle SW updates differently than desktop browsers)

#### Risk 3: Offline Behavior (UNKNOWN)

- **Status**: Basic fallback exists
- **Evidence**: Offline page fallback (line 140), but no offline.html file found in public directory
- **Risk Level**: LOW (app likely requires network for core functionality anyway)

#### Risk 4: iOS WebView Compatibility (UNKNOWN)

- **Status**: Not tested
- **Concern**: iOS WebView handles service workers differently than Safari. The complex activation logic (lines 12-32) may cause issues
- **Risk Level**: MEDIUM (needs iOS device testing)

### Risk Level: MEDIUM

The service worker is sophisticated but complex. The auth handling appears robust, but iOS WebView behavior is untested. The network-first HTML strategy is good, but cache-first static assets could cause stale UI issues.

**Recommendation**: Test service worker behavior on actual iOS devices, especially:

- App updates after new deploy
- OAuth redirect flows
- Offline/online transitions

**Files to Review:**

- `apps/web/public/sw.js`
- `apps/web/src/sw-register.ts`
- `apps/web/src/hooks/useServiceWorker.ts`

---

## 4. Mobile UX Readiness

### Flows That Look Solid

1. **Main List Tabs** (Currently Watching, Want to Watch, Watched)
   - Mobile breakpoint: `MOBILE_SETTINGS_BREAKPOINT = 744` (line 506 in `App.tsx`)
   - Mobile-specific components: `MobileTabs.tsx` with iOS keyboard handling
   - Visual Viewport API used for keyboard offset (lines 38-69 in `MobileTabs.tsx`)

2. **Search**
   - Unified search component exists
   - Mobile-responsive breakpoints in place

3. **Settings**
   - Mobile sheet variant (`SettingsSheet.tsx`) for screens ≤744px
   - Desktop page variant for larger screens
   - Conditional rendering based on viewport width

4. **Games (FlickWord, Daily Trivia)**
   - Mobile-specific styles: `flickword-mobile.css`
   - Game components appear mobile-aware

### Flows That Are Questionable / High-Risk

1. **Admin Page (`/admin`)**
   - **Status**: Route exists, gated by `isAdmin` check (line 102 in `App.tsx`)
   - **Risk**: If admin check fails, route is accessible
   - **Recommendation**: Verify admin gating works correctly, test that non-admin users cannot access

2. **Debug Auth Page (`/debug/auth`)**
   - **Status**: Route exists (line 103 in `App.tsx`)
   - **Risk**: Debug tools should not be accessible in production
   - **Recommendation**: Gate behind environment check or remove entirely for production builds

3. **Unsubscribe Page (`/unsubscribe`)**
   - **Status**: Public route (line 104 in `App.tsx`)
   - **Risk**: Low - this is likely intentional for email unsubscribe links
   - **Recommendation**: Verify this is intended to be public

### Obvious "Don't Ship This Yet" Screens

1. **"Coming Soon" Features in Settings**
   - **Location**: `settingsSections.tsx` lines 1288-1338
   - **Content**: Pro features marked "Coming Soon"
   - **Risk**: LOW (clearly labeled, not broken functionality)
   - **Recommendation**: Either remove or ensure messaging is clear these are future features

2. **Placeholder Content**
   - Multiple TODO comments found (127 instances)
   - Most are in code comments, not user-facing
   - **Risk**: LOW (appears to be development notes, not broken UI)

### Mobile Breakpoint Analysis

- **Primary breakpoint**: 744px (mobile settings)
- **Secondary breakpoint**: 1024px (mobile nav, desktop cards)
- **Desktop poster width**: 225px (≥769px)
- **Mobile-specific CSS**: Multiple files (`compact-mobile.css`, `cards-mobile.css`, etc.)

**Risk Assessment: LOW-MEDIUM**

The mobile UX appears well-structured with proper breakpoints and iOS-specific handling (keyboard offset, visual viewport API). However, actual device testing is required to verify:

- No horizontal overflow
- No pinch-zoom required
- All buttons accessible without scrolling
- Proper keyboard dismissal

**Files to Review:**

- `apps/web/src/components/MobileTabs.tsx`
- `apps/web/src/styles/global.css` (lines 88-127)
- `apps/web/src/styles/tokens.css` (line 37)

---

## 5. Broken / Incomplete Surfaces

### Routes That Are Reachable But Incomplete

1. **`/admin`** - AdminPage
   - **Status**: Gated by admin role check
   - **Risk**: MEDIUM (if gating fails, exposes admin tools)
   - **Recommendation**: Verify `useAdminRole()` hook properly restricts access

2. **`/debug/auth`** - AuthDebugPage
   - **Status**: Debug tool, should be dev-only
   - **Risk**: HIGH (exposes internal auth debugging)
   - **Recommendation**: Remove from production build or gate behind environment variable

3. **`/unsubscribe`** - UnsubscribePage
   - **Status**: Public route (intentional for email links)
   - **Risk**: LOW (legitimate use case)

4. **`/posts/:slug`** - PostDetail
   - **Status**: Public route for community posts
   - **Risk**: LOW (intended functionality)

### "Coming Soon" Content

- **Settings Pro Features**: "Coming Soon" section in settings (lines 1288-1338 in `settingsSections.tsx`)
  - Clearly labeled, not broken
  - **Risk**: LOW

- **Help Content**: Some help entries reference "Coming Soon" features (`help.json` line 233, 283)
  - **Risk**: LOW (documentation, not broken functionality)

### Recommendation

The admin and debug routes are the primary concern. Ensure:

1. Admin route is properly gated (test with non-admin user)
2. Debug route is removed from production or environment-gated
3. All "Coming Soon" content is clearly labeled (currently is)

---

## 6. Native Wrapper Status

### Do We Have iOS/Android Wrapper Code?

**YES** - Capacitor is fully configured.

### Evidence

1. **Capacitor Config**: `capacitor.config.json` exists at root

   ```json
   {
     "appId": "com.TravisL.tvtracker",
     "appName": "TV Tracker",
     "webDir": "apps/web/dist"
   }
   ```

2. **iOS Project Structure**: `ios/` directory exists with:
   - Xcode project: `ios/App/App.xcodeproj/`
   - Swift code: `ios/App/App/AppDelegate.swift`
   - Info.plist: `ios/App/App/Info.plist`
   - Podfile: `ios/Podfile`
   - Assets: `ios/App/App/Assets.xcassets/`

3. **Android Project Structure**: `android/` directory exists with:
   - Gradle build files
   - AndroidManifest.xml
   - Java source files

4. **Package Dependencies**: Root `package.json` includes:
   - `@capacitor/cli`: ^7.4.4
   - `@capacitor/ios`: ^7.4.4
   - `@capacitor/android`: ^7.4.4

5. **Build Scripts**: `package.json` includes:
   - `"mobile:sync": "npm run web:build && npx cap copy && npx cap sync"`
   - `"mobile:android": "npm run mobile:sync && npx cap open android"`

### How Far Along?

**Status: INFRASTRUCTURE COMPLETE, CONTENT SYNCED**

The Capacitor wrapper is set up and appears to have synced web content:

- iOS `public/` directory contains built assets (JS bundles, CSS, HTML)
- Android `assets/public/` directory contains same built assets
- Both platforms have `manifest.webmanifest` and `sw.js` copied

### What's Missing?

1. **iOS App Store Configuration**
   - Info.plist has basic config but may need App Store-specific keys
   - No `MARKETING_VERSION` or `CURRENT_PROJECT_VERSION` visible in Info.plist (may be in Xcode project settings)

2. **App Icons**
   - iOS: `AppIcon.appiconset` exists but only has 512@2x.png
   - Missing standard iOS icon sizes (20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt, 1024pt)

3. **Splash Screens**
   - iOS: Splash images exist (`splash-2732x2732.png`)
   - May need additional sizes for different devices

4. **Capacitor Plugins**
   - No obvious native plugin usage found (camera, geolocation, etc.)
   - App appears to be web-only PWA wrapped in Capacitor

### Risk Assessment

**Risk Level: LOW (Infrastructure Ready)**

The native wrapper infrastructure is complete. The primary gaps are:

- App Store metadata (version numbers, descriptions)
- Complete icon sets
- Testing on actual iOS devices

**Recommendation**: Run `npm run mobile:sync` to ensure latest web build is synced, then open iOS project in Xcode to configure App Store settings.

---

## 7. Compliance / Data Notes

### What Data We Collect (From Code Inspection)

#### User Identity & Authentication

- **Email address**: Collected via Firebase Auth (`lib/auth.ts`)
- **User ID (UID)**: Firebase-generated user identifier
- **Display name**: User-provided (`lib/settings.ts`)
- **Username**: Optional, user-provided (`hooks/useUsername.ts`)

#### Content & Preferences

- **Watchlists**: Currently Watching, Want to Watch, Watched lists
- **Ratings**: User ratings for shows/movies (`lib/ratingSystem.ts`)
- **Notes**: User-written notes about shows/movies
- **Tags**: User-created tags for organization
- **Episode progress**: Which episodes user has watched (`lib/episodeProgressSync.ts`)
- **Notification preferences**: In-app, push, email settings (`lib/notificationSettingsSync.ts`)
- **Theme preferences**: Light/dark mode, personality settings (`lib/settings.ts`)
- **Game statistics**: FlickWord and Trivia game scores (`components/games/TriviaGame.tsx` line 135-170)

#### Usage Data

- **Analytics events**: Tracked via `lib/analytics.ts` (currently console.log only, no external service)
- **Error tracking**: Sentry integration (`main.tsx` lines 93-119) - only in production with DSN
  - Tracks errors, performance, session replays
  - Sample rates: 10% traces, 10% sessions, 100% error replays

#### Location Data (Optional)

- **City/Region**: User-provided for theater information (`hooks/useLocation.ts` line 193)
- **Note**: Currently uses placeholder coordinates, not actual GPS

### Where Data Is Stored

1. **Firebase Firestore** (`lib/firebaseBootstrap.ts`)
   - User profiles: `users/{uid}`
   - Watchlists: `users/{uid}/watchlists`
   - Episode progress: `users/{uid}/episodeProgress/{showId}`
   - Notification settings: `users/{uid}/notificationSettings/main`
   - Email subscription status: `users/{uid}/emailSubscriber`

2. **LocalStorage** (Browser)
   - Library data: `flicklet.library.v2`
   - Settings: `flicklet:settings`
   - Game stats: `flicklet-data` (trivia stats)
   - Episode progress: `episode-progress-{showId}`

3. **Sentry** (Error Tracking)
   - Error logs, performance data, session replays
   - Only when `VITE_SENTRY_DSN` is set and production mode

### External Services in Use

1. **Firebase** (Google)
   - Authentication
   - Firestore database
   - Cloud Messaging (FCM) for push notifications (`firebase-messaging.ts`)

2. **Sentry** (Error Tracking)
   - Error monitoring
   - Performance monitoring
   - Session replay

3. **SendGrid** (Email)
   - Email notifications for episodes (`lib/notifications.ts` line 266)
   - Template ID: `d-22144b9bf8d74fe0bec75f0a430ede9a`
   - Used for Pro tier email notifications

4. **Netlify Forms**
   - Feedback submission (`components/FeedbackPanel.tsx`)

5. **TMDB API** (The Movie Database)
   - Show/movie metadata
   - Poster images
   - API key in HTML meta tag (line 15 in `index.html`) - **SECURITY RISK**: Should be server-side

### App Store Connect Privacy Requirements

Based on this audit, you will need to disclose:

1. **Data Used to Track You** (if applicable)
   - Sentry may track users across apps/websites (check Sentry configuration)
   - Analytics events (currently console.log only, but if externalized later)

2. **Data Linked to You**
   - Email address
   - User ID
   - Display name / Username
   - Watchlists, ratings, notes, tags
   - Episode progress
   - Notification preferences
   - Game statistics

3. **Data Not Linked to You**
   - Error logs (anonymized via Sentry)
   - Usage analytics (if anonymized)

4. **Third-Party Services**
   - Firebase (Google) - Authentication, Database, Push Notifications
   - Sentry - Error Tracking
   - SendGrid - Email Delivery
   - TMDB - Content Metadata

### Security Concerns

1. **TMDB API Key Exposure**
   - **Location**: `apps/web/index.html` line 15
   - **Risk**: API key visible in client-side code
   - **Recommendation**: Move to server-side proxy or environment variable (not in HTML)

2. **Admin Route Access**
   - **Risk**: If admin gating fails, admin tools are exposed
   - **Recommendation**: Verify admin role checking is robust

### Risk Assessment

**Risk Level: MEDIUM**

Data collection is comprehensive but appears to follow standard practices. The primary concerns are:

- TMDB API key exposure (should be server-side)
- Sentry tracking configuration (verify it's not cross-app tracking)
- Admin route security (verify gating works)

**Recommendation**:

1. Move TMDB API key to server-side proxy
2. Review Sentry privacy settings
3. Test admin route gating thoroughly
4. Prepare App Store Connect privacy questionnaire using data above

---

## 8. Overall Readiness Score for iOS Submission

### Qualitative Score: **~65% Ready**

### Breakdown by Category

- **PWA Manifest**: 70% (functional but incomplete icons)
- **HTML Shell**: 50% (missing critical iOS meta tags)
- **Service Worker**: 75% (sophisticated but untested on iOS)
- **Mobile UX**: 80% (well-structured, needs device testing)
- **Native Wrapper**: 85% (infrastructure complete, needs App Store config)
- **Compliance**: 70% (data collection documented, security concerns exist)

### Top 3 Blocking Issues

1. **Missing iOS Meta Tags** (HIGH PRIORITY)
   - `apple-mobile-web-app-capable` required for standalone mode
   - Apple touch icons required for home screen
   - **Estimated Fix Time**: 1-2 hours

2. **Incomplete Icon Set** (MEDIUM PRIORITY)
   - Missing 384px icon
   - Missing maskable icons
   - Missing iOS touch icon sizes (180, 152, 120)
   - **Estimated Fix Time**: 2-4 hours (design + export)

3. **Service Worker iOS Testing** (MEDIUM PRIORITY)
   - Untested on iOS WebView
   - Complex activation logic may cause issues
   - **Estimated Fix Time**: 4-8 hours (testing + potential fixes)

### Top 3 Non-Blocking Polish Items

1. **Mobile Device Testing** (IMPORTANT)
   - Verify all breakpoints work on actual iOS devices
   - Test keyboard handling, scrolling, touch interactions
   - **Estimated Time**: 4-8 hours

2. **Admin/Debug Route Security** (IMPORTANT)
   - Verify admin gating works
   - Remove or gate debug routes in production
   - **Estimated Time**: 1-2 hours

3. **App Store Connect Setup** (REQUIRED BUT NON-BLOCKING)
   - Configure version numbers
   - Complete privacy questionnaire
   - Prepare screenshots, descriptions, keywords
   - **Estimated Time**: 4-6 hours

### Estimated Time to Submission-Ready

**2-3 weeks** (assuming part-time work)

**Breakdown:**

- Critical fixes: 1-2 days
- iOS device testing: 1 week
- App Store Connect setup: 2-3 days
- Polish & bug fixes: 1 week

### Final Recommendation

The app has a solid foundation and is closer to submission than a greenfield project. The primary work is:

1. Adding iOS-specific PWA configurations (quick fix)
2. Testing on actual iOS devices (critical)
3. Completing App Store Connect metadata (required)

**Next Steps:**

1. Add iOS meta tags to `index.html` (blocking)
2. Generate missing icon sizes (blocking)
3. Test on iOS device via TestFlight (critical)
4. Secure admin/debug routes (important)
5. Complete App Store Connect setup (required)

The app appears functional and well-architected. With the iOS-specific configurations added and thorough device testing, it should be ready for App Store submission.

---

## Appendix: File Reference Map

### Key Files Reviewed

**PWA Configuration:**

- `apps/web/public/manifest.webmanifest`
- `apps/web/index.html`
- `apps/web/public/icon-192.png`
- `apps/web/public/icon-512.png`

**Service Worker:**

- `apps/web/public/sw.js`
- `apps/web/src/sw-register.ts`
- `apps/web/src/hooks/useServiceWorker.ts`

**Mobile UX:**

- `apps/web/src/components/MobileTabs.tsx`
- `apps/web/src/styles/global.css`
- `apps/web/src/App.tsx` (mobile breakpoints)

**Native Wrapper:**

- `capacitor.config.json`
- `ios/App/App/Info.plist`
- `ios/App/App.xcodeproj/project.pbxproj`

**Data & Privacy:**

- `apps/web/src/lib/analytics.ts`
- `apps/web/src/lib/firebaseBootstrap.ts`
- `apps/web/src/lib/notifications.ts`
- `apps/web/src/main.tsx` (Sentry config)

**Routes & Security:**

- `apps/web/src/App.tsx` (route handling)
- `apps/web/src/pages/AdminPage.tsx`
- `apps/web/src/debug/AuthDebugPage.tsx`

---

**End of Report**
