# Device Testing Checklist - Google Play Store Readiness

**Purpose:** Comprehensive testing on real Android devices before Play Store submission  
**Last Updated:** 2025-01-27

---

## 🎯 Testing Overview

**Why Real Device Testing is Critical:**
- Emulators don't catch all real-world issues
- Network conditions differ on real devices
- Performance varies significantly
- User experience can't be fully simulated

**Recommended:** Test on at least 2 different Android devices (different manufacturers/Android versions)

---

## 📱 Pre-Testing Setup

### Build Release APK/AAB
```bash
# Build mobile version
npm run mobile:build

# Sync to Android
npm run mobile:sync

# Build release APK
cd android
./gradlew assembleRelease

# Or build AAB (recommended for Play Store)
./gradlew bundleRelease
```

**Output Location:**
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### Install on Device
```bash
# Via ADB
adb install android/app/build/outputs/apk/release/app-release.apk

# Or transfer file to device and install manually
```

---

## ✅ Core Functionality Tests

### 1. App Launch & Initial Load
- [ ] App launches without crashes
- [ ] Splash screen displays correctly
- [ ] Initial load time is acceptable (< 5 seconds)
- [ ] No blank screens or loading errors
- [ ] App icon displays correctly on device

**Expected Behavior:**
- App should load and show home screen
- Data should load from Firestore (if signed in)
- No console errors in logcat

---

### 2. Authentication & Sign-In
- [ ] Sign-in button is visible and accessible
- [ ] Google Sign-In flow works correctly
- [ ] OAuth redirect works (no "invalid origin" errors)
- [ ] User is redirected back to app after sign-in
- [ ] User session persists after app restart
- [ ] Sign-out works correctly
- [ ] Auto-login works (if implemented)

**Test Cases:**
1. Fresh install → Sign in → Verify data syncs
2. Sign out → Sign back in → Verify data persists
3. Close app → Reopen → Verify still signed in

**Known Issues:**
- Auto-login may not work (manual sign-in works fine) - acceptable for MVP

---

### 3. Data Loading & Sync
- [ ] Watchlists load correctly (Currently Watching, Want to Watch, Watched)
- [ ] Data syncs from Firestore
- [ ] Episode progress loads correctly
- [ ] Custom lists load correctly
- [ ] Settings sync across devices (if signed in)
- [ ] Game statistics load correctly

**Test Cases:**
1. Sign in → Verify all lists load
2. Add item to list → Verify appears immediately
3. Sign in on second device → Verify data syncs
4. Make change on device 1 → Verify appears on device 2

---

### 4. TMDB API Calls
- [ ] Search works correctly
- [ ] Trending content loads
- [ ] Show/movie details load
- [ ] Images load correctly
- [ ] No "HTML fallback" errors
- [ ] API calls use absolute URLs (not relative)

**Test Cases:**
1. Search for a show → Verify results appear
2. Browse trending → Verify content loads
3. Open show detail → Verify all data displays
4. Check network logs → Verify requests go to `https://flicklet.netlify.app/api/tmdb-proxy`

**Expected Behavior:**
- All TMDB calls should use proxy (no direct API calls)
- No CORS errors
- JSON responses (not HTML)

---

### 5. Navigation & UI
- [ ] Bottom navigation works (mobile)
- [ ] All tabs are accessible
- [ ] Back button works correctly
- [ ] Scrolling works smoothly
- [ ] Cards display correctly
- [ ] Text is readable (no cut-off)
- [ ] Dark mode works correctly
- [ ] Light mode works correctly

**Test Cases:**
1. Navigate through all tabs
2. Scroll through long lists
3. Switch between light/dark mode
4. Test on different screen sizes

---

### 6. Core Features
- [ ] Add show/movie to list works
- [ ] Move between lists works
- [ ] Episode tracking works
- [ ] "Up Next" section displays correctly
- [ ] Custom lists can be created
- [ ] Custom lists can be edited/deleted
- [ ] Search functionality works
- [ ] Filters work correctly

**Test Cases:**
1. Add item to "Want to Watch"
2. Move item to "Currently Watching"
3. Mark episode as watched
4. Create custom list
5. Add items to custom list

---

### 7. Games Features
- [ ] FlickWord game loads and plays
- [ ] Daily Trivia loads and plays
- [ ] Game statistics save correctly
- [ ] Pro limits work (Free: 1 game/day, Pro: 3 games/day)
- [ ] Trivia limits work (Free: 10 questions, Pro: 30 questions)

**Test Cases:**
1. Play FlickWord → Verify stats save
2. Play Trivia → Verify questions load
3. Test Pro limits (if Pro enabled)
4. Verify daily reset works

---

### 8. Pro Features (If Pro Enabled)
- [ ] Pro status displays correctly in Settings
- [ ] Pro features are accessible (if Pro)
- [ ] Pro features are gated (if Free)
- [ ] Upgrade prompts appear for Free users
- [ ] Pro toggle works in Settings (if testing mode)

**Test Cases:**
1. As Free user → Try to access Pro feature → Verify upgrade prompt
2. As Pro user → Verify all Pro features accessible
3. Test Pro billing flow (if configured)

---

## 🌐 Network & Connectivity Tests

