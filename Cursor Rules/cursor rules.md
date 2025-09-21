# Flicklet TV Tracker - Cursor Rules

## Project Overview
**Flicklet** is a modern TV and movie tracking web application built with vanilla JavaScript, Firebase, and TMDB API. It's a Progressive Web App (PWA) with mobile-first design, featuring user authentication, cloud sync, and comprehensive media management.

## Architecture & Framework

### Core Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build System**: Vite with Terser minification
- **Backend**: Firebase (Auth, Firestore, Storage)
- **API**: The Movie Database (TMDB) API
- **Mobile**: Capacitor for native app packaging
- **Styling**: CSS Custom Properties, Mobile-first responsive design

### Project Structure
```
www/
├── index.html                 # Main SPA entry point
├── js/                       # Core JavaScript modules
│   ├── app.js               # Main application controller
│   ├── functions.js         # Core business logic
│   ├── utils.js             # Utility functions
│   ├── auth.js              # Authentication handling
│   ├── data-init.js         # Data initialization
│   └── firebase-init.js     # Firebase setup
├── scripts/                  # Feature modules
│   ├── components/Card.js   # Unified card component
│   ├── search.js            # Search functionality
│   └── tmdb.js              # TMDB API integration
├── styles/                   # CSS modules
│   ├── main.css             # Core styles
│   ├── components.css       # Component styles
│   └── mobile.css           # Mobile-specific styles
└── netlify/functions/       # Serverless functions
```

## Key Design Patterns

### 1. Modular JavaScript Architecture
- **IIFE Pattern**: All modules use Immediately Invoked Function Expressions
- **Global Namespace**: `window.FlickletApp` as main application controller
- **Event-Driven**: Custom events for module communication (`app:data:ready`, `firebase:ready`)
- **Dependency Injection**: Functions passed as parameters to avoid tight coupling

### 2. Component-Based UI System
- **Unified Card Component**: Single `Card.js` component with variants (compact, expanded, poster)
- **CSS Custom Properties**: Centralized theming with `:root` variables
- **Mobile-First**: Responsive design with mobile breakpoints
- **Accessibility**: ARIA attributes, semantic HTML, keyboard navigation

### 3. State Management
- **Single Source of Truth**: `window.appData` global object
- **Local Storage**: Primary data persistence with Firebase sync
- **Reactive Updates**: Event listeners trigger UI updates
- **Immutable Patterns**: Data updates create new objects rather than mutating

## Coding Standards & Conventions

### JavaScript Style
```javascript
// Function naming: camelCase with descriptive verbs
function loadUserData() { }
function updateTabCounts() { }
function performSearch() { }

// Constants: UPPER_SNAKE_CASE
const TAB_IDS = ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings'];
const MOBILE_BP = 640;

// Variables: camelCase with descriptive names
let isSearching = false;
let currentQuery = '';
let searchTimeout = null;

// Objects: descriptive property names
const cardData = {
  id: item.id,
  title: item.title,
  posterUrl: item.posterUrl,
  rating: item.rating
};
```

### CSS Architecture
```css
/* CSS Custom Properties for theming */
:root {
  --fg: #1f2937;                 /* Primary text */
  --bg: #ffffff;                 /* Background */
  --muted: #374151;              /* Muted text */
  --accent: #ff4c8d;             /* Accent color */
  --border: #e5e7eb;             /* Border color */
}

/* BEM-style naming for components */
.card { }
.card--poster { }
.card__title { }
.card__actions { }

/* Mobile-first responsive design */
@media (max-width: 768px) {
  .card { /* mobile styles */ }
}
```

### HTML Structure
```html
<!-- Semantic HTML5 with accessibility -->
<main role="main">
  <section id="homeSection" class="tab-section active" aria-labelledby="homeTab">
    <div class="home-group">
      <div class="preview-row-container">
        <!-- Card components -->
      </div>
    </div>
  </section>
</main>

<!-- Data attributes for JavaScript targeting -->
<button data-action="add" data-id="123" data-list="wishlist">
  Add to Wishlist
</button>
```

## Key Functions & Modules

### Core Application (`app.js`)
- **`FlickletApp.init()`**: Main initialization sequence
- **`FlickletApp.switchToTab(tab)`**: Tab navigation with search clearing
- **`FlickletApp.updateUI()`**: UI refresh after data changes
- **`FlickletApp.saveData()`**: Firebase data persistence

### Business Logic (`functions.js`)
- **`loadListContent(listType)`**: Render list items with unified card system
- **`updateTabCounts()`**: Update tab badges with counts
- **`moveItem(id, dest)`**: Move items between lists
- **`removeItemFromCurrentList(id)`**: Remove items from current list

### Search System (`search.js`)
- **`SearchModule.performSearch()`**: Main search execution
- **`SearchModule.clearSearch()`**: Clear search and return to previous tab
- **`SearchModule.getSearchState()`**: Get current search state

### Card Component (`Card.js`)
- **`Card(options)`**: Create standardized card elements
- **`createCardData(item, source, section)`**: Normalize item data for cards

## Data Flow & State Management

### Data Sources
1. **Local Storage**: Primary data persistence (`flicklet-data`)
2. **Firebase Firestore**: Cloud sync for authenticated users
3. **TMDB API**: Movie/TV show metadata and search
4. **User Input**: Search queries, list modifications

