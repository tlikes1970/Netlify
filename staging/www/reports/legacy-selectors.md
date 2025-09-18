# Legacy Selectors to Purge

## Stats/Binge Meters and User Stats Blocks

### Selectors to Remove
- `#bingeMeter` - Binge meter display
- `.stats` - Stats container div
- `.stat` - Individual stat elements
- `#bingeBanner` - Binge banner (referenced in config)

### Files Containing These Selectors
- `www/index.html:214-216` - Static HTML structure
- `www/js/home-sections-config.js:26` - Configuration reference
- `www/styles/main.css` - CSS styling
- `www/scripts/inline-script-02.js` - JavaScript references

## Extended Upcoming Beyond "This Week"

### Selectors to Remove
- `#upcomingEpisodes` - Extended upcoming episodes section
- `.upcoming-episodes` - Related CSS classes

### Files Containing These Selectors
- `www/index.html:286-293` - Static HTML structure
- `www/js/home-sections-config.js:22` - Configuration reference
- `www/scripts/inline-script-02.js` - JavaScript references

## Standalone Quote/Quotes Widgets

### Selectors to Remove
- `#quote-flickword-container` - Main quote container
- `#quoteCard` - Individual quote card
- `#randomQuoteCard` - Random quote card
- `.quote-card` - Quote card CSS class
- `.random-quote-card` - Random quote card CSS class
- `#quoteBlock` - Quote block reference

### Files Containing These Selectors
- `www/index.html:296-303` - Static HTML structure
- `www/js/home-sections-config.js:23-25` - Configuration references
- `www/scripts/inline-script-02.js:4392-4455` - JavaScript injection
- `www/styles/main.css` - CSS styling

## Mini/Duplicate FlickWord or Trivia Cards

### Selectors to Remove
- `#flickwordTile` - FlickWord tile (referenced in config)
- `#triviaTile` - Trivia tile (referenced in config)
- `.flickword-tile` - FlickWord tile CSS class
- `.trivia-tile` - Trivia tile CSS class

### Files Containing These Selectors
- `www/js/home-sections-config.js:41-42` - Configuration references
- `www/scripts/trivia.js` - Trivia functionality
- `www/scripts/community/games.js` - Games functionality

## Legacy "Popular This Week" and "Editors' Choice"

### Selectors to Remove
- `.popular-this-week` - Popular this week section
- `.editors-choice` - Editors' choice section
- `#popularThisWeek` - Popular this week ID
- `#editorsChoice` - Editors' choice ID

### Files Containing These Selectors
- `www/scripts/curated-rows.js` - Curated rows system
- `www/scripts/inline-script-01.js` - Inline script references

## Separate "In Theaters (National)" Row

### Selectors to Remove
- `#theatersNational` - National theaters section
- `.theaters-national` - National theaters CSS class
- `#inTheatersNational` - Alternative ID

### Files Containing These Selectors
- `www/scripts/theaters-near-me.js` - Theaters functionality
- `www/scripts/inline-script-02.js` - Inline script references

## Auto-Register/Auto-Inject Row Systems

### Systems to Disable/Remove
- **MP-Playlists v1** - `www/scripts/inline-script-01.js:3813-4028`
- **Quote System** - `www/scripts/inline-script-02.js:4392-4455`
- **Curated Rows Auto-Inject** - `www/scripts/curated-rows.js`
- **Personalized Rows Auto-Inject** - `www/scripts/rows/personalized.js`

### Functions to Disable
- `renderSpotlight()` - MP-Playlists v1 spotlight injection
- `ensureBlocks()` - Quote system block injection
- `drawQuote()` - Quote drawing functionality
- `injectSettingsRow()` - Settings row injection

## Associated Feature Flags

### Flags to Remove/Disable
- `window.FLAGS.home_layout_v2` - Currently disabled anyway
- `window.FLAGS.spotlight_enabled` - Spotlight video flag
- `window.FLAGS.quotes_enabled` - Quote system flag
- `window.FLAGS.curated_rows_enabled` - Curated rows flag

### Files Containing Feature Flags
- `www/js/flags.js` - Main flags file
- `www/scripts/flags-init.js` - Flags initialization
- `www/scripts/home.js:20` - Home layout v2 flag check

## CSS Classes to Purge

### Stats/Binge Related
```css
.stats { /* Remove */ }
.stat { /* Remove */ }
.binge-meter { /* Remove */ }
.binge-banner { /* Remove */ }
```

### Quote Related
```css
.quote-flickword-container { /* Remove */ }
.quote-card { /* Remove */ }
.random-quote-card { /* Remove */ }
.quote-block { /* Remove */ }
```

### Upcoming Episodes
```css
.upcoming-episodes { /* Remove */ }
.extended-upcoming { /* Remove */ }
```

### Legacy Row Classes
```css
.popular-this-week { /* Remove */ }
.editors-choice { /* Remove */ }
.theaters-national { /* Remove */ }
.flickword-tile { /* Remove */ }
.trivia-tile { /* Remove */ }
```

## JavaScript References to Clean Up

### Global Variables
- `window.bingeMeter` - Binge meter reference
- `window.quoteCard` - Quote card reference
- `window.frontSpotlight` - Front spotlight reference

### Event Listeners
- Home tab click listeners for auto-injection
- Quote system event listeners
- Spotlight video event listeners

### Configuration Objects
- `HomeSectionsConfig.ALL_SECTIONS` - Remove legacy section IDs
- `HomeSectionsConfig.SEARCH_HIDDEN_SECTIONS` - Remove legacy section IDs

## Purge Priority

### High Priority (Remove Immediately)
1. `#bingeMeter` and `.stats` - Stats/binge meters
2. `#quote-flickword-container` - Standalone quote widgets
3. `#upcomingEpisodes` - Extended upcoming episodes
4. Auto-inject systems (MP-Playlists v1, Quote system)

### Medium Priority (Remove After Core Cleanup)
1. Legacy row classes and IDs
2. Feature flags for removed systems
3. CSS classes for removed elements

### Low Priority (Cleanup After Implementation)
1. JavaScript references and global variables
2. Event listeners for removed systems
3. Configuration object cleanup




