# Flicklet App - Complete Forensic Analysis

## Overview

Flicklet is a sophisticated TV and movie tracking web application built with vanilla JavaScript, Firebase, and TMDB API. It's a Progressive Web App (PWA) with mobile-first design, featuring user authentication, cloud sync, and comprehensive media management.

## Core Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Firebase (Auth, Firestore, Storage)
- **API**: The Movie Database (TMDB) API
- **Mobile**: Capacitor for native app packaging
- **Styling**: CSS Custom Properties, Mobile-first responsive design

### Data Storage System
The app uses a dual storage approach:

**Local Storage**: Primary data persistence in `localStorage` as `flicklet-data`:
```javascript
{
  tv: { watching: [], wishlist: [], watched: [] },
  movies: { watching: [], wishlist: [], watched: [] },
  settings: { 
    pro: false, 
    episodeTracking: false, 
    theme: 'light', 
    lang: 'en', 
    username: '', 
    displayName: '' 
  }
}
```

**Cloud Sync**: When signed in, everything automatically syncs to Firebase Firestore under `users/{uid}/` with the same structure.

## Authentication System

### Sign-In Methods
The app offers three authentication options:

1. **Google Sign-In**: Uses popup on desktop, automatically falls back to redirect on mobile/blocked popups
2. **Apple Sign-In**: Always uses redirect (never popup) - shows warning on localhost since Apple requires verified domains
3. **Email/Password**: Shows a modal form for direct email/password entry

### Username Flow
After successful sign-in:
1. System checks if user has a username set
2. If not, shows modal asking **"what should we call you?"**
3. User input gets saved to both:
   - `appData.settings.username` (for sarcastic header message)
   - `appData.settings.displayName` (for account button)
4. Username appears in left-justified header area (`#leftSnark`) with sarcastic remark like "welcome back, legend ✨"
5. If username is changed later in settings, system warns user and updates both header and Firebase

## Main App Sections

### Home Tab - Dashboard
The home page contains 5 main groups:

1. **Your Shows Section**:
   - **Currently Watching Rail**: Shows from both TV and movies you're actively watching
   - **Up Next Rail**: Next episodes for TV shows you're watching

2. **Community Section**:
   - **Left Half**: YouTube player with curated content
   - **Right Half**: Games (FlickWord top, Trivia bottom)

3. **For You Section**: 3 customizable genre rails with smart defaults

4. **In Theaters Section**: Current movies with theater information

5. **Feedback Section**: Form for user feedback

### Other Tabs
- **Currently Watching**: All actively watched content with count badges
- **Want to Watch**: Wishlist with count badges  
- **Already Watched**: Completed shows/movies with count badges
- **Discover**: Personalized recommendations based on ratings and viewing habits
- **Settings**: Six sub-sections (General, Notifications, Layout, Data, Pro, About)

## Smart "For You" System

### Intelligent Genre Detection
The system analyzes your watching history to provide personalized recommendations:

1. **Smart Analysis**: Counts genre occurrences in `appData.tv.watching` and `appData.movies.watching`
2. **Top 3 Selection**: Picks the most common genres from your actual viewing habits
3. **Automatic Defaults**: Creates rails for your most-watched genres

### User Customization
In Settings → Layout, users can override smart defaults with 3 dropdown sets per rail:
- **Main Genre**: Drama, Comedy, Action, etc.
- **Sub-Genre**: Crime, Romance, Thriller, etc.
- **Media Type**: Movies, TV, Both

### Fallback System
If no customization and insufficient watching data, defaults to:
- "Drama & Crime"
- "Comedy & Romance" 
- "Sci-Fi & Fantasy"

## Rating System

### User Rating Storage
User ratings are stored per movie/show in the main data structure:
```javascript
{
  id: 123,
  title: "Breaking Bad",
  userRating: 5,  // User's 1-5 star rating
  rating: 9.5,   // TMDB's average rating
  // ... other fields
}
```

### Rating Interface
- Cards display 5 open stars for 1-5 star ratings
- Ratings stored as `userRating` field
- Used for discovery algorithm and personal tracking
- Higher-rated items appear in Discover recommendations

### Rating Functions
- `updateUserRating(itemId, rating)` - Updates local and cloud storage
- `saveUserRating(id, rating)` - Saves rating to Firebase

## Holiday Chip System

### Implementation
- Every card has a "Holiday +" chip in top-right corner
- Click opens modal with holiday category options (Christmas, Halloween, etc.)
- Selected holiday updates card with "Holiday: [Category]" badge
- Holiday assignments stored in card's data structure

### Future Integration
When Holiday Selections tab is implemented:
- Cards with holiday tags automatically appear in Holiday tab
- Content categorized by seasonal themes
- Enables seasonal content discovery

