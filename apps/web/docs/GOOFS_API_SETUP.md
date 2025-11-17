# Goofs API Setup Guide

**Status:** ✅ Automated fetching infrastructure ready  
**Last Updated:** 2024-12-19

---

## Overview

The Goofs feature now supports **automated fetching** from external APIs. The infrastructure is in place - you just need to configure your data source.

---

## Architecture

```
User Clicks "Goofs" Button
  ↓
GoofsModal Opens
  ↓
goofsStore.getGoofsForTitle(tmdbId)
  ↓
Check localStorage cache → Check seed data → Fetch from API
  ↓
Netlify Function: /api/goofs-fetch
  ↓
External API (IMDb, goofs API, etc.)
  ↓
Cache result in localStorage
  ↓
Display goofs in modal
```

---

## Current Implementation

### ✅ What's Already Done:

1. **Netlify Function Created:** `netlify/functions/goofs-fetch.cjs`
   - Handles API requests server-side
   - Returns standardized GoofSet format
   - Includes CORS headers

2. **Frontend Integration:** `apps/web/src/lib/goofs/goofsStore.ts`
   - Automatically fetches from API if not in cache
   - Caches results in localStorage
   - Falls back gracefully if API fails

3. **API Route Configured:** `netlify.toml`
   - `/api/goofs-fetch` → `/.netlify/functions/goofs-fetch`

---

## Next Steps: Choose Your Data Source

You need to implement the actual fetching logic in `netlify/functions/goofs-fetch.cjs`. Here are your options:

### Option 1: IMDb API (RapidAPI)

**Pros:**
- ✅ Large database of goofs
- ✅ Official API (via RapidAPI)
- ✅ Reliable and maintained

**Setup:**

1. **Get RapidAPI IMDb API Key:**
   - Sign up at https://rapidapi.com/
   - Subscribe to "IMDb API" (has free tier)
   - Get your API key

2. **Add to Netlify Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add: `IMDB_API_KEY` = your RapidAPI key

3. **Update `goofs-fetch.cjs`:**
   ```javascript
   async function fetchGoofsFromSource(tmdbId, imdbId, title) {
     const imdbApiKey = process.env.IMDB_API_KEY;
     if (!imdbApiKey) {
       console.warn('IMDB_API_KEY not configured');
       return [];
     }

     // First, get IMDb ID from TMDB if not provided
     if (!imdbId) {
       imdbId = await getImdbIdFromTmdb(tmdbId);
     }
     
     if (!imdbId) {
       return [];
     }

     // Fetch goofs from IMDb API
     const response = await fetch(
       `https://imdb-api.com/en/API/Goofs/${imdbApiKey}/${imdbId}`,
       { headers: { 'Accept': 'application/json' } }
     );
     
     if (!response.ok) {
       throw new Error(`IMDb API error: ${response.status}`);
     }
     
     const data = await response.json();
     
     // Transform IMDb format to our GoofItem format
     return (data.items || []).map((item, idx) => ({
       id: `imdb-${imdbId}-${idx}`,
       type: categorizeGoof(item.type || item.category),
       text: item.text || item.content,
       subtlety: item.subtlety || 'obvious'
     }));
   }

   async function getImdbIdFromTmdb(tmdbId) {
     const tmdbToken = process.env.TMDB_TOKEN;
     if (!tmdbToken) return null;
     
     // Try movie endpoint first
     let response = await fetch(
       `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbToken}`,
       { headers: { 'Accept': 'application/json' } }
     );
     
     if (response.ok) {
       const data = await response.json();
       if (data.imdb_id) return data.imdb_id;
     }
     
     // Try TV endpoint
     response = await fetch(
       `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${tmdbToken}`,
       { headers: { 'Accept': 'application/json' } }
     );
     
     if (response.ok) {
       const data = await response.json();
       if (data.external_ids?.imdb_id) return data.external_ids.imdb_id;
     }
     
     return null;
   }
   ```

---

### Option 2: Custom Goofs API Service

If you have access to a dedicated goofs API service:

1. **Add API Key to Netlify:**
   - `GOOFS_API_KEY` = your API key

2. **Update `fetchGoofsFromSource()`:**
   ```javascript
   async function fetchGoofsFromSource(tmdbId, imdbId, title) {
     const apiKey = process.env.GOOFS_API_KEY;
     if (!apiKey) return [];
     
     const response = await fetch(
       `https://your-goofs-api.com/v1/goofs?tmdb_id=${tmdbId}`,
       {
         headers: {
           'Authorization': `Bearer ${apiKey}`,
           'Accept': 'application/json'
         }
       }
     );
     
     if (!response.ok) return [];
     
     const data = await response.json();
     return data.goofs || [];
   }
   ```

---

### Option 3: Web Scraping (Not Recommended)

⚠️ **Legal/ToS Warning:** Scraping IMDb directly violates their Terms of Service. Use an official API instead.

If you must scrape (for testing only):

1. Use a service like ScraperAPI or Bright Data
2. Add their API key to Netlify
3. Implement scraping logic in the function

---

## Testing the Setup

### 1. Test Netlify Function Locally:

```bash
# Start Netlify dev
netlify dev

