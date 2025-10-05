# Tab System Architecture Documentation

## Overview

The Flicklet tab system has been completely refactored to eliminate conflicts and provide a single source of truth for tab management. This document describes the new architecture, implementation details, and migration from the legacy system.

## Architecture Principles

### 1. Single Source of Truth
- **Primary Engine**: `nav-init.js` is the only system that manages tab state
- **State Management**: Uses `[aria-selected]` for tabs and `[hidden]` for panels
- **Event System**: Single `tab:switched` event for all tab changes

### 2. Legacy System Quarantine
- **Shim Pattern**: All legacy `switchToTab` implementations are now shims
- **Feature Flag**: `window.__useLegacyTabs` controls system selection
- **Delegation**: Legacy systems delegate to `navEngine.activate`

### 3. Performance Optimization
- **DOM Caching**: Frequently accessed elements are cached
- **Batch Operations**: Card rendering uses DocumentFragment
- **Event Delegation**: Single delegated listener for efficiency

## Core Components

### Primary Tab Engine (`nav-init.js`)

```javascript
// Main activation function
function activate(id) {
  // 1. Idempotence check
  // 2. Hide all panels except target
  // 3. Update tab states
  // 4. Set body class
  // 5. Fire tab:switched event
  // 6. Load content via updateTabContent
}

// Global exposure
window.navEngine = { activate, slugMap };
```

**Key Features:**
- Idempotent activation (prevents duplicate operations)
- Performance monitoring with timing logs
- Comprehensive state validation
- Settings sub-tab isolation

### Legacy Shims

#### App.js Shim
```javascript
switchToTab(tab) {
  if (window.__useLegacyTabs) {
    return this._legacySwitchToTab(tab);
  }
  const targetId = `${tab}Section`;
  window.navEngine.activate(targetId);
}
```

#### Functions.js Shim
```javascript
window.switchToTab = function switchToTab(tab) {
  console.warn('[functions.js] DEPRECATED: window.switchToTab is deprecated');
  // Delegates to navEngine.activate
};
```

## State Management

### Tab State
- **Visual State**: `[aria-selected="true"]` on active tab
- **CSS Classes**: `is-active` class for styling
- **Body Classes**: `tab-{name}` for global styling

### Panel State
- **Visibility**: `[hidden]` attribute controls panel visibility
- **CSS Rule**: `[hidden] { display: none; }` ensures consistency
- **Single Visible**: Only one panel visible at a time

### Content Loading
- **Event Trigger**: `tab:switched` event fires after DOM updates
- **Content Function**: `updateTabContent(tabSlug)` loads appropriate content
- **State Tracking**: `FlickletApp.currentTab` updated for compatibility

## Event Flow

```
User Click → nav-init.js activate() → Panel Switch → Event Fire → Content Load → Cards Render
```

### Detailed Flow:
1. **User clicks tab** → Event delegation in nav-init.js
2. **activate(id) called** → Panel visibility updated
3. **tab:switched event** → Fired after DOM stabilization
4. **updateTabContent()** → Loads content for new tab
5. **loadListContent()** → Renders cards in tab
6. **Cards appear** → User sees content

## CSS Architecture

### Visibility Control
```css
/* Global rule - single source of truth */
[hidden] {
  display: none;
}

/* Tab styling */
.tab.is-active {
  /* Active tab styles */
}
```

### Removed Rules
- ❌ `.tab-section.active { display: block; }`
- ❌ `.tab-section { display: none; }`
- ❌ `.tab.active` (replaced with `.tab.is-active`)

## Settings Integration

### Sub-tab Isolation
```html
<div class="settings-tabs" data-scope="settings" role="tablist">
  <!-- Settings sub-tabs -->
</div>
```

```javascript
// nav-init.js ignores settings sub-tabs
if (ev.target.closest('[data-scope="settings"]')) {
  return; // Don't handle settings sub-tabs
}
```

## Search Integration

### Respects Tab System
```javascript
// search.js uses [hidden] instead of inline styles
homeSection.hidden = true; // Instead of style.display = 'none'
```

### No Interference
- Search system works with tab system
- No more inline style conflicts
- Proper cleanup when search ends

## Performance Features

### DOM Optimization
- **Element Caching**: Frequently accessed elements cached
- **Batch Operations**: DocumentFragment for card rendering
- **Single Listeners**: One delegated listener per event type

### Performance Monitoring
```javascript
// Tab activation timing
const startTime = performance.now();
// ... activation logic ...
const endTime = performance.now();
console.log(`Tab activation completed in ${(endTime - startTime).toFixed(2)}ms`);

// Card rendering timing
const startTime = performance.now();
// ... rendering logic ...
const endTime = performance.now();
console.log(`Rendered ${items.length} cards in ${(endTime - startTime).toFixed(2)}ms`);
```

## Migration Guide

### From Legacy System
1. **Remove direct tab manipulation** - Use `navEngine.activate(id)`
2. **Update CSS selectors** - Use `.tab.is-active` instead of `.tab.active`
3. **Respect [hidden] attribute** - Don't use inline styles for visibility
4. **Listen for tab:switched** - Instead of custom tab events

### Feature Flag Usage
```javascript
// Enable legacy system (for rollback)
window.__useLegacyTabs = true;

// Use new system (default)
window.__useLegacyTabs = false;
```

## Testing

### Validation Points
1. **Single Panel Visible**: Only one panel visible at a time
2. **Tab State Consistency**: Tab state matches panel visibility
3. **Content Loading**: Cards appear when switching tabs
4. **Event Firing**: `tab:switched` events fire correctly
5. **Performance**: Tab switching completes quickly

### Debug Tools
```javascript
// Check tab state
document.querySelector('[role="tab"][aria-selected="true"]')

// Check panel visibility
document.querySelector('.tab-section:not([hidden])')

// Check performance
window.tabSystemTestResults // From test suite
```

## Troubleshooting

### Common Issues
1. **Multiple panels visible** → Check CSS conflicts with `[hidden]`
2. **Cards not loading** → Verify `updateTabContent` is called
3. **Tab state mismatch** → Check `aria-selected` vs panel visibility
4. **Performance issues** → Check for duplicate event listeners

### Debug Commands
```javascript
// Force tab activation
window.navEngine.activate('watchingSection');

// Check current state
console.log({
  activeTab: document.querySelector('[role="tab"][aria-selected="true"]')?.id,
  visiblePanel: document.querySelector('.tab-section:not([hidden])')?.id,
  currentTab: window.FlickletApp?.currentTab
});
```

## Future Considerations

### Potential Improvements
1. **Virtual Scrolling**: For large lists
2. **Lazy Loading**: Load content on demand
3. **Animation**: Smooth transitions between tabs
4. **Keyboard Navigation**: Enhanced accessibility

### Maintenance
- Monitor performance metrics
- Update documentation as system evolves
- Remove legacy shims when no longer needed
- Keep feature flag for emergency rollback

---

*This document serves as the definitive guide for the new tab system architecture. Keep it updated as the system evolves.*
