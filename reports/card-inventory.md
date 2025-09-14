# Card Inventory Report - Flicklet TV Tracker

**Date:** January 12, 2025  
**Version:** v23.74-POSTERS-HOME-PAGE-FIX  
**Scope:** Card Types, Properties, Actions & Image Rules

## 1. Card Type Overview

The application uses a hybrid card system with both legacy and modern implementations, standardized around a 2:3 aspect ratio for all poster-based cards.

## 2. Card Types Identified

### 2.1 Show Card (Legacy System)
**Primary Use:** Main content display in tabs and search results  
**CSS Classes:** `.show-card`  
**Layout:** Desktop - horizontal (poster left, content right), Mobile - vertical (poster top, content below)

#### Structure
```html
<div class="show-card">
  <div class="poster-button">
    <img class="show-poster" src="..." alt="...">
    <div class="poster-overlay"></div>
  </div>
  <div class="show-details">
    <div class="show-title-row">
      <h3 class="show-title">Title</h3>
      <span class="program-status-badge">Status</span>
    </div>
    <div class="show-meta">Meta information</div>
    <div class="show-overview">Description</div>
    <div class="rating-container">
      <div class="star-rating">★★★★☆</div>
      <div class="like-dislike">👍👎</div>
    </div>
    <div class="show-actions">
      <button class="btn">Watch</button>
      <button class="btn">Wishlist</button>
      <button class="btn">Rate</button>
    </div>
  </div>
</div>
```

#### Properties
- **Poster Dimensions:** 120px × 180px (desktop), 80px × 120px (mobile)
- **Aspect Ratio:** 2:3 (locked)
- **Actions:** Watch/Unwatch, Add to Wishlist, Rate (1-5 stars), Like/Dislike
- **Status Badge:** Program status (On Air, Ended, Upcoming, etc.)
- **Responsive:** Full responsive behavior with mobile-specific layout

### 2.2 Preview Card (Home Page)
**Primary Use:** Horizontal scrolling carousels on home page  
**CSS Classes:** `.preview-card`  
**Layout:** Compact horizontal cards in scrolling containers

#### Structure
```html
<div class="preview-card">
  <div class="preview-card-poster">
    <img src="..." alt="...">
  </div>
  <div class="preview-card-content">
    <h4 class="preview-card-title">Title</h4>
    <p class="preview-card-year">Year</p>
  </div>
  <div class="preview-card-status">Status</div>
  <div class="preview-card-actions">
    <button class="preview-action-btn">+</button>
  </div>
</div>
```

#### Properties
- **Poster Dimensions:** 184px × 276px (desktop), 64px × 96px (mobile)
- **Aspect Ratio:** 2:3 (locked)
- **Actions:** Quick add buttons (hover reveal)
- **Status:** Compact status indicators
- **Scrolling:** Horizontal scroll with snap behavior

### 2.3 Game Card (Modern System)
**Primary Use:** FlickWord and Daily Trivia games  
**CSS Classes:** `.card.card--game`  
**Layout:** Vertical card with header, body, and actions

#### Structure
```html
<article class="card card--game">
  <div class="card__header">
    <h3 class="card__title">Game Title</h3>
    <div class="card__tools">
      <div class="game-stats">
        <div class="stat-item">
          <span class="stat-label">Streak</span>
          <span class="stat-value">0</span>
        </div>
        <!-- More stats -->
      </div>
    </div>
  </div>
  <div class="card__body card__body--scroll">
    <p class="card__description">Description</p>
  </div>
  <div class="card__actions">
    <button class="btn btn--primary">Play Now</button>
  </div>
</article>
```

#### Properties
- **Dimensions:** Flexible height, fixed width
- **Actions:** Play game, view stats
- **Stats:** Streak, best score, win percentage
- **Modal:** Opens game in modal overlay

### 2.4 Spotlight Card (Community)
**Primary Use:** Featured content in community section  
**CSS Classes:** `.spotlight-*`  
**Layout:** Two-column layout with video and information

#### Structure
```html
<div class="spotlight-grid">
  <div class="spotlight-video">
    <iframe src="..."></iframe>
  </div>
  <div class="spotlight-info">
    <div class="spotlight-meta">
      <h3 class="spotlight-title">Title</h3>
      <p class="spotlight-credit">Credit</p>
      <p class="spotlight-desc">Description</p>
    </div>
    <div class="spotlight-badges">
      <span class="badge">Tag</span>
    </div>
    <div class="spotlight-cta">
      <button class="btn">Action</button>
    </div>
  </div>
</div>
```

#### Properties
- **Video Aspect:** 4:3 (default), 9:16 (vertical), 16:9 (landscape)
- **Actions:** Play video, view details
- **Badges:** Content tags and categories
- **Responsive:** Stacks vertically on mobile

## 3. Image Policies & Rules

### 3.1 TMDB Integration
**Source:** The Movie Database (TMDB) API  
**Image Sizes:** Multiple sizes available via TMDB API  
**Fallback:** SVG placeholder with 2:3 aspect ratio

