# POSTER PERSISTENCE FIX - v23.26

## **Issue Summary**
After signing out and back in, posters in the "Currently Watching" section showed as broken image links, while posters rendered correctly in search/home cards.

## **Root Cause Analysis**

### **Data Flow Investigation:**
1. ✅ **Search Results → addToList() → Firebase Storage**: CORRECT
   - Search results include `poster_path` field from TMDB API
   - `addToList()` stores the entire item object (including `poster_path`)
   - Firebase stores the complete data structure

2. ✅ **Firebase Storage → loadUserDataFromCloud() → appData**: CORRECT
   - Data is loaded directly from Firebase without transformation
   - `appData.tv.watching` and `appData.movies.watching` contain full item objects

3. ✅ **Main Watching List → createShowCard() → Poster Rendering**: CORRECT
   - Uses `item.poster_path` with `TMDB_IMG_BASE` to construct URL
   - `TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w200"`

4. ❌ **Currently Watching Preview → createPreviewCard() → Poster Rendering**: PROBLEM
   - Used different logic: `item.poster_src || item.poster` first, then fallback
   - The issue: `poster_src` and `poster` fields don't exist in stored data
   - Only `poster_path` field exists (from TMDB API)

## **The Fix**

### **Changes Made:**
1. **Standardized Poster URL Construction** in `currently-watching-preview.js`:
   - **Before**: `let posterUrl = item.poster_src || item.poster; if (!posterUrl && item.poster_path) { posterUrl = \`https://image.tmdb.org/t/p/w200${item.poster_path}\`; }`
   - **After**: `const posterUrl = item.poster_path ? \`https://image.tmdb.org/t/p/w200${item.poster_path}\` : null;`

2. **Applied to Both Card Components**:
   - Card v2 component (new Card system)
   - Legacy card fallback component

3. **Removed Unnecessary DOM Sync Logic**:
   - Removed code that was trying to sync DOM data back to appData
   - This was not the root cause and could cause other issues

### **Files Modified:**
- `www/scripts/currently-watching-preview.js` - Fixed poster URL construction logic
- `www/index.html` - Updated version to v23.26-POSTER-FIXED

## **Technical Details**

### **Poster URL Construction Logic:**
```javascript
// Main watching list (createShowCard) - CORRECT
const posterHtml = item.poster_path
  ? `<img src="${TMDB_IMG_BASE}${item.poster_path}" alt="${title}">`
  : `<div class="poster-placeholder">${t("no_image")}</div>`;

// Currently Watching Preview (createPreviewCard) - NOW FIXED
const posterUrl = item.poster_path
  ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
  : null;
```

### **Data Structure:**
- **Stored in Firebase**: Complete TMDB item objects with `poster_path` field
- **Loaded to appData**: Direct assignment from Firebase (no transformation)
- **Used by Components**: Both main list and preview use same `poster_path` field

## **Verification**

### **Expected Behavior After Fix:**
1. ✅ Add show to "Currently Watching" → Poster displays correctly
2. ✅ Sign out and sign back in → Poster still displays correctly in "Currently Watching" section
3. ✅ Posters display consistently across all sections (search, home, watching list, preview)
4. ✅ No broken image links after authentication state changes

### **Test Scenarios:**
1. Add a TV show to "Currently Watching" from search results
2. Verify poster displays in both main watching list and Currently Watching preview
3. Sign out and sign back in
4. Verify poster still displays correctly in both locations
5. Repeat with movies

## **Version History**
- **v23.25**: Fixed "ALREADY IN LIST" duplicate add bug
- **v23.26**: Fixed poster persistence issue in Currently Watching section

## **Success Criteria Met:**
- ✅ Posters persist across sign-in/sign-out cycles
- ✅ Consistent poster rendering across all components
- ✅ No data loss or corruption
- ✅ Minimal code changes with maximum impact
- ✅ No breaking changes to existing functionality
