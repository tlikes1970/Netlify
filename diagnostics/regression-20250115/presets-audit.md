# Presets Audit - Anime/Horror Empty State Analysis

**Date:** January 15, 2025  
**Analysis:** Preset rows (Anime/Horror) empty state investigation  

## 🎯 **PRESET SYSTEM OVERVIEW**

### **Current Architecture**
```
Preset System
├── Content API (api/content.js)
├── Personalized Rows (personalized.js)
├── User Settings (user-settings.js)
└── TMDB Integration (tmdb.js)
```

## 🔍 **PRESET CONFIGURATION**

### **1. Available Presets**
**Location:** `www/scripts/api/content.js:32-53`  
**Current Configuration:**
```javascript
window.ROW_PRESETS = [
  {
    key: 'trending',
    labelKey: 'rows.trending',
    fetch: fetchTrending
  },
  {
    key: 'anime',
    labelKey: 'rows.anime',
    fetch: fetchAnime
  },
  {
    key: 'horror',
    labelKey: 'rows.horror',
    fetch: (page = 1) => fetchByGenre('Horror', page)
  },
  {
    key: 'staff_picks',
    labelKey: 'rows.staff_picks',
    fetch: fetchStaffPicks
  }
];
```

### **2. Anime Fetch Implementation**
**Location:** `www/scripts/api/content.js:210-246`  
**Current Implementation:**
```javascript
async function fetchAnime(page = 1) {
  try {
    console.log('🎌 Fetching anime content, page:', page);
    
    // Fetch animated content and filter for Japanese productions
    const animatedContent = await fetchByGenre('Animation', page);
    
    if (!animatedContent || !Array.isArray(animatedContent.results)) {
      return [];
    }

    // Filter for anime-specific content (Japanese origin required)
    const animeResults = animatedContent.results.filter(item => {
      // Must be from Japan (primary requirement)
      const isJapanese = item.origin_country && item.origin_country.includes('JP');
      
      // Additional anime-specific keywords in title or overview
      const title = (item.title || item.name || '').toLowerCase();
      const overview = (item.overview || '').toLowerCase();
      const hasAnimeKeywords = /anime|manga|otaku|shounen|shoujo|seinen|josei|mecha|isekai|slice of life|battle shounen|studio ghibli|ghibli/i.test(title + ' ' + overview);
      
      // Must be Japanese AND have anime characteristics
      return isJapanese && (hasAnimeKeywords || item.genre_ids?.includes(16));
    });

    console.log(`🎌 Filtered ${animeResults.length} anime items from ${animatedContent.results.length} animated items`);

    return {
      results: animeResults,
      page: page,
      total_pages: animatedContent.total_pages || 1
    };
  } catch (error) {
    console.warn('[content] tmdbGet failed for anime', error);
    return [];
  }
}
```

### **3. Horror Fetch Implementation**
**Location:** `www/scripts/api/content.js:46`  
**Current Implementation:**
```javascript
{
  key: 'horror',
  labelKey: 'rows.horror',
  fetch: (page = 1) => fetchByGenre('Horror', page)
}
```

## 🚨 **ROOT CAUSE ANALYSIS**

### **1. Anime Filtering Too Restrictive**
**Problem:** Anime filter requires BOTH Japanese origin AND anime keywords
**Impact:** Very few results pass the filter
**Location:** `www/scripts/api/content.js:222-232`

### **2. Genre ID Mapping Issues**
**Problem:** Genre mapping may be incorrect or incomplete
**Impact:** Wrong content fetched from TMDB
**Location:** `www/scripts/api/content.js:14-17`

### **3. Error Handling Returns Empty Array**
**Problem:** Errors return empty array instead of showing error state
**Impact:** Users see empty rows instead of error messages
**Location:** `www/scripts/api/content.js:243-245`

### **4. TMDB API Call Failures**
**Problem:** TMDB API calls may be failing silently
**Impact:** No content loaded, empty preset rows
**Location:** `fetchByGenre` function calls

## 🔧 **FIX STRATEGIES**