## Community Features

### YouTube Player Integration
**Current Implementation**:
- Pulls from `/data/community-seed.json` with manually curated content
- Contains horror trailers, movie spotlights, etc.
- Uses YouTube embed API with autoplay, controls, playlist management
- Daily rotation (same video all day, changes at midnight)

**Content Structure**:
```javascript
{
  "id": "horror-001",
  "type": "TRAILER_SPOTLIGHT", 
  "title": "The Exorcist (1973)",
  "media": {
    "kind": "youtube",
    "src": "https://www.youtube.com/embed/YDGw1MTEe9k",
    "autoplay": false,
    "controls": true
  },
  "attribution": {
    "displayName": "Flicklet Picks",
    "watermark": "Top Horror"
  }
}
```

**Future Vision**:
- **Phase 1**: Manual curation of top 10 videos per genre
- **Phase 2**: User/influencer video submissions
- **Phase 3**: Community-driven content with moderation

### Games
**FlickWord**: Fully playable Wordle-style game with stats tracking
**Trivia**: 10 questions free, 50 questions Pro, with statistics

## Episode Tracking System

### Default Behavior
- Episode tracking is **OFF** by default (Keep It Simple philosophy)
- Users can toggle "Enable Episode Tracking" in Settings → Layout

### When Enabled
- Episode tracking buttons become clickable on Currently Watching cards
- Clicking opens modal for episode-level progress updates
- Tracks which episode user is on for TV series (not within-episode progress)

## Pro System - Monetization Strategy

### Payment Methods (Not Yet Implemented)
- **App Store**: In-app purchases through iOS/Android stores
- **Ad-Based**: Watch ads to unlock Pro features temporarily
- **Direct Payment**: Future web-based payment integration

### Pro Features (Currently Preview-Only)
- **Extended Themes**: Dark Pro, Neon Pro, Minimal Pro (vs. Classic only)
- **Trivia+**: 50 questions vs. 10 free
- **Bloopers & Behind Scenes**: Extra content buttons on cards
- **Granular Reminders**: Customizable timing vs. 24-hour default
- **Robust Share**: Enhanced sharing options vs. basic copy/paste list
- **CSV Export**: Export data to spreadsheets

### Pro Gating
- Pro features visible but disabled with 🔒 icons
- Users can preview Pro features without purchasing
- Clear upgrade path and feature comparison

## Content Management

### "Not Interested" System
- Every card has "Not Interested" button
- Items marked as not interested are quarantined from recommendations
- Users can manage their "Not Interested" list in Settings → Data
- Items can be removed to reappear in recommendations

### Data Migration
- Only used for transferring data between devices (iPhone to Android, etc.)
- Not for app version changes
- Maintains data integrity across platforms

## Multi-Language Support

### Languages
- **English** and **Spanish** with dynamic translation system
- Language toggle available in header
- All UI text uses translation system for seamless switching

## User Experience Features

### Three Personality Modes
- **Regular**: Standard tone
- **Semi-sarcastic**: Mildly humorous interactions
- **Severely sarcastic**: Highly sarcastic messaging
- Affects tone of messages and interactions throughout the app

### Accessibility
- ARIA attributes for screen readers
- Keyboard navigation support
- Semantic HTML structure
- High contrast support

## Technical Implementation Details

### Event System
- Custom events for module communication (`app:data:ready`, `firebase:ready`)
- Event listeners trigger UI updates
- Centralized auth state management

### Performance Optimizations
- Lazy loading for images
- Debounced search (500ms delay)
- Virtual scrolling for large lists
- Request idle callback for heavy operations

### Security
- Content Security Policy headers
- Input sanitization for XSS prevention
- Firebase security rules for data validation
- Secure API key handling through serverless functions

## Data Flow Summary

1. **User Action** → Function triggers (search, rate, add to list)
2. **Update Global State** → Modify `window.appData`
3. **Persist to Storage** → Save to localStorage + Firebase
4. **Update UI** → Refresh components and tab counts
5. **Sync Cloud** → Background sync when authenticated

## Future Roadmap

### Planned Features
- **Holiday Selections Tab**: Dedicated seasonal content
- **Social Features**: Community-driven content and games
- **Advanced Analytics**: Detailed watching statistics
- **Enhanced Pro Features**: More premium content and tools

### Technical Improvements
- **Service Workers**: Offline functionality and caching
- **Real-time Sync**: WebSocket integration for live updates
- **Advanced Search**: Filters, sorting, and saved searches
- **CDN Integration**: Static asset optimization

---

*This forensic analysis is based on examination of the actual codebase and represents the current implementation as of the analysis date.*
