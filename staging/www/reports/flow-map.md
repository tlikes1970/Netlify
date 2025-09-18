# DOM Flow Map - Flicklet TV Tracker

**Date:** January 12, 2025  
**Version:** v23.74-POSTERS-HOME-PAGE-FIX  
**Scope:** DOM Structure & Class Relationships

## 1. Main DOM Structure

```
html
└── body
    └── .main-container#appRoot
        ├── header.header[role="banner"]
        │   └── .header-bar
        │       ├── .header-left
        │       │   ├── .version-display
        │       │   ├── h1.brand
        │       │   └── .tagline
        │       └── .header-right
        │           ├── .signin-area[data-auth="signed-out-visible"]
        │           ├── .account-area[data-auth="signed-in-visible"]
        │           └── select#langToggle
        ├── .top-search (Sticky Search)
        │   ├── .search-help
        │   ├── .search-row
        │   └── .tag-filters#tagFilterRow
        ├── .tab-container
        │   ├── button#homeTab.tab.active
        │   ├── button#watchingTab.tab
        │   ├── button#wishlistTab.tab
        │   ├── button#watchedTab.tab
        │   └── button#discoverTab.tab
        ├── #searchResults.search-results
        └── #homeSection.tab-section.active
```

## 2. Home Section Structure

```
#homeSection.tab-section.active
├── #quote-bar.quote-bar[role="region"]
│   └── .quote-marquee
│       └── .quote-text#quoteText
├── #group-1-your-shows.home-group
│   ├── .group-header
│   │   └── h2.group-title
│   ├── #currentlyWatchingPreview.home-preview-row
│   │   ├── .preview-row-header
│   │   └── .preview-row-container.cw-row
│   │       └── .preview-row-scroll.row-inner#currentlyWatchingScroll
│   └── #next-up-row.home-preview-row
│       ├── .preview-row-header
│       └── .preview-row-container
│           └── .next-up-scroll.row-inner.preview-row-scroll
├── #group-2-community.home-group
│   ├── .group-header
│   └── .community-content
│       ├── .community-left
│       │   └── .player-placeholder
│       └── .community-right
│           └── #home-games.home-games
│               ├── #flickwordTile.card.card--game
│               └── #triviaTile.card.card--game
├── #group-3-for-you.home-group
│   ├── .group-header
│   ├── #personalized-section.home-preview-row
│   └── #curated-section.home-preview-row
├── #group-4-theaters.home-group
│   └── #theaters-section.home-preview-row
└── #group-5-feedback.home-group
    └── #feedbackSection.home-preview-row
```

## 3. Tab Sections Structure

```
main#main[role="main"]
├── #watchingSection.tab-section
│   └── .section
│       ├── .section-header
│       └── #watchingList.list-container
├── #wishlistSection.tab-section
│   └── .section
│       ├── .section-header
│       └── #wishlistList.list-container
├── #watchedSection.tab-section
│   └── .section
│       ├── .section-header
│       └── #watchedList.list-container
└── #discoverSection.tab-section
    └── .section
        ├── .section-header
        └── #discoverList.list-container
```

## 4. Card Component Structure

### Show Card (Legacy System)
```
.show-card
├── .poster-button
│   ├── .show-poster / .poster-placeholder
│   └── .poster-overlay
├── .show-details
│   ├── .show-title-row
│   │   ├── .show-title
│   │   └── .program-status-badge
│   ├── .show-meta
│   ├── .show-overview
│   ├── .rating-container
│   │   ├── .star-rating
│   │   └── .like-dislike
│   └── .show-actions
│       ├── .btn (Watch/Unwatch)
│       ├── .btn (Wishlist)
│       └── .btn (Rate)
└── .card-overlay
```

### Game Card (New System)
```
.card.card--game
├── .card__header
│   ├── .card__title
│   └── .card__tools
│       └── .game-stats
│           ├── .stat-item
│           ├── .stat-item
│           └── .stat-item
├── .card__body.card__body--scroll
│   └── .card__description
└── .card__actions
    └── .btn.btn--primary
```

