# Play Store Assets Preparation Guide

**Status:** Preparing assets before Play Console access  
**Last Updated:** 2025-01-27

---

## ✅ Assets Already Ready

### Text Content
- ✅ **Short Description** (80 chars) - Ready in `GOOGLE_PLAY_CONSOLE_LISTING.md`
- ✅ **Full Description** (4000 chars) - Ready in `GOOGLE_PLAY_CONSOLE_LISTING.md`
- ✅ **Promotional Text** (80 chars) - Ready in `GOOGLE_PLAY_CONSOLE_LISTING.md`
- ✅ **Privacy Policy URL** - `https://flicklet.netlify.app/privacy.html` (verified accessible)

### App Icons
- ✅ **App Icon** - Configured in `android/app/src/main/res/mipmap/`
  - Standard icon: `ic_launcher`
  - Round icon: `ic_launcher_round`
  - Icons are already generated and included in the Android build

### Screenshots
- ✅ **Screenshots Exist** - Located in `apps/web/public/Screenshots/`
  - `mobile.png` - Mobile screenshot (Currently Watching view)
  - `wide.png` - Wide screenshot
  
**Note:** Need to verify these meet Play Store requirements (see below)

---

## ❌ Assets Still Needed

### 1. Feature Graphic (REQUIRED)
**Status:** ❌ Not Created  
**Priority:** CRITICAL  
**Size:** 1024x500px  
**Format:** PNG or JPG (no transparency)

