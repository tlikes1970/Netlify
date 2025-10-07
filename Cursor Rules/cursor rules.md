# Flicklet TV Tracker - Cursor Rules

## CRITICAL: Code Review Standards

**NEVER make assumptions or pull conclusions from git history when asked to review code.**

When asked to perform ANY level of code review (forensic, detailed, or otherwise):
1. **Read the actual code files line by line**
2. **Test the current state in the browser**
3. **Verify functionality with real data**
4. **Never assume based on git commits or previous work**
5. **Always provide evidence-based analysis**

Git history shows what was changed, not what is currently working. Always verify the current state.

## Project Overview

**Flicklet** is a modern TV and movie tracking web application built with vanilla JavaScript, Firebase, and TMDB API. It's a Progressive Web App (PWA) with mobile-first design, featuring user authentication, cloud sync, and comprehensive media management.

**Current Version**: v28.103.0 (Complete Data Flow & Poster Resolution)
**Status**: Phase 4 - Complete Data Flow & Poster Resolution Complete

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
├── index.html                 # Main SPA entry point (v28.103.0)
├── js/                       # Core JavaScript modules
│   ├── app.js               # Main application controller
│   ├── functions.js         # Core business logic (updated for v2)
│   ├── functions-v2.js      # Enhanced functions with new data ops
│   ├── utils.js             # Utility functions
│   ├── auth.js              # Authentication handling
│   ├── data-init.js         # Data initialization
│   ├── firebase-init.js     # Firebase setup
│   ├── data-migration.js    # Data structure migration (v28.81)
│   ├── watchlists-adapter-v2.js # Single source of truth (v28.81)
│   ├── data-operations.js   # Unified data operations API (v28.81)
│   ├── notification-system.js # User feedback system (v28.82)
│   └── ui-integration.js    # UI event integration (v28.82)
├── scripts/                  # Feature modules
│   ├── components/Card.js   # Unified card component
│   ├── search.js            # Search functionality
│   └── tmdb.js              # TMDB API integration
├── styles/                   # CSS modules
│   ├── main.css             # Core styles
│   ├── components.css       # Component styles
│   └── mobile.css           # Mobile-specific styles
├── tests/                    # Comprehensive test suite
│   ├── data-flow-audit.spec.ts # Data flow validation tests
│   ├── debug-integration.spec.ts # Integration debugging
│   └── debug-ui-integration.spec.ts # UI integration tests
└── netlify/functions/       # Serverless functions
```

## Data Architecture (v28.81+)

### 1. Single Source of Truth - WatchlistsAdapterV2
- **Purpose**: Centralized data management with Firebase-standardized structure
- **Location**: `www/js/watchlists-adapter-v2.js`
- **Features**: Race condition prevention, error handling, data migration
- **Data Structure**: `{watchingIds: [], wishlistIds: [], watchedIds: []}`

### 2. Unified Data Operations - DataOperations
- **Purpose**: Consistent API for all data operations (add, move, remove)
- **Location**: `www/js/data-operations.js`
- **Features**: Event emission, error handling, automatic saving
- **Events**: `item:added`, `item:moved`, `item:removed`, `item:*:error`

### 3. UI Integration System
- **Purpose**: Connects data operations to UI updates and notifications
- **Location**: `www/js/ui-integration.js`
- **Features**: Event listening, UI refresh, notification display
- **Dependencies**: DataOperations, NotificationSystem

### 4. Notification System
- **Purpose**: User feedback for all data operations
- **Location**: `www/js/notification-system.js`
- **Features**: Success/error messages, auto-dismiss, responsive design
- **Types**: success, error, warning, info

### 5. Data Migration
- **Purpose**: Seamless transition from old to new data structures
- **Location**: `www/js/data-migration.js`
- **Features**: Backward compatibility, structure validation, error handling

## Key Design Patterns

### 1. Modular JavaScript Architecture

- **IIFE Pattern**: All modules use Immediately Invoked Function Expressions
- **Global Namespace**: `window.FlickletApp` as main application controller
- **Event-Driven**: Custom events for module communication (`app:data:ready`, `firebase:ready`)
- **Dependency Injection**: Functions passed as parameters to avoid tight coupling

### 2. Component-Based UI System

- **Unified Card Component**: Single `Card.js` component with variants (compact, expanded, poster)
- **Floating Action Buttons (FABs)**: Always-visible action buttons docked to active tab
- **CSS Custom Properties**: Centralized theming with `:root` variables
- **Mobile-First**: Responsive design with mobile breakpoints
- **Accessibility**: ARIA attributes, semantic HTML, keyboard navigation

### 3. State Management

- **Single Source of Truth**: `window.appData` global object
- **Local Storage**: Primary data persistence with Firebase sync
- **Reactive Updates**: Event listeners trigger UI updates
- **Immutable Patterns**: Data updates create new objects rather than mutating

## Coding Standards & Conventions

### CSS !important Policy

**GENERAL RULE: Avoid `!important` declarations entirely.** Use proper CSS specificity, cascade order, and architectural patterns instead.

**PROHIBITED USES:**
- Layout properties on core containers (html, body, #appRoot, .panels, #homeSection, header, #navigation/.tab-container, .top-search, .fab-dock/.fab)
- Component styling and responsive design
- Theme and color overrides
- Flexbox and Grid layout properties
- Positioning and sizing properties

**ALLOWED EXCEPTIONS (with strict documentation):**
- Third-party library overrides (with `/* OVERRIDE: library-name | reason | owner */`)
- Accessibility utilities (`.sr-only`, `.skip-link`, focus indicators)
- OS/UA bug workarounds (with `/* BUGFIX: browser-version | issue | owner | expires */`)
- Critical security-related overrides (with `/* SECURITY: reason | owner */`)

**REQUIREMENTS FOR ALL EXCEPTIONS:**
- Must include comment: `/* WHY | OWNER | EXPIRES */`
- Must be documented in code review
- Must have plan for removal
- Preflight validation required; STOP on selector mismatch

**Up-arrow control**: appears only after the tab bar exits viewport; fixed bottom-center; no layout !important; created via JS (idempotent) and styled in CSS.
Preflight validation required for sentinel tablist. If missing, fallback shows after 400px scroll.
Do not change sticky search or FAB positioning.

### CSS Specificity & Cascade Order

**PREFERRED ALTERNATIVES TO `!important`:**

1. **Increase Specificity**: Use more specific selectors
   ```css
   /* Instead of: .btn { color: red !important; } */
   .card .btn.btn--primary { color: red; }
   ```

2. **Use CSS Custom Properties**: Leverage CSS variables for overrides
   ```css
   :root { --btn-color: #007bff; }
   .btn { color: var(--btn-color); }
   .theme-dark { --btn-color: #ffffff; }
   ```

3. **Reorder CSS Files**: Place more specific styles after general ones
   ```css
   /* main.css - general styles */
   .btn { padding: 8px 16px; }
   
   /* components.css - specific overrides */
   .card .btn { padding: 12px 20px; }
   ```

4. **Use Attribute Selectors**: Higher specificity without !important
   ```css
   /* Instead of: .input { width: 100% !important; } */
   .search-row input[type="text"] { width: 100%; }
   ```

5. **Leverage CSS Cascade**: Use natural cascade order
   ```css
   /* Later files override earlier ones naturally */
   /* mobile.css can override main.css without !important */
   ```

**CSS LOAD ORDER (in index.html):**
1. `spacing-system.css` - CSS variables and base spacing
2. `main.css` - Core application styles
3. `components.css` - Component-specific styles
4. `mobile.css` - Mobile-specific overrides
5. `home.css` - Home page specific styles

### JavaScript Style

```javascript
// Function naming: camelCase with descriptive verbs
function loadUserData() {}
function updateTabCounts() {}
function performSearch() {}

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
  rating: item.rating,
};
```

### CSS Architecture

```css
/* CSS Custom Properties for theming */
:root {
  --fg: #1f2937; /* Primary text */
  --bg: #ffffff; /* Background */
  --muted: #374151; /* Muted text */
  --accent: #ff4c8d; /* Accent color */
  --border: #e5e7eb; /* Border color */
}

/* BEM-style naming for components */
.card {
}
.card--poster {
}
.card__title {
}
.card__actions {
}

/* Mobile-first responsive design */
@media (max-width: 768px) {
  .card {
    /* mobile styles */
  }
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

<!-- Floating Action Buttons -->
<button id="btnSettings" class="fab-left" aria-label="Go to settings" title="Go to Settings">
  <span aria-hidden="true">⚙️</span>
</button>

<div class="fab-stack">
  <button id="themeToggleFab" class="fab" aria-label="Toggle theme" title="Toggle Light/Dark Mode">
    <span aria-hidden="true">🌙</span>
  </button>
  <button
    id="mardiGrasFab"
    class="fab"
    aria-label="Toggle Mardi Gras mode"
    title="Toggle Mardi Gras Mode"
  >
    <span aria-hidden="true">🎭</span>
  </button>
</div>

<!-- Data attributes for JavaScript targeting -->
<button data-action="add" data-id="123" data-list="wishlist">Add to Wishlist</button>
```

## Key Functions & Modules

### Core Application (`app.js`)

- **`FlickletApp.init()`**: Main initialization sequence
- **`FlickletApp.switchToTab(tab)`**: Tab navigation with search clearing
- **`FlickletApp.updateUI()`**: UI refresh after data changes
- **`FlickletApp.saveData()`**: Firebase data persistence
- **`FlickletApp.toggleTheme()`**: Theme switching (light/dark/system)
- **`FlickletApp.toggleMardiGras()`**: Mardi Gras mode toggle
- **`FlickletApp.dockFABsToActiveTab()`**: Floating Action Button positioning
- **`FlickletApp.initializeFABIcons()`**: FAB icon state initialization

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

### Floating Action Button System

- **`dockFABsToActiveTab()`**: Positions FABs relative to active tab
- **`initializeFABIcons()`**: Sets initial FAB icons based on current state
- **FAB Event Handlers**: Click handlers for settings, theme, and Mardi Gras toggles
- **CSS Classes**: `.fab`, `.fab-left`, `.fab-stack`, `.fab-dock` for positioning

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
document.dispatchEvent(
  new CustomEvent('app:data:ready', {
    detail: { source: 'localStorage' },
  }),
);

// Event listeners in modules
document.addEventListener('app:data:ready', () => {
  updateTabCounts();
});
```

## Firebase Integration

### Authentication

- **Google Sign-In**: Primary authentication method
- **Apple Sign-In**: Secondary authentication method
- **Email/Password**: Tertiary authentication method
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
└── settings: { theme, lang, username, mardi }
```

### Sync Strategy

1. **Local First**: All operations work offline
2. **Cloud Sync**: Background sync when authenticated
3. **Conflict Resolution**: Last-write-wins with timestamps

## Theme & UI System

### Theme Management

- **ThemeManager**: Centralized theme control (`theme-manager.js`)
- **Theme Options**: `light`, `dark`, `system` (follows OS preference)
- **Mardi Gras Mode**: Special festive theme toggle (`on`/`off`)
- **CSS Variables**: Dynamic theming with `:root` custom properties
- **Body Classes**: `mardi` class for Mardi Gras styling

### Floating Action Buttons (FABs)

- **Settings FAB**: Left-side button for settings navigation
- **Theme Toggle FAB**: Right-side button for light/dark mode
- **Mardi Gras FAB**: Right-side button for festive mode toggle
- **Dynamic Positioning**: FABs dock to active tab's bottom area
- **Icon Updates**: Icons change based on current state
- **Accessibility**: Proper ARIA labels and keyboard support

### CSS Architecture for FABs

```css
/* FAB positioning and styling */
.fab,
.fab-left {
  position: static !important;
  background: none !important;
  box-shadow: none !important;
  color: var(--text, #1f2937);
  font-size: 24px;
  transition: all 0.2s ease;
}

.fab-dock {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 16px;
  pointer-events: none;
}

.fab-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}
```

## Current Technical Debt & Code Quality Issues

### Phase 2 Analysis Results (v28.31.0)

**Critical Issues Identified:**

#### 1. Massive Code Duplication

- **552 functions across 75 files** - excessive function proliferation
- **Monolithic files**: `functions.js` (3,513 lines) contains mixed responsibilities
- **Duplicate card systems**: 3+ different card implementations
- **Repeated patterns**: Similar functions across multiple modules

#### 2. Architectural Problems

- **Mixed patterns**: IIFE, ES6 modules, and global functions mixed together
- **Global namespace pollution**: 552+ functions in global scope
- **Circular dependencies**: Functions calling each other across modules
- **No clear separation of concerns**: Business logic mixed with UI code

#### 3. Performance Issues

- **Large bundle size**: Multiple large files loaded synchronously
- **Redundant API calls**: Similar data fetched multiple times
- **Memory leaks**: Event listeners not properly cleaned up
- **Inefficient DOM queries**: Repeated `getElementById` calls

#### 4. Code Quality Issues

- **Inconsistent naming**: camelCase, snake_case, and kebab-case mixed
- **No error handling**: Many functions lack try-catch blocks
- **Magic numbers**: Hardcoded values throughout
- **Dead code**: Commented out code and unused functions

### Phase 2 Remediation Plan

1. **Consolidate duplicate functions** into shared utilities
2. **Refactor monolithic files** into focused modules
3. **Implement consistent patterns** (ES6 modules throughout)
4. **Remove dead code** and unused functions
5. **Optimize bundle loading** with proper module system
6. **Add proper error handling** and validation
7. **Enforce coding standards** with consistent naming and structure

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
- **Render Guards**: Prevent duplicate rendering with `window.render_*` flags
- **Deduplication**: Set-based ID filtering to prevent duplicate items
- **Performance Logging**: Console output for debugging render cycles

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

### Data Flow Testing (v28.81+)
- **Comprehensive Test Suite**: 18 Playwright tests covering complete data flow
- **Test Coverage**: Search → Add → Move → Remove → UI Updates → Notifications
- **Test Files**: 
  - `tests/data-flow-audit.spec.ts` - Main data flow validation
  - `tests/debug-integration.spec.ts` - Integration debugging
  - `tests/debug-ui-integration.spec.ts` - UI integration testing
- **Success Rate**: 6/18 tests passing (33%) - Core functionality working
- **Test Categories**: High Priority (data integrity), Medium Priority (UI integration)

### Test Execution
```bash
# Run all data flow tests
npx playwright test tests/data-flow-audit.spec.ts --headed

# Run specific test categories
npx playwright test tests/data-flow-audit.spec.ts --grep "Search to Add Flow"
npx playwright test tests/data-flow-audit.spec.ts --grep "Move Between Lists"

# Debug integration issues
npx playwright test tests/debug-integration.spec.ts --headed
```

### Core Testing Principles (CRITICAL)

#### Never Assume Rule
- **NEVER assume** code works without testing
- **NEVER assume** changes don't break other functionality  
- **NEVER assume** data structures match expectations
- **NEVER assume** UI changes are visible without verification
- **ALWAYS verify** with actual testing before proceeding

#### Always Test Before Moving On Rule
- **MANDATORY**: Test every change before moving to the next task
- **MANDATORY**: Verify functionality works end-to-end
- **MANDATORY**: Check that changes don't break existing features
- **MANDATORY**: Confirm visual changes are actually visible
- **STOP**: If any test fails, fix before proceeding

### Pre-Development Validation Requirements

Before making any code changes, the assistant must:

1. **API Key Validation**
   - Verify TMDB API key in meta tag is valid and functional
   - Test one API call to ensure openTMDBLink works without errors
   - If API key invalid, STOP and request valid key from user

2. **Data Source Validation**
   - Confirm all data sources use real, valid IDs (not fake/sample data)
   - Verify data structure matches what functions expect
   - If using sample data, STOP and request real data or different approach

3. **End-to-End Testing Requirements**
   - Test all interactive elements (clicks, navigation) work without errors
   - Verify visual changes are actually visible and functional
   - Confirm settings changes affect display as expected
   - If any test fails, STOP and fix before proceeding

4. **Visual Verification (Mandatory)**
   - Before coding: Take screenshot of current state
   - After coding: Take screenshot of new state
   - Verify changes are visible and functional
   - If no visual change, STOP and debug rendering

### Code Quality Tools

- **ESLint**: JavaScript linting
- **JSCPD**: Duplicate code detection
- **Axe**: Accessibility testing
- **Lighthouse**: Performance auditing
- **Depcheck**: Dependency analysis

### Accessibility Standards

- **WCAG 2.1 AA Compliance**: All components must meet accessibility standards
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG AA compliant color ratios
- **Focus Management**: Clear focus indicators and logical tab order

#### WCAG 2.1 AA Compliance Checkpoints

- **Perceivable**:
  - Text alternatives for images and media
  - Captions and transcripts for video content
  - Sufficient color contrast (4.5:1 for normal text, 3:1 for large text)
  - Resizable text up to 200% without loss of functionality
- **Operable**:
  - Keyboard accessible for all functionality
  - No seizure-inducing content (flashing < 3 times per second)
  - Clear navigation and consistent UI patterns
  - Sufficient time limits with ability to extend or disable
- **Understandable**:
  - Clear language and readable text
  - Consistent navigation and functionality
  - Error identification and suggestions for correction
  - Help and documentation available
- **Robust**:
  - Valid, semantic HTML markup
  - Compatible with assistive technologies
  - Future-proof code that works with evolving technologies

### Testing Strategy

- **Unit Tests**: Individual function testing
- **Visual Tests**: Screenshot comparison
- **Integration Tests**: End-to-end user flows
- **Performance Tests**: Core Web Vitals monitoring

### Testing Best Practices (v28.103)
**CRITICAL**: Always test complete user journeys, not individual components in isolation.

#### ✅ Required Testing Approach
1. **End-to-End Flow Testing**: Test complete user journeys (Search → Add → Move → Display)
2. **Data Consistency Verification**: Verify same data appears across all components
3. **Cross-Component Validation**: Ensure all card systems use consistent data transformation
4. **Real User Scenarios**: Test actual user workflows, not just technical components
5. **Comprehensive Debugging**: When issues found, compare working vs broken components side-by-side

#### ❌ Testing Anti-Patterns (Avoid These)
1. **Component Isolation**: Testing individual components without integration
2. **Assumption-Based Testing**: Assuming components work without verification
3. **Incomplete Data Verification**: Not checking that data flows correctly between components
4. **Fragmented Testing**: Testing pieces separately instead of complete flows
5. **Insufficient Debugging**: Not digging deep enough when issues are found

#### 🎯 Testing Success Criteria
- **Complete Flow**: Search → Add → Move → Home Display works end-to-end
- **Data Consistency**: Same poster URLs, titles, and metadata across all components
- **User Experience**: Actual user workflows function correctly
- **Cross-Platform**: Works on both list tabs and home page
- **Real Data**: Uses actual TMDB data, not placeholders or test data

## Security Considerations

### Content Security Policy

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline';"
/>
```

### Data Validation

- **Input Sanitization**: XSS prevention
- **API Validation**: TMDB response validation
- **Firebase Rules**: Server-side data validation

## Development Workflow

### Phase-Based Development

**Current Phase**: Phase 4 - Complete Data Flow & Poster Resolution Complete

- **Phase 1**: ✅ Repository Hygiene (Gate A) - COMPLETED
- **Phase 2**: ✅ Code Quality & Technical Debt (Gate B) - COMPLETED
- **Phase 3**: ✅ Performance Optimization (Gate C) - COMPLETED
- **Phase 4**: ✅ Complete Data Flow & Poster Resolution (Gate D) - COMPLETED
- **Phase 5**: ⏳ Feature Enhancement & Testing (Gate E) - NEXT

### Build Process

```bash
# Development
netlify dev          # Netlify dev server on port 8888 (serves from www/)

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

### ⚠️ CRITICAL: Server Management Rule

**NEVER START A SECOND DEVELOPMENT SERVER** - The user always has a server running. Starting a second server will cause port conflicts and break the development environment.

- **Current Server**: User maintains their own development server
- **Assistant Action**: Only make code changes, never run `npm run dev`, `netlify dev`, or any server commands
- **Port Conflicts**: Multiple servers on same port will cause errors and break functionality
- **Hot Reload**: User's existing server will automatically reload changes made by the assistant

### Version Management

- **Semantic Versioning**: Major.Minor.Patch (currently v28.103.0)
- **Auto-increment**: Version bumped on code changes [[memory:8428544]]
- **Rollback Support**: Easy rollback with version display
- **Version Location**: Updated in `www/index.html` title tag and `package.json`
- **Change Tracking**: Version comments document what was fixed
- **Phase Tracking**: Version reflects current development phase

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
const element = document.getElementById('target') || document.querySelector('.fallback');

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

**⚠️ IMPORTANT**: Before troubleshooting, always check recent git history and current version to avoid duplicating recent work.

1. **Firebase Not Loading**: Check `firebase-config.js` and network connectivity
2. **Search Not Working**: Verify TMDB API key and `searchTMDB` function
3. **Cards Not Rendering**: Check `Card.js` component and CSS classes
4. **Mobile Layout Issues**: Verify viewport meta tag and CSS breakpoints
5. **FABs Not Visible**: Check `dockFABsToActiveTab()` calls in app initialization
6. **Settings FAB Opens Modal**: Verify `aria-haspopup="dialog"` is removed from HTML
7. **Mardi Gras Not Working**: Check `ThemeManager.mardi` property and CSS `.mardi` class
8. **FAB Styling Issues**: Verify CSS overrides with `!important` declarations
9. **Tab Visibility Issues**: Check recent commits - extensive work done in v28.80-v28.102
10. **Modal Blocking**: Review recent modal fixes and test fixture updates
11. **Layout Problems**: Verify CSS specificity fixes implemented in recent versions

### Debug Tools

- **Console Logging**: Extensive logging with `[module]` prefixes
- **Performance Monitor**: Built-in performance tracking
- **Error Boundaries**: Graceful error handling with fallbacks

## FlickWord Game System

### Overview

FlickWord is a Wordle-style daily word guessing game integrated into the Flicklet app. It features a modal-based interface with responsive design, dynamic stats tracking, and keyboard color feedback.

### Architecture

#### Core Files

- **`www/features/flickword-v2.html`** - Main game implementation (iframe content)
- **`www/scripts/modules/flickword-modal.js`** - Modal control and stats management
- **`www/index.html`** - Game launcher and stats display (lines 536-575)
- **`www/styles/main.css`** - Modal and stats styling (lines 2670-2715)

#### Game Flow

1. **Launch**: User clicks FlickWord button → opens modal with iframe
2. **Play**: User enters 5-letter words → gets color feedback
3. **Complete**: Game ends → stats update → modal closes
4. **Stats**: Main page displays updated statistics

### Key Components

#### 1. Modal System

```html
<!-- Game Modal Structure -->
<div class="game-modal" id="modal-flickword" aria-hidden="true" role="dialog">
  <div class="gm-overlay" data-close></div>
  <div class="gm-dialog" role="document">
    <header class="gm-header">
      <h3 id="modal-flickword-title">🎯 FlickWord</h3>
      <button class="gm-close" type="button" aria-label="Close" data-close>&times;</button>
    </header>
    <main class="gm-body">
      <iframe
        id="flickword-game-frame"
        src="/features/flickword-v2.html"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    </main>
  </div>
</div>
```

#### 2. Stats Display

```html
<!-- Stats Card Layout -->
<div class="game-stats">
  <!-- Top Row: Overall Performance -->
  <div class="stat-item">
    <span class="stat-label">Games</span>
    <span class="stat-value" data-fw-games>0</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Won</span>
    <span class="stat-value" data-fw-won>0</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Lost</span>
    <span class="stat-value" data-fw-lost>0</span>
  </div>
  <!-- Bottom Row: Current Performance -->
  <div class="stat-item">
    <span class="stat-label">Streak</span>
    <span class="stat-value" data-fw-streak>0</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Best</span>
    <span class="stat-value" data-fw-best>0</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Win %</span>
    <span class="stat-value" data-fw-win>—</span>
  </div>
</div>
```

#### 3. Game Logic (flickword-v2.html)

- **Word Generation**: Daily word from API with fallback to word list
- **Validation**: Dictionary API check for valid words
- **Scoring**: Letter-by-letter comparison with color coding
- **Keyboard**: Dynamic color updates based on letter status
- **Communication**: PostMessage API for modal control

### CSS Architecture

#### Responsive Sizing

```css
:root {
  --tile: clamp(36px, 6vw, 56px);
  --gap: clamp(4px, 0.8vw, 8px);
  --key: clamp(28px, 6vw, 44px);
}
```

#### Keyboard Colors

```css
.key.correct {
  background-color: #20b265;
  color: white;
}
.key.present {
  background-color: #f7c23c;
  color: white;
}
.key.absent {
  background-color: #6b7280;
  color: white;
}
```

#### Stats Grid Layout

```css
#flickwordTile .game-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
@media (max-width: 640px) {
  #flickwordTile .game-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Data Management

#### LocalStorage Keys

- **`flickword:stats`** - Main stats storage
- **`flickword:results`** - Daily game results
- **`flickword:word`** - Daily word cache
- **`flicklet-data`** - App-wide data (includes FlickWord stats)

#### Stats Structure

```javascript
{
  games: 15,        // Total games played
  wins: 14,         // Games won
  losses: 1,        // Games lost
  streak: 0,        // Current win streak
  maxStreak: 14     // Longest streak achieved
}
```

### Event System

#### Modal Events

- **`openFlickWordModal()`** - Opens game modal
- **`closeFlickWordModal()`** - Closes modal and updates stats
- **Escape key** - Closes modal
- **Overlay click** - Closes modal

#### Game Events (PostMessage)

- **`flickword:close`** - Game requests modal close
- **`flickword:result`** - Game completion with stats

### Accessibility Features

- **ARIA attributes**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- **Keyboard navigation**: Tab order, Escape key support
- **Focus management**: Focus trap within modal
- **Screen reader support**: Semantic HTML and ARIA labels

### Mobile Responsiveness

- **Viewport scaling**: CSS custom properties with `clamp()`
- **Touch targets**: Minimum 44px touch targets
- **Grid adaptation**: 3-column desktop, 2-column mobile
- **Modal sizing**: Full-screen on mobile, constrained on desktop

### Integration Points

- **Main App**: Launched from home page game section
- **Stats System**: Updates main app stats display
- **Modal System**: Uses shared modal infrastructure
- **Storage**: Integrates with app-wide localStorage system

### Troubleshooting Guide

#### Common Issues

1. **Modal won't open**: Check event listener attachment timing
2. **Stats not updating**: Verify PostMessage communication
3. **Keyboard colors missing**: Ensure CSS classes are defined
4. **Responsive issues**: Check CSS custom property values

#### Debug Logging

- **`🎯` prefix**: FlickWord-specific logs
- **`📊` prefix**: Stats-related logs
- **Console output**: Extensive debugging for all game states

### Maintenance Notes

- **Version tracking**: Increment version on any changes
- **Testing**: Manual testing required for game flow
- **Dependencies**: No external libraries, pure vanilla JS
- **Browser support**: Modern browsers with ES6+ support

## Dynamic Checklist System

### Pre-Development Validation

**BEFORE making any code changes:**

- [ ] **API Key Validation**: Verify TMDB API key is valid and functional
- [ ] **Data Source Validation**: Confirm all data sources use real, valid IDs
- [ ] **End-to-End Testing**: Test all interactive elements work without errors
- [ ] **Visual Verification**: Take screenshot of current state before changes
- [ ] **Dependency Check**: Identify all modules/functions that will be affected
- [ ] **Rollback Plan**: Ensure version can be easily rolled back if needed

### Post-Development Validation

**AFTER making code changes:**

- [ ] **Build Test**: Run `npm run build` to ensure no build errors
- [ ] **Dev Server Test**: Run `netlify dev` and verify functionality
- [ ] **Visual Verification**: Take screenshot of new state and compare
- [ ] **Functionality Test**: Test all affected features work correctly
- [ ] **Version Update**: Increment version number in `package.json` and `index.html`
- [ ] **Documentation Update**: Update Cursor Rules with any new patterns/learnings

### Phase Gate Validation

**At each phase transition:**

- [ ] **Phase Completion**: All phase objectives met and documented
- [ ] **Learning Capture**: New patterns, gotchas, and solutions documented
- [ ] **Critical Areas**: Updated critical areas map with new findings
- [ ] **Version Tagging**: Version reflects completed phase
- [ ] **Handoff Readiness**: Ready for next phase or user review

## Critical Areas Map

### High-Risk Areas (Require Extra Care)

1. **Authentication System** (`auth-manager.js`)
   - **Risk**: Button listener conflicts, redirect handling
   - **Gotcha**: Always check for existing listeners before adding new ones
   - **Pattern**: Use `__authClickHandler` property to prevent duplicates

2. **Data Loading** (`data-init.js`, `functions.js`)
   - **Risk**: Race conditions, duplicate data loading
   - **Gotcha**: Use `window.render_*` flags to prevent duplicate renders
   - **Pattern**: Always check if data already loaded before loading again

3. **Card Rendering** (`Card.js`, `functions.js`)
   - **Risk**: Duplicate cards, memory leaks
   - **Gotcha**: Clear containers before rendering new content
   - **Pattern**: Use `cleanupDuplicateCards()` after bulk operations

4. **Firebase Integration** (`firebase-init.js`, `data-init.js`)
   - **Risk**: Auth state conflicts, data sync issues
   - **Gotcha**: Wait for auth ready before data operations
   - **Pattern**: Use `waitForAuthReady()` before Firebase operations

5. **Search System** (`search.js`)
   - **Risk**: Search state conflicts, UI state corruption
   - **Gotcha**: Clear search state when switching tabs
   - **Pattern**: Use `SearchModule.clearSearch()` before tab switches

### Medium-Risk Areas (Monitor Closely)

1. **Theme Management** (`theme-manager.js`)
2. **Modal Systems** (various modal files)
3. **Tab Navigation** (`app.js`)
4. **Data Persistence** (`utils.js`)

### Low-Risk Areas (Standard Care)

1. **CSS Styling** (`styles/`)
2. **Static Content** (`index.html`)
3. **Configuration** (`netlify.toml`, `vite.config.js`)

## Learning Log

### Phase 1 Learnings (Repository Hygiene)

**Date**: 2025-01-25
**What Worked**:

- `cmd /c "rmdir /s /q"` successfully removed `node_modules` with long paths
- Removing duplicate directories first, then files, was most efficient
- Version incrementing after each major change enabled easy rollbacks

**What Broke**:

- PowerShell `Remove-Item` failed on long file paths even with registry fix
- Some files had invalid characters in names causing removal failures
- CSP header in `_headers` file had invalid characters causing Netlify crashes

**Patterns Discovered**:

- Always use `cmd /c` for Windows file operations with long paths
- CSP headers should be in `netlify.toml`, not `_headers` file
- Version tracking in both `package.json` and `index.html` title

**Critical Gotchas**:

- Long path support in Windows registry doesn't fix all PowerShell issues
- Netlify CLI is sensitive to invalid characters in headers
- Some files may have corrupted names that prevent normal deletion

### Phase 2 Learnings (Code Quality Analysis)

**Date**: 2025-01-25
**What Worked**:

- Semantic search identified major architectural issues quickly
- Function counting revealed massive duplication (552 functions across 75 files)
- Pattern analysis showed mixed architectural approaches

**What Broke**:

- N/A (Analysis phase)

**Patterns Discovered**:

- Monolithic `functions.js` (3,513 lines) contains mixed responsibilities
- Multiple card systems exist: `Card.js`, `BasePosterCard.js`, `card.js`
- Global namespace pollution with 552+ functions
- Mixed patterns: IIFE, ES6 modules, and global functions

**Critical Gotchas**:

- Large codebases can have hidden duplication that's hard to spot
- Mixed architectural patterns make refactoring complex
- Global namespace pollution makes debugging difficult

### Current Phase Status

**Phase**: 2 - Code Quality & Technical Debt
**Status**: Analysis complete, consolidation in progress
**Next Actions**: Consolidate duplicate functions, refactor monolithic files
**Risks**: Breaking existing functionality during refactoring
**Mitigation**: Incremental changes with extensive testing at each step

## Modal Management System (v28.65+)

### Phase A-F Implementation: Single Authority for Auth Curtain

**Status**: ✅ COMPLETED - Authentication modal freezing issue permanently resolved

#### Core Principles

1. **One Usher Team Per Curtain**: Auth, Share, Games have separate modal systems with unique classes
2. **Class-Based Visibility**: Use `.is-active` class for visibility; no inline style sniffing; no `!important` force
3. **Z-Index Hierarchy**: Auth (20000) > Share/Games (15000) > Other content (10000)
4. **Normalized Close Paths**: All close methods (Esc, overlay, Cancel, auto-close) use same routine
5. **Scoped Event Listeners**: No global duplicates; each modal manages its own listeners

## Notification System (v28.70+)

### Design Philosophy: Clean, Centered, Auto-Dismissing

**Status**: ✅ COMPLETED - Modern notification system matching app design language

#### Core Principles

1. **Centered Positioning**: All notifications appear in center of screen for maximum visibility
2. **Modal-Style Design**: Match sign-in modal styling (white background, blue accent, rounded corners)
3. **No Close Button**: Clean design with auto-dismiss after 4 seconds
4. **Smooth Animations**: Fade in/out with scale for professional feel
5. **Consistent Typography**: 16px text, centered alignment, proper spacing

#### Notification Design Standards

```css
/* Centered, clean notification design */
.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #1976d2; /* Blue accent */
  border-radius: 12px;
  padding: 16px 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  animation: fadeInScale 0.3s ease-out;
}
```

#### Implementation Pattern

```javascript
// Clean notification function - no close button needed
window.showNotification = function showNotification(message, type = 'info', duration = 4000) {
  // Remove existing notifications
  document.querySelectorAll('.notification').forEach((n) => n.remove());

  // Create centered notification
  const n = document.createElement('div');
  n.className = `notification ${type}`;
  n.innerHTML = `<span class="notification-message">${message}</span>`;

  document.body.appendChild(n);

  // Auto-dismiss with fade out
  setTimeout(() => {
    if (n.parentNode) {
      n.style.animation = 'fadeOutScale 0.3s ease-in forwards';
      setTimeout(() => n.remove(), 300);
    }
  }, duration);
};
```

#### Anti-Patterns (FORBIDDEN)

- ❌ Side-positioned notifications (top-right, bottom-right)
- ❌ Close buttons (X) on notifications
- ❌ Bright colored backgrounds (green, red, orange)
- ❌ Slide animations (use fade + scale instead)
- ❌ Long durations (keep under 5 seconds)
- ❌ Multiple notifications at once

#### Color Coding

- **Success**: White background with blue accent border
- **Error**: White background with red accent border
- **Warning**: White background with orange accent border
- **Info**: White background with blue accent border

#### Animation Standards

```css
@keyframes fadeInScale {
  from {
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes fadeOutScale {
  from {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0;
  }
}
```

#### Testing Requirements

- **Visibility Test**: Notification appears centered and is clearly visible
- **Auto-Dismiss Test**: Notification disappears after 4 seconds without user action
- **Design Consistency Test**: Matches sign-in modal styling exactly
- **Animation Test**: Smooth fade in/out with scale effect
- **Single Notification Test**: Only one notification shows at a time

#### Auth Modal Manager

```javascript
// Centralized auth modal control
window.AUTH_MANAGER._authModalManager = {
  open() {
    /* Class-based visibility with .is-active */
  },
  close() {
    /* Proper cleanup and state reset */
  },
  isModalOpen() {
    /* Check both state and DOM visibility */
  },
};
```

#### CSS Architecture

```css
/* Auth Modal - Highest priority */
.auth-modal-backdrop {
  z-index: 20000;
  display: none; /* Hidden by default */
}
.auth-modal-backdrop.is-active {
  display: flex; /* Shown via class */
}

/* Share/Game Modals - Lower priority */
.share-modal-backdrop,
.game-modal {
  z-index: 15000; /* Below auth */
}
```

#### Anti-Patterns (FORBIDDEN)

- ❌ Inline style sniffing: `[style*="display: flex"]`
- ❌ `!important` to force visibility
- ❌ Global modal cleanup: `document.querySelectorAll('.modal-backdrop').forEach(modal => modal.remove())`
- ❌ Multiple modal systems using same classes
- ❌ Event listeners not scoped to specific modals

#### Testing Requirements

- **Smoke Test 1**: Open/close auth modal twice without freezing
- **Smoke Test 2**: Open Share → Auth → verify Auth on top, single dimmer
- **Smoke Test 3**: Sign-in completion auto-closes auth modal
- **Leak Check**: No duplicate listeners after close

#### Console One-Liners for PM

```javascript
// Count curtains
document.querySelectorAll('.modal-backdrop').length(
  // Check auth visibility
  () => {
    const m = document.getElementById('providerModal');
    if (!m) return 'no el';
    const cs = getComputedStyle(m);
    return { display: cs.display, aria: m.getAttribute('aria-hidden') };
  },
)();

// Quick z-order sanity
getComputedStyle(document.getElementById('providerModal')).zIndex;
```

## Current Status & Achievements (v28.103.0)

### ✅ Completed Features
1. **Data Architecture Refactor** (v28.81)
   - Single source of truth with WatchlistsAdapterV2
   - Unified data operations API
   - Firebase-standardized data structure
   - Race condition prevention
   - Comprehensive error handling

2. **UI Integration & Notifications** (v28.82)
   - Real-time UI updates after data changes
   - Success/error notification system
   - Event-driven architecture
   - Responsive notification design

3. **Core Data Flow** - **FULLY FUNCTIONAL**
   - ✅ Search for items
   - ✅ Add items to lists
   - ✅ Move items between lists
   - ✅ Remove items from lists
   - ✅ Data persistence (localStorage + Firebase)
   - ✅ UI updates and notifications
   - ✅ Error handling and user feedback

4. **Layout Normalization & Performance** (v28.80 - v28.102)
   - ✅ Tab visibility and CSS conflict resolution
   - ✅ Layout normalization across all breakpoints
   - ✅ CSS specificity fixes and cleanup
   - ✅ Performance optimization with script deferring
   - ✅ Modal blocking prevention for tests
   - ✅ Mobile layout fixes and responsive design
   - ✅ Header positioning and z-index layering
   - ✅ Search container spacing and visibility

5. **Complete Data Flow & Poster Resolution** (v28.103)
   - ✅ End-to-end data flow validation: Search → Add → Move → Home Display
   - ✅ Unified data transformation across all card systems
   - ✅ Poster URL consistency between list tabs and home page
   - ✅ Home page adapter integration for data consistency
   - ✅ Complete user journey testing with proper data verification
   - ✅ Fixed poster resolution issue on home page
   - ✅ Data source unification (WatchlistsAdapterV2 as single source of truth)

### 📊 Test Results
- **Total Tests**: 18 comprehensive Playwright tests
- **Passing Tests**: 6/18 (33% success rate)
- **Core Functionality**: 100% working
- **Test Categories**: High Priority (data integrity), Medium Priority (UI integration)

### 🎯 Key Technical Achievements
- **Zero Race Conditions**: Proper async/await patterns throughout
- **Consistent Error Handling**: All operations have proper error handling
- **Event-Driven Architecture**: Clean separation between data and UI layers
- **Backward Compatibility**: Seamless migration from old data structures
- **Comprehensive Testing**: Full data flow validation with Playwright
- **Performance Optimization**: Script deferring and loading optimization
- **Layout Stability**: CSS conflict resolution and responsive design fixes
- **Data Flow Integrity**: Complete end-to-end data consistency across all components
- **Unified Card Systems**: Consistent data transformation and poster URL construction

## Process Improvements & Development Workflow

### 📋 Pre-Development Checklist
**CRITICAL**: Before making any changes, always:

1. **Review Git History First**
   - Check recent commits to understand current work
   - Verify current version vs documentation
   - Identify if issues are already being addressed
   - Look for patterns in recent fixes

2. **Check Current Version**
   - Compare `package.json` version with documentation
   - Note: Documentation may be outdated (v28.82 vs actual v28.102.0)
   - Review version progression to understand scope of recent work

3. **Understand Recent Work Context**
   - v28.80+: Major layout fixes and CSS conflict resolution
   - v28.102: Layout normalization and performance optimization
   - v28.103: Complete data flow and poster resolution
   - Extensive work on tab visibility, modal blocking, and responsive design

4. **Avoid Assumptions**
   - Don't assume issues are new problems
   - Don't "fix" things that may be intentionally designed
   - Don't duplicate work already in progress
   - Always check if solutions already exist

### 🔍 Investigation Protocol
1. **Git Status Check**: `git status` to see current changes
2. **Recent Commits**: `git log --oneline -20` to understand recent work
3. **Version Verification**: Check `package.json` for actual version
4. **Documentation Review**: Read cursor rules and project documentation
5. **Issue Analysis**: Determine if issue is new or ongoing

### 📝 Documentation Maintenance
- **Keep version numbers current** in documentation
- **Update status sections** to reflect actual project state
- **Document process improvements** as they're identified
- **Maintain git history awareness** in development workflow

### 🔄 Next Phase Opportunities
- Fix remaining test edge cases (12 failing tests)
- Optimize performance for large datasets
- Add advanced search and filtering
- Implement real-time collaboration features

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

## Document Maintenance Rules

### Mandatory Update Protocol

**The assistant MUST reference and update this document at every gate:**

1. **Starting a Phase**: Update phase status, objectives, and critical areas
2. **Completing Development & Starting Testing**: Update learning log with what worked/broke
3. **Exiting Testing & Handing to User**: Update critical areas map with new findings
4. **User Says "Complete"**: Update phase status to completed, capture final learnings

### Update Protocol

- **Gap Identification**: When gaps or missing information are discovered in this document during development, the assistant must ask the user for approval before updating
- **User Approval Required**: Always confirm with the user before adding new sections or modifying existing content
- **Version Tracking**: Document updates should be noted in version comments when significant changes are made
- **Completeness Check**: Regularly review the document for completeness against actual codebase implementation
- **Learning Capture**: Always update the Learning Log with new patterns, gotchas, and solutions
- **Critical Areas**: Always update the Critical Areas Map with new high-risk areas discovered

## UI Design Rules

### Username + Snark Display ✅ IMPLEMENTED
- **Location**: `#leftSnark` element (left side of header)
- **Content**: Username with snarky message (e.g., "Travis, your couch has a permanent dent")
- **Persistence**: Stays permanently visible when user is signed in
- **No Flash Messages**: No temporary messages should appear before the real username+snark
- **Account Button**: Username also appears in account button (right side) - this is correct

---

_This document serves as the definitive guide for understanding and working with the Flicklet TV Tracker codebase. Keep it updated as the project evolves._
