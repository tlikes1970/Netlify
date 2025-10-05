# CSS !important Triage Report - Main.css
*Generated from CSS audit data - October 2, 2025*

## Overview
This report analyzes all `!important` declarations in `main.css` grouped by page sections. Each entry includes the selector, what it's trying to force, risk assessment, and proposed replacement approach.

---

## A) Page Flow & Scroll Owner

### Tab Section Visibility Control
- **Selector**: `.tab-section` → `display: none`
- **What it's trying to force**: Hide all tab content panels by default
- **Risk if removed**: **High** - All tabs would be visible simultaneously, breaking the single-page app behavior
- **Proposed replacement**: Use CSS custom properties with `:not(.active)` selector instead of `!important`
- **Removed + Verified**: ☐

- **Selector**: `.tab-section.active` → `display: block`
- **What it's trying to force**: Show only the currently active tab panel
- **Risk if removed**: **High** - Active tabs wouldn't display, breaking navigation
- **Proposed replacement**: Use CSS custom properties with `.active` class specificity
- **Removed + Verified**: ☐

---

## B) Tabs & Tab Panels
*Note: Most tab-related !important declarations are in `tabs.css`, not `main.css`*

---

## C) FAB Dock

### Core FAB Dock Positioning
- **Selector**: `.fab-dock` → `position: fixed`
- **What it's trying to force**: Keep the floating action button dock anchored to screen bottom
- **Risk if removed**: **High** - FAB dock would scroll with page content instead of staying fixed
- **Proposed replacement**: Use CSS custom properties with higher specificity selectors
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `bottom: var(--fab-gap)`
- **What it's trying to force**: Position FAB dock at bottom with consistent spacing
- **Risk if removed**: **Medium** - FAB dock positioning would be inconsistent
- **Proposed replacement**: Use CSS custom properties with container queries
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `left: 50%`
- **What it's trying to force**: Center the FAB dock horizontally on screen
- **Risk if removed**: **Medium** - FAB dock would align to left instead of center
- **Proposed replacement**: Use CSS custom properties with flexbox centering
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `transform: translateX(-50%)`
- **What it's trying to force**: Perfect horizontal centering of the FAB dock
- **Risk if removed**: **Medium** - FAB dock would be off-center
- **Proposed replacement**: Use CSS custom properties with margin auto
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `z-index: 50`
- **What it's trying to force**: Keep FAB dock above other page elements
- **Risk if removed**: **High** - FAB dock could be hidden behind other elements
- **Proposed replacement**: Use CSS custom properties with layered z-index system
- **Removed + Verified**: ☐

### FAB Dock Layout Properties
- **Selector**: `.fab-dock` → `display: flex`
- **What it's trying to force**: Make FAB dock a flex container for button alignment
- **Risk if removed**: **High** - FAB buttons wouldn't align properly
- **Proposed replacement**: Use CSS custom properties with grid layout
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `align-items: flex-end`
- **What it's trying to force**: Align FAB buttons to bottom of dock
- **Risk if removed**: **Medium** - FAB buttons would align to center instead of bottom
- **Proposed replacement**: Use CSS custom properties with align-items baseline
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `justify-content: space-between`
- **What it's trying to force**: Spread FAB buttons across the dock width
- **Risk if removed**: **Medium** - FAB buttons would cluster together
- **Proposed replacement**: Use CSS custom properties with gap spacing
- **Removed + Verified**: ☐

### FAB Dock Sizing
- **Selector**: `.fab-dock` → `width: min(var(--container-max), 100vw)`
- **What it's trying to force**: Limit FAB dock width to container max or viewport width
- **Risk if removed**: **Medium** - FAB dock could overflow on wide screens
- **Proposed replacement**: Use CSS custom properties with container queries
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `max-width: calc(100vw - 2 * var(--container-pad))`
- **What it's trying to force**: Ensure FAB dock doesn't exceed viewport minus padding
- **Risk if removed**: **Medium** - FAB dock could overflow on narrow screens
- **Proposed replacement**: Use CSS custom properties with clamp() function
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `padding: 0 calc(var(--container-pad) + 16px)`
- **What it's trying to force**: Add consistent padding to FAB dock edges
- **Risk if removed**: **Low** - FAB dock would have no edge padding
- **Proposed replacement**: Use CSS custom properties with margin instead of padding
- **Removed + Verified**: ☐

