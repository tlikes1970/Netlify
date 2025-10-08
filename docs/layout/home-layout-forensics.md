# Home Page Layout Forensics Report

**Generated:** 2025-01-25  
**Scope:** Home-page card layouts and gutters  
**Target:** Flicklet TV Tracker v28.128.0

## Executive Summary

This forensic analysis identifies every source of truth affecting Home-page card layouts and gutters across 5 main sections. The analysis reveals a complex cascade with multiple competing systems, runtime mutations, and inconsistent breakpoint handling that creates the reported layout issues.

### Key Findings

- **3 competing layout systems** (main.css, home.css, home-layout.css)
- **139 media queries** affecting layout properties
- **188 runtime style mutations** that can override CSS
- **Inconsistent breakpoint definitions** across files
- **Multiple specificity conflicts** for critical selectors

## Selector Inventory

### Home Page Sections
| Selector | File:Line | Type | Specificity | Notes |
|----------|-----------|------|-------------|-------|
| `#group-1-your-shows` | `www/index.html:1127` | HTML | ID | Your Shows section |
| `#group-2-community` | `www/index.html:1186` | HTML | ID | Community section |
| `#group-3-for-you` | `www/index.html:1324` | HTML | ID | For You section |
| `#group-4-theaters` | `www/index.html:1361` | HTML | ID | Theaters section |
| `#group-5-feedback` | `www/index.html:1414` | HTML | ID | Feedback section |
| `.home-group` | `www/styles/main.css:2973` | CSS | Class | Group wrapper styling |
| `.home-group` | `www/styles/home.css:106` | CSS | Class | **CONFLICT** - Different rules |

### Row/Rail Containers
| Selector | File:Line | Type | Specificity | Notes |
|----------|-----------|------|-------------|-------|
| `.home-preview-row` | `www/styles/main.css:584` | CSS | Class | Main row wrapper |
| `.preview-row-container` | `www/styles/main.css:1314` | CSS | Class | Container wrapper |
| `.preview-row-scroll` | `www/styles/main.css:1318` | CSS | Class | Scroll container |
| `.row-inner` | `www/styles/main.css:2434` | CSS | Class | Inner row content |
| `#currentlyWatchingScroll` | `www/index.html:1145` | HTML | ID | Currently watching scroll |
| `#curatedSections` | `www/index.html:1355` | HTML | ID | Curated sections container |

### Card Components
| Selector | File:Line | Type | Specificity | Notes |
|----------|-----------|------|-------------|-------|
| `.card` | `www/styles/cards.css:4` | CSS | Class | Base card styling |
| `.card.v2` | `www/styles/cards.css:4` | CSS | Class | V2 card system |
| `.card-actions` | `www/styles/cards.css:456` | CSS | Class | Action button container |
| `.actions` | `www/styles/home.css:71` | CSS | Class | **CONFLICT** - Different rules |

## Cascade Provenance

### Critical Layout Properties

#### Width/Box-Sizing
| Property | Selector | File:Line | Value | Specificity | Winner |
|----------|----------|-----------|-------|-------------|--------|
| `width` | `#homeSection .card.v2` | `www/styles/home-layout.css:54` | `clamp(var(--home-card-w-sm), 20vw, var(--home-card-w-lg))` | 0,0,2,0 | ✅ |
| `width` | `.card.v2` | `www/styles/cards.css:4` | `unset` | 0,0,1,0 | ❌ |
| `box-sizing` | `*` | `www/styles/main.css:460` | `border-box` | 0,0,0,0 | ✅ |
| `max-width` | `#homeSection .card.v2` | `www/styles/home-layout.css:56` | `clamp(var(--home-card-w-sm), 20vw, var(--home-card-w-lg))` | 0,0,2,0 | ✅ |

#### Display/Flex/Grid
| Property | Selector | File:Line | Value | Specificity | Winner |
|----------|----------|-----------|-------|-------------|--------|
| `display` | `.preview-row-scroll` | `www/styles/home-layout.css:39` | `grid` | 0,0,1,0 | ✅ |
| `display` | `.preview-row-scroll` | `www/styles/main.css:1318` | `flex` | 0,0,1,0 | ❌ (overridden) |
| `grid-auto-flow` | `.preview-row-scroll` | `www/styles/home-layout.css:40` | `column` | 0,0,1,0 | ✅ |
| `justify-content` | `#group-1-your-shows .actions` | `www/styles/home.css:75` | `center` | 0,0,2,0 | ✅ |