#### Image Sizing Strategy
```css
/* Desktop Posters */
.show-poster, .poster-placeholder {
  width: var(--poster-w-desktop); /* 120px */
  height: var(--poster-h-desktop); /* 180px */
  aspect-ratio: 2/3;
  object-fit: cover;
}

/* Mobile Posters */
@media (max-width: 640px) {
  .show-poster, .poster-placeholder {
    width: var(--poster-w-mobile); /* 80px */
    height: var(--poster-h-mobile); /* 120px */
  }
}
```

### 3.2 Image Loading Strategy
- **Lazy Loading:** Not implemented (recommended)
- **Placeholder:** SVG fallback during loading
- **Error Handling:** Graceful fallback to placeholder
- **Aspect Ratio:** Maintained during loading to prevent CLS

### 3.3 Image Optimization
- **Format:** WebP preferred, JPEG fallback
- **Sizing:** Responsive images with proper srcset
- **Compression:** TMDB handles compression
- **Caching:** Browser caching for repeated views

## 4. Card Actions & Interactions

### 4.1 Show Card Actions
```javascript
// Primary Actions
- toggleWatch() // Add/remove from currently watching
- toggleWishlist() // Add/remove from wishlist
- rateShow(rating) // Rate 1-5 stars
- toggleLike() // Like/dislike
- toggleDislike() // Dislike/like

// Secondary Actions
- showDetails() // View full details
- shareShow() // Share content
- reportIssue() // Report problems
```

### 4.2 Preview Card Actions
```javascript
// Quick Actions
- quickAdd() // Add to list without full view
- quickWatch() // Start watching
- quickWishlist() // Add to wishlist
```

### 4.3 Game Card Actions
```javascript
// Game Actions
- startGame() // Open game modal
- viewStats() // View detailed statistics
- resetProgress() // Reset game progress
```

## 5. CSS Architecture

### 5.1 Card Base Classes
```css
.card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-2px);
}
```

### 5.2 Responsive Card System
```css
/* Mobile Card Layout */
@media (max-width: 768px) {
  .show-card {
    display: grid;
    grid-template-columns: var(--poster-w-mobile) 1fr;
    gap: var(--card-gap-mobile);
    padding: var(--card-pad-y-mobile) var(--card-pad-x-mobile);
  }
}

/* Desktop Card Layout */
@media (min-width: 769px) {
  .show-card {
    display: grid;
    grid-template-columns: var(--poster-w-desktop) 1fr;
    gap: var(--card-gap-desktop);
    padding: var(--card-pad-y-desktop) var(--card-pad-x-desktop);
  }
}
```

## 6. State Management

### 6.1 Card States
- **Loading:** Skeleton or placeholder state
- **Loaded:** Full content displayed
- **Error:** Error state with retry option
- **Empty:** No content available
- **Interactive:** User can interact with card

### 6.2 Action States
- **Default:** Normal appearance
- **Hover:** Enhanced visual feedback
- **Active:** Currently selected/active
- **Disabled:** Not available for interaction
- **Loading:** Action in progress

## 7. Accessibility Features

### 7.1 ARIA Labels
```html
<button class="btn" aria-label="Add to Currently Watching">
  <span class="icon" aria-hidden="true">▶️</span>
  <span class="label">Watch</span>
</button>
```

### 7.2 Keyboard Navigation
- **Tab Order:** Logical tab sequence
- **Focus Indicators:** Visible focus states
- **Keyboard Shortcuts:** Arrow keys for carousels
- **Escape Key:** Close modals and overlays

### 7.3 Screen Reader Support
- **Semantic HTML:** Proper heading hierarchy
- **Live Regions:** Dynamic content updates
- **Alt Text:** Descriptive image alternatives
- **Role Attributes:** Proper ARIA roles

## 8. Performance Considerations

### 8.1 Card Rendering
- **Virtual Scrolling:** Not implemented (recommended for large lists)
- **Lazy Loading:** Not implemented (recommended)
- **Image Optimization:** TMDB handles optimization
- **CSS Containment:** Limited use (recommended)

### 8.2 Memory Management
- **Event Listeners:** Proper cleanup on card removal
- **Image Caching:** Browser handles caching
- **DOM Cleanup:** Cards removed from DOM when not needed

## 9. Recommendations

### 9.1 Immediate Improvements
1. **Implement lazy loading** for all card images
2. **Add skeleton loaders** for loading states
3. **Implement virtual scrolling** for large lists
4. **Add CSS containment** for performance

### 9.2 Medium Priority
1. **Standardize card actions** across all card types
2. **Implement progressive enhancement** for images
3. **Add keyboard shortcuts** for common actions
4. **Improve error handling** for failed image loads

### 9.3 Long Term
1. **Migrate to single card system** (remove legacy)
2. **Implement card animations** with proper performance
3. **Add card customization** options
4. **Implement card analytics** for user behavior

## 10. Conclusion

The card system is well-structured with proper responsive behavior and accessibility features. The main areas for improvement focus on performance optimization through lazy loading and virtual scrolling, as well as standardizing the action system across all card types. The 2:3 aspect ratio standardization is excellent and should be maintained across all future card implementations.
