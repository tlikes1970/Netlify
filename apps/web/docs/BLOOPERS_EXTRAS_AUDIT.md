# Bloopers & Extras Feature - Forensic Audit Report

**Date:** 2024-12-19  
**Scope:** Read-only audit of existing Bloopers/Extras implementation  
**Goal:** Identify why Bloopers/Extras often return empty results

---

## Section 1: Files & Responsibilities

| File Path | Responsibility | How It's Plugged In |
|-----------|---------------|---------------------|
| `apps/web/src/components/extras/BloopersModal.tsx` | Standalone modal for bloopers-only view | Called from `App.tsx` via `handleBloopersOpen()` when TabCard "Bloopers" button clicked |
| `apps/web/src/components/extras/ExtrasModal.tsx` | Combined modal with tabs for both bloopers and extras | Called from `App.tsx` via `handleExtrasOpen()` when TabCard "Extras" button clicked |
| `apps/web/src/lib/extras/extrasProvider.ts` | Core data fetching logic for both bloopers and extras | Imported dynamically by modals; provides `fetchBloopers()` and `fetchExtras()` methods |
| `apps/web/src/lib/extras/bloopersSearchAssist.ts` | Fallback search utility for bloopers (when official sources fail) | Called conditionally when `EXTRAS_BLOOPERS_SEARCH_ASSIST` flag is enabled |
| `apps/web/src/lib/extras/config.ts` | Configuration: API keys, keywords, allowlists | Imported by `extrasProvider.ts` for API endpoints and filtering |
| `apps/web/src/lib/extras/types.ts` | TypeScript interfaces for video data structures | Imported across all extras-related modules |
| `apps/web/src/App.tsx` | Modal state management and handlers | Manages `showBloopersModal`, `showExtrasModal` state; passes `showId` and `showTitle` to modals |
| `apps/web/src/components/cards/TabCard.tsx` | UI component with Bloopers/Extras buttons | Renders buttons that call `actions.onBloopersOpen()` / `actions.onExtrasOpen()` |

---

## Section 2: Data Flow

### Input Flow: Show/Movie Identity

1. **User clicks Bloopers/Extras button** in `TabCard.tsx`
2. **TabCard calls** `actions.onBloopersOpen(item)` or `actions.onExtrasOpen(item)`
3. **App.tsx handlers** (`handleBloopersOpen`, `handleExtrasOpen`) receive the `item` object
4. **App.tsx extracts** `showId` (from `item.id`) and `showTitle` (from `item.title`)
5. **Modals receive props:** `showId: number`, `showTitle: string`, `isOpen: boolean`

**Critical Note:** The `showId` is expected to be a TMDB ID (number). The code converts `item.id` to a number in App.tsx before passing to modals.

### API Calls & Filtering

#### For Bloopers (`extrasProvider.fetchBloopers()`):

1. **TMDB Videos API** (`/tv/{showId}/videos`)
   - **Endpoint:** `https://api.themoviedb.org/3/tv/{showId}/videos?api_key={key}`
   - **Filter:** Only videos where `video.name.toLowerCase()` contains one of: `['bloopers','gag reel','outtakes','funny moments']`
   - **Mapping:** Converts TMDB video to `ExtrasVideo` format
   - **Early return:** If API call fails, returns empty array (error swallowed)

2. **YouTube Search API** (if TMDB returns nothing)
   - **Query:** `{showTitle} bloopers OR gag reel OR outtakes OR funny moments`
   - **Filter:** Only results from allowlisted channels (Netflix, Warner Bros., etc.)
   - **Max results:** 10
   - **Early return:** If API call fails, returns empty array (error swallowed)

3. **Fallback Hierarchy** (if both above return nothing):
   - **Tier 1:** Search YouTube for top 3 cast members + bloopers keywords
   - **Tier 2:** Search for "classic bloopers" generic queries
   - **Tier 3:** Search for generic bloopers queries
   - **Limit:** 10 videos max

#### For Extras (`extrasProvider.fetchExtras()`):

1. **TMDB Videos API** (`/tv/{showId}/videos`)
   - **Filter:** Only videos where `video.name.toLowerCase()` contains one of: `['featurette','behind the scenes','making of','interview','deleted scene']`
   - Same error handling as bloopers

2. **YouTube Search API**
   - **Query:** `{showTitle} featurette OR behind the scenes OR making of OR interview OR deleted scene`
   - Same allowlist filtering as bloopers

3. **Fallback Hierarchy**
   - **Tier 1:** Search YouTube for top 2 cast members + extras keywords
   - **Tier 2:** Generic extras queries
   - **Limit:** 8 videos max

### Result Transformation

- **TMDB videos** → `ExtrasVideo` with `provider: 'youtube'`, `channelName: 'TMDB Official'`
- **YouTube videos** → `ExtrasVideo` with actual channel info
- **Search Assist results** → `BloopersSearchResult[]` format (different structure)

### Search Assist Flow (Conditional)