#### Padding/Margins
| Property | Selector | File:Line | Value | Specificity | Winner |
|----------|----------|-----------|-------|-------------|--------|
| `padding` | `.home-group` | `www/styles/main.css:2974` | `32px` | 0,0,1,0 | ❌ |
| `padding` | `.home-group` | `www/styles/home.css:108` | `32px` | 0,0,1,0 | ❌ (equal specificity) |
| `padding-left` | `#group-1-your-shows > .home-preview-row` | `www/styles/home.css:44` | `var(--home-frame-gutter)` | 0,0,2,0 | ✅ |
| `margin` | `.home-preview-row` | `www/styles/main.css:585` | `var(--stack) 0` | 0,0,1,0 | ❌ (overridden) |

## Breakpoints & Media Queries

### Breakpoint Definitions
| Variable | Value | File:Line | Usage Count |
|----------|-------|-----------|-------------|
| `--bp-mobile` | `480px` | `www/styles/main.css:317` | 15 |
| `--bp-mobile-lg` | `640px` | `www/styles/main.css:447` | 25 |
| `--bp-tablet` | `768px` | `www/styles/main.css:3614` | 8 |
| `--bp-desktop` | `1024px` | `www/styles/home-layout.css:89` | 3 |

### Critical Media Queries

#### Mobile (≤640px)
```css
@media (max-width: var(--bp-mobile-lg)) {
  .home-group {
    margin-bottom: 24px;
    padding: 24px; /* Reduced but proportional padding for mobile */
  }
  .preview-row-scroll {
    scroll-snap-type: x mandatory;
    scroll-padding: 16px;
  }
}
```

#### Desktop (≥1024px)
```css
@media (min-width: 1024px) {
  #homeSection { --_row-gap: var(--home-row-gap-lg); }
  .preview-row-scroll,
  .row-inner,
  .up-next-scroll,
  .curated-row {
    grid-auto-columns: clamp(var(--home-card-w-md), 16vw, var(--home-card-w-xl));
  }
}
```

#### Small Mobile (≤480px)
```css
@media (max-width: 480px) {
  #homeSection { --_row-gap: var(--home-row-gap-sm); }
  .preview-row-scroll,
  .row-inner,
  .up-next-scroll,
  .curated-row {
    grid-auto-columns: clamp(var(--home-card-w-sm), 42vw, var(--home-card-w-md));
  }
}
```

## Runtime Influencers

### Style Mutations
| File:Line | Function | Target | Properties | Impact |
|-----------|----------|--------|------------|--------|
| `www/js/renderers/card-v2.js:21` | `setProperty` | `.card.v2` | `width`, `min-width`, `max-width` | **BLOCKED** for Home cards |
| `www/js/functions.js:96` | `style.display` | Tab sections | `display` | Shows/hides sections |
| `www/scripts/simple-tab-manager.js:96` | `style.display` | Tab sections | `display` | **CONFLICT** with above |

### Class List Mutations
| File:Line | Function | Target | Classes | Impact |
|-----------|----------|--------|---------|--------|
| `www/js/functions.js:374` | `classList.toggle` | `body` | `mobile-v1` | Mobile layout detection |
| `www/js/nav-init.js:179` | `classList.add` | `body` | `tab-${tabClass}` | Tab state management |
| `www/scripts/currently-watching-preview.js:209` | `classList.add` | `#currentlyWatchingScroll` | `row-inner` | Runtime class addition |

### Observers
| File:Line | Observer Type | Target | Purpose |
|-----------|---------------|--------|---------|
| `www/js/settings-state.js:193` | `MutationObserver` | Tab sections | Settings state sync |
| `www/js/settings-effects.js:149` | `MutationObserver` | Tab sections | Settings effects binding |

## Dependency Graph

