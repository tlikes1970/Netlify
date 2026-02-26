# Google Play Store Submission - Current State Audit
**Date:** February 25, 2026  
**App:** Flicklet (TV Tracker)  
**Package:** com.TravisL.tvtracker  
**Audit Type:** Read-Only Codebase Analysis

---

## 1. ANDROID BUILD CONFIGURATION

### 1.1 Package Name
- **Package Name:** `com.TravisL.tvtracker`
- **Location:** `android/app/build.gradle` (line 11)
- **Namespace:** `com.TravisL.tvtracker` (line 8)
- **Status:** ✅ Configured

### 1.2 Version Information
- **Version Code:** `3`
- **Version Name:** `28.170.6`
- **Location:** `android/gradle.properties` (lines 25-26)
- **Matches package.json:** ✅ Yes (version 28.170.6)
- **Status:** ✅ Configured

### 1.3 Signing Configuration
- **Keystore File:** `android/keystore/release.keystore` ✅ EXISTS
- **Keystore Password:** Configured in `gradle.properties`
- **Key Alias:** `app_release`
- **Key Password:** Configured in `gradle.properties`
- **Configuration Location:** `android/gradle.properties` (lines 29-32)
- **Build Integration:** `android/app/build.gradle` (lines 24-33)
- **Status:** ✅ Fully Configured

**Signing Config Details:**
```properties
RELEASE_STORE_FILE=../keystore/release.keystore
RELEASE_STORE_PASSWORD=Fr0d0L!v3s
RELEASE_KEY_ALIAS=app_release
RELEASE_KEY_PASSWORD=Fr0d0L!v3s
```

**⚠️ Security Note:** Keystore passwords are stored in plaintext in `gradle.properties`. Ensure this file is:
- Not committed to public repositories
- Securely backed up (keystore loss = cannot update app)
- Protected with appropriate file permissions

---

## 2. RELEASE BUILD STATUS

### 2.1 Existing Release Builds
- **.aab Files Found:** ❌ None
- **.apk Files Found:** ❌ None (gitignored)
- **Build Output Directory:** `android/app/build/outputs/` (not present in repo)
- **Status:** ⚠️ No release builds detected in repository

### 2.2 Build Scripts
- **Build Commands Available:**
  - `./gradlew bundleRelease` - Creates .aab (recommended for Play Store)
  - `./gradlew assembleRelease` - Creates .apk
- **Documentation:** ✅ Found in `DEVICE_TESTING_CHECKLIST.md`
- **Expected Output Locations:**
  - AAB: `android/app/build/outputs/bundle/release/app-release.aab`
  - APK: `android/app/build/outputs/apk/release/app-release.apk`
- **Status:** ✅ Build scripts configured

### 2.3 Build Configuration
- **Minify Enabled:** ❌ `false` (line 38 in `build.gradle`)
- **ProGuard:** ✅ Configured but not active (minify disabled)
- **Build Type:** Release build type configured with signing
- **Status:** ⚠️ Minification disabled (optional optimization)

---

## 3. PLAY STORE REQUIREMENTS CHECK

### 3.1 Target SDK Version
- **Target SDK:** `35` ✅
- **Compile SDK:** `35` ✅
- **Min SDK:** `23` ✅ (Android 6.0+)
- **Location:** `android/variables.gradle` (lines 2-4)
- **Status:** ✅ Meets Play Store requirements (target SDK 33+ required)

### 3.2 Privacy Policy
- **Privacy Policy Document:** ✅ EXISTS
  - Location: `apps/web/public/privacy.html`
  - Also bundled: `android/app/src/main/assets/public/privacy.html`
- **Privacy Policy URL:** `https://flicklet.netlify.app/privacy.html`
- **Accessibility:** ✅ Verified accessible (per `GOOGLE_PLAY_READINESS_PROGRESS.md`)
- **App Integration:** ✅ Linked in settings (`apps/web/src/components/settingsSections.tsx`)
- **Play Console Status:** ⚠️ Needs to be added to Play Console listing (manual step)
- **Status:** ✅ Complete (ready for Play Console)

### 3.3 In-App Purchases / Subscriptions
- **Billing Library:** ✅ Google Play Billing Library v6.0.1
  - Location: `android/app/build.gradle` (line 65)
