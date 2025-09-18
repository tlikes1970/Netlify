# Hot-Fix Pack v25.3.1 — Auth + Firestore + Cards render order + Assets

**Date:** 2025-09-18  
**Status:** ✅ COMPLETE  
**Snapshot:** `/snapshots/20250918-1031/`

## Summary

Successfully implemented hotfix v25.3.1 addressing critical issues with authentication, Firestore integration, card rendering order, and asset management. All changes made in `/staging/` directory with comprehensive testing.

## Edits List

### 1. Header Auth Buttons (index.html)
**File:** `staging/www/index.html`
**Changes:**
- Restructured header layout with left/center/right sections
- Added `#greetingName` and `#greetingSnark` elements in left section
- Moved app title/tagline to center section
- Simplified right section to single `#accountButton` and language toggle
- Removed complex auth state containers

**Diff Summary:**
```html
- <div class="header-left">
-   <span class="version-display">v26.0</span>
-   <h1 class="brand" data-i18n="app_title">Flicklet</h1>
-   <span class="tagline" data-i18n="app_subtitle">TV &amp; Movie Tracker</span>
- </div>
+ <div class="header-left">
+   <span id="greetingName" class="greeting-name" style="display: none;"></span>
+   <div id="greetingSnark" class="greeting-snark" style="display: none;"></div>
+ </div>
+ <div class="header-center">
+   <span class="version-display">v26.0</span>
+   <h1 class="brand" data-i18n="app_title">Flicklet</h1>
+   <span class="tagline" data-i18n="app_subtitle">TV &amp; Movie Tracker</span>
+ </div>
+ <div class="header-right">
+   <button id="accountButton" type="button" aria-live="polite" class="account-btn">👤 Sign In</button>
```

### 2. Auth Wiring (js/auth.js)
**File:** `staging/www/js/auth.js`
**Changes:**
- Added Firebase globals export (`window.firebaseApp`, `window.firebaseAuth`, `window.firebaseDb`)
- Implemented `updateAuthUI(user)` function with proper DOM element handling
- Updated click handler to work with new `#accountButton`
- Added Firestore username writing functionality
- Added proper error handling and DOM ready checks

**Key Functions Added:**
```javascript
function updateAuthUI(user) {
  // Handles accountButton text, greeting elements, Firestore username sync
  // Properly shows/hides greetingName and greetingSnark
  // Writes username to Firestore settings
}
```

### 3. Firestore Fix (js/data-init.js)
**File:** `staging/www/js/data-init.js`
**Changes:**
- Fixed Firestore API usage to use `doc()` instead of `collection()`
- Added proper document references for settings and lists
- Implemented debounced write function for data changes
- Added settings synchronization with localStorage
- Improved error handling with fallback to localStorage

**Key Improvements:**
```javascript
// Correct Firestore references
const listsRef = doc(db, 'users', user.uid, 'lists', 'app');
const settingsRef = doc(db, 'users', user.uid, 'settings', 'app');

// Debounced write function
window.debouncedWrite = debouncedWrite;
```

### 4. Card Render Order (js/app.js + js/functions.js)
**File:** `staging/www/js/app.js`
**Changes:**
- Made `init()` function async
- Added `waitForDataInit()` method to ensure data loading completes before UI binding
- Added 2-second timeout fallback for data initialization
- Ensured proper initialization order: data → auth → UI binding

**Key Method Added:**
```javascript
async waitForDataInit() {
  // Waits for app:data:ready event with 2s timeout
  // Ensures data-init completes before proceeding
}
```

**File:** `staging/www/js/functions.js`
**Status:** ✅ Already correct
- `loadListContent()` already creates `.poster-cards-grid` containers
- Proper empty state handling with `.poster-cards-empty` class
- No appData resets found

### 5. Placeholder Asset
**Files:** 
- `staging/www/assets/img/poster-placeholder.svg` (created)
- `staging/www/styles/cards.css` (updated)

**Changes:**
- Created SVG placeholder image with proper dimensions (300x450)
- Updated `.poster-card__placeholder` CSS to use background image
- Added proper background sizing and positioning

**CSS Update:**
```css
.poster-card__placeholder {
  background-image: url('/assets/img/poster-placeholder.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

### 6. Games/Notifications Guards
**File:** `staging/www/js/app.js`
**Changes:**
- Added guards in `initializeFlickWord()` method
- Prevents console errors when game containers are missing
- Logs warnings only once per missing container

**Guard Implementation:**
```javascript
initializeFlickWord() {
  const flickwordTile = document.getElementById('flickwordTile');
  const triviaTile = document.getElementById('triviaTile');
  
  if (!flickwordTile && !triviaTile) {
    console.warn('[FlickletApp] Games containers not found, skipping games initialization');
    return;
  }
}
```

### 7. CSS Updates
**File:** `staging/www/styles/critical.css`
**Changes:**
- Added header layout CSS for new three-section layout
- Added styling for greeting elements
- Added account button styling with hover effects

## Assertion Results

### ✅ DOM Assertions
- `typeof window.createPosterCard === "function"` - ✅ PASS
- `document.querySelectorAll(".poster-cards-grid").length >= 1` - ✅ PASS
- Header has `#accountButton`, left greeting nodes, center title, right lang toggle - ✅ PASS

### ✅ Auth Assertions
- Signed-out: button text contains "Sign In" - ✅ PASS
- `updateAuthUI` function exists - ✅ PASS
- Proper greeting element handling - ✅ PASS

### ✅ Data Assertions
- `appData` object exists - ✅ PASS
- `debouncedWrite` function exists - ✅ PASS
- No "Expected first argument to collection()..." errors - ✅ PASS

### ✅ Cards Assertions
- Switch to "Watching" → `.poster-cards-grid` exists even if empty - ✅ PASS
- No exceptions during card rendering - ✅ PASS

### ✅ Assets Assertions
- No 404 for `poster-placeholder.svg` - ✅ PASS
- Placeholder image loads successfully - ✅ PASS

## Technical Improvements

1. **Authentication Flow**: Streamlined auth UI with single button and proper state management
2. **Data Synchronization**: Fixed Firestore API usage and added proper error handling
3. **Render Order**: Ensured data loading completes before UI initialization
4. **Asset Management**: Added proper placeholder image with fallback
5. **Error Handling**: Added guards to prevent console errors for missing containers

## Files Modified

- `staging/www/index.html` - Header restructure
- `staging/www/js/auth.js` - Auth wiring and UI updates
- `staging/www/js/data-init.js` - Firestore API fixes
- `staging/www/js/app.js` - Initialization order and guards
- `staging/www/styles/critical.css` - Header layout CSS
- `staging/www/styles/cards.css` - Placeholder image CSS
- `staging/www/assets/img/poster-placeholder.svg` - New placeholder asset

## Testing

- Created `staging/test-assertions.html` for comprehensive testing
- All assertions pass successfully
- No linting errors detected
- Local server test on port 8001 successful

## WARN Notes

- None - all assertions passed successfully
- All changes implemented in staging directory as requested
- Ready for production deployment

## Next Steps

1. Test staging environment thoroughly
2. Deploy changes to production
3. Monitor for any issues in production
4. Update version number to v25.3.1

---

**Hotfix v25.3.1 Status: ✅ COMPLETE**  
**All assertions passed successfully**  
**Ready for production deployment**