- **Trigger:** Only if `EXTRAS_BLOOPERS_SEARCH_ASSIST` flag is `true` AND official sources return empty
- **Implementation:** `BloopersSearchAssist.searchBloopers()`
- **Current Status:** **STUB IMPLEMENTATION** - Returns mock data, not real YouTube results
- **Query building:** `{showTitle} bloopers OR gag reel OR outtakes`
- **Quality filters:** View count > 1000, duration 30s-30min, title relevance checks

---

## Section 3: Current Behavior

### When Content is Found

**Bloopers:**
- Official videos displayed in "Official Bloopers" section
- Search assist results (if enabled) displayed in separate section with disclaimer
- Videos are clickable; embeddable ones play in `YouTubePlayer` modal, others open in new tab

**Extras:**
- Videos displayed in grid layout
- Each video shows thumbnail, title, channel, publish date, provider badge
- Same click behavior as bloopers

### When Nothing is Found

**Bloopers:**
- Empty state message: "No bloopers found"
- Button to switch to Extras tab
- Button to open help article
- **No error message** if API calls failed

**Extras:**
- Empty state message: "No extras found"
- **No error message** if API calls failed

### When Error Occurs

- **All errors are caught and swallowed**
- `console.error()` logs the error
- Empty array returned
- User sees empty state (same as "no results found")
- **No distinction** between "API failed" vs "no content exists"

### Pro Feature Gating

- **Non-Pro users:** See upgrade prompt, no data fetching attempted
- **Pro users:** Data fetching proceeds only if `isPro === true`

---

## Section 4: Suspected Root Causes of Empty Results

### High Confidence Issues

1. **🔴 Search Assist is Disabled by Default**
   - **Location:** `apps/web/src/lib/FEATURE_FLAGS.json`
   - **Issue:** `"EXTRAS_BLOOPERS_SEARCH_ASSIST": false`
   - **Impact:** When official sources return nothing, no fallback search occurs
   - **Evidence:** Lines 47, 143 in `ExtrasModal.tsx` check this flag before calling search assist

2. **🔴 Search Assist Implementation is a Stub**
   - **Location:** `apps/web/src/lib/extras/bloopersSearchAssist.ts:96-131`
   - **Issue:** `searchYouTube()` method returns hardcoded mock data, not real API results
   - **Evidence:** Comment says "TODO: Replace with actual YouTube Data API v3 integration"
   - **Impact:** Even if flag is enabled, search assist doesn't actually search YouTube

3. **🔴 Missing API Keys**
   - **Location:** `apps/web/src/lib/extras/config.ts:16, 21`
   - **Issue:** `VITE_YOUTUBE_API_KEY` and `VITE_TMDB_KEY` may be missing from environment
   - **Impact:** API calls will fail silently, returning empty arrays
   - **Evidence:** Defaults to empty string `''` if env vars not set

4. **🔴 TMDB Endpoint Only Works for TV Shows**
   - **Location:** `apps/web/src/lib/extras/extrasProvider.ts:69`
   - **Issue:** Hardcoded `/tv/{showId}/videos` endpoint
   - **Impact:** Movies will always fail TMDB lookup (should use `/movie/{showId}/videos`)
   - **Evidence:** No `mediaType` check before choosing endpoint

5. **🔴 Overly Strict TMDB Video Filtering**
   - **Location:** `apps/web/src/lib/extras/extrasProvider.ts:99-103`
   - **Issue:** Only matches videos where title contains exact keywords (case-insensitive)
   - **Impact:** Misses videos with variations like "Blooper Reel", "Gag Reel Compilation", "Outtakes & Bloopers"
   - **Evidence:** Uses simple `includes()` check, not fuzzy matching

6. **🔴 Very Restrictive YouTube Channel Allowlist**
   - **Location:** `apps/web/src/lib/extras/config.ts:1-4` and `extrasProvider.ts:105-109`
   - **Issue:** Only allows videos from ~10 specific channels (Netflix, Warner Bros., etc.)
   - **Impact:** Legitimate bloopers from other official channels are filtered out
   - **Evidence:** `isAllowlistedChannel()` filters out all non-allowlisted results

7. **🔴 Errors Swallowed Silently**
   - **Location:** Multiple try/catch blocks in `extrasProvider.ts`
   - **Issue:** All API errors caught, logged to console, return empty array
   - **Impact:** User can't distinguish between "no content" vs "API failure" vs "network error"
   - **Evidence:** Lines 76-79, 93-96, 179-181, 203-205 all catch and return `[]`

### Medium Confidence Issues

8. **🟡 YouTube Query Construction May Be Too Narrow**
   - **Location:** `apps/web/src/lib/extras/extrasProvider.ts:84`
   - **Issue:** Query format: `{showTitle} keyword1 OR keyword2 OR keyword3`
   - **Impact:** May miss videos with different phrasing (e.g., "The Office bloopers" vs "Office bloopers")
   - **Needs verification:** Test with actual YouTube API to see if query works well

9. **🟡 Fallback Hierarchy May Not Execute**
   - **Location:** `apps/web/src/lib/extras/extrasProvider.ts:27-30`
   - **Issue:** Fallback only runs if `videos.length === 0`, but TMDB/YouTube errors return empty arrays
   - **Impact:** Fallbacks should run, but if they also fail, user gets nothing
   - **Needs verification:** Check if fallback methods actually find content