**What to Include:**
- App name: "Flicklet"
- Tagline: "Track TV Shows & Movies"
- Key visual: TV/movie poster cards or watchlist interface
- Brand colors: Primary blue (#3b82f6), dark theme colors

**Design Guidelines:**
- Keep text minimal (Google may translate)
- Use high contrast for readability
- Show the app's visual style
- No transparency (solid background)
- Text should be readable at small sizes

**Where to Create:**
- **Canva** (free templates: search "Google Play Feature Graphic")
- **Figma** (design tool)
- **Photoshop** (if available)
- **Hire a designer** on Fiverr/Upwork (~$20-50)

**Canva Template:**
1. Go to Canva.com
2. Search for "Google Play Feature Graphic" template
3. Customize with:
   - App name: Flicklet
   - Tagline: Track TV Shows & Movies
   - Background: Dark theme (#000000 or #1a1a1a)
   - Accent color: #3b82f6 (blue)
   - Add TV/movie poster mockups or app interface preview

**Save Location:** `apps/web/public/feature-graphic.png` (or `.jpg`)

---

### 2. Additional Screenshots (RECOMMENDED)
**Status:** ⚠️ Partial (2 exist, need 2-6 more)  
**Priority:** HIGH  
**Minimum Required:** 2  
**Maximum Allowed:** 8  
**Recommended:** 4-6

**Current Screenshots:**
- ✅ `mobile.png` - Currently Watching view (dark theme)

**Recommended Additional Screenshots:**

1. **Home Screen** - Show watchlists (Currently Watching, Want to Watch, Watched)
   - Highlight: Multiple lists visible
   - Show: Personalized dashboard

2. **Discovery/Search** - Show search results and personalized recommendations
   - Highlight: Search functionality
   - Show: Trending content, recommendations

3. **Show Detail** - Show episode tracking and "Up Next" feature
   - Highlight: Episode progress tracking
   - Show: Up Next reminders

4. **Games** - Show FlickWord or Daily Trivia game
   - Highlight: Daily games feature
   - Show: Game statistics

5. **My Lists** - Show custom lists feature
   - Highlight: Custom list creation
   - Show: Multiple custom lists

6. **Settings** - Show customization options
   - Highlight: Theme, language, Pro features
   - Show: Settings interface

7. **Theater Showtimes** - Show "In Theaters Near You" feature
   - Highlight: Location-based showtimes
   - Show: Theater listings

8. **Light Mode** - Show the app in light theme
   - Highlight: Theme customization
   - Show: Light mode interface

**Screenshot Requirements:**
- **Aspect Ratio:** 16:9 or 9:16 (portrait or landscape)
- **Format:** PNG or JPG
- **Size:** At least 320px on shortest side, max 3840px
- **Content:** Use real content (not placeholder data)
- **Style:** Consistent across all screenshots

**How to Capture:**
1. Run app on Android device/emulator
2. Navigate to desired screen
3. Use Android Studio's screenshot tool (View → Tool Windows → Device File Explorer)
4. Or use device's native screenshot (Power + Volume Down)
5. Edit/crop to proper aspect ratio
6. Add text overlays if desired (optional, but recommended)

**Save Location:** `apps/web/public/Screenshots/`
- Name format: `screenshot-1.png`, `screenshot-2.png`, etc.
- Or descriptive: `home-screen.png`, `discovery.png`, `games.png`, etc.

---

## 📋 Screenshot Verification Checklist

For existing screenshots (`mobile.png` and `wide.png`):

- [ ] **Aspect Ratio:** Verify 16:9 or 9:16
- [ ] **Size:** Check minimum 320px on shortest side
- [ ] **Format:** PNG or JPG (no transparency issues)
- [ ] **Content:** Real content (not placeholders)
- [ ] **Quality:** High resolution, clear text
- [ ] **Consistency:** Match app's current design

**Action:** Review existing screenshots and determine if they need to be recaptured or if additional screenshots are needed.

---

## 🎨 Design Resources

### Color Palette
- **Primary:** `#3b82f6` (Blue)
- **Background (Dark):** `#000000` or `#1a1a1a`
- **Background (Light):** `#ffffff`
- **Text (Dark):** `#ffffff`
- **Text (Light):** `#333333`
- **Accent:** `#3b82f6` (Blue)

### Typography
- Use clean, modern sans-serif fonts
- Ensure good readability at small sizes
- Match app's font family if possible

### Brand Elements
- App logo: "Flicklet" (pink/purple gradient)
- Tagline: "Track TV Shows & Movies"
- Key visual: TV/movie poster cards

---

## 📝 Content Rating Preparation

While waiting for Play Console access, prepare answers for the Content Rating questionnaire:

**Location:** Policy → App content → Content rating

**Questions & Answers:**

1. **Does your app contain user-generated content?**
   - ✅ Yes (Community posts/comments)

2. **Does your app allow users to communicate with each other?**
   - ✅ Yes (Community features)

3. **Does your app allow users to share content with each other?**
   - ✅ Yes (Watchlists can be shared)

4. **Does your app contain violence?**
   - ❌ No

5. **Does your app contain sexual content?**
   - ❌ No

6. **Does your app contain profanity?**
   - ⚠️ Possibly (User-generated content may contain profanity)

7. **Does your app contain alcohol, tobacco, or drug references?**
   - ❌ No

8. **Does your app contain gambling?**
   - ❌ No

9. **Does your app contain scary content?**
   - ⚠️ Possibly (TV shows/movies may contain scary content, but app itself doesn't)

10. **Does your app allow users to make purchases?**
    - ✅ Yes (Pro subscription via Google Play Billing)

**Expected Rating:** Likely **Teen**, due to user-generated content and in-app purchases.

---

## ✅ Pre-Play Console Checklist

Before you get Play Console access, ensure:

- [ ] Feature graphic created (1024x500px)
- [ ] Screenshots captured (minimum 2, recommended 4-6)
- [ ] Screenshots verified (aspect ratio, size, quality)
- [ ] App descriptions reviewed and finalized
- [ ] Privacy policy URL verified accessible
- [ ] Content rating answers prepared
- [ ] Data safety form guide ready (`GOOGLE_PLAY_DATA_SAFETY_FORM_GUIDE.md`)

---

## 🚀 Next Steps (After Play Console Access)

1. **Create App Listing**
   - Add app name, package name, category
   - Upload feature graphic
   - Upload screenshots
   - Add descriptions

2. **Complete Policy Requirements**
   - Complete Content Rating questionnaire
   - Complete Data Safety form (use guide)
   - Add privacy policy URL

3. **Configure Subscriptions**
   - Create Flicklet Pro subscription
   - Set up monthly/yearly base plans
   - Configure founders pricing (90-day offer)

4. **Build & Upload**
   - Build release AAB
   - Upload to Play Console
   - Submit for review

---

**Status:** ✅ Text content ready, ⚠️ Visual assets need creation  
**Estimated Time:** 2-4 hours for feature graphic + screenshots  
**Blocked By:** None (can be done now)