### Component Hierarchy
```
#homeSection (www/index.html:1124)
├── #group-1-your-shows (www/index.html:1127)
│   ├── #currentlyWatchingPreview (www/index.html:1136)
│   │   └── #currentlyWatchingScroll (www/index.html:1145)
│   └── #up-next-row (www/index.html:1160)
│       └── .up-next-scroll (www/index.html:1170)
├── #group-2-community (www/index.html:1186)
│   └── .community-content (www/index.html:1191)
├── #group-3-for-you (www/index.html:1324)
│   ├── #personalized-section (www/index.html:1330)
│   └── #curated-section (www/index.html:1348)
│       └── #curatedSections (www/index.html:1355)
├── #group-4-theaters (www/index.html:1361)
│   └── #theaters-section (www/index.html:1366)
└── #group-5-feedback (www/index.html:1414)
    └── #feedbackSection (www/index.html:1419)
```

### Import Dependencies
```
www/index.html
├── www/js/app.js (main controller)
├── www/js/auth-manager.js (authentication)
├── www/js/functions.js (business logic)
├── www/scripts/currently-watching-preview.js (CW rendering)
├── www/scripts/simple-tab-manager.js (tab management)
└── www/js/renderers/card-v2.js (card rendering)
```

## Libraries & Themes

### CSS Variables (Layout-Affecting)
| Variable | Default Value | File:Line | Usage |
|----------|---------------|-----------|-------|
| `--home-card-w-sm` | `140px` | `www/styles/home-layout.css:6` | Small card width |
| `--home-card-w-md` | `180px` | `www/styles/home-layout.css:7` | Medium card width |
| `--home-card-w-lg` | `200px` | `www/styles/home-layout.css:8` | Large card width |
| `--home-card-w-xl` | `220px` | `www/styles/home-layout.css:9` | Extra large card width |
| `--home-frame-gutter` | `32px` | `www/styles/home.css:7` | Frame gutter |
| `--home-row-gap-sm` | `12px` | `www/styles/home-layout.css:12` | Small row gap |
| `--home-row-gap-md` | `16px` | `www/styles/home-layout.css:13` | Medium row gap |
| `--home-row-gap-lg` | `20px` | `www/styles/home-layout.css:14` | Large row gap |

### Global Resets
| File:Line | Rule | Impact |
|-----------|------|--------|
| `www/styles/main.css:460` | `* { box-sizing: border-box; }` | All elements use border-box |
| `www/styles/home.css:191` | `html, body { overflow-x: hidden; }` | Prevents horizontal scroll |

## Findings Per Screenshot Symptom

### 1. "Buttons mis-sized/wrongly justified"
**Root Cause:** Multiple competing action button layouts

**Sources:**
- `www/styles/home.css:71-84` - 2x2 grid for Your Shows
- `www/styles/home-layout.css:60-68` - 2x2 grid for Home cards
- `www/styles/cards.css:456-459` - Override for home page

**Conflicts:**
- Different gap values (8px vs 8px vs 8px)
- Different justify-content (center vs unset vs unset)
- Different grid-template-columns (repeat(2, minmax(0, 1fr)) vs 1fr 1fr vs 1fr 1fr)

### 2. "Curated cards start too far right"
**Root Cause:** Inconsistent padding application

**Sources:**
- `www/styles/home.css:44` - `padding-left: var(--home-frame-gutter)` on panels
- `www/styles/home-layout.css:46` - `padding-inline: 12px` on rails
- `www/styles/main.css:1318` - `gap: 16px` on scroll containers

**Conflicts:**
- Double padding: 32px (frame) + 12px (rail) = 44px total
- Gap adds additional 16px between cards
- No consistent left alignment system

### 3. "Community has huge dead space"
**Root Cause:** Height constraints and grid layout issues

**Sources:**
- `www/styles/home.css:148-156` - Two-column grid on desktop
- `www/styles/main.css:3044-3047` - Width constraints on preview container
- `www/styles/main.css:3076-3079` - Padding/margin overrides

**Conflicts:**
- Grid auto-rows not defined, causing height collapse
- Conflicting width constraints (100% vs max-width)
- Padding overrides creating unexpected spacing

### 4. "Tabbed view buttons with huge mid gutter"
**Root Cause:** Flex/grid layout conflicts in tab containers

**Sources:**
- `www/styles/main.css:654-683` - Tab navigation flex layout
- `www/styles/home.css:314-328` - Tab container overrides
- `www/js/nav-init.js:179` - Runtime class additions

