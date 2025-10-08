# Home: Frame + Rails Normalization

## Summary
Implemented Home frame and rails normalization by removing padding overrides from main.css and creating a token-driven home-layout.css system. This ensures consistent gutter behavior, proper rail grid layout, and eliminates cascade conflicts.

## Changes Made

### 1. Removed Home Padding Overrides from main.css

**Removed selectors:**
- `#group-1-your-shows .dark-mode .home-preview-row` (lines 1441-1446)
- `.home-preview-row` mobile rule (lines 3759-3762) 
- `.home-preview-row.collapsed` and related rules (lines 3863-3880)

**Replaced with:**
- Comments indicating rules moved to home-layout.css
- No functional CSS removed, only relocated for better organization

### 2. Created home-layout.css with Token System

**New design tokens:**
```css
:root {
  --home-gutter: 32px;           /* Single source of truth for gutters */
  --rail-col-w: 260px;           /* Rail column width */
  --rail-col-w-sm: 200px;        /* Mobile rail column width */
  --rail-gap: 16px;              /* Gap between rail items */
}
```

**Frame normalization:**
- Wrappers: `width: 100%`, no padding
- Panels own the single gutter: `padding-inline: var(--home-gutter)`
- Groups: `width: 100%`, `padding-inline: 0`

**Rail normalization:**
- Deepest rails: `display: grid`, `grid-auto-flow: column`
- Zero rail padding: `padding: 0`
- Scroll behavior: `overflow-x: auto`, `overflow-y: hidden`
- Snap behavior: `scroll-snap-type: inline mandatory`

**Action buttons:**
- 2x2 grid with container queries
- No label clipping: `white-space: nowrap`, `text-overflow: ellipsis`
- Fallback for older browsers

### 3. Import Order Verification

**Confirmed correct order:**
1. `main.css` (line 171)
2. `home-layout.css` (line 213)

This ensures home-layout.css can override main.css rules without using `!important`.

## Technical Implementation

### Frame Structure
```
#homeSection (wrapper: width 100%, no padding)
└── #group-1-your-shows.home-group (group: width 100%, padding 0)
    └── .home-preview-row (panel: padding-inline 32px)
        └── .preview-row-scroll (rail: grid, padding 0)
            └── .card (snap target)
```

### Rail Properties
- **Display**: `grid` with `grid-auto-flow: column`
- **Sizing**: `grid-auto-columns: var(--rail-col-w)`
- **Spacing**: `gap: var(--rail-gap)`
- **Padding**: `0` (panels own gutters)
- **Scroll**: `overflow-x: auto`, `overflow-y: hidden`
- **Snap**: `scroll-snap-type: inline mandatory`

### RTL Support
- Uses logical properties: `padding-inline`, `margin-inline`
- RTL-aware scroll indicators
- Proper scroll direction handling

## Testing

### Verification Script
Run `verifyRailNormalization()` in console to verify:
- ✅ Group 1 rails: PASS
- ✅ Gutters for all groups: PASS  
- ✅ N/A rails for unmounted sections: PASS
- ✅ Action buttons: 2x2 grid, no label clipping

### Expected Results
- **Panels**: `padding: 32px` (single gutter)
- **Rails**: `padding: 0`, `display: grid`, `overflow-x: auto`
- **Cards**: `scroll-snap-align: start`
- **Actions**: 2x2 grid, no text clipping

## Benefits

1. **Single Source of Truth**: All Home layout controlled by tokens
2. **No Cascade Conflicts**: home-layout.css owns layout, main.css owns visual
3. **RTL-Safe**: Uses logical properties and RTL-aware scroll
4. **Maintainable**: Easy to adjust gutters/sizing via tokens
5. **No !important**: Proper cascade ownership without overrides
6. **Consistent**: All rails behave identically across Home sections

## Files Modified

- `www/styles/main.css` - Removed Home padding overrides
- `www/styles/home-layout.css` - Created token-driven layout system
- `www/index.html` - Import order already correct

## No Breaking Changes

- No DOM changes required
- No `!important` usage
- Preserves existing visual appearance
- Maintains all functionality



