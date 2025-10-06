# Home Verification Utilities - Dev Tools

This directory contains development-only utilities for verifying Home page layout, frame structure, and rail normalization. These tools help ensure consistent behavior across different Home sections and catch layout issues early.

## Quick Start

### 1. Load the utilities
```javascript
// In browser console (dev environment only)
import('/dev/verify-home.js').then(module => {
  console.log('Home verification utilities loaded');
});
```

### 2. Run verification
```javascript
// Check Home frame structure and gutters
window.__DEV_TOOLS.verifyHomeFrames();

// Check rail normalization (deepest rails only)
window.__DEV_TOOLS.verifyRailNormalization();

// Force hidden Home section visible for testing
window.__DEV_TOOLS.forceHomeVisible(true);
```

## Available Utilities

### `verifyHomeFrames()`

Verifies the complete Home frame structure and gutter behavior.

**Checks:**
- Groups have `width: 100%`, `padding: 0`
- Panels have `padding: 32px` (single gutter)
- Rails have `padding: 0`, proper grid layout
- No double gutters or conflicting rules

**Expected Output:**
```
🔍 Verifying Home frame structure...

📊 Home Frame Verification Results:
┌─────────────────────┬───────────┬───────────┬─────────────────────┐
│ groupId             │ groupOK   │ gutterOK  │ panel               │
├─────────────────────┼───────────┼───────────┼─────────────────────┤
│ group-1-your-shows  │ PASS      │ PASS      │ div.home-preview-row│
│ group-2-community   │ PASS      │ PASS      │ div.section-content │
│ group-3-for-you     │ PASS      │ PASS      │ div.home-preview-row│
│ group-4-theaters    │ PASS      │ PASS      │ div.home-preview-row│
│ group-5-feedback    │ PASS      │ PASS      │ div.home-preview-row│
└─────────────────────┴───────────┴───────────┴─────────────────────┘

✅ All Home frames verified successfully!
✅ Home frames: PASS
```

**Common Issues:**
- `❌ Group group-1-your-shows: paddingLeft=32px` - Double gutter detected
- `❌ Panel group-2-community: paddingLeft=0px` - Missing panel gutter
- `❌ group-1-your-shows deep rail[0]: display=block` - Not using grid layout

### `verifyRailNormalization()`

Verifies rail normalization for deepest rails only.

**Checks:**
- Rails use `display: grid` with `grid-auto-flow: column`
- Zero rail padding (`padding: 0`)
- Proper overflow behavior (`overflow-x: auto`, `overflow-y: hidden`)
- Cards have `scroll-snap-align: start`
- No conflicting rules in home.css

**Expected Output:**
```
🔍 Verifying Home rail normalization...

📊 Rail Normalization Results:
┌─────────────────────┬───────────┬─────────────┬─────────────┬─────────────┐
│ groupId             │ deepRails │ deepRailsOK │ cardsWithSnap│ totalCards  │
├─────────────────────┼───────────┼─────────────┼─────────────┼─────────────┤
│ group-1-your-shows  │ 2         │ PASS        │ 8           │ 8           │
│ group-2-community   │ 1         │ PASS        │ 4           │ 4           │
│ group-3-for-you     │ 1         │ PASS        │ 6           │ 6           │
│ group-4-theaters    │ 1         │ PASS        │ 5           │ 5           │
│ group-5-feedback    │ 0         │ N/A         │ 0           │ 0           │
└─────────────────────┴───────────┴─────────────┴─────────────┴─────────────┘

🔍 Deep Rail Details:
Deep rails checked: 5
Deep rails passed: 5/5
Cards with snap: 23/23

✅ All rails normalized successfully!
✅ Rail normalization: PASS
```

**Common Issues:**
- `❌ group-1-your-shows deep rail[0]: display=block` - Not using grid
- `❌ group-2-community deep rail[0]: paddingLeft=16px` - Non-zero rail padding
- `❌ group-3-for-you deep rail[0]: overflowX=visible` - Missing horizontal scroll

### `forceHomeVisible(enable)`

Toggles diagnostic visibility for hidden Home sections.

**Usage:**
```javascript
// Make hidden #homeSection visible for testing
window.__DEV_TOOLS.forceHomeVisible(true);

// Run verification on now-visible section
window.__DEV_TOOLS.verifyHomeFrames();

// Restore normal visibility
window.__DEV_TOOLS.forceHomeVisible(false);
```

