# Tab System Documentation

## Overview

The tab system has been completely simplified and consolidated into a single, well-documented system. All tab switching logic is now centralized in `FlickletApp.switchToTab()` to prevent conflicts and make the codebase more maintainable.

## Architecture

### Single Source of Truth
- **Main Function**: `FlickletApp.switchToTab(tab)` in `www/js/app.js`
- **Event Handling**: `FlickletApp.bindTabClicks()` in `www/js/app.js`
- **Content Loading**: `FlickletApp.updateTabContent(tab)` in `www/js/app.js`

### Removed Systems
- ❌ `SimpleTabManager` (deleted)
- ❌ `hardenTabSwitch` wrapper (removed)
- ❌ Individual tab click handlers in `inline-script-01.js` (removed)
- ❌ Duplicate `switchTab` methods (removed)

## How It Works

### 1. Tab Click Detection
```javascript
// Event delegation catches all clicks on elements with [data-tab] attribute
document.addEventListener('click', (event) => {
  const tabElement = event.target.closest('[data-tab]');
  if (tabElement) {
    const tab = tabElement.getAttribute('data-tab');
    FlickletApp.switchToTab(tab);
  }
});
```

### 2. Tab Switching Process
When `FlickletApp.switchToTab(tab)` is called:

1. **Validate Tab** - Check against supported tabs array
2. **Update State** - Set currentTab and previousTab
3. **Dispatch Events** - Fire 'tabSwitched' custom event
4. **Clear Search** - Clear search if switching away from home
5. **Update Tab Buttons** - Hide current tab, show others
6. **Update Sections** - Show only active section
7. **Manage Home Sections** - Show/hide home-specific content
8. **Update Search Bar** - Hide search bar on settings tab
9. **Load Content** - Call appropriate content loading function
10. **Update UI** - Refresh tab counts and other UI elements

### 3. Content Loading
```javascript
updateTabContent(tab) {
  switch(tab) {
    case 'home':
      this.loadHomeContent();
      break;
    case 'watching':
    case 'wishlist': 
    case 'watched':
      this.loadListContent(tab);
      break;
    case 'discover':
      this.loadDiscoverContent();
      break;
    case 'settings':
      this.loadSettingsContent();
      break;
  }
}
```

## Supported Tabs

| Tab ID | Section ID | Description |
|--------|------------|-------------|
| `home` | `homeSection` | Main dashboard with recommendations |
| `watching` | `watchingSection` | Currently watching shows/movies |
| `wishlist` | `wishlistSection` | Want to watch list |
| `watched` | `watchedSection` | Completed shows/movies |
| `discover` | `discoverSection` | Personalized recommendations |
| `settings` | `settingsSection` | App settings and configuration |

## HTML Requirements

### Tab Buttons
```html
<button id="homeTab" class="tab" data-tab="home">🏠 Home</button>
<button id="watchingTab" class="tab" data-tab="watching">▶️ Watching</button>
<!-- etc. -->
```

### Tab Sections
```html
<div id="homeSection" class="tab-section active">...</div>
<div id="watchingSection" class="tab-section">...</div>
<!-- etc. -->
```

## Adding a New Tab

### 1. Update Supported Tabs Array
```javascript
// In FlickletApp.switchToTab()
const supportedTabs = ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings', 'newTab'];
```

### 2. Add Section Mapping
```javascript
// In updateSectionVisibility()
const sectionMap = {
  home: 'homeSection',
  watching: 'watchingSection',
  // ... existing tabs
  newTab: 'newTabSection'
};
```

### 3. Add Content Loading Logic
```javascript
// In updateTabContent()
case 'newTab':
  this.loadNewTabContent();
  break;
```

### 4. Add HTML Elements
```html
<!-- Tab Button -->
<button id="newTabTab" class="tab" data-tab="newTab">🆕 New Tab</button>

<!-- Tab Section -->
<div id="newTabSection" class="tab-section">...</div>
```

## Event System