### State Updates
```javascript
// 1. User action triggers function
moveItem(itemId, 'watched');

// 2. Update global state
appData.movies.watched.push(item);

// 3. Persist to storage
saveAppData();

// 4. Update UI
updateUI();
updateTabCounts();
```

### Event System
```javascript
// Custom events for module communication
document.dispatchEvent(new CustomEvent('app:data:ready', { 
  detail: { source: 'localStorage' } 
}));

// Event listeners in modules
document.addEventListener('app:data:ready', () => {
  updateTabCounts();
});
```

## Firebase Integration

### Authentication
- **Google Sign-In**: Primary authentication method
- **Firebase Auth**: User state management
- **Persistence**: Local storage with cloud sync

### Data Structure
```javascript
// Firestore document structure
users/{uid}/
├── profile: { email, displayName, photoURL }
├── watchlists: {
│   ├── tv: { watching: [], wishlist: [], watched: [] }
│   └── movies: { watching: [], wishlist: [], watched: [] }
│   }
└── settings: { theme, lang, username }
```

### Sync Strategy
1. **Local First**: All operations work offline
2. **Cloud Sync**: Background sync when authenticated
3. **Conflict Resolution**: Last-write-wins with timestamps

## Performance Optimizations

### Loading Strategy
- **Critical CSS**: Inlined for above-the-fold content
- **Async CSS**: Non-critical styles loaded asynchronously
- **Script Loading**: Explicit order with dependencies
- **Image Lazy Loading**: `loading="lazy"` on poster images

### Rendering Optimizations
- **Virtual Scrolling**: Large lists use virtual scrolling
- **Debounced Search**: 500ms delay on search input
- **Memoization**: Cached search results and API calls
- **Request Idle Callback**: Heavy operations deferred to idle time

## Mobile & Responsive Design

### Breakpoints
- **Mobile**: ≤640px (primary target)
- **Tablet**: 641px - 768px
- **Desktop**: ≥769px

### Mobile-Specific Features
- **Touch Gestures**: Swipe navigation for carousels
- **Viewport Units**: `100svh` for full-screen mobile
- **Safe Areas**: `env(safe-area-inset-*)` for notched devices
- **Snap Scrolling**: `scroll-snap-type` for card carousels

## Testing & Quality Assurance

### Code Quality Tools
- **ESLint**: JavaScript linting
- **JSCPD**: Duplicate code detection
- **Axe**: Accessibility testing
- **Lighthouse**: Performance auditing
- **Depcheck**: Dependency analysis

### Testing Strategy
- **Unit Tests**: Individual function testing
- **Visual Tests**: Screenshot comparison
- **Integration Tests**: End-to-end user flows
- **Performance Tests**: Core Web Vitals monitoring

## Security Considerations

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline';">
```

### Data Validation
- **Input Sanitization**: XSS prevention
- **API Validation**: TMDB response validation
- **Firebase Rules**: Server-side data validation

## Development Workflow

### Build Process
```bash
# Development
npm run dev          # Vite dev server on port 8000

# Production
npm run build        # Vite build with Terser minification
npm run preview      # Preview production build

# Quality Assurance
npm run audit:dup    # Duplicate code detection
npm run audit:dead   # Dead code analysis
npm run lint:strict  # Strict linting
npm run a11y:axe     # Accessibility audit
npm run lh:mobile    # Lighthouse mobile audit
```

### Version Management
- **Semantic Versioning**: Major.Minor.Patch
- **Auto-increment**: Version bumped on code changes
- **Rollback Support**: Easy rollback with version display

## Common Patterns & Best Practices

### Error Handling
```javascript
try {
  const result = await performOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  showNotification('Operation failed', 'error');
  return null;
}
```

### Async Operations
```javascript
// Promise-based async operations
async function loadData() {
  try {
    const data = await fetchData();
    processData(data);
  } catch (error) {
    handleError(error);
  }
}
```

### DOM Manipulation
```javascript
// Safe DOM queries with fallbacks
const element = document.getElementById('target') || 
                document.querySelector('.fallback');

if (element) {
  element.classList.add('active');
}
```

### Event Delegation
```javascript
// Use event delegation for dynamic content
document.addEventListener('click', (e) => {
  const button = e.target.closest('[data-action]');
  if (button) {
    handleAction(button.dataset.action);
  }
});
```

## Troubleshooting Guide

### Common Issues
1. **Firebase Not Loading**: Check `firebase-config.js` and network connectivity
2. **Search Not Working**: Verify TMDB API key and `searchTMDB` function
3. **Cards Not Rendering**: Check `Card.js` component and CSS classes
4. **Mobile Layout Issues**: Verify viewport meta tag and CSS breakpoints

### Debug Tools
- **Console Logging**: Extensive logging with `[module]` prefixes
- **Performance Monitor**: Built-in performance tracking
- **Error Boundaries**: Graceful error handling with fallbacks

## Future Considerations

### Scalability
- **Code Splitting**: Lazy load non-critical modules
- **Service Workers**: Offline functionality and caching
- **CDN Integration**: Static asset optimization

### Feature Roadmap
- **Real-time Sync**: WebSocket integration for live updates
- **Advanced Search**: Filters, sorting, and saved searches
- **Social Features**: Sharing and collaboration
- **Analytics**: User behavior tracking and insights

---

*This document serves as the definitive guide for understanding and working with the Flicklet TV Tracker codebase. Keep it updated as the project evolves.*