# In another terminal, test the function
curl "http://localhost:8888/api/goofs-fetch?tmdbId=1396"
```

### 2. Test from Browser Console:

```javascript
// Test the API endpoint
fetch('/api/goofs-fetch?tmdbId=1396')
  .then(r => r.json())
  .then(console.log);
```

### 3. Test Full Flow:

1. Clear localStorage: `localStorage.removeItem('flicklet.goofs.v1')`
2. Open Breaking Bad card
3. Click "Goofs" button
4. Check console logs for API fetch
5. Verify goofs appear in modal

---

## Environment Variables Needed

Add these to **Netlify Dashboard → Site Settings → Environment Variables**:

### Required (choose one):
- `IMDB_API_KEY` - If using RapidAPI IMDb API
- `GOOFS_API_KEY` - If using custom goofs API
- `SCRAPER_API_KEY` - If using web scraping service

### Optional (for IMDb ID lookup):
- `TMDB_TOKEN` - Already configured for TMDB proxy

---

## Caching Strategy

The system uses a **multi-layer cache**:

1. **localStorage** - Persistent browser cache (survives page refresh)
2. **In-memory cache** - Fast lookup during session
3. **API fetch** - Only when not in cache

**Cache invalidation:**
- Results are cached indefinitely
- To refresh: Clear localStorage or wait for manual refresh feature (future)

---

## Error Handling

The system gracefully handles errors:

- ✅ API failures don't crash the app
- ✅ Returns empty array if API unavailable
- ✅ Falls back to seed data if available
- ✅ Shows "No goofs found" message if all sources fail

---

## Monitoring

Check Netlify Function logs:
1. Go to Netlify Dashboard
2. Functions → `goofs-fetch`
3. View logs for errors/requests

---

## Next Steps

1. **Choose your data source** (IMDb API recommended)
2. **Get API key** and add to Netlify environment variables
3. **Update `fetchGoofsFromSource()`** in `goofs-fetch.cjs`
4. **Test locally** with `netlify dev`
5. **Deploy** and test in production

---

## Troubleshooting

### API Returns Empty Array:

- Check Netlify function logs for errors
- Verify API key is set correctly
- Test API endpoint directly (curl/Postman)
- Check if TMDB ID → IMDb ID conversion works

### Goofs Not Appearing:

- Check browser console for errors
- Verify localStorage has data: `localStorage.getItem('flicklet.goofs.v1')`
- Clear cache and try again
- Check Netlify function logs

### CORS Errors:

- Shouldn't happen (function includes CORS headers)
- If it does, check `goofs-fetch.cjs` CORS configuration

---

**The infrastructure is ready - just implement your chosen data source!** 🚀

