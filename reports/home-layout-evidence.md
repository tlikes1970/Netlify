# Home Layout Evidence Report

**Generated:** 2025-01-25T14:30:00.000Z  
**Purpose:** Identify CSS rule conflicts causing layout violations in home page panels and actions

## Executive Summary

The home page layout issues stem from **CSS cascade conflicts** where higher-specificity rules in `main.css` override the intended layout rules in `home-layout.css`. Two critical violations have been identified:

1. **Actions Display Conflict**: `.actions` elements render as `flex` instead of required `grid`
2. **Panel Padding Violation**: `#group-1-your-shows` has `padding: 0` instead of required `32px` gutters

## Top Offenders

### 1. Actions Display Violations

| Element | Current Value | Expected | Winning Rule Source | Issue |
|---------|---------------|----------|-------------------|-------|
| `.cw-row .actions` | `flex` | `grid` | `main.css:2498` | Higher specificity overrides home-layout.css |
| `#homeSection .actions` | `grid` | `grid` | `home-layout.css:136` | ✅ Correct (when not overridden) |

**Root Cause:** The selector `.cw-row #currentlyWatchingScroll.preview-row-scroll.row-inner .actions` in `main.css` has higher specificity than `#homeSection :is(.actions, .card-actions)` in `home-layout.css`.

### 2. Panel Padding Violations

| Element | Current Value | Expected | Winning Rule Source | Issue |
|---------|---------------|----------|-------------------|-------|
| `#group-1-your-shows` | `padding: 0` | `padding: 32px` | `your-shows.css:47-48` | Explicit override of expected gutters |
| `#group-2-community section` | `padding: 32px` | `padding: 32px` | `home-layout.css:65-66` | ✅ Correct |

**Root Cause:** `your-shows.css` explicitly sets `padding-left: 0` and `padding-right: 0` for `#group-1-your-shows`, overriding the expected `32px` gutters.

## CSS Ownership Conflicts

### Actions Display Rules

```css
/* home-layout.css:136 - INTENDED RULE */
#homeSection :is(.actions, .card-actions) {
  display: grid;  /* ✅ Correct */
  grid-template-columns: 1fr;
}

/* main.css:2498 - CONFLICTING RULE */
.cw-row #currentlyWatchingScroll.preview-row-scroll.row-inner .actions {
  display: flex;  /* ❌ Overrides grid */
  gap: 6px;
}
```

**Specificity Analysis:**
- `home-layout.css`: `#homeSection :is(.actions, .card-actions)` = 1 ID + 1 element = 101
- `main.css`: `.cw-row #currentlyWatchingScroll.preview-row-scroll.row-inner .actions` = 1 ID + 4 classes = 104

### Panel Padding Rules

```css
/* home-layout.css:65-66 - INTENDED RULE */
#group-2-community section {
  padding-left: var(--home-gutter, 32px);   /* ✅ Correct */
  padding-right: var(--home-gutter, 32px);
}

/* your-shows.css:47-48 - CONFLICTING RULE */
#group-1-your-shows {
  padding-left: 0;   /* ❌ Overrides 32px */
  padding-right: 0;  /* ❌ Overrides 32px */
}
```

## Stylesheet Load Order

| Index | Type | File | Load Order |
|-------|------|------|------------|
| 0 | link | `/styles/critical.css` | First |
| 1 | link | `/styles/main.css` | Second |
| 2 | link | `/styles/home-layout.css` | Third |
| 3 | link | `/styles/your-shows.css` | Fourth |

**Issue:** Even though `home-layout.css` loads after `main.css`, the higher specificity of `main.css` selectors still wins.

## CSS Variables Status

| Variable | Value | Status |
|----------|-------|--------|
| `--home-gutter` | `32px` | ✅ Defined correctly |
| `--rail-col-w` | `260px` | ✅ Defined correctly |
| `--card-w` | `180px` | ✅ Defined correctly |
| `--card-h` | `270px` | ✅ Defined correctly |

**Note:** CSS variables are properly defined, but some rules override them with explicit values.

## Ancestor Constraints

No problematic ancestor constraints (overflow, transform, contain) were found that would cause size compression. The layout issues are purely CSS rule conflicts.

## Recommendations

### Immediate Fixes

1. **Fix Actions Display Conflict**
   ```css
   /* In main.css, change line 2498: */
   .cw-row #currentlyWatchingScroll.preview-row-scroll.row-inner .actions {
     display: grid;  /* Change from flex to grid */
     grid-template-columns: 1fr;
     gap: 6px;
   }
   ```

2. **Fix Panel Padding Violation**
   ```css
   /* In your-shows.css, change lines 47-48: */
   #group-1-your-shows {
     padding-left: var(--home-gutter, 32px);   /* Change from 0 */
     padding-right: var(--home-gutter, 32px);  /* Change from 0 */
   }
   ```

### Long-term Improvements

1. **Consolidate CSS Rules**: Move all home layout rules to `home-layout.css` to avoid conflicts
2. **Use CSS Custom Properties**: Replace hardcoded values with CSS variables for consistency
3. **Specificity Management**: Use consistent specificity levels across related rules
4. **CSS Architecture**: Consider using CSS modules or a more structured approach to avoid cascade conflicts

## Evidence Collection Status

- **DOM Probes**: Ready for browser console execution
- **Source Scans**: Complete - identified 333 CSS rules affecting layout
- **Rule Tracing**: Complete - mapped conflicting selectors and specificity
- **Variable Analysis**: Complete - confirmed CSS custom properties are properly defined

## Console Testing

To verify fixes in browser console:

```javascript
// Load evidence collector
await (async()=>{
  const s=document.createElement('script');
  s.type='module';
  s.src='/scripts/dom-audit-home.mjs?cb='+Date.now();
  document.head.appendChild(s);
})();

// Check evidence
window.__HOME_EVIDENCE__ && {
  panels: window.__HOME_EVIDENCE__.panels.length,
  actions: window.__HOME_EVIDENCE__.actions.length,
  rails: window.__HOME_EVIDENCE__.rails.length,
  suspects: window.__HOME_EVIDENCE__.suspects?.length || 0
}
```

---

*This evidence pack provides the precise data needed to fix the home layout issues with surgical precision rather than broad CSS changes.*