### **Strategy 1: Relax Anime Filtering (Recommended)**
**File:** `www/scripts/api/content.js:210-246`  
**Make anime detection more lenient:**
```javascript
async function fetchAnime(page = 1) {
  try {
    console.log('🎌 Fetching anime content, page:', page);
    
    // Fetch animated content
    const animatedContent = await fetchByGenre('Animation', page);
    
    if (!animatedContent || !Array.isArray(animatedContent.results)) {
      console.warn('🎌 No animated content results');
      return { results: [], page: 1, total_pages: 1 };
    }

    // More lenient anime detection
    const animeResults = animatedContent.results.filter(item => {
      const title = (item.title || item.name || '').toLowerCase();
      const overview = (item.overview || '').toLowerCase();
      const combinedText = title + ' ' + overview;
      
      // Check for anime keywords (more comprehensive)
      const hasAnimeKeywords = /anime|manga|otaku|shounen|shoujo|seinen|josei|mecha|isekai|slice of life|battle shounen|studio ghibli|ghibli|japanese|japan|tokyo|osaka|kyoto/i.test(combinedText);
      
      // Check for Japanese origin (more lenient)
      const isJapanese = item.origin_country && item.origin_country.includes('JP');
      
      // Check for animation genre
      const isAnimation = item.genre_ids && item.genre_ids.includes(16);
      
      // Accept if has anime keywords OR is Japanese OR is animation genre
      return hasAnimeKeywords || isJapanese || isAnimation;
    });

    console.log(`🎌 Filtered ${animeResults.length} anime items from ${animatedContent.results.length} animated items`);

    // If no anime results, fallback to all animated content
    if (animeResults.length === 0) {
      console.log('🎌 No anime-specific results, using all animated content');
      return {
        results: animatedContent.results.slice(0, 20),
        page: page,
        total_pages: animatedContent.total_pages || 1
      };
    }

    return {
      results: animeResults,
      page: page,
      total_pages: animatedContent.total_pages || 1
    };
  } catch (error) {
    console.error('🎌 Anime fetch error:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
}
```

