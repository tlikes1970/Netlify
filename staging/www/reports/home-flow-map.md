# Home Flow Map - Current Render Path Analysis

## Entry Points for Home Content

### 1. Primary Home Load Function
**Location**: `www/js/functions.js:122-143`
```javascript
window.loadHomeContent = function loadHomeContent() {
  const container = document.getElementById('homeSection');
  // Load content with better sequencing
  setTimeout(() => {
    try { startDailyCountdown?.(); } catch {}
    try { updateFlickWordStats?.(); } catch {}
  }, 50);
};
```

### 2. Home Layout v2 System (Feature Flag Controlled)
**Location**: `www/scripts/home.js`
- **Feature Flag**: `window.FLAGS.home_layout_v2`
- **Status**: Currently disabled (returns early if flag not set)
- **Sections**: My Library, Community, Curated, Personalized, Theaters, Feedback

### 3. Auto-Inject Systems

#### A. MP-Playlists v1 (Spotlight Video)
**Location**: `www/scripts/inline-script-01.js:3813-4028`
- **Function**: `renderSpotlight()` - injects spotlight video
- **Mount Point**: `findHomeMount()` - finds home section
- **Auto-trigger**: On home tab click, 500ms delay
- **Content**: Video spotlight with playlist cards

#### B. Quote System
**Location**: `www/scripts/inline-script-02.js:4392-4455`
- **Function**: `drawQuote()` and `ensureBlocks()`
- **Auto-inject**: Creates quote blocks and front spotlight
- **Content**: Quote cards, front spotlight, feedback sections

#### C. Curated Rows System
**Location**: `www/scripts/curated-rows.js`
- **Auto-register**: Dynamic row creation based on settings
- **Content**: Trending, Staff Picks, New This Week rows

## Current DOM Structure (After Load)

### Static HTML Structure (index.html)
```html
<div id="homeSection" class="tab-section">
  <div class="stats">
    <div class="stat" id="bingeMeter"></div>
  </div>
  
  <!-- Currently Watching Preview Row -->
  <section id="currentlyWatchingPreview" class="home-preview-row" style="display: none;">
  
  <!-- Next Up This Week Row -->
  <section id="next-up-row" class="home-section" style="display: none;">
  
  <!-- Community Section -->
  <div id="community-section" class="home-section">
    <div id="spotlight-row" class="home-row" style="display: none;">
  
  <!-- Curated Section -->
  <div id="curated-section" class="home-section">
    <div id="curatedSections" class="home-section" style="display: none;">
  
  <!-- Personalized Section -->
  <div id="personalized-section" class="home-section" style="display: none;">
  
  <!-- Theaters Section -->
  <div id="theaters-section" class="home-section" style="display: none;">
  
  <!-- Upcoming Episodes -->
  <div id="upcomingEpisodes" class="home-section" style="display: none;">
  
  <!-- Quote/Flickword Container -->
  <div id="quote-flickword-container" class="home-section" style="display: none;">
    <div class="quote-card" id="quoteCard">
    <div class="random-quote-card" id="randomQuoteCard">
  
  <!-- Feedback Section -->
  <div id="feedbackSection" class="home-section" style="display: none;">
</div>
```

### Dynamic Content Injection
1. **Spotlight Video** - Injected by MP-Playlists v1
2. **Quote Blocks** - Injected by `ensureBlocks()`
3. **Front Spotlight** - Injected by `ensureBlocks()`
4. **Curated Rows** - Injected by curated-rows.js
5. **Personalized Rows** - Injected by personalized.js

## Render Order Issues

### 1. Multiple Auto-Inject Systems
- **MP-Playlists v1** - Injects spotlight video
- **Quote System** - Injects quote blocks and front spotlight
- **Curated Rows** - Injects trending/staff picks rows
- **Personalized Rows** - Injects genre-based rows

### 2. No Coordination Between Systems
- Each system injects independently
- No order enforcement
- Potential for duplicate content
- No cleanup mechanism

### 3. Feature Flag Confusion
- **Home Layout v2** is disabled (feature flag not set)
- **Legacy systems** still active and injecting
- **Mixed approaches** - some static HTML, some dynamic injection

## Home Sections Configuration

### Current Configuration (home-sections-config.js)
```javascript
ALL_SECTIONS: [
  'currentlyWatchingPreview', 
  'next-up-row',
  'community-section',
  'spotlight-row',
  'curated-section',
  'curatedSections',
  'personalized-section',
  'theaters-section',
  'upcomingEpisodes',
  'quote-flickword-container',
  'quoteCard',
  'randomQuoteCard',
  'bingeBanner',
  'feedbackSection'
]
```

### Issues with Current Config
1. **Too many sections** - 14 sections vs required 8
2. **Legacy sections included** - bingeBanner, quote-flickword-container
3. **No order enforcement** - just a list, no positioning
4. **Mixed static/dynamic** - some sections are HTML, others injected

## Root Causes of Layout Drift

### 1. Multiple Injection Systems
- **No single source of truth** for Home content
- **Competing systems** trying to inject content
- **No coordination** between injection points

### 2. Legacy Code Still Active
- **Old systems** still running alongside new ones
- **Feature flags** not properly controlling behavior
- **No cleanup** of deprecated injection systems

### 3. Static HTML + Dynamic Injection Mix
- **Base structure** in HTML
- **Additional content** injected by JavaScript
- **No enforcement** of final structure

### 4. No Order Enforcement
- **Sections can appear** in any order
- **No validation** of final DOM structure
- **No tripwires** to catch violations

## Proposed Solution

### 1. Single Home Render System
- **One system** responsible for Home content
- **Clear entry point** for all Home modifications
- **Order enforcement** built into the system

### 2. Immovable Layout Contract
- **Exact 8-section order** enforced
- **Runtime validation** of structure
- **Automatic cleanup** of violations

### 3. Legacy System Cleanup
- **Remove auto-inject systems** that don't follow contract
- **Disable feature flags** for deprecated systems
- **Clean up** unused injection code

### 4. Runtime Guardrails
- **Order assertion** after render
- **Purge legacy sections** automatically
- **Prevent re-injection** of removed content