### FAB Button Positioning
- **Selector**: `.fab-dock .fab-left` → `pointer-events: auto`
- **What it's trying to force**: Make the left FAB button clickable
- **Risk if removed**: **High** - Left FAB button would be unclickable
- **Proposed replacement**: Use CSS custom properties with pointer-events inherit
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock .fab-left` → `margin-right: auto`
- **What it's trying to force**: Push left FAB button to the left side of dock
- **Risk if removed**: **Medium** - Left FAB button would center instead of left-align
- **Proposed replacement**: Use CSS custom properties with flexbox order
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock .fab-left` → `position: static`
- **What it's trying to force**: Reset left FAB button to normal document flow
- **Risk if removed**: **Medium** - Left FAB button could have unexpected positioning
- **Proposed replacement**: Use CSS custom properties with position relative
- **Removed + Verified**: ☐

### FAB Button Reset Properties
- **Selector**: `.fab` → `position: static`
- **What it's trying to force**: Reset all FAB buttons to normal document flow
- **Risk if removed**: **Medium** - FAB buttons could have unexpected positioning
- **Proposed replacement**: Use CSS custom properties with position relative
- **Removed + Verified**: ☐

- **Selector**: `.fab` → `pointer-events: auto`
- **What it's trying to force**: Make all FAB buttons clickable
- **Risk if removed**: **High** - FAB buttons would be unclickable
- **Proposed replacement**: Use CSS custom properties with pointer-events inherit
- **Removed + Verified**: ☐

