# TV Tracker - Single Source of Truth Architecture

## 🎯 PRIMARY SYSTEMS (Use These Only)

### Tab Management
- **PRIMARY**: `FlickletApp.switchToTab(tab)` in `www/js/app.js`
- **DEPRECATED**: `SimpleTabManager`, old `window.switchToTab()`, DOM detection
- **Current Tab**: `window.FlickletApp.currentTab`

### Data Management
- **PRIMARY**: `window.appData` object
- **BACKUP**: `localStorage` for persistence
- **CLOUD**: Firebase Firestore (when available)

### Authentication
- **PRIMARY**: `window.FlickletApp.currentUser`
- **State**: `window.FlickletApp.authInitialized`

### UI Updates
- **PRIMARY**: `FlickletApp.updateUI()`
- **Tab Content**: `FlickletApp.updateTabContent(tab)`

## 🚫 DEPRECATED SYSTEMS (Don't Use)

### Tab Management
- ❌ `SimpleTabManager.switchToTab()` - DISABLED (conflicted with FlickletApp)
- ❌ `window.switchToTab()` - DEPRECATED (delegates to FlickletApp)
- ❌ DOM detection with `querySelector` - UNRELIABLE

### Data Management
- ❌ Multiple localStorage keys - Use `window.appData` instead
- ❌ Direct DOM manipulation for data - Use `FlickletApp.updateUI()`

## 🔄 Initialization Order

1. **bootstrap.js** → `FlickletApp.init()`
2. **FlickletApp.init()** → `this.switchToTab('home')`
3. **Everything else** follows this order

## 🛠️ Debug Commands

```javascript
// Check current state
console.log('Current tab:', window.FlickletApp?.currentTab);
console.log('Current user:', window.FlickletApp?.currentUser);
console.log('App data:', window.appData);

// Check active systems
console.log('Active systems:', {
  FlickletApp: !!window.FlickletApp,
  SimpleTabManager: !!window.SimpleTabManager,
  oldSwitchToTab: typeof window.switchToTab
});

// Force switch to home
window.FlickletApp?.switchToTab('home');
```

## 📋 Rules for Future Changes

### ✅ DO
- Use `FlickletApp.switchToTab(tab)` for all tab switching
- Use `window.appData` for all data operations
- Use `FlickletApp.updateUI()` for UI updates
- Test changes immediately
- Update this document when making changes

### ❌ DON'T
- Use DOM detection for tab state
- Create new tab management systems
- Use deprecated functions
- Add more code to fix symptoms - fix root causes

## 🔧 Recent Fixes

### Tab Switching Issue (Fixed)
- **Problem**: App started on watching tab instead of home
- **Root Cause**: Two issues:
  1. DOM detection code in `inline-script-02.js` was unreliable
  2. `refactor-validation.js` was auto-switching to watching tab during tests
- **Fix**: 
  1. Changed to use `window.FlickletApp?.currentTab` instead of DOM detection
  2. Made validation tests return to home tab after testing
- **Cleanup**: Disabled `SimpleTabManager` override that was conflicting

### Files Modified
- `www/scripts/inline-script-02.js` - Fixed DOM detection
- `www/scripts/simple-tab-manager.js` - Disabled conflicting override
- `www/scripts/refactor-validation.js` - Fixed auto-switching during tests

## 🎯 Next Cleanup Tasks

1. Remove commented-out code from `inline-script-03.js`
2. Consolidate duplicate event listeners
3. Remove unused utility functions
4. Simplify initialization sequence

---
**Last Updated**: $(date)
**Status**: ✅ Tab switching fixed, architecture documented