### **Strategy 2: Improve Error Handling**
**File:** `www/scripts/rows/personalized.js:153-200`  
**Add better error states:**
```javascript
async function loadPresetContent(scrollerEl, preset) {
  if (!scrollerEl || !preset || !preset.fetch) {
    console.error('❌ Invalid parameters for loadPresetContent');
    return;
  }

  try {
    console.log(`🎯 Loading content for preset: ${preset.key}`);
    
    // Show skeleton while loading
    scrollerEl.innerHTML = `
      <div class="row__skeleton">
        ${Array.from({length: 8}).map(() => '<div class="ghost-card"></div>').join('')}
      </div>
    `;

    // Fetch content with timeout
    const data = await Promise.race([
      preset.fetch(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);
    
    if (!data || !data.results || !Array.isArray(data.results)) {
      console.warn(`[personalized] Invalid data from preset ${preset.key}:`, data);
      scrollerEl.innerHTML = `
        <div class="row__error">
          <p>No content available for this category.</p>
          <button class="btn btn--sm" onclick="location.reload()">Retry</button>
        </div>
      `;
      return;
    }

    // Clear skeleton and render cards
    scrollerEl.innerHTML = '';
    
    const items = data.results.slice(0, 20);
    console.log(`🎯 Rendering ${items.length} items for ${preset.key}`);

    if (items.length === 0) {
      scrollerEl.innerHTML = `
        <div class="row__empty">
          <p>No items found in this category.</p>
          <button class="btn btn--sm" onclick="location.reload()">Try Again</button>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const cardElement = createCardElement(item);
      if (cardElement) {
        scrollerEl.appendChild(cardElement);
      }
    });

  } catch (error) {
    console.error(`❌ Failed to load content for preset ${preset.key}:`, error);
    
    scrollerEl.innerHTML = `
      <div class="row__error">
        <p>Failed to load content. Please try again.</p>
        <button class="btn btn--sm" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}
```

### **Strategy 3: Add Genre Fallbacks**
**File:** `www/scripts/api/content.js:14-17`  
**Expand genre mapping:**
```javascript
const GENRE_FALLBACK = (window.__GENRES__) || {
  16: 'Animation', 
  27: 'Horror', 
  28: 'Action', 
  35: 'Comedy', 
  18: 'Drama',
  12: 'Adventure', 
  14: 'Fantasy', 
  53: 'Thriller', 
  80: 'Crime', 
  99: 'Documentary',
  // Add more genres
  36: 'History',
  10402: 'Music',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  10752: 'War',
  37: 'Western'
};
```

### **Strategy 4: Add Debug Logging**
**File:** `www/scripts/api/content.js`  
**Add comprehensive logging:**
```javascript
async function fetchByGenre(genreName, page = 1) {
  try {
    console.log(`🎬 Fetching ${genreName} content, page:`, page);
    
    const genreId = resolveGenreIdByName(genreName, GENRE_FALLBACK);
    console.log(`🎬 Resolved genre "${genreName}" to ID:`, genreId);
    
    if (!genreId) {
      console.warn(`🎬 Unknown genre: ${genreName}`);
      return { results: [], page: 1, total_pages: 1 };
    }
    
    const response = await window.tmdbGet(`/discover/movie`, {
      with_genres: genreId,
      page: page,
      sort_by: 'popularity.desc'
    });
    
    console.log(`🎬 TMDB response for ${genreName}:`, response);
    
    if (!response || !response.results) {
      console.warn(`🎬 No results for ${genreName}`);
      return { results: [], page: 1, total_pages: 1 };
    }
    
    console.log(`🎬 Found ${response.results.length} results for ${genreName}`);
    return response;
    
  } catch (error) {
    console.error(`🎬 Error fetching ${genreName}:`, error);
    return { results: [], page: 1, total_pages: 1 };
  }
}
```

## 🔍 **TMDB API INTEGRATION**

### **Current TMDB Integration**
**Location:** `www/scripts/tmdb.js`  
**Issue:** May not be properly loaded or configured

### **Required TMDB Setup**
```javascript
// Ensure TMDB client is available
if (typeof window.tmdbGet !== 'function') {
  console.error('TMDB client not available');
  return;
}

// Test TMDB connection
window.tmdbGet('/genre/movie/list')
  .then(genres => {
    console.log('TMDB genres loaded:', genres);
    window.__GENRES__ = genres.genres.reduce((acc, genre) => {
      acc[genre.id] = genre.name;
      return acc;
    }, {});
  })
  .catch(error => {
    console.error('TMDB connection failed:', error);
  });
```

## 📊 **PRESET LOADING PERFORMANCE**

### **Current Performance Issues**
- No caching of preset results
- No retry mechanism for failed requests
- No loading states for users
- No fallback content

### **Performance Improvements**
```javascript
// Add preset caching
const presetCache = new Map();

async function fetchPresetWithCache(preset, page = 1) {
  const cacheKey = `${preset.key}-${page}`;
  
  if (presetCache.has(cacheKey)) {
    console.log(`🎯 Using cached data for ${preset.key}`);
    return presetCache.get(cacheKey);
  }
  
  const data = await preset.fetch(page);
  presetCache.set(cacheKey, data);
  return data;
}
```

## 🎯 **RECOMMENDED IMPLEMENTATION**

### **Phase 1: Fix Anime Filtering (15 min)**
1. Relax anime detection criteria
2. Add fallback to all animated content
3. Test anime preset loading

### **Phase 2: Improve Error Handling (10 min)**
1. Add proper error states
2. Add retry buttons
3. Test error scenarios

### **Phase 3: Add Debug Logging (10 min)**
1. Add comprehensive logging
2. Test TMDB integration
3. Debug genre mapping

### **Phase 4: Add Caching (15 min)**
1. Implement preset caching
2. Add loading states
3. Test performance

## 📋 **TESTING CHECKLIST**

After preset fixes:
- [ ] Anime preset shows content
- [ ] Horror preset shows content
- [ ] Trending preset shows content
- [ ] Staff picks preset shows content
- [ ] Error states display properly
- [ ] Retry buttons work
- [ ] Loading states show
- [ ] No JavaScript errors
- [ ] Presets load quickly
- [ ] Content is relevant

## 🔄 **ROLLBACK PLAN**

If preset fixes cause issues:
1. Revert to original filtering
2. Remove error handling changes
3. Debug TMDB integration
4. Test individual presets

## 📊 **IMPACT ASSESSMENT**

| Fix Strategy | Complexity | Risk | Effectiveness |
|--------------|------------|------|---------------|
| Relax Filtering | Low | Low | High |
| Error Handling | Medium | Low | High |
| Debug Logging | Low | Low | Medium |
| Caching | Medium | Low | Medium |