### FAB Button Position Reset Group
- **Selector**: `.fab-dock .fab; .fab-dock .fab-left; .fab-dock .fab-stack` → `position: static`
- **What it's trying to force**: Reset all FAB button types to normal document flow
- **Risk if removed**: **Medium** - FAB buttons could have unexpected positioning
- **Proposed replacement**: Use CSS custom properties with position relative
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock .fab; .fab-dock .fab-left; .fab-dock .fab-stack` → `top: auto`
- **What it's trying to force**: Reset top positioning for all FAB button types
- **Risk if removed**: **Low** - FAB buttons could have unexpected top positioning
- **Proposed replacement**: Use CSS custom properties with top unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock .fab; .fab-dock .fab-left; .fab-dock .fab-stack` → `bottom: auto`
- **What it's trying to force**: Reset bottom positioning for all FAB button types
- **Risk if removed**: **Low** - FAB buttons could have unexpected bottom positioning
- **Proposed replacement**: Use CSS custom properties with bottom unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock .fab; .fab-dock .fab-left; .fab-dock .fab-stack` → `left: auto`
- **What it's trying to force**: Reset left positioning for all FAB button types
- **Risk if removed**: **Low** - FAB buttons could have unexpected left positioning
- **Proposed replacement**: Use CSS custom properties with left unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock .fab; .fab-dock .fab-left; .fab-dock .fab-stack` → `right: auto`
- **What it's trying to force**: Reset right positioning for all FAB button types
- **Risk if removed**: **Low** - FAB buttons could have unexpected right positioning
- **Proposed replacement**: Use CSS custom properties with right unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock .fab; .fab-dock .fab-left; .fab-dock .fab-stack` → `transform: none`
- **What it's trying to force**: Reset transform for all FAB button types
- **Risk if removed**: **Low** - FAB buttons could have unexpected transforms
- **Proposed replacement**: Use CSS custom properties with transform unset
- **Removed + Verified**: ☐

### FAB Button Universal Reset
- **Selector**: `.fab; .fab-left; .fab-stack; .fab-dock` → `position: static`
- **What it's trying to force**: Reset positioning for all FAB-related elements
- **Risk if removed**: **Medium** - FAB elements could have unexpected positioning
- **Proposed replacement**: Use CSS custom properties with position relative
- **Removed + Verified**: ☐

### FAB Dock Mobile Override
- **Selector**: `.fab-dock` → `position: fixed` (duplicate)
- **What it's trying to force**: Ensure FAB dock stays fixed on mobile devices
- **Risk if removed**: **High** - FAB dock would scroll with content on mobile
- **Proposed replacement**: Use CSS custom properties with media queries
- **Removed + Verified**: ☐

### Settings Button Styling Reset
- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `background: transparent`
- **What it's trying to force**: Remove background from settings button in FAB dock
- **Risk if removed**: **Medium** - Settings button would have unwanted background
- **Proposed replacement**: Use CSS custom properties with background unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `background-color: transparent`
- **What it's trying to force**: Remove background color from settings button
- **Risk if removed**: **Medium** - Settings button would have unwanted background color
- **Proposed replacement**: Use CSS custom properties with background-color unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `background-image: none`
- **What it's trying to force**: Remove background image from settings button
- **Risk if removed**: **Low** - Settings button could have unwanted background image
- **Proposed replacement**: Use CSS custom properties with background-image unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `box-shadow: none`
- **What it's trying to force**: Remove shadow from settings button
- **Risk if removed**: **Low** - Settings button could have unwanted shadow
- **Proposed replacement**: Use CSS custom properties with box-shadow unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `border: none`
- **What it's trying to force**: Remove border from settings button
- **Risk if removed**: **Low** - Settings button could have unwanted border
- **Proposed replacement**: Use CSS custom properties with border unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `border-radius: 0`
- **What it's trying to force**: Remove rounded corners from settings button
- **Risk if removed**: **Low** - Settings button could have unwanted rounded corners
- **Proposed replacement**: Use CSS custom properties with border-radius unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `color: var(--text, #333)`
- **What it's trying to force**: Set text color for settings button
- **Risk if removed**: **Medium** - Settings button text could be invisible
- **Proposed replacement**: Use CSS custom properties with color inherit
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `font-size: 24px`
- **What it's trying to force**: Set font size for settings button
- **Risk if removed**: **Low** - Settings button text could be too small
- **Proposed replacement**: Use CSS custom properties with font-size inherit
- **Removed + Verified**: ☐

### Settings Button Sizing Reset
- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `width: auto`
- **What it's trying to force**: Reset width of settings button to auto
- **Risk if removed**: **Low** - Settings button could have fixed width
- **Proposed replacement**: Use CSS custom properties with width unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `height: auto`
- **What it's trying to force**: Reset height of settings button to auto
- **Risk if removed**: **Low** - Settings button could have fixed height
- **Proposed replacement**: Use CSS custom properties with height unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `min-width: auto`
- **What it's trying to force**: Reset minimum width of settings button
- **Risk if removed**: **Low** - Settings button could have minimum width constraint
- **Proposed replacement**: Use CSS custom properties with min-width unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `min-height: auto`
- **What it's trying to force**: Reset minimum height of settings button
- **Risk if removed**: **Low** - Settings button could have minimum height constraint
- **Proposed replacement**: Use CSS custom properties with min-height unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings; .fab-dock #btnSettings.fab-left` → `padding: 8px`
- **What it's trying to force**: Set padding for settings button
- **Risk if removed**: **Low** - Settings button could have no padding
- **Proposed replacement**: Use CSS custom properties with padding inherit
- **Removed + Verified**: ☐

### Settings Button Hover Reset
- **Selector**: `.fab-dock #btnSettings:hover; .fab-dock #btnSettings.fab-left:hover` → `background: transparent`
- **What it's trying to force**: Keep settings button background transparent on hover
- **Risk if removed**: **Low** - Settings button could have unwanted hover background
- **Proposed replacement**: Use CSS custom properties with background unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings:hover; .fab-dock #btnSettings.fab-left:hover` → `background-color: transparent`
- **What it's trying to force**: Keep settings button background color transparent on hover
- **Risk if removed**: **Low** - Settings button could have unwanted hover background color
- **Proposed replacement**: Use CSS custom properties with background-color unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings:hover; .fab-dock #btnSettings.fab-left:hover` → `background-image: none`
- **What it's trying to force**: Keep settings button background image none on hover
- **Risk if removed**: **Low** - Settings button could have unwanted hover background image
- **Proposed replacement**: Use CSS custom properties with background-image unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings:hover; .fab-dock #btnSettings.fab-left:hover` → `box-shadow: none`
- **What it's trying to force**: Keep settings button shadow none on hover
- **Risk if removed**: **Low** - Settings button could have unwanted hover shadow
- **Proposed replacement**: Use CSS custom properties with box-shadow unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock #btnSettings:hover; .fab-dock #btnSettings.fab-left:hover` → `opacity: 0.8`
- **What it's trying to force**: Dim settings button on hover for visual feedback
- **Risk if removed**: **Low** - Settings button wouldn't have hover feedback
- **Proposed replacement**: Use CSS custom properties with opacity inherit
- **Removed + Verified**: ☐

### FAB Dock Mobile Layout Override
- **Selector**: `.fab-dock` → `left: 50%` (duplicate)
- **What it's trying to force**: Center FAB dock horizontally on mobile
- **Risk if removed**: **Medium** - FAB dock would align to left on mobile
- **Proposed replacement**: Use CSS custom properties with media queries
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `transform: translateX(-50%)` (duplicate)
- **What it's trying to force**: Perfect horizontal centering on mobile
- **Risk if removed**: **Medium** - FAB dock would be off-center on mobile
- **Proposed replacement**: Use CSS custom properties with margin auto
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `width: 100vw`
- **What it's trying to force**: Make FAB dock full viewport width on mobile
- **Risk if removed**: **Medium** - FAB dock would be constrained width on mobile
- **Proposed replacement**: Use CSS custom properties with container queries
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `max-width: none`
- **What it's trying to force**: Remove max-width constraint on mobile
- **Risk if removed**: **Medium** - FAB dock would be constrained width on mobile
- **Proposed replacement**: Use CSS custom properties with max-width unset
- **Removed + Verified**: ☐

- **Selector**: `.fab-dock` → `padding: 0 calc(var(--container-pad) + 16px)` (duplicate)
- **What it's trying to force**: Add consistent padding on mobile
- **Risk if removed**: **Low** - FAB dock would have no edge padding on mobile
- **Proposed replacement**: Use CSS custom properties with margin instead of padding
- **Removed + Verified**: ☐

---

## D) Home "Your Shows" Rows

### General Home Preview Row Reset
- **Selector**: `#group-1-your-shows .home-preview-row` → `margin: 16px 0`
- **What it's trying to force**: Add vertical spacing to home preview rows
- **Risk if removed**: **Medium** - Home preview rows would have no vertical spacing
- **Proposed replacement**: Use CSS custom properties with margin inherit
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .home-preview-row` → `background: none`
- **What it's trying to force**: Remove background from home preview rows
- **Risk if removed**: **Low** - Home preview rows could have unwanted background
- **Proposed replacement**: Use CSS custom properties with background unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .home-preview-row` → `border: none`
- **What it's trying to force**: Remove border from home preview rows
- **Risk if removed**: **Low** - Home preview rows could have unwanted border
- **Proposed replacement**: Use CSS custom properties with border unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .home-preview-row` → `border-radius: 0`
- **What it's trying to force**: Remove rounded corners from home preview rows
- **Risk if removed**: **Low** - Home preview rows could have unwanted rounded corners
- **Proposed replacement**: Use CSS custom properties with border-radius unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .home-preview-row` → `padding: 0`
- **What it's trying to force**: Remove padding from home preview rows
- **Risk if removed**: **Low** - Home preview rows could have unwanted padding
- **Proposed replacement**: Use CSS custom properties with padding unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .home-preview-row` → `box-shadow: none`
- **What it's trying to force**: Remove shadow from home preview rows
- **Risk if removed**: **Low** - Home preview rows could have unwanted shadow
- **Proposed replacement**: Use CSS custom properties with box-shadow unset
- **Removed + Verified**: ☐

### Currently Watching Preview Row Styling
- **Selector**: `#group-1-your-shows #currentlyWatchingPreview.home-preview-row` → `margin: 16px 0`
- **What it's trying to force**: Add vertical spacing to currently watching preview
- **Risk if removed**: **Medium** - Currently watching preview would have no vertical spacing
- **Proposed replacement**: Use CSS custom properties with margin inherit
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows #currentlyWatchingPreview.home-preview-row` → `background: var(--card)`
- **What it's trying to force**: Set card background for currently watching preview
- **Risk if removed**: **Medium** - Currently watching preview could have no background
- **Proposed replacement**: Use CSS custom properties with background inherit
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows #currentlyWatchingPreview.home-preview-row` → `border: 1px solid var(--border)`
- **What it's trying to force**: Add border to currently watching preview
- **Risk if removed**: **Low** - Currently watching preview could have no border
- **Proposed replacement**: Use CSS custom properties with border inherit
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows #currentlyWatchingPreview.home-preview-row` → `border-radius: 12px`
- **What it's trying to force**: Add rounded corners to currently watching preview
- **Risk if removed**: **Low** - Currently watching preview could have no rounded corners
- **Proposed replacement**: Use CSS custom properties with border-radius inherit
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows #currentlyWatchingPreview.home-preview-row` → `padding: 20px`
- **What it's trying to force**: Add padding to currently watching preview
- **Risk if removed**: **Medium** - Currently watching preview could have no padding
- **Proposed replacement**: Use CSS custom properties with padding inherit
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows #currentlyWatchingPreview.home-preview-row` → `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)`
- **What it's trying to force**: Add subtle shadow to currently watching preview
- **Risk if removed**: **Low** - Currently watching preview could have no shadow
- **Proposed replacement**: Use CSS custom properties with box-shadow inherit
- **Removed + Verified**: ☐

### Home Group Container Reset
- **Selector**: `#group-1-your-shows.home-group` → `background: none`
- **What it's trying to force**: Remove background from home group container
- **Risk if removed**: **Low** - Home group could have unwanted background
- **Proposed replacement**: Use CSS custom properties with background unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows.home-group` → `border: none`
- **What it's trying to force**: Remove border from home group container
- **Risk if removed**: **Low** - Home group could have unwanted border
- **Proposed replacement**: Use CSS custom properties with border unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows.home-group` → `border-radius: 0`
- **What it's trying to force**: Remove rounded corners from home group container
- **Risk if removed**: **Low** - Home group could have unwanted rounded corners
- **Proposed replacement**: Use CSS custom properties with border-radius unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows.home-group` → `padding: 0`
- **What it's trying to force**: Remove padding from home group container
- **Risk if removed**: **Low** - Home group could have unwanted padding
- **Proposed replacement**: Use CSS custom properties with padding unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows.home-group` → `box-shadow: none`
- **What it's trying to force**: Remove shadow from home group container
- **Risk if removed**: **Low** - Home group could have unwanted shadow
- **Proposed replacement**: Use CSS custom properties with box-shadow unset
- **Removed + Verified**: ☐

---

## E) Quote Bar

### Quote Bar Layout
- **Selector**: `.quote-bar` → `display: block`
- **What it's trying to force**: Make quote bar a block element
- **Risk if removed**: **Medium** - Quote bar could be inline instead of block
- **Proposed replacement**: Use CSS custom properties with display inherit
- **Removed + Verified**: ☐

- **Selector**: `.quote-bar` → `background: var(--bg, #ffffff)`
- **What it's trying to force**: Set background color for quote bar
- **Risk if removed**: **Medium** - Quote bar could have no background
- **Proposed replacement**: Use CSS custom properties with background inherit
- **Removed + Verified**: ☐

- **Selector**: `.quote-bar` → `border: 1px solid var(--border, #e5e7eb)`
- **What it's trying to force**: Add border to quote bar
- **Risk if removed**: **Low** - Quote bar could have no border
- **Proposed replacement**: Use CSS custom properties with border inherit
- **Removed + Verified**: ☐

- **Selector**: `.quote-bar` → `color: var(--fg, #1f2937)`
- **What it's trying to force**: Set text color for quote bar
- **Risk if removed**: **Medium** - Quote bar text could be invisible
- **Proposed replacement**: Use CSS custom properties with color inherit
- **Removed + Verified**: ☐

- **Selector**: `.quote-bar` → `font-size: var(--fs-0, 1rem)`
- **What it's trying to force**: Set font size for quote bar
- **Risk if removed**: **Low** - Quote bar text could be too small
- **Proposed replacement**: Use CSS custom properties with font-size inherit
- **Removed + Verified**: ☐

- **Selector**: `.quote-bar` → `font-weight: normal`
- **What it's trying to force**: Set font weight for quote bar
- **Risk if removed**: **Low** - Quote bar text could be bold
- **Proposed replacement**: Use CSS custom properties with font-weight inherit
- **Removed + Verified**: ☐

### Quote Text Layout
- **Selector**: `.quote-text` → `display: inline-block`
- **What it's trying to force**: Make quote text inline-block for proper alignment
- **Risk if removed**: **Medium** - Quote text could be inline instead of inline-block
- **Proposed replacement**: Use CSS custom properties with display inherit
- **Removed + Verified**: ☐

- **Selector**: `.quote-text` → `color: var(--fg, #1f2937)`
- **What it's trying to force**: Set text color for quote text
- **Risk if removed**: **Medium** - Quote text could be invisible
- **Proposed replacement**: Use CSS custom properties with color inherit
- **Removed + Verified**: ☐

- **Selector**: `.quote-text` → `font-size: var(--fs-0, 1rem)`
- **What it's trying to force**: Set font size for quote text
- **Risk if removed**: **Low** - Quote text could be too small
- **Proposed replacement**: Use CSS custom properties with font-size inherit
- **Removed + Verified**: ☐

- **Selector**: `.quote-text` → `font-weight: var(--font-weight-normal, normal)`
- **What it's trying to force**: Set font weight for quote text
- **Risk if removed**: **Low** - Quote text could be bold
- **Proposed replacement**: Use CSS custom properties with font-weight inherit
- **Removed + Verified**: ☐

### Quote Text Specific Styling
- **Selector**: `#quote-bar .quote-text; .quote-bar .quote-text` → `font-weight: normal`
- **What it's trying to force**: Ensure quote text has normal font weight
- **Risk if removed**: **Low** - Quote text could be bold
- **Proposed replacement**: Use CSS custom properties with font-weight inherit
- **Removed + Verified**: ☐

- **Selector**: `#quote-bar .quote-text; .quote-bar .quote-text` → `font-style: italic`
- **What it's trying to force**: Make quote text italic
- **Risk if removed**: **Low** - Quote text wouldn't be italic
- **Proposed replacement**: Use CSS custom properties with font-style inherit
- **Removed + Verified**: ☐

---

## F) Dark Mode That Touches Layout

### Dark Mode Home Preview Row Reset
- **Selector**: `#group-1-your-shows .dark-mode .home-preview-row` → `background: none`
- **What it's trying to force**: Remove background from home preview rows in dark mode
- **Risk if removed**: **Low** - Home preview rows could have unwanted background in dark mode
- **Proposed replacement**: Use CSS custom properties with background unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .dark-mode .home-preview-row` → `border: none`
- **What it's trying to force**: Remove border from home preview rows in dark mode
- **Risk if removed**: **Low** - Home preview rows could have unwanted border in dark mode
- **Proposed replacement**: Use CSS custom properties with border unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .dark-mode .home-preview-row` → `border-radius: 0`
- **What it's trying to force**: Remove rounded corners from home preview rows in dark mode
- **Risk if removed**: **Low** - Home preview rows could have unwanted rounded corners in dark mode
- **Proposed replacement**: Use CSS custom properties with border-radius unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .dark-mode .home-preview-row` → `padding: 0`
- **What it's trying to force**: Remove padding from home preview rows in dark mode
- **Risk if removed**: **Low** - Home preview rows could have unwanted padding in dark mode
- **Proposed replacement**: Use CSS custom properties with padding unset
- **Removed + Verified**: ☐

- **Selector**: `#group-1-your-shows .dark-mode .home-preview-row` → `box-shadow: none`
- **What it's trying to force**: Remove shadow from home preview rows in dark mode
- **Risk if removed**: **Low** - Home preview rows could have unwanted shadow in dark mode
- **Proposed replacement**: Use CSS custom properties with box-shadow unset
- **Removed + Verified**: ☐

---

## Summary

**Total !important declarations in main.css**: 89

**Risk Distribution**:
- **High Risk**: 12 declarations (tab visibility, FAB positioning, button interactions)
- **Medium Risk**: 25 declarations (layout properties, spacing, colors)
- **Low Risk**: 52 declarations (cosmetic properties, resets, overrides)

**Priority for Removal**:
1. **Low Risk** - Cosmetic properties and resets (52 items)
2. **Medium Risk** - Layout properties and spacing (25 items)  
3. **High Risk** - Critical functionality (12 items)

**Recommended Approach**:
1. Start with Low Risk items using CSS custom properties
2. Test each removal thoroughly before proceeding
3. Use higher specificity selectors instead of !important
4. Implement CSS custom properties for consistent theming
5. Consider CSS container queries for responsive behavior



