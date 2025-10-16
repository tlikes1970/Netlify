# Fixed Bottom Elements Audit

## Fixed Bottom Elements Found

### 1. Bottom Navigation (.bottom-nav)
- **File**: `www/styles/mobile.css` (lines 4-17)
- **Position**: `position: fixed; bottom: 0;`
- **Z-Index**: `1000`
- **Padding**: `padding: 8px 0 calc(8px + env(safe-area-inset-bottom));`
- **Risk**: HIGH - Will conflict with compact layout spacing

### 2. FAB Dock System
- **File**: `www/styles/components.css` (lines 3084-3085)
- **Position**: `bottom: max(16px, env(safe-area-inset-bottom));`
- **Z-Index**: `1000`
- **Risk**: MEDIUM - Uses safe area insets, may need adjustment

### 3. Mobile Hotfix Overrides
- **File**: `www/styles/mobile-hotfix.css` (lines 12-13)
- **Position**: `position: fixed; bottom: 0;`
- **Z-Index**: `1000 !important`
- **Padding**: `padding: 8px 0 calc(8px + env(safe-area-inset-bottom)) !important;`
- **Risk**: HIGH - Uses !important, will override compact tokens

## Z-Index Hierarchy Conflicts

### Critical Z-Index Values
1. **99999** - Error handlers, modals (highest)
2. **20000** - Auth modals
3. **15000** - Game modals
4. **10000** - Various overlays
5. **1000** - Bottom nav, FABs, search bars
6. **100** - Cards, badges
7. **50** - Dropdowns, tooltips
8. **10** - Low priority elements
9. **1** - Base elements

### Potential Conflicts
- Bottom nav (z-index: 1000) may conflict with FAB dock (z-index: 1000)
- Multiple elements using z-index: 1000 could cause layering issues
- Safe area insets used inconsistently across components

## Padding-Bottom Usage

### Elements Using Padding-Bottom
1. **App Root**: `padding-bottom: calc(var(--fab-size, 56px) + var(--fab-gap, 16px));`
2. **Body**: `padding-bottom: calc(env(safe-area-inset-bottom) + 120px);`
3. **Mobile Content**: `padding-bottom: calc(76px + env(safe-area-inset-bottom));`
4. **FAB Rail**: `padding-bottom: calc(var(--fab-rail-height) + 20px);`

### Safe Area Inset Usage
- **Bottom Nav**: `calc(8px + env(safe-area-inset-bottom))`
- **FAB Dock**: `max(16px, env(safe-area-inset-bottom))`
- **Mobile Content**: `calc(76px + env(safe-area-inset-bottom))`
- **Body**: `calc(env(safe-area-inset-bottom) + 120px)`

## Risks for Mobile Compact Migration

### 1. Spacing Conflicts
- Bottom nav reserves space at bottom
- FAB dock also reserves space
- Multiple padding-bottom calculations may compound

### 2. Z-Index Wars
- Bottom nav and FAB dock both use z-index: 1000
- May cause layering issues with compact layout

### 3. Safe Area Inset Inconsistency
- Different calculations across components
- May cause layout shifts on devices with notches

### 4. !important Overrides
- Mobile hotfix uses !important declarations
- Will override compact token values

## Recommendations

1. **Consolidate Z-Index Values**: Create clear hierarchy for compact layout
2. **Unify Safe Area Handling**: Use consistent calculations across all components
3. **Remove !important**: Replace with proper CSS specificity
4. **Test on Notched Devices**: Verify safe area calculations work correctly
5. **Reserve Space Calculation**: Ensure bottom nav + FAB dock don't overlap
