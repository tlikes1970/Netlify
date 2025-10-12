# Flicklet Home Rails Audit Report

## Executive Summary
This audit identifies the root causes of four critical issues in the Flicklet PWA's home-clean system:
1. **Rails not scrolling unless forced** - CSS overflow conflicts
2. **Poster/cards inflating** - Missing aspect-ratio constraints  
3. **Community/player not gated** - Missing gating logic
4. **Viewport reporting ~4500px wide** - CSS variable conflicts

## Root Cause Analysis

### 1. Rails Not Scrolling (Issue A)

**Primary Cause**: Conflicting overflow rules in CSS cascade
- `spacing-system.css:69` sets `--app-root-overflow-x: hidden` globally
- `main.css:477` applies `overflow-x: var(--app-root-overflow-x)` to body
- `home-clean.css:4` sets `overflow-x:auto` on rails but gets overridden

**Secondary Causes**:
- `components.css:5044` has `overflow-x: hidden` on parent containers
- `main.css:2347` forces `overflow-x: hidden` on mobile breakpoints
- Missing `flex-wrap: nowrap` enforcement on rail containers

**Affected Selectors**:
```css
body { overflow-x: hidden; } /* spacing-system.css:69 → main.css:477 */
.rail { overflow-x: auto; } /* home-clean.css:4 - gets overridden */
```

### 2. Poster/Cards Inflating (Issue B)

**Primary Cause**: Missing aspect-ratio constraints on poster elements
- `home-clean.css:13` defines `.poster-wrap` with `aspect-ratio:2/3` but cards don't use `.poster-wrap`
- Cards use `.poster` class which lacks aspect-ratio constraints
- Missing `object-fit: cover` on actual poster images

**Secondary Causes**:
- `home-clean.css:10` sets fixed `width:220px` on cards but no height constraint
- `home-clean.css:195-198` defines `.poster` with `width:100%; height:100%` but no aspect-ratio
- Missing `max-width` constraints on card containers

**Affected Selectors**:
```css
#clean-root .rail > .card { width:220px; } /* home-clean.css:10 - no height */
.home-clean-container .poster { width:100%; height:100%; } /* home-clean.css:195 - no aspect-ratio */
```

### 3. Community/Player Not Gated (Issue C)

**Primary Cause**: Missing gating logic in HomeClean component
- `HomeClean.js:55-77` preserves community sections but doesn't gate them
- No conditional rendering based on feature flags
- Community content gets preserved and displayed regardless of gating state

**Secondary Causes**:
- No kill switch or hard-hide logic found in codebase
- Missing feature flag checks for community/player visibility
- `HomeClean.js:104-106` creates community container without gating

**Affected Code**:
```javascript
// HomeClean.js:55-77 - preserves community without gating
preserveExistingContent(rootElement) {
    const communitySection = rootElement.querySelector('#group-2-community');
    // ... preserves and re-adds community content
}
```

### 4. Viewport Width ~4500px (Issue D)

**Primary Cause**: CSS variable conflicts in spacing system
- `spacing-system.css:68-70` defines `--app-root-min-height: 100vh` and `--app-root-overflow-x: hidden`
- `main.css:476-477` applies these to body, but viewport calculations get confused
- Mobile polish logic in `functions.js:343` uses `window.innerWidth` but CSS variables interfere

**Secondary Causes**:
- `home-clean.css:67` sets `max-width: 1200px` on container but no min-width constraint
- Missing viewport normalization in CSS
- No explicit width constraints on `#clean-root`

**Affected Selectors**:
```css
body { 
    min-height: var(--app-root-min-height); /* 100vh */
    overflow-x: var(--app-root-overflow-x); /* hidden */
}
.home-clean-container { max-width: 1200px; } /* home-clean.css:67 */
```

## Why Viewport Reports ~4500px

The viewport width calculation issue stems from:

1. **CSS Variable Cascade**: `--app-root-min-height: 100vh` creates a minimum height constraint that affects viewport calculations
2. **Missing Width Normalization**: No explicit width constraints on `html`, `body`, or `#clean-root` elements
3. **Mobile Polish Logic**: `functions.js:343` calculates `viewportWidth = window.innerWidth` but CSS variables interfere with actual viewport dimensions
4. **Container Queries**: `components.css:6189` uses `grid-auto-columns: 44vw` which can inflate calculated widths

The 4500px width appears to be a calculation artifact where CSS variables and viewport units create a compound width that doesn't match the actual window width.

## Affected Selectors with Specificity Chain

### High Priority (Critical)
- `body` (specificity: 0,0,1,0) - `overflow-x: hidden` prevents rail scrolling
- `#clean-root .rail` (specificity: 0,1,1,0) - `overflow-x: auto` gets overridden
- `.home-clean-container .poster` (specificity: 0,0,2,0) - missing aspect-ratio

### Medium Priority (Important)  
- `#clean-root .rail > .card` (specificity: 0,1,2,0) - fixed width, no height constraint
- `.home-clean-container` (specificity: 0,0,1,0) - max-width only, no min-width

### Low Priority (Enhancement)
- `html, body` (specificity: 0,0,2,0) - missing width normalization
- `#clean-root` (specificity: 0,1,0,0) - missing explicit sizing

## Minimal Fix Plan

### 1. CSS Normalization (spacing-system.css)
```css
/* Root sizing sanity */
html, body, #clean-root {
    transform: none !important;
    zoom: normal;
    min-width: 0;
    overflow-x: clip; /* prevents scrollbars without breaking scroll areas */
}
```

### 2. Rails Baseline (home-clean.css)
```css
#clean-root .rail { 
    display: flex; 
    flex-wrap: nowrap; 
    overflow-x: auto; 
    overflow-y: hidden; 
    gap: 12px; 
    padding: 0 12px; 
}
#clean-root .rail .card { 
    flex: 0 0 var(--card-w, 154px); 
    max-width: var(--card-w, 154px); 
}
```

### 3. Poster Sizing (home-clean.css)
```css
#clean-root .rail .card .poster, 
#clean-root .rail .card .thumb,
#clean-root .rail .card img,
#clean-root .rail .card video { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
}
#clean-root .rail .card .poster, 
#clean-root .rail .card .thumb { 
    aspect-ratio: 2/3; 
}
```

### 4. Community Gating (HomeClean.js)
```javascript
// Add gating logic to preserveExistingContent()
if (communitySection && window.FLAGS?.communityEnabled !== false) {
    // preserve community
} else {
    // hide community
}
```

### 5. Viewport Guard (functions.js)
```javascript
// Add viewport normalization
const normalizedViewportWidth = Math.min(window.innerWidth, window.outerWidth);
```

## Implementation Priority

1. **Critical**: Fix rail scrolling (CSS overflow conflicts)
2. **High**: Fix poster aspect-ratio (missing constraints)  
3. **Medium**: Add community gating (missing logic)
4. **Low**: Normalize viewport width (CSS variable conflicts)

## Validation Criteria

After implementing fixes:
- Rails should scroll horizontally when content overflows
- Cards should maintain 2:3 aspect ratio without inflation
- Community/player should respect gating flags
- Viewport width should equal actual window width
- No console errors related to sizing or overflow