### Preview Card (Home Page)
```
.preview-card
├── .preview-card-poster
│   └── img / .poster-placeholder
├── .preview-card-content
│   ├── .preview-card-title
│   └── .preview-card-year
├── .preview-card-status
└── .preview-card-actions
    └── .preview-action-btn
```

## 5. CSS Class Hierarchy

### Layout Classes
```
.main-container
├── .header
│   ├── .header-bar
│   ├── .header-left
│   └── .header-right
├── .top-search
│   ├── .search-help
│   ├── .search-row
│   └── .tag-filters
├── .tab-container
│   └── .tab
├── .search-results
└── .tab-section
    └── .home-group
        ├── .group-header
        ├── .home-preview-row
        └── .community-content
```

### Card Classes
```
.card (Base)
├── .card--game (Game variant)
├── .card__header
├── .card__body
├── .card__actions
└── .show-card (Legacy)
    ├── .poster-button
    ├── .show-details
    └── .show-actions
```

### Responsive Classes
```
.mobile (Body class for mobile)
.mobile-v1 (Enhanced mobile class)
.dark-mode (Theme class)
.mardi (Mardi Gras theme)
```

## 6. JavaScript Integration Points

### DOM Element IDs
- `#appRoot` - Main application container
- `#homeSection` - Home tab content
- `#watchingSection` - Currently watching tab
- `#wishlistSection` - Wishlist tab
- `#watchedSection` - Already watched tab
- `#discoverSection` - Discover tab
- `#searchResults` - Search results container
- `#currentlyWatchingScroll` - Currently watching carousel
- `#flickwordTile` - FlickWord game card
- `#triviaTile` - Trivia game card

### Event Listeners
- Tab switching: `.tab` buttons
- Search functionality: `#searchInput`, `#searchBtn`
- Card interactions: `.show-card`, `.card--game`
- Modal triggers: `[data-action]` attributes

## 7. CSS Variable System

### Spacing Variables
```css
:root {
  --spacing-xs: 2px;
  --spacing-sm: 4px;
  --spacing-md: 8px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
}
```

### Component Variables
```css
:root {
  --poster-w-desktop: 120px;
  --poster-h-desktop: 180px;
  --poster-w-mobile: 80px;
  --poster-h-mobile: 120px;
  --home-card-width-desktop: 184px;
  --home-card-height-desktop: 276px;
  --home-card-width-mobile: 64px;
  --home-card-height-mobile: 96px;
}
```

### Color Variables
```css
:root {
  --bg: #ffffff;
  --text: #121212;
  --primary: #e91e63;
  --card: #f7f7f9;
  --border: #dedee3;
  --success: #51cf66;
  --warning: #ffd43b;
  --danger: #f06292;
}
```

## 8. Responsive Breakpoints

### Mobile (≤768px)
- Single column layout
- Vertical card stacking
- Reduced spacing
- Touch-optimized controls

### Desktop (≥641px)
- Multi-column layout
- Horizontal card arrangements
- Full spacing system
- Hover interactions

### Small Mobile (≤480px)
- Compressed layout
- Minimal spacing
- Essential controls only
- Stacked search controls

## 9. Accessibility Structure

### ARIA Landmarks
- `role="banner"` - Header
- `role="main"` - Main content
- `role="region"` - Quote bar
- `role="dialog"` - Modals
- `role="menu"` - Account menu

### Focus Management
- Tab order follows DOM structure
- Focus indicators on all interactive elements
- Skip links (recommended addition)

## 10. Performance Considerations

### CSS Containment
- Limited use of `contain` property
- Potential for optimization in dynamic sections

### Layout Stability
- Fixed dimensions for cards prevent shifts
- Aspect ratio maintenance for images
- Skeleton loading states (recommended)

This DOM structure provides a solid foundation for the responsive layout system, with clear separation of concerns and proper semantic markup.