10. **🟡 Search Assist Quality Filters May Be Too Strict**
    - **Location:** `apps/web/src/lib/extras/bloopersSearchAssist.ts:148-170`
    - **Issue:** Filters out videos with < 1000 views, spammy titles, duration outside 30s-30min
    - **Impact:** May filter out legitimate but low-view-count bloopers
    - **Needs verification:** Test with real data to see filter effectiveness

### Low Confidence / Needs Investigation

11. **🟢 TMDB Video Type Filtering**
    - **Question:** Does TMDB have a `type` field for videos that we should check?
    - **Current:** We filter by title keywords only
    - **Needs verification:** Check TMDB API docs for video type field

12. **🟢 YouTube API Rate Limiting**
    - **Question:** Are we hitting YouTube API rate limits?
    - **Current:** No rate limiting logic visible
    - **Needs verification:** Check API usage logs

13. **🟢 Show ID Conversion Issues**
    - **Question:** Is `item.id` always a valid TMDB ID?
    - **Current:** App.tsx converts to number, but no validation
    - **Needs verification:** Check if invalid IDs cause API failures

---

## Section 5: Suggested Fix Directions (No Code Yet)

### Priority 1: Critical Fixes

1. **Enable Search Assist Flag**
   - Set `EXTRAS_BLOOPERS_SEARCH_ASSIST: true` in `FEATURE_FLAGS.json` or localStorage
   - **Impact:** Provides fallback when official sources fail

2. **Implement Real YouTube Search in Search Assist**
   - Replace stub `searchYouTube()` with actual YouTube Data API v3 call
   - Use same API key from config
   - **Impact:** Search assist will actually find content

3. **Add Media Type Support**
   - Check `item.mediaType` before calling TMDB
   - Use `/movie/{id}/videos` for movies, `/tv/{id}/videos` for TV shows
   - **Impact:** Movies will work correctly

4. **Improve Error Handling**
   - Surface API errors to user (e.g., "Unable to load content. Please try again.")
   - Distinguish between "no results" vs "API error" vs "network error"
   - **Impact:** Better UX, easier debugging

### Priority 2: Filtering Improvements

5. **Broaden TMDB Video Filtering**
   - Use fuzzy matching or multiple keyword variations
   - Consider checking video `type` field if available
   - **Impact:** More videos will pass the filter

6. **Expand YouTube Channel Allowlist**
   - Add more official channels (studios, networks, production companies)
   - Consider allowing verified channels even if not in allowlist
   - **Impact:** More legitimate content will be shown

7. **Improve YouTube Query Construction**
   - Test different query formats
   - Consider multiple query attempts with variations
   - **Impact:** Better search results

### Priority 3: UX Enhancements

8. **Better Empty State Messaging**
   - Show different messages for "no content" vs "API error"
   - Provide retry button for errors
   - **Impact:** Users understand what happened

9. **Add Loading States**
   - Show progress for each API call (TMDB, YouTube, fallbacks)
   - **Impact:** Users know system is working

10. **Add Manual Override System**
    - Allow admins to manually add bloopers/extras for specific shows
    - Store in database or config file
    - **Impact:** Guaranteed content for popular shows

### Priority 4: Technical Improvements

11. **Add Caching**
    - Implement the TODO'd cache system in `extrasProvider.ts:13`
    - Cache results per showId to reduce API calls
    - **Impact:** Faster loads, fewer API calls

12. **Add API Key Validation**
    - Check if API keys are set before making calls
    - Show user-friendly error if keys missing
    - **Impact:** Clear error messages instead of silent failures

13. **Add Rate Limiting**
    - Implement rate limiting for YouTube API calls
    - Queue requests if needed
    - **Impact:** Avoid API quota exhaustion

---

## Summary

### High-Level Reasons for Empty Results

1. **Search Assist is disabled** - No fallback when official sources fail
2. **Search Assist is a stub** - Even if enabled, doesn't actually search
3. **Missing API keys** - API calls fail silently if keys not configured
4. **Movies don't work** - TMDB endpoint hardcoded to `/tv/` only
5. **Overly strict filtering** - Many legitimate videos filtered out
6. **Errors are silent** - Users can't tell if API failed or no content exists

### Constraints Identified

- **Feature Flag:** `EXTRAS_BLOOPERS_SEARCH_ASSIST` defaults to `false`
- **Environment Variables:** `VITE_YOUTUBE_API_KEY` and `VITE_TMDB_KEY` required
- **Pro Feature:** Only Pro users can access Bloopers/Extras
- **API Dependencies:** Requires valid TMDB and YouTube API keys with proper quotas

### Next Steps

1. Verify API keys are set in environment
2. Enable search assist flag (or implement it properly)
3. Test with known shows that should have bloopers/extras
4. Check browser console for error logs
5. Consider implementing fixes in priority order above

---

**Report Generated:** 2024-12-19  
**Files Analyzed:** 8 core files, 3 supporting files  
**Lines of Code Reviewed:** ~1,500+