### 9. Online Behavior
- [ ] App works with good internet connection
- [ ] Data loads correctly
- [ ] API calls succeed
- [ ] Images load from CDN

### 10. Offline Behavior
- [ ] App loads cached data when offline
- [ ] No crashes when offline
- [ ] Appropriate error messages shown
- [ ] Data syncs when connection restored

**Test Cases:**
1. Load app with internet → Go offline → Verify cached data shows
2. Make changes offline → Go online → Verify syncs
3. Test airplane mode → Verify graceful degradation

---

## 🔔 Notifications (If Configured)

### 11. Push Notifications
- [ ] FCM token registers correctly
- [ ] Notifications are received
- [ ] Notification tap opens app
- [ ] Notification settings work
- [ ] Email notifications work (Pro users)

**Prerequisites:**
- `google-services.json` must be in `android/app/`
- Firebase Cloud Messaging configured

**Test Cases:**
1. Sign in → Verify FCM token registered
2. Trigger test notification → Verify received
3. Tap notification → Verify app opens
4. Disable notifications in settings → Verify disabled

---

## ⚡ Performance Tests

### 12. Performance & Stability
- [ ] App doesn't freeze or lag
- [ ] Smooth scrolling (60fps)
- [ ] Fast page transitions
- [ ] No memory leaks (test over 30+ minutes)
- [ ] Battery usage is reasonable
- [ ] App doesn't crash during normal use

**Test Cases:**
1. Use app for 30+ minutes continuously
2. Navigate rapidly between screens
3. Scroll through long lists
4. Monitor battery usage
5. Check memory usage (via Android Studio Profiler)

**Performance Targets:**
- Initial load: < 5 seconds
- Page transitions: < 500ms
- Scroll performance: 60fps
- Memory usage: < 200MB

---

## 🔒 Security & Privacy Tests

### 13. Security
- [ ] No sensitive data in logs
- [ ] API keys not exposed
- [ ] HTTPS used for all network calls
- [ ] User data encrypted in transit
- [ ] App backup disabled (`allowBackup="false"`)

**Test Cases:**
1. Check logcat → Verify no API keys exposed
2. Check network traffic → Verify all HTTPS
3. Verify AndroidManifest.xml has `allowBackup="false"`

---

## 📱 Device-Specific Tests

### 14. Different Android Versions
- [ ] Test on Android 8.0+ (minimum SDK)
- [ ] Test on latest Android version
- [ ] Test on mid-range Android version

### 15. Different Screen Sizes
- [ ] Test on small phone (5" screen)
- [ ] Test on large phone (6.5"+ screen)
- [ ] Test on tablet (if supported)

### 16. Different Manufacturers
- [ ] Test on Samsung device
- [ ] Test on Google Pixel device
- [ ] Test on other manufacturer (if available)

**Why This Matters:**
- Different manufacturers have different Android skins
- Some may have different WebView implementations
- UI may render differently

---

## 🐛 Error Handling Tests

### 17. Error Scenarios
- [ ] Handle network errors gracefully
- [ ] Handle API errors gracefully
- [ ] Handle authentication errors gracefully
- [ ] Show appropriate error messages
- [ ] App doesn't crash on errors

**Test Cases:**
1. Disable internet → Perform action → Verify error message
2. Invalid API response → Verify graceful handling
3. Sign-in failure → Verify error message shown

---

## 📊 Testing Results Template

**Device Information:**
- Device Model: _______________
- Android Version: _______________
- Screen Size: _______________
- Test Date: _______________

**Test Results:**
- [ ] All core functionality tests passed
- [ ] All network tests passed
- [ ] All performance tests passed
- [ ] All security tests passed
- [ ] Critical bugs found: _______________
- [ ] Non-critical bugs found: _______________

**Overall Assessment:**
- [ ] Ready for Play Store submission
- [ ] Needs fixes before submission
- [ ] Major issues found

---

## 🚨 Critical Issues (Must Fix Before Submission)

These issues will block Play Store approval:

- [ ] App crashes on launch
- [ ] Sign-in doesn't work
- [ ] Data doesn't sync
- [ ] API calls fail
- [ ] Privacy policy link doesn't work
- [ ] App violates Play Store policies

---

## ⚠️ Known Issues (Acceptable for MVP)

These issues are acceptable for initial launch:

- Auto-login may not work (manual sign-in works)
- Some network errors in emulator (expected)
- Firestore real-time listeners may disconnect (SDK handles reconnects)

---

## 📝 Reporting Issues

When reporting issues, include:

1. **Device Information:**
   - Model, Android version, screen size

2. **Steps to Reproduce:**
   - Clear steps to trigger the issue

3. **Expected Behavior:**
   - What should happen

4. **Actual Behavior:**
   - What actually happens

5. **Screenshots/Logs:**
   - Visual evidence or logcat output

6. **Frequency:**
   - How often it occurs

---

## ✅ Sign-Off

**Testing Completed By:** _______________  
**Date:** _______________  
**Ready for Submission:** [ ] Yes [ ] No  
**Notes:** _______________

---

**Status:** ⚠️ Pending real device testing  
**Estimated Time:** 4-8 hours  
**Priority:** HIGH (must complete before submission)