**What it does:**
- Adds `<style id="force-home-visible">` with diagnostic CSS
- Forces `#homeSection` to be measurable
- Overrides common hiding techniques (display, visibility, opacity, etc.)
- Safe to use - only affects diagnostic visibility

### `HOME_CARD_MATCHERS`

Selector constants used by verification utilities.

```javascript
// Access the matchers
const matchers = window.__DEV_TOOLS.HOME_CARD_MATCHERS;

// Available selectors
console.log(matchers.cards);        // '#homeSection .card'
console.log(matchers.rails);        // ['.preview-row-container', ...]
console.log(matchers.groups);       // ['group-1-your-shows', ...]
console.log(matchers.panels);       // ['.home-preview-row', ...]
```

## Troubleshooting

### "Dev utilities not available in production"
This is expected behavior. The utilities are gated behind a dev flag:
```javascript
if (window.__DEV__ || location.hostname === 'localhost') {
  // Expose utilities
}
```

### "Group group-X not found"
The Home section might not be mounted yet. Try:
```javascript
// Force visibility first
window.__DEV_TOOLS.forceHomeVisible(true);

// Wait for DOM updates
setTimeout(() => {
  window.__DEV_TOOLS.verifyHomeFrames();
}, 100);
```

### "Rails not using grid layout"
Check if home-layout.css is loading after main.css:
```javascript
// Check import order
Array.from(document.styleSheets)
  .filter(sheet => sheet.href && (sheet.href.includes('main.css') || sheet.href.includes('home-layout.css')))
  .forEach(sheet => console.log(sheet.href));
```

### "Conflicting rules in home.css"
Remove layout rules from home.css - they should be in home-layout.css:
```javascript
// Find conflicting rules
Array.from(document.styleSheets)
  .filter(sheet => sheet.href && sheet.href.includes('home.css'))
  .flatMap(sheet => {
    try {
      return Array.from(sheet.cssRules);
    } catch (e) {
      return [];
    }
  })
  .filter(rule => rule.selectorText && rule.selectorText.includes('preview-row'))
  .forEach(rule => console.log(rule.selectorText, rule.cssText));
```

## Integration

### In your build process
```javascript
// webpack.config.js or similar
if (process.env.NODE_ENV === 'development') {
  // Include dev utilities
  entry: {
    main: './src/main.js',
    dev: './dev/verify-home.js'
  }
}
```

### In your HTML
```html
<!-- Development only -->
<script type="module">
  if (window.__DEV__ || location.hostname === 'localhost') {
    import('/dev/verify-home.js');
  }
</script>
```

### In your console
```javascript
// Quick verification
window.__DEV_TOOLS.verifyHomeFrames() && window.__DEV_TOOLS.verifyRailNormalization();

// Debug specific group
const group = document.getElementById('group-1-your-shows');
const rails = group.querySelectorAll('.preview-row-scroll');
rails.forEach(rail => console.log(rail, getComputedStyle(rail).display));
```

## Expected PASS Output

### Complete verification
```javascript
// Run both verifications
const frames = window.__DEV_TOOLS.verifyHomeFrames();
const rails = window.__DEV_TOOLS.verifyRailNormalization();

// Both should return overallPass: true
console.log('Frames:', frames.overallPass); // true
console.log('Rails:', rails.overallPass);   // true
```

### Individual checks
```javascript
// Frame structure - shows 5 lines (one per section)
window.__DEV_TOOLS.verifyHomeFrames();
// Expected: Per-section table with groupOK: PASS, gutterOK: PASS

// Rail normalization - shows deep rails only
window.__DEV_TOOLS.verifyRailNormalization();
// Expected: Per-section table with deepRailsOK: PASS, Deep Rail Details table

// Visibility toggle
window.__DEV_TOOLS.forceHomeVisible(true);
// Expected: "Diagnostic visibility enabled for #homeSection"
```

## Notes

- **No DOM changes**: Utilities only read and verify, never modify DOM structure
- **No !important**: Verification doesn't use !important, only diagnostic visibility does
- **Dev only**: Gated behind dev flags, not available in production
- **Reusable**: Same selectors and logic as working console blocks
- **Safe**: Can be run multiple times without side effects

## Files

- `verify-home.js` - Main verification utilities
- `README.md` - This documentation
- `../styles/home-layout.css` - Layout system being verified
- `../styles/main.css` - Base styles (should not contain Home layout rules)
