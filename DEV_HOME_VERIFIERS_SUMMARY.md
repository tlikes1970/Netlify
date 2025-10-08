# Dev: Home verifiers + docs

## Summary
Added development-only Home verification utilities with comprehensive documentation. These tools help verify Home page layout, frame structure, and rail normalization without affecting production code paths.

## What Was Added

### 1. Core Verification Module (`dev/verify-home.js`)

**Exported utilities:**
- `verifyHomeFrames()` - Check frame structure and gutters
- `verifyRailNormalization()` - Check rail grid layout and properties  
- `forceHomeVisible(enable)` - Toggle diagnostic visibility for hidden sections
- `HOME_CARD_MATCHERS` - Selector constants for card detection

**Key features:**
- ✅ **Dev-only gating**: `if (window.__DEV__ || location.hostname === 'localhost')`
- ✅ **No production impact**: No-op exports in production builds
- ✅ **Console accessible**: Exposed via `window.__DEV_TOOLS.*`
- ✅ **No DOM changes**: Read-only verification, no structure modifications
- ✅ **No !important**: Only diagnostic visibility uses !important
- ✅ **Reusable logic**: Same selectors and logic as working console blocks

### 2. Comprehensive Documentation (`dev/README.md`)

**Includes:**
- Quick start guide with copy-paste console snippets
- Expected PASS output examples for all utilities
- Troubleshooting section with common issues and solutions
- Integration examples for build processes
- Complete API reference with usage examples

**Console snippets:**
```javascript
// Load and run verification
window.__DEV_TOOLS.verifyHomeFrames();
window.__DEV_TOOLS.verifyRailNormalization();
window.__DEV_TOOLS.forceHomeVisible(true);
```

### 3. HTML Integration

**Added to `index.html`:**
```html
<!-- Dev Home Verification Utilities (dev only) -->
<script type="module">
  if (window.__DEV__ || location.hostname === 'localhost') {
    import('/dev/verify-home.js');
  }
</script>
```

**Features:**
- ✅ **Conditional loading**: Only loads in dev environments
- ✅ **Module import**: Uses ES6 modules for clean separation
- ✅ **No runtime imports in prod**: Gated behind dev flags

### 4. Test Utilities (`dev/test-utilities.js`)

**Test script for validation:**
- Verifies all utilities are available
- Tests `HOME_CARD_MATCHERS` structure
- Validates `forceHomeVisible()` functionality
- Runs verification functions if Home section exists
- Provides cleanup and usage instructions

## How to Run

### In Development
```javascript
// Utilities are automatically loaded in dev
window.__DEV_TOOLS.verifyHomeFrames();
window.__DEV_TOOLS.verifyRailNormalization();
window.__DEV_TOOLS.forceHomeVisible(true);
```

### Manual Testing
```javascript
// Load test script
import('/dev/test-utilities.js').then(() => {
  console.log('Test completed');
});
```

## Expected PASS Output

### verifyHomeFrames()
```
🔍 Verifying Home frame structure...

📊 Home Frame Verification Results:
Groups: 5/5 passed
Panels: 15/15 passed  
Rails: 8/8 passed

✅ All Home frames verified successfully!
✅ Home frames: PASS
```

### verifyRailNormalization()
```
🔍 Verifying Home rail normalization...

📊 Rail Normalization Results:
Groups with rails: 5/5
Rails checked: 8
Rails passed: 8/8
Cards with snap: 24/24

✅ All rails normalized successfully!
✅ Rail normalization: PASS
```

### forceHomeVisible(true)
```
🔧 Diagnostic visibility enabled for #homeSection
```

## Runtime Impact

### Development
- ✅ **Utilities available**: `window.__DEV_TOOLS.*` populated
- ✅ **Console logging**: Detailed verification output
- ✅ **Diagnostic tools**: `forceHomeVisible()` for hidden sections
- ✅ **No performance impact**: Only loads when needed

### Production
- ✅ **No runtime imports**: Gated behind dev flags
- ✅ **No-op exports**: Functions return safe defaults
- ✅ **No bundle inclusion**: Not included in production builds
- ✅ **Zero overhead**: No production code paths affected

## Files Added

- `www/dev/verify-home.js` - Main verification utilities
- `www/dev/README.md` - Comprehensive documentation
- `www/dev/test-utilities.js` - Test script for validation
- `www/index.html` - Updated with dev-only script loading

## Files Modified

- `www/index.html` - Added dev utilities script loading

## Verification

### All utilities exist on window.__DEV_TOOLS
```javascript
// In dev console
console.log(window.__DEV_TOOLS.verifyHomeFrames);        // function
console.log(window.__DEV_TOOLS.verifyRailNormalization); // function  
console.log(window.__DEV_TOOLS.forceHomeVisible);        // function
console.log(window.__DEV_TOOLS.HOME_CARD_MATCHERS);      // object
```

### forceHomeVisible() works correctly
```javascript
// Test visibility toggle
window.__DEV_TOOLS.forceHomeVisible(true);  // Adds <style id="force-home-visible">
window.__DEV_TOOLS.forceHomeVisible(false); // Removes style element
```

### No runtime imports in production
- Dev flag gating prevents production exposure
- No-op exports ensure safe fallbacks
- Module loading only occurs in dev environments

## Benefits

1. **Developer Experience**: Easy-to-use console utilities for layout verification
2. **Early Detection**: Catch layout issues before they reach production
3. **Documentation**: Comprehensive guide with examples and troubleshooting
4. **Safe**: No production impact, dev-only exposure
5. **Maintainable**: Reusable logic from working console blocks
6. **Testable**: Built-in test utilities for validation

## Usage Examples

### Quick verification
```javascript
// Run all checks
window.__DEV_TOOLS.verifyHomeFrames() && 
window.__DEV_TOOLS.verifyRailNormalization();
```

### Debug hidden sections
```javascript
// Make hidden section visible and verify
window.__DEV_TOOLS.forceHomeVisible(true);
window.__DEV_TOOLS.verifyHomeFrames();
window.__DEV_TOOLS.forceHomeVisible(false);
```

### Check specific selectors
```javascript
// Use matchers for custom checks
const matchers = window.__DEV_TOOLS.HOME_CARD_MATCHERS;
const cards = document.querySelectorAll(matchers.cards);
console.log(`Found ${cards.length} cards`);
```