- **Permission:** ✅ `com.android.vending.BILLING` declared
  - Location: `AndroidManifest.xml` (line 42)
- **Implementation:**
  - ✅ Billing bridge: `apps/web/src/lib/capacitorBilling.ts`
  - ✅ Pro upgrade flow: `apps/web/src/lib/proUpgrade.ts`
  - ✅ Pro status management: `apps/web/src/lib/proStatus.ts`
- **Backend Integration:** ✅ Backend API endpoints configured (`/api/billing/*`)
- **Product IDs:** Configured for `pro_subscription_monthly` and `pro_subscription_yearly`
- **Status:** ✅ Implemented (needs Play Console product configuration)

### 3.4 Push Notifications
- **Firebase Configuration:** ⚠️ `google-services.json` NOT FOUND
- **Expected Location:** `android/app/google-services.json`
- **Build Integration:** ✅ Configured (conditional plugin application in `build.gradle` lines 70-77)
- **FCM Implementation:** ✅ Code exists in app (`firebase-messaging` integration)
- **Status:** ⚠️ Incomplete (google-services.json missing - push notifications won't work)

**Note:** App functions without push notifications, but this is a key feature. To enable:
1. Download `google-services.json` from Firebase Console
2. Place in `android/app/` directory
3. Rebuild app

### 3.5 Pro Gating Implementation
- **Pro Status System:** ✅ Fully implemented
  - Source: `apps/web/src/lib/proStatus.ts`
  - Sources supported: `alpha`, `gift`, `stripe`, `ios`, `android`, `manual`
- **Pro Features:** ✅ Gated throughout app
- **Billing Integration:** ✅ Google Play Billing configured
- **Status:** ✅ Complete

---

## 4. TODOs AND COMMENTS REFERENCING PLAY STORE

### 4.1 Direct References Found

#### Google Play / Play Store / Play Console
- `GOOGLE_PLAY_READINESS_PROGRESS.md` - Comprehensive readiness tracking document
- `GOOGLE_PLAY_DATA_SAFETY_FORM_GUIDE.md` - Data Safety form completion guide
- `PLAY_STORE_ASSETS_PREPARATION.md` - Asset preparation guide
- `GOOGLE_PLAY_CONSOLE_LISTING.md` - Store listing content guide
- `DEVICE_TESTING_CHECKLIST.md` - Pre-submission testing checklist

#### Release / Signing / Keystore
- `GOOGLE_PLAY_READINESS_PROGRESS.md` (line 121-132): App signing configuration complete
- `GOOGLE_PLAY_READINESS_PROGRESS.md` (line 181): Note about incrementing VERSION_CODE
- `DEVICE_TESTING_CHECKLIST.md` (lines 32-40): Build release commands documented
- `GOOGLE_PLAY_CONSOLE_LISTING.md` (lines 463-465): Build commands referenced

### 4.2 Code Comments
- `android/app/build.gradle` (line 26): Comment about signing config only when provided
- `android/app/build.gradle` (line 40): Comment about release signing usage
- `android/app/build.gradle` (line 76): Comment about google-services.json requirement for push notifications

### 4.3 Documentation Status
- ✅ Comprehensive documentation exists for Play Store submission
- ✅ Step-by-step guides available for:
  - Data Safety form completion
  - Asset preparation
  - Store listing content
  - Device testing

---

## 5. COMPLETE vs INCOMPLETE CHECKLIST

### ✅ COMPLETE (Ready for Submission)

#### Build Configuration
- [x] Package name configured (`com.TravisL.tvtracker`)
- [x] Version code set (3)
- [x] Version name set (28.170.6)
- [x] Keystore file exists
- [x] Signing configuration active
- [x] Release build type configured
- [x] Target SDK 35 (meets requirements)
- [x] Min SDK 23 (Android 6.0+)

#### Legal & Compliance
- [x] Privacy policy document created
- [x] Privacy policy URL accessible (`https://flicklet.netlify.app/privacy.html`)
- [x] Privacy policy linked in app
- [x] Data Safety form guide prepared

#### In-App Purchases
- [x] Google Play Billing Library integrated (v6.0.1)
- [x] BILLING permission declared
- [x] Billing bridge implementation complete
- [x] Pro upgrade flow implemented
- [x] Pro status management system complete

#### Security
- [x] `android:allowBackup="false"` set (security best practice)
- [x] API keys moved to server-side (TMDB proxy)
- [x] Origin validation configured

#### Documentation
- [x] Store listing content prepared
- [x] Asset preparation guide created
- [x] Device testing checklist created
- [x] Build commands documented

---

### ⚠️ INCOMPLETE (Needs Action)

#### Critical (Blocks Submission)
- [ ] **Release Build Generated**
  - No .aab file exists
  - Action: Run `./gradlew bundleRelease` to create release AAB
  - Location: `android/app/build/outputs/bundle/release/app-release.aab`

- [ ] **Play Console Listing Created**
  - App listing not yet created in Play Console
  - Action: Create app listing in Play Console
  - Required: App name, category, descriptions

- [ ] **Privacy Policy Added to Play Console**
  - Privacy policy exists but not yet added to Play Console listing
  - Action: Add URL to Play Console → Store presence → Main store listing
  - URL: `https://flicklet.netlify.app/privacy.html`

- [ ] **Data Safety Form Completed**
  - Guide exists but form not yet completed
  - Action: Complete Data Safety form in Play Console
  - Guide: `GOOGLE_PLAY_DATA_SAFETY_FORM_GUIDE.md`

- [ ] **Content Rating Questionnaire**
  - Not yet completed
  - Action: Complete Content Rating questionnaire in Play Console
  - Guide: `PLAY_STORE_ASSETS_PREPARATION.md` (lines 174-212)

#### High Priority (Recommended Before Submission)
- [ ] **Feature Graphic Created**
  - Required asset missing
  - Size: 1024x500px
  - Action: Create feature graphic (see `PLAY_STORE_ASSETS_PREPARATION.md`)
  - Estimated time: 1-2 hours

- [ ] **Screenshots Prepared**
  - 2 screenshots exist, but need verification
  - Minimum: 2 required
  - Recommended: 4-6 screenshots
  - Action: Verify existing screenshots meet requirements, capture additional if needed
  - Guide: `PLAY_STORE_ASSETS_PREPARATION.md` (lines 72-133)

- [ ] **In-App Purchase Products Configured**
  - Products not yet created in Play Console
  - Action: Create subscription products in Play Console:
    - `pro_subscription_monthly`
    - `pro_subscription_yearly`
  - Configure pricing, base plans, founders pricing (90-day offer)

- [ ] **Real Device Testing**
  - Testing checklist exists but not yet executed
  - Action: Test on real Android device using `DEVICE_TESTING_CHECKLIST.md`
  - Critical tests: OAuth flows, billing, offline behavior

#### Medium Priority (Can Be Done Post-Launch)
- [ ] **Push Notifications Enabled**
  - `google-services.json` missing
  - Action: Download from Firebase Console, place in `android/app/`
  - Impact: Push notifications won't work until added
  - Status: Non-blocking (app functions without it)

- [ ] **ProGuard Minification Enabled**
  - Currently disabled (`minifyEnabled false`)
  - Action: Enable minification and test thoroughly
  - Impact: Reduces APK size, improves security
  - Status: Optional optimization

---

## 6. SUMMARY STATISTICS

### Completion Status
- **Build Configuration:** 100% ✅
- **Legal/Compliance:** 95% ⚠️ (needs Play Console steps)
- **In-App Purchases:** 90% ⚠️ (needs Play Console product setup)
- **Push Notifications:** 50% ⚠️ (google-services.json missing)
- **Store Listing:** 10% ⚠️ (text ready, assets needed)
- **Testing:** 30% ⚠️ (checklist ready, execution needed)

### Overall Readiness: ~65%

**Breakdown:**
- ✅ **Code/Configuration:** Complete
- ⚠️ **Play Console Setup:** Not started
- ⚠️ **Assets:** Partially ready
- ⚠️ **Testing:** Not executed

---

## 7. NEXT STEPS (Priority Order)

### Phase 1: Hard Blockers (Must Complete First)
1. **Generate Release Build**
   - Run: `cd android && ./gradlew bundleRelease`
   - Verify: `android/app/build/outputs/bundle/release/app-release.aab` exists
   - Time: 5-10 minutes

2. **Create Play Console Listing**
   - Access Play Console
   - Create new app
   - Add package name: `com.TravisL.tvtracker`
   - Time: 15-30 minutes

3. **Add Privacy Policy to Listing**
   - Play Console → Store presence → Main store listing
   - Add URL: `https://flicklet.netlify.app/privacy.html`
   - Time: 2 minutes

4. **Complete Data Safety Form**
   - Use guide: `GOOGLE_PLAY_DATA_SAFETY_FORM_GUIDE.md`
   - Time: 30-45 minutes

5. **Complete Content Rating**
   - Use answers from `PLAY_STORE_ASSETS_PREPARATION.md`
   - Time: 15-30 minutes

**Phase 1 Estimated Time:** 1-2 hours

### Phase 2: Store Assets (Required for Submission)
1. **Create Feature Graphic**
   - Size: 1024x500px
   - Use guide: `PLAY_STORE_ASSETS_PREPARATION.md`
   - Time: 1-2 hours

2. **Prepare Screenshots**
   - Verify existing screenshots
   - Capture 2-4 additional screenshots
   - Time: 1-2 hours

3. **Add Store Listing Content**
   - Use content from `GOOGLE_PLAY_CONSOLE_LISTING.md`
   - Upload feature graphic and screenshots
   - Time: 30 minutes

**Phase 2 Estimated Time:** 3-5 hours

### Phase 3: In-App Purchases Setup
1. **Create Subscription Products**
   - Create `pro_subscription_monthly` and `pro_subscription_yearly`
   - Configure pricing and base plans
   - Set up founders pricing (90-day offer)
   - Time: 30-60 minutes

2. **Test Purchase Flow**
   - Test on real device with test accounts
   - Verify purchase validation
   - Time: 30 minutes

**Phase 3 Estimated Time:** 1-2 hours

### Phase 4: Testing (Recommended)
1. **Real Device Testing**
   - Use checklist: `DEVICE_TESTING_CHECKLIST.md`
   - Test critical flows: OAuth, billing, offline
   - Time: 4-8 hours

**Phase 4 Estimated Time:** 4-8 hours

---

## 8. ESTIMATED TIMELINE

**Minimum (Hard Blockers Only):** 1-2 hours  
**Recommended (Including Assets):** 5-9 hours  
**Complete (Including Testing):** 10-17 hours

**Realistic Timeline:** 1-2 weeks (assuming part-time work)

---

## 9. KEY FILES REFERENCE

### Configuration Files
- `android/app/build.gradle` - App build configuration
- `android/build.gradle` - Project build configuration
- `android/gradle.properties` - Version and signing config
- `android/variables.gradle` - SDK versions
- `android/app/src/main/AndroidManifest.xml` - App manifest

### Documentation Files
- `GOOGLE_PLAY_READINESS_PROGRESS.md` - Overall progress tracking
- `GOOGLE_PLAY_DATA_SAFETY_FORM_GUIDE.md` - Data Safety form guide
- `PLAY_STORE_ASSETS_PREPARATION.md` - Asset creation guide
- `GOOGLE_PLAY_CONSOLE_LISTING.md` - Store listing content
- `DEVICE_TESTING_CHECKLIST.md` - Testing checklist

### Implementation Files
- `apps/web/src/lib/capacitorBilling.ts` - Billing bridge
- `apps/web/src/lib/proUpgrade.ts` - Pro upgrade flow
- `apps/web/src/lib/proStatus.ts` - Pro status management
- `apps/web/public/privacy.html` - Privacy policy

---

## 10. RISKS AND CONSIDERATIONS

### Critical Risks
1. **Keystore Loss:** If keystore is lost, app cannot be updated. Ensure secure backup.
2. **Version Code Management:** Must increment `VERSION_CODE` for each release (currently 3).
3. **Privacy Policy Updates:** Any changes to data collection require privacy policy updates.

### Non-Critical Issues
1. **Push Notifications:** App functions without `google-services.json`, but notifications won't work.
2. **Minification:** Currently disabled - optional optimization for post-launch.
3. **Testing:** Comprehensive testing recommended but not blocking for initial submission.

---

**End of Audit Report**
