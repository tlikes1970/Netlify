# Feature Matrix Analysis

## Current Feature Status

### FTX-1: "Not interested" Card Actions
**Status**: ✅ PARTIALLY IMPLEMENTED
**Files**: 
- `www/scripts/list-actions.js` (lines 94-165) - Main handler
- `www/scripts/card.js` (lines 1-27) - Basic card actions
**Handlers**: 
- Event listener on `[data-action="not-interested"], .btn-not-interested`
- Global `CardActions.notInterested(id, type)` function
**Dependencies**: 
- `window.appData` for data storage
- `window.Toast.show` for notifications
- `AppEvents.emit('data:changed')` for state updates
**Issues**: 
- Only works on search results, not all lists
- Needs unified handler for all card types
- Missing Discover page integration

### FTX-2: Movie/TV Posters Button
**Status**: ✅ IMPLEMENTED
**Files**:
- `www/scripts/inline-script-02.js` (lines 2875-2884) - Poster rendering
- `www/styles/components.css` (lines 1939-1956) - Poster button styles
**Handlers**:
- `data-action="open"` on poster buttons
- `window.getPosterUrl()` for URL generation
- `window.tmdbSrcset()` for responsive images
**Dependencies**:
- TMDB API for poster data
- `TMDB_IMG_BASE` constant
- Fallback placeholder system
**Issues**: 
- Button action needs verification
- Error handling for missing posters

### FTX-3: Share Lists & Export CSV
**Status**: ✅ PARTIALLY IMPLEMENTED
**Files**:
- `www/scripts/inline-script-02.js` (lines 2262-2460) - Share functionality
- `www/index.html` (lines 836-841, 870-875) - Export CSV buttons
**Handlers**:
- `copyShareList()` function for text sharing
- `data-pro="required"` gating for CSV export
**Dependencies**:
- `navigator.clipboard` API
- Pro gating system (`data-pro="required"`)
- `window.appData` for list data
**Issues**:
- CSV export not implemented (buttons exist but no functionality)
- Share link generation needs improvement
- Missing copy-to-clipboard fallback

### FTX-4: Pro Surface
**Status**: ✅ PARTIALLY IMPLEMENTED
**Files**:
- `www/scripts/pro-gate.js` (lines 1-65) - Pro gating system
- `www/index.html` (lines 846-877) - Pro features UI
**Handlers**:
- `data-pro="required"` attribute system
- `data-pro-mode="hide|disable"` for different behaviors
- `window.enablePro()/disablePro()` for testing
**Dependencies**:
- `localStorage.getItem('flicklet:pro')` for Pro status
- Pro gating CSS classes
**Issues**:
- Read-only previews not implemented
- Pro features list needs completion
- Missing clear CTA for Pro upgrade

### FTX-5: Notifications Testability
**Status**: ✅ PARTIALLY IMPLEMENTED
**Files**:
- `www/scripts/inline-script-01.js` (lines 3095-3610) - Notification engine
- `www/scripts/notifications.js` (lines 1-70) - Toast system
- `www/js/functions.js` (lines 462-523) - Episode notifications
**Handlers**:
- `window.FLAGS.notifEngineEnabled` for core notifications
- `window.FLAGS.notifAdvancedEnabled` for Pro features
- Master toggle in settings
**Dependencies**:
- `localStorage` for notification settings
- `window.appData` for episode data
- TMDB API for episode air dates
**Issues**:
- Mock mode not implemented
- Advanced notifications need testing mode
- Missing visible state indicators

### FTX-6: Marquee Quotes
**Status**: ✅ IMPLEMENTED
**Files**:
- `www/scripts/inline-script-02.js` (lines 4375-4412) - Quote system
- `www/styles/card-system.css` (lines 842-905) - Marquee styles
- `www/index.html` (lines 1236-1272) - Quote bar initialization
**Handlers**:
- `drawQuote()` function with deck-based rotation
- `getQuoteDeck()` for shuffle management
- CSS animations for marquee effect
**Dependencies**:
- `QUOTES` array for content pool
- `localStorage` for deck persistence
- Translation system for multilingual quotes
**Issues**:
- Content pool needs expansion (sarcastic/snarky quotes)
- Rotation logic is pluggable but needs more variety

### FTX-7: Settings Tie-ins
**Status**: ✅ PARTIALLY IMPLEMENTED
**Files**:
- `www/js/language-manager.js` (lines 1-44) - Language persistence
- `www/js/app.js` (lines 1570-1655) - FAB docking system
- `www/index.html` (lines 2068-2126) - Episode tracking toggle
**Handlers**:
- `LanguageManager.saveLanguage()` for Spanish persistence
- `dockFABsToActiveTab()` for FAB visibility
- Episode tracking toggle with `updateEpisodeTrackingUI()`
**Dependencies**:
- `localStorage` for settings persistence
- `window.appData` for data sync
- FAB docking system for button positioning
**Issues**:
- Spanish persistence across reload needs verification
- FABs visibility needs testing
- Episode tracking toggle needs modal integration

### FTX-8: Community Player Placeholder
**Status**: ✅ PARTIALLY IMPLEMENTED
**Files**:
- `www/index.html` (lines 299-338) - Community content layout
- `www/scripts/community-spotlight.js` (lines 1-49) - Community spotlight
- `www/js/flags.js` (lines 1-29) - Feature flags
**Handlers**:
- Community content two-column layout
- `window.FLAGS.communityPlayer` flag (not yet defined)
- Placeholder content with "Coming soon" message
**Dependencies**:
- Feature flag system
- Community content layout
- Load guard system
**Issues**:
- Community player flag not defined
- Load guard not implemented
- Placeholder needs proper error handling

## Data Sources & Stores

### Primary Data Store
- `window.appData` - Main application data
- `localStorage['flicklet-data']` - Persistent storage
- `localStorage['tvMovieTrackerData']` - Legacy data fallback

### Feature Flags
- `window.FLAGS` - Feature toggles
- Pro status: `localStorage['flicklet:pro']`
- Notification settings: `localStorage['flicklet:notif:*']`

### Event System
- `AppEvents.emit('data:changed')` - Data change notifications
- `window.Toast.show()` - User notifications
- `window.showNotification()` - Legacy notification system

## Selectors & Event Sources

### Card Actions
- `[data-action="not-interested"]` - Not interested buttons
- `[data-action="open"]` - Poster/open buttons
- `.curated-card, .list-card, .list-row, .card` - Card containers

### Pro Gating
- `[data-pro="required"]` - Pro-gated elements
- `[data-pro-mode="hide|disable"]` - Gating behavior
- `.pro-locked` - Disabled state styling

### Settings Controls
- `#enableEpisodeTracking` - Episode tracking toggle
- `#shareOpenBtn` - Share lists button
- `[data-pro-feature="export-csv"]` - CSV export buttons

## Side Effects & Dependencies

### Layout Dependencies
- FAB docking system affects button positioning
- Quote marquee affects layout height
- Pro gating affects element visibility

### Data Dependencies
- Episode tracking affects card modal content
- Language changes affect all text content
- Pro status affects feature availability

### API Dependencies
- TMDB API for poster images and episode data
- Clipboard API for sharing functionality
- Local storage for all persistent data


