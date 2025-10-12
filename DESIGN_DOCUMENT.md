# Flicklet V2 - Comprehensive Design Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [User Interface Design](#user-interface-design)
4. [Data Model](#data-model)
5. [Component System](#component-system)
6. [API Integration](#api-integration)
7. [Settings System](#settings-system)
8. [Development Environment](#development-environment)
9. [Feature Flags](#feature-flags)
10. [Accessibility](#accessibility)
11. [Performance](#performance)
12. [Testing Strategy](#testing-strategy)
13. [Deployment](#deployment)

---

## Project Overview

**Flicklet V2** is a modern TV and movie tracking web application built with React 18, TypeScript, and Vite. It provides users with a Netflix-style interface for discovering, tracking, and managing their entertainment consumption across movies and TV shows.

### Core Features
- **Media Discovery**: Browse trending content and movies currently in theaters
- **Personal Tracking**: Manage personal watchlists (watching, wishlist, watched)
- **Community Features**: Community player and games Flickword and Trivia (API)
- **Responsive Design**: Mobile-first approach with keyboard navigation
- **Real-time Data**: Live integration with The Movie Database (TMDB) API
Live integration with Trivia API
Attitude - the APP has a three-fold personality that can be switched in settings. Regular, semi sarcastic, severly sarcastic. 
Multi-lingual, supports spanish and english

### Layout Structure

The app follows a **rail-based layout** similar to Netflix:

```
┌─────────────────────────────────────────┐
│                Header                    │
├─────────────────────────────────────────┤
│  Your Shows Rail                        │
│  [Card] [Card] [Card] [Card] →         │
├─────────────────────────────────────────┤
│  Community Rail (feature-flagged)       │
│  [Card] [Card] [Card] →                │
├─────────────────────────────────────────┤
│  For You Rail (TMDB Data)               │
│  [Card] [Card] [Card] [Card] →         │
├─────────────────────────────────────────┤
│  In Theaters Rail (TMDB Data)           │
│  [Card] [Card] [Card] [Card] →         │
├─────────────────────────────────────────┤
│  Feedback Rail                          │
│  [Card] [Card] [Card] →                │
└─────────────────────────────────────────┘
```

### Responsive Behavior

- **Mobile-First**: Primary target is mobile devices
- **Horizontal Scrolling**: Each rail scrolls horizontally with snap behavior
- **Keyboard Navigation**: Arrow keys, Home, End, Enter for accessibility
- **Touch Gestures**: Swipe navigation on mobile devices

---

## Data Model

### Core Data Structure

The app manages several key data entities:

#### Media Items
```typescript
type CardData = {
  id: string;           // Unique identifier
  kind: 'movie' | 'tv'; // Media type
  title: string;        // Display title
  poster: string;       // Poster image URL
}
```

#### User Watchlists
```typescript
type Watchlists = {
  tv: {
    watching: MediaItem[];   // Currently watching
    wishlist: MediaItem[];   // Want to watch
    watched: MediaItem[];    // Completed
  };
  movies: {
    watching: MediaItem[];
    wishlist: MediaItem[];
    watched: MediaItem[];
  };
}
```

#### User Settings
```typescript
type Settings = {
  pro: boolean;                    // Premium status
  isPro: boolean;                 // Alias for pro
  episodeTracking: boolean;       // Episode tracking feature
  username: string;               // User display name
  displayName: string;            // Full display name
  lang: string;                   // Language preference
  theme: 'light' | 'dark';       // Theme preference
}
```

### Data Flow

1. **Initial Load**: App loads with skeleton placeholders
2. **TMDB Hydration**: Real data fetches from TMDB via proxy
3. **User Interaction**: Actions update local state and sync to cloud
4. **Persistence**: Data saved to localStorage and Firebase (when authenticated)

---

## Component System

### Core Components

#### Rail Component
**Purpose**: Horizontal scrolling container for media cards

**Props**:
```typescript
type RailProps = {
  id: string;                    // Unique identifier
  title: string;                 // Rail title
  enabled?: boolean;            // Show/hide rail
  skeletonCount?: number;       // Loading placeholder count
  items?: CardData[];           // Real data items
}
```

**Features**:
- Horizontal scrolling with snap behavior
- Keyboard navigation (arrows, Home, End, Enter)
- Skeleton loading states
- Accessibility attributes (ARIA labels, roles)

#### Card Component
**Purpose**: Individual media item display

**Props**:
```typescript
type CardProps = {
  title?: string;    // Media title
  poster?: string;  // Poster image URL
}
```

**Features**:
- 2:3 aspect ratio poster container
- Actions grid (2 columns)
- Lazy loading for images
- Focus management for keyboard navigation

### Component Hierarchy

```
App
├── Rail (Your Shows)
│   └── Card[] (skeleton)
├── Rail (Community) [feature-flagged]
│   └── Card[] (skeleton)
├── Rail (For You)
│   └── Card[] (TMDB data)
├── Rail (In Theaters)
│   └── Card[] (TMDB data)
└── Rail (Feedback)
    └── Card[] (skeleton)
```

---

## API Integration

### TMDB Integration

The app integrates with The Movie Database (TMDB) through a secure proxy pattern:

#### Proxy Function (`netlify/functions/tmdb-proxy.js`)
- **Purpose**: Secure server-side API key handling
- **Method**: Serverless function with CORS support
- **Caching**: 5-minute cache for successful responses
- **Error Handling**: Comprehensive error logging and fallbacks

#### Client Adapter (`src/lib/tmdb.ts`)
- **Purpose**: Clean API interface for React components
- **Features**: Type-safe data transformation, error handling
- **Endpoints**:
  - `trendingForYou()`: `/trending/all/week`
  - `nowPlayingMovies()`: `/movie/now_playing`

#### React Query Integration
- **Caching**: 60-second stale time for optimal performance
- **Background Updates**: Automatic refetching on window focus
- **Error States**: Graceful error handling with retry logic

### API Data Flow

```
React Component
    ↓ useQuery hook
TMDB Adapter
    ↓ fetch()
Netlify Proxy
    ↓ fetch()
TMDB API
    ↓ JSON response
Data Transformation
    ↓ CardData[]
React Component (re-render)
```

---

## Settings System

The Settings system provides comprehensive user customization and management capabilities through a tabbed interface accessible via a floating action button (FAB).

### Settings Access

- **FAB Location**: Bottom left of home screen (sticky positioning)
- **Icon**: COG icon only
- **Layout**: Settings tabs on left, content on right
- **Additional Theme Toggle**: FAB on bottom right (Moon/Sun icon) for quick theme switching

### Settings Structure

#### 1. General
- **Display Name**: User's display name with warning on change
- **My Statistics**: 
  - Counts of currently watching, want to watch, already watched, total items
  - Broken out by TV shows and Movies
- **Not Interested Management**: 
  - Button to access the "not interested" list
  - Options to remove from list or leave as is
- **Personality Level**: Three-level system (1-3)
  - Regular
  - Semi-sarcastic
  - Severely sarcastic
- **Reset System to Defaults**: Restore all settings to initial state

#### 2. Notifications
- **Notification Types**:
  - Upcoming episode alerts
  - Weekly discover
  - Monthly stats digest
- **Alert Configuration (Pro)**:
  - Advanced notification by lead time in hours
  - Pick the list (currently watching or want to watch)

#### 3. Layout
- **Basic Customization**:
  - Condensed view option
  - Theme preference (Light/Dark)
  - Home page Lists configuration
  - Genre/sub-genre of "For You" rows
  - Enable episode tracking toggle
- **Pro Features**:
  - Theme packs (holiday and movie themes)

#### 4. Data
- **Standard Data Management**:
  - **Share List**: Choose lists and shows to share
    - Generates copy/pasteable formatted list with Flicklet branding and link
  - **Backup System (JSON)**: Export all personal data
  - **Import (JSON)**: Import previously exported data
  - **Reset All Data**: Restore system to defaults
- **Pro Features**:
  - Advanced sharing options

#### 5. Pro
- **Pro Management**:
  - Unlock pro features button (payment prompt - not implemented)
  - Pro feature list and descriptions
- **Pro Features**:
  - Alert configuration details (hourly config)
  - Theme packs (holiday and movie themes - not implemented)
  - Social features (FlickWord, Trivia, shared watchlists among friends)
  - Bloopers/Behind the scenes (activates button on show cards)
  - Additional features TBD

#### 6. About
- **Information Sections**:
  - About unique for you
  - About the creators
  - About the app
- **Feedback**:
  - Share your thoughts (feedback, quotes for marquee, clips for home page player, venting, etc.)

### Settings Data Model

```typescript
type Settings = {
  // General
  displayName: string;
  personalityLevel: 1 | 2 | 3; // Regular, Semi-sarcastic, Severely sarcastic
  
  // Notifications
  notifications: {
    upcomingEpisodes: boolean;
    weeklyDiscover: boolean;
    monthlyStats: boolean;
    alertConfig?: {
      leadTimeHours: number;
      targetList: 'watching' | 'wishlist';
    };
  };
  
  // Layout
  layout: {
    condensedView: boolean;
    theme: 'light' | 'dark';
    homePageLists: string[];
    forYouGenres: string[];
    episodeTracking: boolean;
    themePack?: string; // Pro feature
  };
  
  // Pro
  pro: {
    isPro: boolean;
    features: {
      advancedNotifications: boolean;
      themePacks: boolean;
      socialFeatures: boolean;
      bloopersAccess: boolean;
    };
  };
};
```

### Settings Persistence

- **Local Storage**: Primary storage for settings
- **Firebase Sync**: Cloud backup when authenticated
- **Migration**: Automatic migration from V1 settings format
- **Validation**: Settings validation and error handling

---

## Development Environment

### Local Development Setup

#### Prerequisites
- Node.js 18+
- Netlify CLI (`npm i -g netlify-cli`)

#### Environment Configuration
1. Create `.env` at repo root:
   ```
   TMDB_KEY=your_tmdb_api_key
   ```

2. Run development server:
   ```bash
   netlify dev
   ```

3. App available at `http://localhost:8888`

### Build Configuration

#### Vite Configuration
- **Mode-Aware**: Different configs for dev/prod
- **Environment Loading**: Loads from app directory and repo root
- **Path Aliases**: `@/*` for src, `#inputs/*` for migration data
- **TypeScript**: Strict mode with React JSX support

#### Tailwind Configuration
- **Design Token Integration**: Reads from `DESIGN_TOKENS.json`
- **Custom Theme**: Extended with app-specific colors and spacing
- **Safelist**: Critical classes for skeleton loading

---

## Feature Flags

The app uses a comprehensive feature flag system for controlled rollouts:

### Current Flags (`FEATURE_FLAGS.json`)
```json
{
  "defaults": {
    "community_player": false,
    "community_games_enabled": false,
    "homeRowSpotlight": false,
    "flicklet_episodeTracking_enabled": false
  }
}
```

### Flag Usage
- **Conditional Rendering**: Components render based on flag state
- **Runtime Toggle**: Flags can be changed without code deployment
- **Type Safety**: TypeScript integration for flag names

### Implementation
```typescript
const showCommunity = useFlag('community_player');
return (
  <>
    {showCommunity && <Rail id="community" title="Community" />}
  </>
);
```

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
- **Arrow Keys**: Horizontal scrolling within rails
- **Home/End**: Jump to beginning/end of rail
- **Enter**: Focus first card in rail
- **Tab**: Standard tab order through interactive elements

#### Screen Reader Support
- **ARIA Labels**: All rails have descriptive labels
- **Semantic HTML**: Proper use of `<section>`, `<article>`, `<main>`
- **Role Attributes**: `role="list"` and `role="listitem"` for card containers

#### Visual Accessibility
- **Color Contrast**: High contrast text on dark background
- **Focus Indicators**: Clear focus states for keyboard navigation
- **Responsive Text**: Scalable text that works at 200% zoom

### Implementation Details
```typescript
// Keyboard navigation in Rail component
function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  const scroller = e.currentTarget;
  const card = scroller.querySelector<HTMLElement>('[data-card]');
  const delta = cardWidth + gap;
  
  switch (e.key) {
    case 'ArrowRight': 
      scroller.scrollBy({ left: +delta, behavior: 'smooth' }); 
      break;
    // ... other keys
  }
}
```

---

## Performance

### Optimization Strategies

#### Loading Performance
- **Skeleton States**: Immediate visual feedback during data loading
- **Lazy Loading**: Images load only when needed
- **Code Splitting**: Vite automatically splits vendor and app code
- **Tree Shaking**: Unused code eliminated in production builds

#### Runtime Performance
- **React Query Caching**: Prevents unnecessary API calls
- **Memoization**: Components re-render only when props change
- **Virtual Scrolling**: Efficient rendering of large lists (future)
- **Image Optimization**: WebP format with fallbacks

#### Network Optimization
- **API Proxy Caching**: 5-minute cache on successful responses
- **Compression**: Gzip compression for all assets
- **CDN**: Netlify's global CDN for static assets

### Performance Monitoring
```typescript
// Debug helpers for performance analysis
window.debugQueries = () => {
  // Returns React Query cache status
  // Shows data loading states and error conditions
};
```

---

## Testing Strategy

### Testing Pyramid

#### Unit Tests
- **Component Testing**: Individual component behavior
- **Hook Testing**: Custom hook logic validation
- **Utility Testing**: Helper function correctness

#### Integration Tests
- **API Integration**: TMDB proxy and data transformation
- **Component Integration**: Rail and Card interaction
- **State Management**: React Query cache behavior

#### End-to-End Tests (Playwright)
```typescript
// Example E2E test
test('home page renders rails with data', async ({ page }) => {
  await page.goto('/');
  
  // Verify rails are present
  await expect(page.locator('[data-rail="for-you"]')).toBeVisible();
  await expect(page.locator('[data-rail="in-theaters"]')).toBeVisible();
  
  // Verify data loading
  await expect(page.locator('[data-card]')).toHaveCount.greaterThan(0);
});
```

### Test Coverage Goals
- **Unit Tests**: 80%+ coverage for core logic
- **Integration Tests**: Critical user flows
- **E2E Tests**: Happy path scenarios

---

## Deployment

### Netlify Deployment

#### Build Process
1. **Install Dependencies**: `npm install`
2. **Type Check**: `tsc` (TypeScript compilation)
3. **Build Assets**: `vite build` (React app)
4. **Deploy Functions**: Netlify Functions deployment

#### Environment Variables
- **Build Time**: `TMDB_KEY` for serverless functions
- **Runtime**: Feature flags and configuration

#### Deployment Pipeline
```yaml
# netlify.toml configuration
[build]
  publish = "apps/web/dist"
  functions = "netlify/functions"

[dev]
  command = "npm run dev --prefix apps/web"
  targetPort = 5173
  publish = "apps/web"
```

### Production Considerations
- **CDN**: Global content delivery
- **HTTPS**: Automatic SSL certificates
- **Monitoring**: Built-in analytics and error tracking
- **Rollbacks**: Instant rollback capability

---

## Future Roadmap

### Phase 1: Core Functionality
- [ ] User authentication system
- [ ] Personal watchlist management
- [ ] Search functionality
- [ ] Media detail pages

### Phase 2: Enhanced Features
- [ ] Recommendation engine
- [ ] Social features (sharing, reviews)
- [ ] Offline support with service workers
- [ ] Mobile app (Capacitor)

### Phase 3: Advanced Features
- [ ] AI-powered recommendations
- [ ] Integration with streaming services
- [ ] Advanced analytics and insights
- [ ] Multi-language support

---

## Conclusion

Flicklet V2 represents a modern, scalable approach to media tracking applications. The architecture emphasizes:

- **Developer Experience**: TypeScript, modern tooling, comprehensive testing
- **User Experience**: Responsive design, accessibility, performance
- **Maintainability**: Component-based architecture, feature flags, clear separation of concerns
- **Scalability**: Serverless functions, CDN delivery, efficient caching

The design document serves as a living reference for the development team and stakeholders, ensuring consistent implementation and clear understanding of the application's architecture and capabilities.
