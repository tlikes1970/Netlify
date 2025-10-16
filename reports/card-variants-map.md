# Card Variants Usage Map

## BasePosterCard Component

### File: `www/scripts/components/BasePosterCard.js`
- **Props**: `{id, posterUrl, title, year, rating, overflowActions, onClick, isDisabled, subline, hideRating}`
- **CSS Classes**: `.base-poster-card`, `.base-poster-card__poster`, `.base-poster-card__content`
- **Usage Locations**:
  - `www/scripts/components/FlickWordTab.js` (lines 67-68, 166) - Game cards with rating and actions
  - `www/scripts/components/TriviaTab.js` (lines 83-84, 228) - Game cards with rating and actions
- **Rating Present**: Yes (when rating > 0 and not hidden)
- **Actions Present**: Yes (overflow menu with custom actions)

## CardCW Component

### File: `www/components/home-clean/CardCW.js`
- **Class**: `CardCW`
- **Usage Locations**:
  - `www/components/home-clean/HomeClean.js` (line 339) - Currently watching items
  - `www/components/home-clean/HomeClean.old` (line 484) - Legacy usage
- **Parent Component**: HomeClean
- **Route**: Home page
- **Rating Present**: Yes (star rating system)
- **Actions Present**: Yes (move to watched, remove, etc.)

## CardNextUp Component

### File: `www/components/home-clean/CardNextUp.js`
- **Class**: `CardNextUp`
- **Usage Locations**:
  - `www/components/home-clean/HomeClean.js` (line 342) - Next up items
  - `www/components/home-clean/HomeClean.old` (line 487) - Legacy usage
- **Parent Component**: HomeClean
- **Route**: Home page
- **Rating Present**: Yes (star rating system)
- **Actions Present**: Yes (play next, remove, etc.)

## CardForYou Component

### File: `www/components/home-clean/CardForYou.js`
- **Class**: `CardForYou`
- **Usage Locations**:
  - `www/components/home-clean/HomeClean.js` (lines 345, 348) - For you items and theaters
  - `www/components/home-clean/HomeClean.old` (line 490) - Legacy usage
- **Parent Component**: HomeClean
- **Route**: Home page
- **Rating Present**: Yes (star rating system)
- **Actions Present**: Yes (add to wishlist, remove, etc.)

## .tab-card CSS Class

### File: `www/styles/components.css` (lines 1187-1272)
- **Usage Locations**:
  - Mobile responsive rules for tab-based cards
  - Used in list views (watching, wishlist, watched tabs)
- **Parent Component**: List rendering functions
- **Route**: Tab pages (watching, wishlist, watched)
- **Rating Present**: Yes (`.tab-card .rating`)
- **Actions Present**: Yes (`.tab-card .mobile-actions .btn`)

## .show-card CSS Class

### File: Multiple files
- **Usage Locations**:
  - `www/styles/components.css` (lines 1733-1858) - Desktop layout
  - `www/styles/mobile.css` (lines 629-1138) - Mobile layout
  - `www/styles/main.css` (lines 800, 888) - Dark mode
  - `www/archive/scripts/inline-script-03.js` (lines 171, 196, 211, 226) - Event handlers
  - `www/scripts/list-actions.js` (line 76) - Action targeting
- **Parent Component**: Various list rendering functions
- **Route**: Multiple (home, tabs, search results)
- **Rating Present**: Yes (`.show-card .star-rating`, `.show-card .rating-container`)
- **Actions Present**: Yes (`.show-card .show-actions`, `.show-card .right-actions`)

## Summary by Component Type

### Game Cards (BasePosterCard)
- **Count**: 2 usage locations
- **Props**: Full props including rating and actions
- **Mobile Support**: CSS-based responsive design

### Home Page Cards (CardCW, CardNextUp, CardForYou)
- **Count**: 3 component classes
- **Props**: Full data objects with rating and actions
- **Mobile Support**: Component-level responsive design

### List Cards (.tab-card, .show-card)
- **Count**: 2 CSS class systems
- **Props**: CSS-based styling
- **Mobile Support**: Extensive mobile-specific CSS rules

## Mobile Compact Migration Impact

### High Impact Components
1. **BasePosterCard** - Used in game tabs, needs compact token integration
2. **.tab-card** - Mobile-specific rules with !important declarations
3. **.show-card** - Extensive mobile CSS rules, fallback layout

### Medium Impact Components
1. **CardCW/CardNextUp/CardForYou** - Home page cards, may need token updates
2. **Mobile CSS overrides** - Multiple files with conflicting rules

### Low Impact Components
1. **Legacy usage** - Archive files, minimal impact
2. **Dark mode rules** - Theme-specific, not layout-specific