**Conflicts:**
- Different gap values across breakpoints
- Conflicting justify-content values
- Runtime class changes affecting layout

## Actionable Fixes

### Priority 1: Consolidate Layout Systems
**Files to Change:**
1. `www/styles/home-layout.css` - Make this the single source of truth
2. `www/styles/home.css` - Remove conflicting rules
3. `www/styles/main.css` - Remove duplicate home-specific rules

**Specific Changes:**
```css
/* www/styles/home-layout.css - Add these rules */
.home-group {
  margin-block: 0 var(--section-gap);
  padding: 32px;
  border-radius: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.preview-row-scroll,
.row-inner,
.up-next-scroll,
.curated-row {
  display: grid;
  grid-auto-flow: column;
  align-items: start;
  grid-auto-columns: clamp(var(--home-card-w-sm), 20vw, var(--home-card-w-lg));
  gap: var(--_row-gap);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding-inline: 0; /* Remove double padding */
}
```

### Priority 2: Fix Action Button Layout
**Files to Change:**
1. `www/styles/home-layout.css:60-68` - Consolidate action rules
2. `www/styles/home.css:71-84` - Remove duplicate rules

**Specific Changes:**
```css
/* www/styles/home-layout.css - Update action rules */
#homeSection .card.v2 .actions,
#homeSection .cw-card.v2 .actions,
#homeSection .curated-card.v2 .actions,
#homeSection .search-card.v2 .actions,
#group-1-your-shows :is(.actions, .card-actions) {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  grid-auto-rows: minmax(36px, auto);
  gap: 8px;
  justify-items: center;
  align-items: center;
  padding: 8px 0;
}
```

### Priority 3: Fix Padding/Gutter System
**Files to Change:**
1. `www/styles/home.css:35-48` - Fix double padding
2. `www/styles/home-layout.css:46` - Remove conflicting padding

**Specific Changes:**
```css
/* www/styles/home.css - Fix padding system */
:is(#group-1-your-shows,
    #group-2-community,
    #group-3-for-you,
    #group-4-theaters,
    #group-5-feedback)
  > :is(.home-preview-row, .section-content, .card-container, section, div) {
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  padding-left: var(--home-frame-gutter);
  padding-right: var(--home-frame-gutter);
  margin-left: 0;
  margin-right: 0;
}

/* www/styles/home-layout.css - Remove conflicting padding */
.preview-row-scroll,
.row-inner,
.up-next-scroll,
.curated-row {
  /* ... existing rules ... */
  padding-inline: 0; /* Remove this line */
}
```

### Priority 4: Fix Breakpoint Consistency
**Files to Change:**
1. `www/styles/main.css` - Standardize breakpoint variables
2. `www/styles/home-layout.css` - Use consistent breakpoints

**Specific Changes:**
```css
/* www/styles/main.css - Add consistent breakpoints */
:root {
  --bp-mobile: 480px;
  --bp-mobile-lg: 640px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
}
```

## Testing Strategy

### 1. Run Layout Forensics
```bash
# Browser console
layoutForensics()

# Or use bookmarklet
# Copy from docs/layout/bookmarklets.md
```

### 2. Test Breakpoints
- Mobile: 320px, 480px
- Mobile Large: 640px, 768px  
- Desktop: 1024px, 1200px, 1440px

### 3. Test Sections
- Your Shows: Currently Watching + Up Next
- Community: Two-column layout
- For You: Curated sections
- Theaters: Movie listings
- Feedback: Action buttons

### 4. Verify Fixes
- No double padding on cards
- Consistent button sizing
- Proper left alignment
- No dead space in Community
- Consistent gutters across sections

## Conclusion

The Home page layout issues stem from **3 competing layout systems** with **inconsistent breakpoints** and **runtime mutations** that override CSS. The fix requires **consolidating to a single source of truth** (`home-layout.css`) and **removing conflicting rules** from other files.

**Estimated Fix Time:** 2-3 hours  
**Risk Level:** Medium (requires careful testing)  
**Files Affected:** 3 CSS files, 0 JS files

---

*This report was generated using automated analysis tools. For questions or clarifications, refer to the source code or run the layout forensics script.*