### Custom Events
- `tabSwitched` - Fired when tab changes
  - `detail.tab` - New tab name
  - `detail.previousTab` - Previous tab name

### Listening for Tab Changes
```javascript
document.addEventListener('tabSwitched', (event) => {
  console.log('Tab changed from', event.detail.previousTab, 'to', event.detail.tab);
});
```

## Search Integration

### Search State Management
- Search is automatically cleared when switching tabs (except when staying on home)
- Search results are hidden when switching tabs
- Search bar is hidden on settings tab

### Search State Property
```javascript
// Access search state
FlickletApp.isSearching // boolean
```

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus search input
- `Ctrl/Cmd + T` - Toggle theme
- `1-5` - Switch to tabs 1-5 (handled by inline-script-01.js)

## Backward Compatibility

### Legacy Support
- `window.switchToTab()` still works but delegates to `FlickletApp.switchToTab()`
- Shows deprecation warning in console
- Will be removed in future version

### Migration Guide
```javascript
// OLD (deprecated)
window.switchToTab('home');

// NEW (recommended)
FlickletApp.switchToTab('home');
```

## Debugging

### Console Logging
All tab operations are logged with `[TAB SYSTEM]` prefix:
```
🔄 [TAB SYSTEM] Switching to tab: home
✅ [TAB SYSTEM] Successfully switched to home tab
```

### Debug Methods
```javascript
// Check current tab
console.log('Current tab:', FlickletApp.currentTab);

// Check supported tabs
console.log('Supported tabs:', ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings']);
```

## File Structure

```
www/
├── js/
│   └── app.js                 # Main tab system (FlickletApp)
├── scripts/
│   ├── inline-script-01.js   # Updated to use FlickletApp
│   └── inline-script-02.js   # Content loading functions
└── TAB_SYSTEM_DOCUMENTATION.md # This file
```

## Future Developers

### DO NOT:
- ❌ Create additional tab switching systems
- ❌ Add individual tab click handlers elsewhere
- ❌ Modify tab visibility logic outside of FlickletApp
- ❌ Create duplicate switchToTab methods

### DO:
- ✅ Use `FlickletApp.switchToTab(tab)` for all tab switching
- ✅ Add new tabs by following the documented process
- ✅ Use `data-tab` attributes on tab elements
- ✅ Listen for `tabSwitched` events for tab change notifications
- ✅ Add new content loading logic to `updateTabContent()`

## Performance

### Optimizations
- Event delegation reduces memory usage
- Single event handler instead of multiple
- Centralized state management
- Efficient DOM updates

### Metrics
- **Before**: ~500 lines across 4+ files
- **After**: ~200 lines in single file
- **Reduction**: 60% less code, 100% centralized

## Testing

### Manual Testing
1. Click each tab button - should switch correctly
2. Use keyboard shortcuts - should work
3. Switch tabs during search - should clear search
4. Check console logs - should show `[TAB SYSTEM]` messages

### Automated Testing
```javascript
// Test tab switching
FlickletApp.switchToTab('home');
console.assert(FlickletApp.currentTab === 'home');

// Test event firing
let eventFired = false;
document.addEventListener('tabSwitched', () => { eventFired = true; });
FlickletApp.switchToTab('watching');
console.assert(eventFired === true);
```

## Troubleshooting

### Common Issues

1. **Tab not switching**
   - Check if element has `data-tab` attribute
   - Verify tab name is in supported tabs array
   - Check console for error messages

2. **Duplicate event handlers**
   - Ensure no individual tab click handlers exist
   - All clicks should go through `bindTabClicks()`

3. **Content not loading**
   - Check if content loading function exists
   - Verify `updateTabContent()` is called
   - Check for JavaScript errors

### Debug Steps
1. Open browser console
2. Look for `[TAB SYSTEM]` log messages
3. Check for error messages
4. Verify `FlickletApp.switchToTab` is available
5. Test with `FlickletApp.switchToTab('home')` directly

---

**Last Updated**: January 2025  
**Version**: 2.0 (Simplified)  
**Maintainer**: Future developers should follow this documentation
