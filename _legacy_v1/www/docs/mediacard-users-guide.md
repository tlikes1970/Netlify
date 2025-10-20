# MediaCard Unified System - Technical Guide

> **📚 For the complete user experience guide, see [Complete User's Guide](./complete-users-guide.md)**

## Overview

The MediaCard system provides a unified, consistent way to display TV shows and movies across all tabs in Flicklet. Each card shows essential information and provides context-appropriate actions based on the current tab and user's Pro status.

## Card Layout

### Desktop Layout (Horizontal)
```
┌─────────────────────────────────────────────────────────────┐
│ [Poster 180x270]  Title: The Fantastic 4: First Steps     │
│                   Year: 2004                               │
│                   [Movie] [Action] [Adventure]             │
│                                                             │
│                   Description text here, clamped to       │
│                   2-3 lines maximum for consistency...      │
│                                                             │
│                   ★ ★ ★ ★ ☆ (Interactive Rating)          │
│                                                             │
│                   [▶ Want to Watch] [🚫 Not Interested]    │
│                   [📺 Episode Tracking] [🔒 Export (Pro)]   │
│                                                             │
│                   Poster opens TMDB                         │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Vertical Stack)
```
┌─────────────────────────────────────────┐
│ [Poster - Full Width]                   │
│                                         │
│ Title: The Fantastic 4: First Steps    │
│ Year: 2004                              │
│ [Movie] [Action] [Adventure]            │
│                                         │
│ Description text here, clamped to       │
│ 2-3 lines maximum for consistency...    │
│                                         │
│ ★ ★ ★ ★ ☆ (Interactive Rating)          │
│                                         │
│ [▶ Want to Watch] [🚫 Not Interested]   │
│ [📺 Episode Tracking] [⋯]               │
│                                         │
│ Poster opens TMDB                       │
└─────────────────────────────────────────┘
```

## Card Components

### 1. Poster
- **Size**: 180px × 270px (2:3 aspect ratio)
- **Behavior**: Clickable, opens TMDB page
- **Loading**: Lazy-loaded for performance
- **Fallback**: Shows placeholder if image fails

### 2. Title
- **Font**: Bold, 16px
- **Clamp**: Maximum 2 lines
- **Fallback**: Uses localized title, falls back to original title

### 3. Year & Type
- **Year**: Extracted from release_date or first_air_date
- **Type**: "Movie" or "TV Show" based on media_type
- **Display**: Year followed by type badge

### 4. Genres
- **Format**: Pill-shaped badges
- **Limit**: Shows first 2 genres
- **Source**: From TMDB genre data

### 5. Description
- **Font**: 14px, gray-600 color
- **Clamp**: 2-3 lines maximum
- **Source**: TMDB overview field
- **Fallback**: "No description available"

### 6. Interactive Rating
- **Range**: 1-5 stars
- **Behavior**: Click to rate, persists immediately
- **Visual**: Amber stars for rated, gray for unrated
- **Event**: Emits `app:rating:updated` for Discover logic

### 7. Actions
Actions vary by context and user's Pro status:

#### Watching Tab Actions
- **Primary**: Want to Watch, Not Interested
- **Secondary**: Details, Episode Tracking
- **Pro**: Smart Notifications, Viewing Journey

#### Wishlist Tab Actions
- **Primary**: Move to Watching, Not Interested
- **Secondary**: Details
- **Pro**: Advanced Customization

#### Watched Tab Actions
- **Primary**: Back to Want, Not Interested
- **Secondary**: Details
- **Pro**: Extra Trivia

#### Discover Tab Actions
- **Primary**: Add to Want, Not Interested
- **Secondary**: Details
- **Pro**: Pro Preview

## Pro Features

### Pro-Locked Actions
- **Visual**: Dashed border, lock icon (🔒)
- **Behavior**: Click triggers upsell modal
- **Tooltip**: "Pro feature" on hover
- **Examples**: Smart Notifications, Viewing Journey, Advanced Customization, Extra Trivia, Pro Preview

### Pro User Experience
- **Actions**: All actions execute normally
- **Features**: Access to premium functionality
- **Visual**: No lock icons or disabled states

## Settings Configuration

### Required Settings Structure
```javascript
window.appSettings = {
  user: { 
    isPro: false  // or true for Pro users
  },
  ui: {
    actions: {
      watching: [
        { 
          id: 'move-to-wishlist', 
          label: 'Want to Watch', 
          icon: '📥', 
          primary: true, 
          pro: false, 
          handler: 'move-to-wishlist' 
        },
        { 
          id: 'export', 
          label: 'Export', 
          icon: '⬇️', 
          primary: false, 
          pro: true, 
          handler: 'export' 
        }
      ],
      wishlist: [ /* similar structure */ ],
      watched: [ /* similar structure */ ],
      discover: [ /* similar structure */ ],
      home: [ /* similar structure */ ]
    }
  }
};
```

### Action Object Properties
- **id**: Unique identifier for the action
- **label**: Display text for the button
- **icon**: Emoji or icon to display
- **primary**: Boolean - shows in main action row if true
- **pro**: Boolean - requires Pro subscription if true
- **handler**: Function name to call when executed

## Action Handlers

### Available Handlers
- `move-to-wishlist`: Move item to wishlist
- `move-to-watching`: Move item to watching
- `undo-to-wishlist`: Move item back to wishlist
- `move-to-not`: Mark as not interested
- `add-to-wishlist`: Add to wishlist (Discover)
- `details`: Open TMDB details page
- `episode-toggle`: Open episode tracking modal
- `smart-notifications`: Open Smart Notifications setup (Pro)
- `viewing-journey`: Open Viewing Journey analytics (Pro)
- `advanced-customization`: Open Advanced Customization (Pro)
- `extra-trivia`: Open Extra Trivia content (Pro)
- `pro-preview`: Open Pro Preview toggle (Pro)

### Custom Handlers
You can add custom handlers by extending the `dispatchAction` function in `actions.js`.

## Responsive Behavior

### Desktop (>640px)
- **Layout**: Horizontal (poster left, content right)
- **Actions**: All actions visible in horizontal row
- **Overflow**: No overflow menu needed

### Mobile (≤640px)
- **Layout**: Vertical stack (poster top, content bottom)
- **Actions**: Primary actions visible, secondary in overflow menu
- **Overflow**: "⋯" button reveals additional actions

## Events

### Rating Events
```javascript
// Listen for rating updates
window.addEventListener('app:rating:updated', (event) => {
  const { id, rating } = event.detail;
  // Update Discover logic, analytics, etc.
});
```

### Upsell Events
```javascript
// Listen for Pro upsell triggers
window.addEventListener('app:upsell:open', (event) => {
  const { source, item } = event.detail;
  // Open your Pro upgrade modal
  // source: 'card-action'
  // item: the media item that triggered the upsell
});
```

## Integration

### Using MediaCard in Your Code
```javascript
// Render a single card
const card = window.renderMediaCard(item, 'watching');
container.appendChild(card);

// Transform item data for MediaCard
const mediaCardData = transformForMediaCard(item, 'watching');
const card = window.renderMediaCard(mediaCardData, 'watching');
```

### Required Item Data Structure
```javascript
const item = {
  id: 12345,
  title: "The Fantastic 4: First Steps",
  year: 2004,
  type: "Movie",
  genres: ["Action", "Adventure"],
  posterUrl: "https://image.tmdb.org/t/p/w200/poster.jpg",
  tmdbUrl: "https://www.themoviedb.org/movie/12345",
  mediaType: "movie",
  userRating: 4,
  description: "Four young outsiders teleport to an alternate universe..."
};
```

## Troubleshooting

### Cards Not Rendering
1. Check if `window.renderMediaCard` is available
2. Verify item data structure matches requirements
3. Check console for JavaScript errors

### Actions Not Working
1. Verify `window.appSettings.ui.actions[context]` is defined
2. Check if action handlers exist in `actions.js`
3. Ensure user Pro status is correctly set

### Pro Actions Not Showing Upsell
1. Verify `app:upsell:open` event listener is set up
2. Check if `openProUpsell` function is working
3. Ensure Pro status detection is accurate

## Best Practices

### Performance
- Use lazy loading for poster images
- Limit description text to prevent layout shifts
- Cache action configurations

### Accessibility
- All interactive elements have proper ARIA labels
- Keyboard navigation supported
- Screen reader friendly

### User Experience
- Consistent card heights for grid layouts
- Clear visual distinction between Pro and free features
- Immediate feedback for user actions

## Future Enhancements

### Planned Features
- Drag and drop reordering
- Bulk actions
- Custom action configurations
- Advanced filtering and sorting
- Social sharing integration

### Customization Options
- Theme variations
- Custom action icons
- Flexible layout options
- Custom rating systems
