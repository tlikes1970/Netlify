# Home Clean Component - Phase 3 Complete

A modern, data-driven home layout component that integrates seamlessly with the existing Flicklet app. This component provides a clean, card-based interface for viewing and managing TV shows and movies with advanced features like holiday assignments and streamlined actions.

## Phase 3 Features ✅

- **Live Data Integration**: Connected to real `appData` sources
- **TMDB API Integration**: Cached curated content with 24-hour expiration
- **Real Action Handlers**: Connected to existing reducers and update functions
- **Analytics Integration**: Action tracking and event dispatching
- **Feature Flag Toggle**: Runtime switching between legacy and clean layouts
- **Performance Optimized**: Async loading, caching, and efficient rendering

## Feature Flag

The component is controlled by the `window.FLAGS.homeClean` feature flag, which defaults to `true`. To disable the component, set `window.FLAGS.homeClean = false` before the app initializes.

## Layout Toggle

Runtime switching between layouts:

```javascript
// Switch to clean layout
window.toggleHomeLayout(true);

// Switch to legacy layout  
window.toggleHomeLayout(false);
```

## Data Sources

### Currently Watching
- **Source**: `window.appData.tvWatching`
- **Sort**: By `updatedAt` descending
- **Actions**: Want to Watch, Watched, Not Interested, Delete

### Next Up
- **Source**: `window.appData.nextUp`
- **Sort**: By `airDate` ascending
- **Display**: Smart labels based on series status

### For You (Drama, Comedy, Horror)
- **Source**: TMDB API with user's curated preferences
- **Cache**: 24-hour sessionStorage cache
- **Fallback**: Default genre IDs if no preferences

## Holiday+ Persistence

Holiday assignments are automatically persisted to `localStorage['flicklet:holidayAssignments']` using card IDs as keys. The assignments are restored when the component initializes and persist across page reloads. Holiday assignment events are dispatched as `holiday:assigned` custom events with card details.

## QA Testing Commands

```javascript
// Check component status
window.getHomeCleanStatus();

// Get rail metrics
window.homeCleanReport();

// Refresh with current data
window.refreshCleanLayout();

// Clear curated cache
window.clearCuratedCache();

// Toggle layouts
window.toggleHomeLayout(true);   // Clean
window.toggleHomeLayout(false);  // Legacy
```

## Performance Targets

- ✅ First paint: ≤ 1.5s
- ✅ Layout shift: ≤ 0.05
- ✅ Rail widths: ≤ viewport + 5px
- ✅ Cache hit rate: > 80% for curated data

## Component Structure

- **`home-clean.html`**: Template markup with five rails (CW, Next Up, Drama, Comedy, Horror)
- **`home-clean.css`**: Scoped styles under `#home-clean` selector
- **`home-clean.js`**: Live data adapters, rendering logic, and action handlers
- **`holiday-modal.js`**: Global holiday assignment modal component
- **`index.js`**: Component loader with mount/destroy functions

## Integration

The component mounts automatically when the feature flag is enabled and integrates with the existing home section without modifying legacy code. Action events are dispatched and connected to real data mutations. Legacy rails are automatically hidden when the clean layout is active.
