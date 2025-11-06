# Flicklet System Map Report

**Generated:** 2025-01-XX  
**Scope:** Complete application analysis - React V2 (apps/web)  
**Confidence:** High (comprehensive codebase scan completed)

---

## Executive Summary

**Biggest Gaps Identified:**

1. **Feature Silos:** Community posts, movie tracking, and games (FlickWord/Trivia) operate independently with no cross-feature connections. Users can't link their 5-star ratings to community discussions, or see trivia questions about shows they're watching.

2. **Data Model Fragmentation:** User watch history stored in `users/{uid}/watchlists` (Firestore) and `flicklet.library.v2` (localStorage) with sync complexity. Game stats (FlickWord) stored separately in localStorage only, never synced to cloud. No unified user profile aggregating all activity.

3. **Missing Integration Points:** No deep linking between features (e.g., trivia question about a show → show detail page), no auto-generated community posts from user actions (e.g., "I just 5-starred this!"), and no cross-feature analytics showing how games relate to viewing habits.

---

## 1. USER-FACING FEATURE INVENTORY

### Home Page Features

#### Feature: View Currently Watching Rail
- **Action:** User opens home page
- **Result:** Horizontal scrollable rail shows TV shows and movies from "watching" list
- **Entry Point:** Home page → "Your Shows" section
- **Status:** Working
- **File Reference:** `[HomeYourShowsRail:tsx:1-100]`

#### Feature: View Up Next Rail
- **Action:** User opens home page
- **Result:** Horizontal rail shows next episodes for TV shows user is watching
- **Entry Point:** Home page → "Your Shows" section
- **Status:** Working (episodes populated from TMDB)
- **File Reference:** `[HomeUpNextRail:tsx:1-150]`

#### Feature: View Community Posts
- **Action:** User scrolls to Community section
- **Result:** Recent posts displayed with vote counts, comment counts, author info
- **Entry Point:** Home page → "Community" section
- **Status:** Working (but comments don't appear on detail page - see PostDetail)
- **File Reference:** `[CommunityPanel:tsx:12-262]`

#### Feature: Play FlickWord Game
- **Action:** User clicks FlickWord game card in Community section
- **Result:** Modal opens with daily word-guessing game (Wordle-style)
- **Entry Point:** Home page → Community section → FlickWord card
- **Status:** Working (stats stored in localStorage, not synced to cloud)
- **File Reference:** `[FlickWordGame:tsx:1-921]`, `[FlickWordModal:tsx:12-263]`

#### Feature: Play Trivia Game
- **Action:** User clicks Trivia game card in Community section
- **Result:** Modal opens with movie/TV trivia questions (5 free, 10 for Pro)
- **Entry Point:** Home page → Community section → Trivia card
- **Status:** Working (API integration with OpenTriviaDB, fallback questions)
- **File Reference:** `[TriviaGame:tsx:1-906]`, `[triviaApi:ts:4-130]`

#### Feature: View For You Recommendations
- **Action:** User scrolls to "For You" section
- **Result:** 3 customizable genre rails showing personalized content from TMDB
- **Entry Point:** Home page → "For You" section
- **Status:** Working (smart defaults based on watching history, user-configurable in Settings)
- **File Reference:** `[useForYouRows:ts:1-50]`, `[useGenreContent:ts:1-100]`

#### Feature: View In Theaters
- **Action:** User scrolls to "In Theaters Near You" section
- **Result:** Rail shows current movies with theater information, showtimes, addresses
- **Entry Point:** Home page → "In Theaters Near You" section
- **Status:** Working (realistic theater data generated from TMDB + location)
- **File Reference:** `[TheaterInfo:tsx:1-200]`, `[useInTheaters:ts:1-50]`

#### Feature: Submit Feedback
- **Action:** User scrolls to Feedback section, fills form, submits
- **Result:** Feedback sent (via Netlify function or email)
- **Entry Point:** Home page → "Feedback" section
- **Status:** Working
- **File Reference:** `[FeedbackPanel:tsx:1-150]`

### Navigation & Tabs

#### Feature: Switch Between Tabs
- **Action:** User clicks tab (Currently Watching, Want to Watch, Watched, Returning, My Lists, Discovery, Settings)
- **Result:** View changes, content loads for selected tab
- **Entry Point:** Header tabs (desktop) or bottom tabs (mobile)
- **Status:** Working
- **File Reference:** `[Tabs:tsx:1-100]`, `[MobileTabs:tsx:1-150]`, `[App:tsx:469-600]`

#### Feature: View Currently Watching Tab
- **Action:** User clicks "Currently Watching" tab
- **Result:** Full-page list of all shows/movies in "watching" list with filters, sort options
- **Entry Point:** Tab navigation → "Currently Watching"
- **Status:** Working
- **File Reference:** `[ListPage:tsx:1-300]`

#### Feature: View Want to Watch Tab
- **Action:** User clicks "Want to Watch" tab
- **Result:** Full-page list of wishlist items
- **Entry Point:** Tab navigation → "Want to Watch"
- **Status:** Working
- **File Reference:** `[ListPage:tsx:1-300]`

#### Feature: View Watched Tab
- **Action:** User clicks "Watched" tab
- **Result:** Full-page list of completed shows/movies
- **Entry Point:** Tab navigation → "Watched"
- **Status:** Working
- **File Reference:** `[ListPage:tsx:1-300]`

#### Feature: View Returning Shows Tab
- **Action:** User clicks "Returning" tab
- **Result:** Smart filtered list of shows with status "Returning Series" from watching list
- **Entry Point:** Tab navigation → "Returning"
- **Status:** Working (uses `useReturningShows` selector)
- **File Reference:** `[useReturningShows:ts:1-50]`, `[App:tsx:580-586]`

#### Feature: View My Lists Tab
- **Action:** User clicks "My Lists" tab
- **Result:** Page showing custom lists user created, ability to create/edit/delete lists
- **Entry Point:** Tab navigation → "My Lists"
- **Status:** Working
- **File Reference:** `[MyListsPage:tsx:1-200]`

#### Feature: View Discovery Tab
- **Action:** User clicks "Discovery" tab
- **Result:** Page with search, genre filters, personalized recommendations
- **Entry Point:** Tab navigation → "Discovery"
- **Status:** Working
- **File Reference:** `[DiscoveryPage:tsx:1-200]`

### Search Features

#### Feature: Search Movies/TV/People
- **Action:** User types in search bar, presses Enter or clicks search
- **Result:** Results page shows matching movies, TV shows, or people from TMDB
- **Entry Point:** Header search bar
- **Status:** Working (TMDB API integration)
- **File Reference:** `[SearchBar:tsx:1-150]`, `[SearchResults:tsx:1-200]`, `[useSearch:ts:1-100]`

#### Feature: Filter Search by Genre
- **Action:** User selects genre from dropdown in search
- **Result:** Search results filtered by selected genre
- **Entry Point:** Search bar → Genre dropdown
- **Status:** Working
- **File Reference:** `[SearchBar:tsx:1-150]`

#### Feature: Voice Search
- **Action:** User clicks microphone icon, speaks query
- **Result:** Speech-to-text converts audio to search query
- **Entry Point:** Search bar → Microphone icon
- **Status:** Working (browser Web Speech API)
- **File Reference:** `[VoiceSearch:tsx:1-100]`

### Card Actions

#### Feature: Add to Want to Watch
- **Action:** User clicks "Add" button on any card
- **Result:** Item added to wishlist, toast notification shown, syncs to Firebase if authenticated
- **Entry Point:** Any card → "Add" button
- **Status:** Working
- **File Reference:** `[actions:ts:40-58]`, `[Card:tsx:1-200]`

#### Feature: Mark as Watched
- **Action:** User clicks "Watched" button on card
- **Result:** Item moved to "watched" list, toast notification shown
- **Entry Point:** Any card → "Watched" button
- **Status:** Working
- **File Reference:** `[actions:ts:60-78]`, `[Card:tsx:1-200]`

#### Feature: Start Watching
- **Action:** User clicks "Start Watching" button on card
- **Result:** Item moved to "watching" list
- **Entry Point:** Any card → "Start Watching" button
- **Status:** Working
- **File Reference:** `[actions:ts:80-98]`, `[Card:tsx:1-200]`

#### Feature: Rate Movie/Show
- **Action:** User clicks star rating (1-5 stars) on card
- **Result:** Rating saved to item, stored in localStorage and synced to Firebase
- **Entry Point:** Any card → Star rating component
- **Status:** Working
- **File Reference:** `[StarRating:tsx:1-100]`, `[storage:ts:224-490]`

#### Feature: Add Notes/Tags
- **Action:** User clicks "Notes" or "Tags" button on card, fills modal, saves
- **Result:** Notes and tags saved to item, searchable via `tag:comedy` syntax
- **Entry Point:** Any card → "Notes" or "Tags" button
- **Status:** Working
- **File Reference:** `[NotesAndTagsModal:tsx:1-200]`, `[storage:ts:224-490]`

#### Feature: Set Episode Progress
- **Action:** User clicks episode tracking button, selects season/episode
- **Result:** Current episode saved to item (if episode tracking enabled in Settings)
- **Entry Point:** TV show card → Episode tracking button
- **Status:** Working (requires Settings → Layout → Episode Tracking enabled)
- **File Reference:** `[EpisodeTrackingModal:tsx:1-150]`, `[EpisodeProgressDisplay:tsx:1-100]`

#### Feature: Configure Show Notifications
- **Action:** User clicks notification bell icon on card, configures settings
- **Result:** Notification preferences saved (Pro feature: email/push, Free: simple reminders)
- **Entry Point:** Any card → Notification bell icon
- **Status:** Working (Pro features require Pro subscription)
- **File Reference:** `[ShowNotificationSettingsModal:tsx:1-200]`, `[notifications:ts:54-334]`

#### Feature: View Bloopers
- **Action:** User clicks "Bloopers" button on card
- **Result:** Modal opens showing YouTube bloopers/reel videos for the show/movie
- **Entry Point:** Any card → "Bloopers" button
- **Status:** Working
- **File Reference:** `[BloopersModal:tsx:1-200]`, `[YouTubePlayer:tsx:1-150]`

#### Feature: View Extras
- **Action:** User clicks "Extras" button on card
- **Result:** Modal opens showing behind-the-scenes, trailers, interviews
- **Entry Point:** Any card → "Extras" button
- **Status:** Working
- **File Reference:** `[ExtrasModal:tsx:1-200]`, `[YouTubePlayer:tsx:1-150]`

### Community Features

#### Feature: Create Community Post
- **Action:** User clicks "New Post" button in Community section, writes title/body, selects tags, submits
- **Result:** Post appears in Recent Posts sidebar, visible to all users
- **Entry Point:** CommunityPanel → "New Post" button → NewPostModal
- **Status:** Working (but comments don't appear on detail page - see PostDetail issue)
- **File Reference:** `[NewPostModal:tsx:1-200]`, `[CommunityPanel:tsx:12-262]`

#### Feature: View Post Detail
- **Action:** User clicks on a post card
- **Result:** Full post page opens at `/posts/{slug}` with body, comments, replies, vote bar
- **Entry Point:** CommunityPanel → PostCard click
- **Status:** Partially functional (comments load but may not display correctly)
- **File Reference:** `[PostDetail:tsx:1-300]`, `[PostCard:tsx:1-150]`

#### Feature: Vote on Post
- **Action:** User clicks upvote/downvote arrow on post
- **Result:** Vote saved to `posts/{postId}/votes/{userId}`, score updated via Cloud Function
- **Entry Point:** PostDetail page → VoteBar component
- **Status:** Working (aggregateVotes Cloud Function updates score)
- **File Reference:** `[VoteBar:tsx:1-100]`, `[functions/index:ts:4-17]`

#### Feature: Comment on Post
- **Action:** User writes comment in CommentComposer, submits
- **Result:** Comment appears in CommentList, saved to `posts/{postId}/comments/{commentId}`, sanitized by Cloud Function
- **Entry Point:** PostDetail page → CommentComposer
- **Status:** Working (sanitizeComment Cloud Function validates content)
- **File Reference:** `[CommentComposer:tsx:16-125]`, `[CommentList:tsx:15-201]`, `[functions/sanitizeComment:ts:1-100]`

#### Feature: Reply to Comment
- **Action:** User clicks "Reply" on a comment, writes reply, submits
- **Result:** Reply appears nested under comment, push notification sent to comment author (if FCM token exists)
- **Entry Point:** PostDetail → CommentList → Reply button
- **Status:** Working (sendPushOnReply Cloud Function sends notification)
- **File Reference:** `[ReplyList:tsx:1-142]`, `[functions/sendPushOnReply:ts:1-96]`

### Settings Features

#### Feature: Open Settings
- **Action:** User clicks Settings FAB or Settings icon
- **Result:** Settings page/modal opens with tabs: Account, Display, Notifications, Layout, Data, Pro, About
- **Entry Point:** Settings FAB (floating action button) or header Settings icon
- **Status:** Working (mobile uses SettingsSheet, desktop uses SettingsPage modal)
- **File Reference:** `[SettingsPage:tsx:1-300]`, `[SettingsSheet:tsx:1-200]`, `[FABs:tsx:1-100]`

#### Feature: Configure For You Genres
- **Action:** User goes to Settings → Layout, selects genres for 3 rails
- **Result:** Home page "For You" section updates with new genre combinations
- **Entry Point:** Settings → Layout → For You Genre Config
- **Status:** Working
- **File Reference:** `[ForYouGenreConfig:tsx:1-150]`, `[GenreRowConfig:tsx:1-100]`

#### Feature: Toggle Theme
- **Action:** User clicks theme toggle FAB or Settings → Display → Theme
- **Result:** App switches between light/dark theme, preference saved
- **Entry Point:** ThemeToggleFAB or Settings → Display
- **Status:** Working
- **File Reference:** `[FABs:tsx:1-100]`, `[SettingsPage:tsx:1-300]`

#### Feature: Change Language
- **Action:** User goes to Settings → Display → Language, selects English/Spanish
- **Result:** All UI text switches language, preference saved
- **Entry Point:** Settings → Display → Language
- **Status:** Working (English and Spanish supported)
- **File Reference:** `[translations:ts:1-605]`, `[language:ts:1-100]`

#### Feature: Change Personality Level
- **Action:** User goes to Settings → Display → Personality, selects Regular/Semi-Sarcastic/Severely Sarcastic
- **Result:** Toast messages and UI copy become more sarcastic, preference saved
- **Entry Point:** Settings → Display → Personality
- **Status:** Working
- **File Reference:** `[settings:ts:1-200]`, `[PersonalityExamples:tsx:1-100]`

#### Feature: Export Data
- **Action:** User goes to Settings → Data → Export, clicks export button
- **Result:** JSON file downloaded with all user data (watchlists, settings, notes)
- **Entry Point:** Settings → Data → Export
- **Status:** Working
- **File Reference:** `[SettingsPage:tsx:1-300]`

#### Feature: Clear Data
- **Action:** User goes to Settings → Data → Clear, confirms deletion
- **Result:** All local data cleared, user signed out
- **Entry Point:** Settings → Data → Clear
- **Status:** Working
- **File Reference:** `[SettingsPage:tsx:1-300]`

#### Feature: Upgrade to Pro
- **Action:** User goes to Settings → Pro, clicks upgrade button
- **Result:** Pro features unlocked (more trivia questions, email notifications, advanced customization)
- **Entry Point:** Settings → Pro
- **Status:** Working (Pro status stored in settings, feature-gated throughout app)
- **File Reference:** `[SettingsPage:tsx:1-300]`, `[settings:ts:1-200]`

### Authentication Features

#### Feature: Sign In with Google
- **Action:** User clicks "Sign In" → "Google", allows popup/redirect
- **Result:** User authenticated, username prompt shown if first time, data syncs from Firebase
- **Entry Point:** Header → Sign In button → AuthModal → Google
- **Status:** Working (popup on desktop, redirect on mobile/blocked popups)
- **File Reference:** `[AuthModal:tsx:1-200]`, `[authLogin:ts:1-100]`, `[auth:ts:49-468]`

#### Feature: Sign In with Apple
- **Action:** User clicks "Sign In" → "Apple", redirects to Apple, signs in
- **Result:** User authenticated, username prompt shown if first time
- **Entry Point:** Header → Sign In button → AuthModal → Apple
- **Status:** Working (always uses redirect, never popup)
- **File Reference:** `[AuthModal:tsx:1-200]`, `[authLogin:ts:1-100]`

#### Feature: Sign In with Email/Password
- **Action:** User clicks "Sign In" → "Email", enters email/password, submits
- **Result:** User authenticated, username prompt shown if first time
- **Entry Point:** Header → Sign In button → AuthModal → Email
- **Status:** Working
- **File Reference:** `[AuthModal:tsx:1-200]`, `[auth:ts:49-468]`

#### Feature: Set Username
- **Action:** User signs in for first time, modal prompts "what should we call you?", user enters name
- **Result:** Username saved to settings, appears in header snark message
- **Entry Point:** Post-authentication → UsernamePromptModal
- **Status:** Working
- **File Reference:** `[UsernamePromptModal:tsx:1-150]`, `[useUsername:ts:1-100]`

#### Feature: Sign Out
- **Action:** User clicks account button → Sign Out
- **Result:** User signed out, local data cleared, redirected to home
- **Entry Point:** Header → AccountButton → Sign Out
- **Status:** Working
- **File Reference:** `[AccountButton:tsx:1-150]`, `[auth:ts:49-468]`

### Admin Features

#### Feature: Access Admin Page
- **Action:** Admin user navigates to `/admin` route
- **Result:** Admin dashboard opens with user management, metrics, bulk actions
- **Entry Point:** URL: `/admin` (requires admin role in Firebase Auth token)
- **Status:** Working (admin role set via Cloud Function `setAdminRole`)
- **File Reference:** `[AdminPage:tsx:1-200]`, `[functions/setAdminRole:ts:1-100]`

#### Feature: Manage Users (Admin)
- **Action:** Admin views user list, can grant/revoke admin role, export data
- **Result:** User roles updated, CSV exports generated
- **Entry Point:** Admin page → User Management tab
- **Status:** Working
- **File Reference:** `[AdminUserManagement:tsx:1-200]`, `[functions/manageAdminRole:ts:1-100]`

---

## 2. DATA MODELS & RELATIONSHIPS

### Firestore Collections

#### Collection: `posts/{postId}`
**Purpose:** Community posts created by users

**Fields:**
- `id` (string): Document ID (auto-generated)
- `slug` (string): Unique URL slug (e.g., "my-favorite-show-review")
- `title` (string): Post title
- `excerpt` (string): Short summary
- `body` (string): Full post content
- `authorId` (string): Firebase Auth UID of post author
- `authorName` (string): Display name of author
- `tagSlugs` (array<string>): Array of tag slugs (e.g., ["movies", "reviews"])
- `publishedAt` (Timestamp): When post was published
- `updatedAt` (Timestamp): Last update time
- `score` (number): Aggregated vote score (updated by Cloud Function)
- `voteCount` (number): Total number of votes (updated by Cloud Function)
- `commentCount` (number): Total number of comments (updated by Cloud Function)

**Relationships:**
- Has sub-collection: `posts/{postId}/votes/{userId}` (one vote per user)
- Has sub-collection: `posts/{postId}/comments/{commentId}` (comments on post)
- Author references: `users/{authorId}` (via `authorId` field)

**Data Flow:**
- **Created:** `[NewPostModal:tsx:1-200]` → Firestore `addDoc`
- **Updated:** Post author or admin via `[PostDetail:tsx:1-300]`
- **Read:** `[CommunityPanel:tsx:12-262]` (list), `[PostDetail:tsx:1-300]` (detail)
- **Deleted:** Post author or admin

**File References:** `[firestore.rules:18-38]`, `[NewPostModal:tsx:1-200]`, `[PostDetail:tsx:1-300]`

---

#### Sub-Collection: `posts/{postId}/votes/{userId}`
**Purpose:** User votes on posts (upvote/downvote)

**Fields:**
- `value` (number): 1 for upvote, -1 for downvote
- `userId` (string): Document ID = user's UID

**Relationships:**
- Parent: `posts/{postId}`
- User: `users/{userId}` (via document ID)

**Data Flow:**
- **Created/Updated:** `[VoteBar:tsx:1-100]` → Firestore `setDoc`
- **Read:** `[VoteBar:tsx:1-100]` (to show current vote)
- **Aggregated:** Cloud Function `aggregateVotes` updates parent post `score` and `voteCount`

**File References:** `[firestore.rules:39-49]`, `[VoteBar:tsx:1-100]`, `[functions/index:ts:4-17]`

---

#### Sub-Collection: `posts/{postId}/comments/{commentId}`
**Purpose:** Comments on community posts

**Fields:**
- `id` (string): Document ID (auto-generated)
- `authorId` (string): Firebase Auth UID
- `authorName` (string): Display name
- `authorAvatar` (string): Avatar URL (optional)
- `body` (string): Comment text (max 5000 chars, validated by security rules)
- `createdAt` (Timestamp): Server timestamp
- `updatedAt` (Timestamp): Server timestamp
- `replyCount` (number): Number of replies (updated by Cloud Function `aggregateReplies`)

**Relationships:**
- Parent: `posts/{postId}`
- Has sub-collection: `posts/{postId}/comments/{commentId}/replies/{replyId}`
- Author: `users/{authorId}` (via `authorId` field)

**Data Flow:**
- **Created:** `[CommentComposer:tsx:16-125]` → Firestore `addDoc` → Cloud Function `sanitizeComment` validates
- **Updated:** Comment author via `[CommentList:tsx:15-201]`
- **Read:** `[CommentList:tsx:15-201]` (real-time via `onSnapshot`)
- **Deleted:** Comment author, post author, or admin

**File References:** `[firestore.rules:51-88]`, `[CommentComposer:tsx:16-125]`, `[CommentList:tsx:15-201]`, `[functions/sanitizeComment:ts:1-100]`

---

#### Sub-Collection: `posts/{postId}/comments/{commentId}/replies/{replyId}`
**Purpose:** Replies to comments (1 level deep)

**Fields:**
- `id` (string): Document ID (auto-generated)
- `authorId` (string): Firebase Auth UID
- `authorName` (string): Display name
- `authorAvatar` (string): Avatar URL (optional)
- `body` (string): Reply text (max 500 chars, validated by security rules)
- `createdAt` (Timestamp): Server timestamp

**Relationships:**
- Parent: `posts/{postId}/comments/{commentId}`
- Author: `users/{authorId}` (via `authorId` field)

**Data Flow:**
- **Created:** `[ReplyList:tsx:1-142]` → Firestore `addDoc` → Cloud Function `aggregateReplies` updates parent comment `replyCount` → Cloud Function `sendPushOnReply` sends FCM notification to comment author
- **Updated/Deleted:** Reply author
- **Read:** `[ReplyList:tsx:1-142]` (real-time via `onSnapshot`)

**File References:** `[firestore.rules:76-87]`, `[ReplyList:tsx:1-142]`, `[functions/aggregateReplies:ts:1-100]`, `[functions/sendPushOnReply:ts:1-96]`

---

#### Collection: `users/{userId}`
**Purpose:** User profiles and synced data

**Fields:**
- `uid` (string): Firebase Auth UID (document ID)
- `email` (string): User email
- `displayName` (string): User display name
- `photoURL` (string | null): Avatar URL
- `lastLoginAt` (string): ISO timestamp of last login
- `fcmToken` (string | null): FCM token for push notifications (stored by `firebase-messaging.ts`)
- `watchlists` (object): Synced watchlist data (see structure below)
  - `movies`: { `watching`: [], `wishlist`: [], `watched`: [] }
  - `tv`: { `watching`: [], `wishlist`: [], `watched`: [] }
  - `customLists`: [] (custom list definitions)
  - `customItems`: {} (items in custom lists, keyed by list ID)
- `lastUpdated` (Timestamp): Last sync time

**Relationships:**
- Auth: Firebase Auth user (via `uid`)
- Posts: Author of posts in `posts/{postId}` (via `authorId`)

**Data Flow:**
- **Created:** `[auth:ts:342-384]` → `ensureUserDocument` on first login
- **Updated:** `[firebaseSync:ts:148-191]` → `saveToFirebase` (debounced, triggered by `library:changed` event)
- **Read:** `[firebaseSync:ts:196-232]` → `loadFromFirebase` on login
- **FCM Token:** `[firebase-messaging:ts:57-100]` → `getFCMToken` stores token

**File References:** `[firestore.rules:91-109]`, `[auth:ts:342-384]`, `[firebaseSync:ts:11-429]`, `[firebase-messaging:ts:1-122]`

---

### LocalStorage Data Models

#### Key: `flicklet.library.v2`
**Purpose:** Primary library storage (watchlists, ratings, notes, tags)

**Structure:**
```typescript
{
  "movie:123": {
    id: 123,
    mediaType: "movie",
    title: "The Matrix",
    year: 1999,
    posterUrl: "https://...",
    list: "watching" | "wishlist" | "watched" | "not" | "custom:listId",
    addedAt: 1234567890,
    userRating: 5, // 1-5 stars
    userNotes: "Great movie!",
    tags: ["sci-fi", "action"],
    synopsis: "...",
    showStatus: "Ended" | "Returning Series" | ...,
    nextAirDate: "2025-01-15",
    lastAirDate: "2024-12-01",
    networks: [...],
    productionCompanies: [...],
    // ... other TMDB fields
  },
  "tv:456": { ... }
}
```

**Data Flow:**
- **Created/Updated:** `[storage:ts:224-490]` → `Library.upsert` → saves to localStorage → emits `library:changed` event → triggers Firebase sync
- **Read:** `[storage:ts:224-490]` → `Library.getAll()`, `useLibrary` hook
- **Deleted:** `[storage:ts:224-490]` → `Library.remove`

**File References:** `[storage:ts:1-524]`, `[library.types:ts:1-18]`

---

#### Key: `flicklet.customLists.v2`
**Purpose:** Custom list definitions

**Structure:**
```typescript
{
  customLists: [
    {
      id: "list-123",
      name: "Holiday Movies",
      description: "Movies to watch during holidays",
      color: "#FF0000",
      createdAt: 1234567890,
      itemCount: 5,
      isDefault: false
    }
  ],
  selectedListId: "list-123",
  maxLists: 10
}
```

**Data Flow:**
- **Created/Updated:** `[customLists:ts:1-200]` → `customListManager.create/update`
- **Read:** `[customLists:ts:1-200]` → `customListManager.getAll`

**File References:** `[customLists:ts:1-200]`, `[library.types:ts:1-18]`

---

#### Key: `flicklet:flickword-game-state`
**Purpose:** FlickWord game state (current game progress)

**Structure:**
```typescript
{
  target: "HOUSE",
  guesses: ["CRANE", "MOUSE"],
  current: "",
  maxGuesses: 6,
  done: false,
  status: { "H": "correct", "O": "present", ... },
  lastResults: [["correct", "absent", ...], ...],
  wordInfo: {
    definition: "...",
    difficulty: "easy"
  },
  showHint: false,
  date: "2025-01-15" // Date when game was saved
}
```

**Data Flow:**
- **Created/Updated:** `[FlickWordGame:tsx:72-95]` → `saveGameState` on each guess
- **Read:** `[FlickWordGame:tsx:174-265]` → `loadTodaysWord` loads saved state if same date

**File References:** `[FlickWordGame:tsx:1-921]`

---

#### Key: `flicklet:flickword-stats` or `flickword:stats`
**Purpose:** FlickWord game statistics

**Structure:**
```typescript
{
  games: 10,
  wins: 8,
  losses: 2,
  streak: 3,
  maxStreak: 5
}
```

**Data Flow:**
- **Updated:** `[FlickWordModal:tsx:90-131]` → `handleGameComplete` saves stats
- **Read:** `[FlickWordStats:tsx:13-101]` → displays stats

**File References:** `[FlickWordModal:tsx:90-131]`, `[FlickWordStats:tsx:13-101]`

**⚠️ ISSUE:** FlickWord stats stored in localStorage only, never synced to Firebase. If user clears browser data, stats are lost.

---

#### Key: `flicklet-data` (Legacy V1 format)
**Purpose:** Legacy data format (still used in some places, being migrated)

**Structure:**
```javascript
{
  tv: { watching: [], wishlist: [], watched: [] },
  movies: { watching: [], wishlist: [], watched: [] },
  settings: { pro: false, episodeTracking: false, theme: 'light', lang: 'en', username: '', displayName: '' },
  flickword: { games: 0, wins: 0, losses: 0, streak: 0, maxStreak: 0 }
}
```

**Data Flow:**
- **Migration:** `[storage:ts:44-76]` → `migrateOldData` converts to V2 format on first load

**File References:** `[storage:ts:44-76]`

---

### Settings Data Model

**Storage:** `flicklet.settings.v2` (localStorage) + synced to `users/{uid}/settings` (Firestore)

**Structure:**
```typescript
{
  account: {
    username: string,
    displayName: string,
    email: string,
    photoURL: string | null
  },
  display: {
    theme: "light" | "dark",
    language: "en" | "es",
    personalityLevel: "regular" | "semi-sarcastic" | "severely-sarcastic"
  },
  notifications: {
    globalEnabled: boolean,
    methods: {
      inApp: boolean,
      push: boolean,
      email: boolean // Pro only
    },
    showSettings: Record<showId, ShowNotificationSettings>
  },
  layout: {
    episodeTracking: boolean,
    forYouRows: [
      { mainGenre: string, subGenre: string, mediaType: "movies" | "tv" | "both" },
      ...
    ]
  },
  pro: {
    isPro: boolean,
    subscriptionType: string | null,
    expiresAt: number | null
  }
}
```

**Data Flow:**
- **Created/Updated:** `[settings:ts:1-200]` → `settingsManager.update*` methods
- **Read:** `[settings:ts:1-200]` → `useSettings` hook
- **Sync:** Synced to Firebase on changes (via `firebaseSync`)

**File References:** `[settings:ts:1-200]`

---

### Analytics/Events Data Model

**Storage:** `flicklet_analytics` (localStorage, last 100 events) - Development only

**Structure:**
```typescript
[
  {
    event: "tab_opened:returning",
    payload: { count: 5 },
    timestamp: "2025-01-15T10:00:00Z",
    userAgent: "...",
    url: "https://..."
  },
  ...
]
```

**Data Flow:**
- **Created:** `[analytics:ts:12-19]` → `track(event, payload)` logs to console and localStorage
- **Read:** Development debugging only (not sent to external service)

**File References:** `[analytics:ts:1-19]`, `[events:ts:1-11]`

**⚠️ ISSUE:** Analytics currently only logs to console/localStorage. No external analytics service integrated (Sentry installed but not initialized).

---

## 3. INTEGRATION MATRIX

| Feature | Community Posts | Movie Tracking | FlickWord | Trivia | Notifications | Discovery |
|---------|----------------|----------------|-----------|--------|---------------|-----------|
| **Community Posts** | -- | ❌ No | ❌ No | ❌ No | ✅ Yes (reply notifications) | ❌ No |
| **Movie Tracking** | ❌ No | -- | ❌ No | ❌ No | ✅ Yes (episode notifications) | ✅ Yes (recommendations) |
| **FlickWord** | ❌ No | ❌ No | -- | ❌ No | ❌ No | ❌ No |
| **Trivia** | ❌ No | ❌ No | ❌ No | -- | ❌ No | ❌ No |
| **Notifications** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | -- | ❌ No |
| **Discovery** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | -- |

### Legend
- ✅ **Yes**: Features are connected (data flows between them)
- ❌ **No**: Features are silos (no integration)
- 🟡 **Should**: High-value opportunity for integration (noted in Section 7)

### Detailed Integration Status

#### Community ↔ Movie Tracking: ❌ No
- **Current:** Posts can mention shows/movies by name, but no deep linking or auto-tagging
- **Missing:** Can't click a show name in a post to go to show detail, can't create post from a 5-star rating

#### Community ↔ FlickWord: ❌ No
- **Current:** Completely separate features
- **Missing:** Can't share FlickWord results to community, no leaderboard integration

#### Community ↔ Trivia: ❌ No
- **Current:** Completely separate features
- **Missing:** Can't discuss trivia questions in community, no trivia-related posts

#### Movie Tracking ↔ FlickWord: ❌ No
- **Current:** Completely separate features
- **Missing:** No word-of-the-day related to shows user is watching

#### Movie Tracking ↔ Trivia: ❌ No
- **Current:** Completely separate features
- **Missing:** Trivia questions not personalized to user's watch history, no deep links from trivia to show pages

#### FlickWord ↔ Trivia: ❌ No
- **Current:** Completely separate games
- **Missing:** No shared stats or achievements

#### Notifications ↔ Community: ✅ Yes
- **Connected:** `sendPushOnReply` Cloud Function sends FCM push when user receives reply
- **File Reference:** `[functions/sendPushOnReply:ts:1-96]`

#### Notifications ↔ Movie Tracking: ✅ Yes
- **Connected:** `NotificationManager` sends in-app/push/email notifications for upcoming episodes
- **File Reference:** `[notifications:ts:54-334]`, `[ShowNotificationSettingsModal:tsx:1-200]`

#### Discovery ↔ Movie Tracking: ✅ Yes
- **Connected:** Discovery page uses watch history and ratings to generate recommendations
- **File Reference:** `[DiscoveryPage:tsx:1-200]`, `[smartDiscovery:ts:1-100]`

---

## 4. UI COMPONENT ARCHITECTURE

### Major Components

#### Component: `App.tsx`
**What it renders:** Main application shell, routing, modals, tabs

**Hooks/APIs called:**
- `useAuth` - Authentication state
- `useLibrary` - Watchlist data (watching, wishlist, watched)
- `useSettings` - User settings
- `useForYouRows` - For You genre configuration
- `useForYouContent` - Genre-based content from TMDB
- `useInTheaters` - Movies in theaters
- `useServiceWorker` - Offline support
- `useReturningShows` - Smart filtered returning shows

**Contains:**
- `FlickletHeader` - Search, marquee, account button
- `Tabs` / `MobileTabs` - Navigation
- `CommunityPanel` - Community posts
- `HomeYourShowsRail` - Currently watching rail
- `HomeUpNextRail` - Up next episodes rail
- `Rail` - Generic horizontal scrollable rail
- `Section` - Section wrapper with title
- `TheaterInfo` - Theater information
- `FeedbackPanel` - Feedback form
- `SettingsPage` - Settings modal
- `PostDetail` - Post detail page (route: `/posts/:slug`)
- `ListPage` - List views (watching, wishlist, watched, returning)
- `MyListsPage` - Custom lists
- `DiscoveryPage` - Discovery/search
- `AdminPage` - Admin dashboard (route: `/admin`)
- Various modals: `NotesAndTagsModal`, `ShowNotificationSettingsModal`, `FlickWordModal`, `BloopersModal`, `ExtrasModal`, `HelpModal`, `AuthModal`

**Props:** None (root component)

**State managed:**
- `view` - Current tab/view
- `currentPath` - URL path for routing
- `search` - Search query/state
- `showSettings` - Settings modal visibility
- `showFlickWordModal` - FlickWord modal visibility
- `notesModalItem` - Item for notes modal
- `notificationModalItem` - Item for notification modal
- `bloopersModalItem` - Item for bloopers modal
- `extrasModalItem` - Item for extras modal
- `showHelpModal` - Help modal visibility
- `showAuthModal` - Auth modal visibility

**File Reference:** `[App:tsx:63-941]`

**⚠️ Issues:**
- Multiple responsibilities: routing, state management, modal management, data fetching
- Large file (941 lines) - could be split into smaller components
- Modal state management scattered across multiple useState hooks

---

#### Component: `CommunityPanel.tsx`
**What it renders:** Recent community posts in sidebar/list format

**Hooks/APIs called:**
- `useAuth` - Check if user authenticated
- Firestore `onSnapshot` - Real-time posts listener
- Firestore `collection` - Posts collection query

**Contains:**
- `PostCard` - Individual post card
- `NewPostModal` - Modal to create new post

**Props:** None

**State managed:**
- `posts` - Array of post documents
- `loading` - Loading state
- `showNewPostModal` - New post modal visibility

**File Reference:** `[CommunityPanel:tsx:12-262]`

**⚠️ Issues:**
- No pagination (loads all posts) - could be performance issue with many posts
- No error boundary for Firestore errors

---

#### Component: `PostDetail.tsx`
**What it renders:** Full post page with body, comments, replies, vote bar

**Hooks/APIs called:**
- `useAuth` - Authentication state
- Firestore `getDoc` - Fetch post by slug
- Firestore `onSnapshot` - Real-time post updates

**Contains:**
- `VoteBar` - Upvote/downvote buttons
- `CommentComposer` - Comment input form
- `CommentList` - List of comments
- `ReplyList` - Replies to comments (nested)

**Props:**
- `slug` (string) - Post slug from URL

**State managed:**
- `post` - Post document data
- `loading` - Loading state
- `error` - Error state

**File Reference:** `[PostDetail:tsx:1-300]`

**⚠️ Issues:**
- Comments may not display correctly (reported in feature inventory)
- No error boundary
- No loading skeleton

---

#### Component: `FlickWordGame.tsx`
**What it renders:** Wordle-style word guessing game interface

**Hooks/APIs called:**
- `getTodaysWord` - Daily word API (`dailyWordApi.ts`)
- `validateWord` - Word validation API
- `localStorage` - Game state and stats persistence

**Contains:**
- Game board (6 rows × 5 tiles)
- Virtual keyboard
- Stats display
- Hint toggle

**Props:**
- `onClose` (function) - Close callback
- `onGameComplete` (function) - Game completion callback

**State managed:**
- `game` - Game state (target word, guesses, current input, status)
- `isLoading` - Loading state
- `notifications` - Toast notifications array
- `animationState` - Tile animation state

**File Reference:** `[FlickWordGame:tsx:1-921]`

**⚠️ Issues:**
- Large component (921 lines) - could be split into smaller sub-components
- Stats stored in localStorage only, not synced to Firebase
- No error boundary for API failures

---

#### Component: `TriviaGame.tsx`
**What it renders:** Trivia question interface with multiple choice answers

**Hooks/APIs called:**
- `getCachedTrivia` - Trivia API with caching (`triviaApi.ts`)
- `useSettings` - Check Pro status

**Contains:**
- Question display
- Answer options (4 buttons)
- Explanation display
- Score counter
- Game completion screen

**Props:**
- `onClose` (function) - Close callback
- `onGameComplete` (function) - Game completion callback

**State managed:**
- `questions` - Array of trivia questions
- `currentQuestionIndex` - Current question
- `selectedAnswer` - User's selected answer
- `score` - Current score
- `gameState` - 'loading' | 'playing' | 'completed'
- `showExplanation` - Show explanation toggle
- `isProUser` - Pro status
- `currentGame` - Game number (1-5 for Pro)
- `gamesCompletedToday` - Daily completion counter

**File Reference:** `[TriviaGame:tsx:1-906]`

**⚠️ Issues:**
- Large component (906 lines) - could be split
- No stats persistence (scores not saved)
- No error boundary

---

#### Component: `Card.tsx` / `CardV2.tsx`
**What it renders:** Media card (movie/TV show) with poster, title, actions

**Hooks/APIs called:**
- `useLibrary` - Check if item in library
- Event system - Emits `card:want`, `card:watched`, etc.

**Contains:**
- `StarRating` - 1-5 star rating component
- `ActionButton` - Add/Watched/Start Watching buttons
- `MyListToggle` - Custom list toggle
- `EpisodeProgressDisplay` - Episode progress (TV only)
- `ProviderBadge` - Streaming provider badge

**Props:**
- `item` (MediaItem) - Movie/TV show data
- `mode` (string) - Display mode
- Various action callbacks

**State managed:**
- Local hover/click state
- Rating state (if editable)

**File Reference:** `[Card:tsx:1-200]`, `[CardV2:tsx:1-300]`

**⚠️ Issues:**
- Two card components (`Card.tsx` and `CardV2.tsx`) - potential duplication
- Complex prop interface (many optional callbacks)

---

#### Component: `ListPage.tsx`
**What it renders:** Full-page list view with filters, sort, search

**Hooks/APIs called:**
- `useLibrary` - Watchlist data
- `useSettings` - Settings (episode tracking, etc.)

**Contains:**
- `ListFilters` - Filter chips (genre, year, etc.)
- `SortDropdown` - Sort options
- `Card` / `CardV2` - Media cards
- `InfiniteScrollContainer` - Infinite scroll wrapper

**Props:**
- `title` (string) - Page title
- `items` (LibraryEntry[]) - Items to display
- `mode` (string) - List mode (watching, wishlist, watched, returning)
- Various action callbacks (onNotesEdit, onTagsEdit, etc.)

**State managed:**
- `filteredItems` - Filtered/sorted items
- `filters` - Active filters
- `sortBy` - Sort option

**File Reference:** `[ListPage:tsx:1-300]`

**⚠️ Issues:**
- No pagination (renders all items) - could be slow with large lists
- Filter logic could be extracted to custom hook

---

#### Component: `SettingsPage.tsx`
**What it renders:** Settings modal/page with multiple tabs

**Hooks/APIs called:**
- `useSettings` - Settings data
- `settingsManager` - Settings update methods
- `useAuth` - User data

**Contains:**
- Settings tabs: Account, Display, Notifications, Layout, Data, Pro, About
- `ForYouGenreConfig` - Genre configuration
- `GenreRowConfig` - Individual genre row config
- Various form inputs

**Props:**
- `onClose` (function) - Close callback

**State managed:**
- `activeTab` - Current settings tab
- Form state for various settings

**File Reference:** `[SettingsPage:tsx:1-300]`

**⚠️ Issues:**
- Large component - could be split into tab components
- Settings sync to Firebase not always immediate (debounced)

---

### Component Issues Summary

**Multiple Responsibilities:**
- `App.tsx` - Routing, state, modals, data fetching
- `FlickWordGame.tsx` - Game logic, UI, API calls, persistence
- `TriviaGame.tsx` - Game logic, UI, API calls, state management
- `ListPage.tsx` - Filtering, sorting, rendering, infinite scroll

**Duplicated Logic:**
- Two card components (`Card.tsx` and `CardV2.tsx`)
- Modal state management pattern repeated across multiple components
- Settings sync logic duplicated in multiple places

**Missing Error Boundaries:**
- `CommunityPanel` - No error boundary for Firestore errors
- `PostDetail` - No error boundary
- `FlickWordGame` - No error boundary for API failures
- `TriviaGame` - No error boundary
- `ListPage` - No error boundary

**Performance Issues:**
- `CommunityPanel` - No pagination (loads all posts)
- `ListPage` - No pagination (renders all items)
- `App.tsx` - Large component, many re-renders possible

---

## 5. USER FLOW MAPS

### Flow 1: New User Discovers App → Rates First Movie → Sees Community Post Option

**Step 1: User opens app**
- **UI Element:** Home page loads
- **Data:** No user data, empty watchlists
- **Next State:** Auth modal auto-opens after 1 second (if not authenticated)

**Step 2: User signs in with Google**
- **UI Element:** `AuthModal` → Google button
- **Data:** Firebase Auth creates user, `ensureUserDocument` creates `users/{uid}` document
- **Next State:** Username prompt modal opens (if first time)

**Step 3: User sets username**
- **UI Element:** `UsernamePromptModal`
- **Data:** Username saved to `settings.username` and `settings.displayName`, synced to Firebase
- **Next State:** Home page with personalized header message

**Step 4: User searches for a movie**
- **UI Element:** Header search bar
- **Data:** TMDB API search returns results
- **Next State:** `SearchResults` page shows matching movies

**Step 5: User clicks "Add" on a movie card**
- **UI Element:** `Card` → "Add" button
- **Data:** Event `card:want` emitted → `Library.upsert` adds to wishlist → `library:changed` event → Firebase sync triggered
- **Next State:** Toast notification: "Added to Want to Watch" (personality-based message)

**Step 6: User navigates to "Want to Watch" tab**
- **UI Element:** Tab navigation → "Want to Watch"
- **Data:** `useLibrary('wishlist')` reads from localStorage
- **Next State:** `ListPage` shows wishlist items

**Step 7: User clicks "Start Watching" on the movie**
- **UI Element:** `Card` → "Start Watching" button
- **Data:** `Library.upsert` moves item from wishlist to watching list
- **Next State:** Item appears in "Currently Watching" tab

**Step 8: User rates the movie 5 stars**
- **UI Element:** `Card` → `StarRating` component
- **Data:** `userRating: 5` saved to library entry, synced to Firebase
- **Next State:** Stars update visually, rating persists

**Step 9: User scrolls to Community section**
- **UI Element:** Home page → "Community" section
- **Data:** `CommunityPanel` queries Firestore `posts` collection (real-time listener)
- **Next State:** Recent posts displayed

**Step 10: User sees "New Post" button but doesn't create post**
- **UI Element:** `CommunityPanel` → "New Post" button
- **Data:** No data change (user doesn't click)
- **Next State:** User continues browsing

**⚠️ MISSING CONNECTION:** No prompt to create a post about the 5-star movie. No deep link from rating to community post creation.

**File References:** `[App:tsx:198-235]`, `[AuthModal:tsx:1-200]`, `[UsernamePromptModal:tsx:1-150]`, `[SearchResults:tsx:1-200]`, `[actions:ts:40-58]`, `[storage:ts:224-490]`, `[CommunityPanel:tsx:12-262]`

---

### Flow 2: User Plays Trivia → Gets Question Wrong → Sees Related Community Discussion

**Step 1: User opens Trivia game**
- **UI Element:** Home page → Community section → Trivia card click
- **Data:** `TriviaGame` component loads, `getCachedTrivia` fetches questions from API (or fallback)
- **Next State:** Trivia modal opens with first question

**Step 2: User sees question about a show they're watching**
- **UI Element:** `TriviaGame` → Question display
- **Data:** Question loaded (not personalized to user's watch history)
- **Next State:** User sees 4 answer options

**Step 3: User selects wrong answer**
- **UI Element:** `TriviaGame` → Answer button click
- **Data:** `selectedAnswer` state updated, `score` not incremented
- **Next State:** Explanation shown, "Next" button appears

**Step 4: User clicks "Next"**
- **UI Element:** `TriviaGame` → "Next" button
- **Data:** `currentQuestionIndex` incremented
- **Next State:** Next question displayed

**Step 5: User completes game**
- **UI Element:** `TriviaGame` → Final score screen
- **Data:** Game state set to 'completed', score calculated
- **Next State:** Modal closes, user returns to home

**Step 6: User wants to discuss the question they got wrong**
- **UI Element:** User manually navigates to Community section
- **Data:** No automatic connection - user must manually search for posts about the show
- **Next State:** User may or may not find relevant discussion

**⚠️ MISSING CONNECTIONS:**
1. Trivia questions not personalized to user's watch history
2. No deep link from trivia question to show detail page
3. No prompt to create community post about the show after getting question wrong
4. No "Discuss this show" button in trivia explanation

**File References:** `[TriviaGame:tsx:1-906]`, `[triviaApi:ts:4-130]`, `[CommunityPanel:tsx:12-262]`

---

### Flow 3: User Creates Post → Receives Comment → Replies → Receives Notification

**Step 1: User creates a post**
- **UI Element:** `CommunityPanel` → "New Post" button → `NewPostModal`
- **Data:** User fills title, body, selects tags, submits
- **Next State:** `addDoc` to Firestore `posts` collection → Post appears in `CommunityPanel`

**Step 2: Another user views the post**
- **UI Element:** `CommunityPanel` → `PostCard` click
- **Data:** `PostDetail` component loads, fetches post by slug
- **Next State:** Post detail page at `/posts/{slug}`

**Step 3: Other user writes a comment**
- **UI Element:** `PostDetail` → `CommentComposer` → Submit
- **Data:** `addDoc` to `posts/{postId}/comments/{commentId}` → Cloud Function `sanitizeComment` validates → Comment appears in `CommentList` (real-time)
- **Next State:** Comment displayed in `CommentList`

**Step 4: Original user receives notification (if FCM token exists)**
- **UI Element:** Browser push notification (if app closed) or toast (if app open)
- **Data:** Cloud Function `sendPushOnReply` NOT triggered (only triggers on replies, not comments)
- **Next State:** User may or may not see notification

**⚠️ ISSUE:** No push notification for new comments, only for replies. User must manually check post.

**Step 5: Original user clicks on post**
- **UI Element:** User navigates to `/posts/{slug}`
- **Data:** `PostDetail` loads post and comments (real-time listener)
- **Next State:** Post page with comments visible

**Step 6: Original user replies to comment**
- **UI Element:** `CommentList` → "Reply" button → `ReplyList` → Submit reply
- **Data:** `addDoc` to `posts/{postId}/comments/{commentId}/replies/{replyId}` → Cloud Function `aggregateReplies` updates parent comment `replyCount` → Cloud Function `sendPushOnReply` sends FCM notification to comment author
- **Next State:** Reply appears nested under comment, comment author receives push notification

**Step 7: Comment author receives push notification**
- **UI Element:** Browser push notification (background) or toast (foreground)
- **Data:** FCM message delivered via `firebase-messaging-sw.js` (background) or `setupForegroundMessageHandler` (foreground)
- **Next State:** User clicks notification → Opens post detail page

**File References:** `[NewPostModal:tsx:1-200]`, `[PostDetail:tsx:1-300]`, `[CommentComposer:tsx:16-125]`, `[CommentList:tsx:15-201]`, `[ReplyList:tsx:1-142]`, `[functions/sendPushOnReply:ts:1-96]`, `[firebase-messaging:ts:1-122]`

---

### Flow 4: User 5-Stars Show → Checks Profile → Sees Watch History + Game Stats

**Step 1: User rates a show 5 stars**
- **UI Element:** `Card` → `StarRating` → 5 stars
- **Data:** `Library.upsert` updates `userRating: 5`, synced to Firebase
- **Next State:** Stars update, rating saved

**Step 2: User wants to check their profile/stats**
- **UI Element:** User looks for profile page
- **Data:** No dedicated profile page exists
- **Next State:** User must navigate to different tabs to see different data

**Step 3: User checks "Watched" tab**
- **UI Element:** Tab navigation → "Watched"
- **Data:** `useLibrary('watched')` reads from localStorage
- **Next State:** `ListPage` shows watched items with ratings visible on cards

**Step 4: User checks FlickWord stats**
- **UI Element:** User must open FlickWord game → Stats button
- **Data:** `FlickWordStats` reads from `localStorage.getItem('flickword:stats')`
- **Next State:** Stats modal shows games, wins, losses, streak

**Step 5: User checks Trivia stats**
- **UI Element:** User must open Trivia game → Stats (if available)
- **Data:** No stats persistence - scores not saved
- **Next State:** No stats to display

**⚠️ MISSING CONNECTIONS:**
1. No unified profile page showing all user activity (ratings, watch history, game stats)
2. FlickWord stats not synced to Firebase (localStorage only)
3. Trivia stats not saved at all
4. No aggregation of user activity across features

**File References:** `[StarRating:tsx:1-100]`, `[ListPage:tsx:1-300]`, `[FlickWordStats:tsx:13-101]`, `[TriviaGame:tsx:1-906]`

---

## 6. TECHNICAL DEBT & RISKS

### Race Conditions

#### Issue: Optimistic UI Without Rollback
**Location:** `[CommentComposer:tsx:25-71]`, `[ReplyList:tsx:63-75]`
**Problem:** Comments/replies are written optimistically to Firestore, but if Cloud Function `sanitizeComment` rejects the content, the UI doesn't roll back. User sees comment appear, then it may disappear if validation fails.
**Risk:** Medium - User confusion, potential data inconsistency
**Fix:** Add error handling to roll back optimistic update if Firestore write fails

#### Issue: Firebase Sync Race Condition
**Location:** `[firebaseSync:ts:148-191]`
**Problem:** `syncInProgress` flag prevents concurrent syncs, but if user makes rapid changes, some may be lost if sync is in progress.
**Risk:** Low - Debounced sync reduces frequency, but edge cases exist
**Fix:** Queue sync operations instead of skipping

#### Issue: Library Update Race Condition
**Location:** `[storage:ts:224-490]`
**Problem:** Multiple rapid `Library.upsert` calls can cause duplicate Firebase sync events if debounce hasn't fired yet.
**Risk:** Low - Debounce helps, but not perfect
**Fix:** Use request ID or timestamp to deduplicate sync events

---

### Missing Security Rules

#### Issue: Users Collection Read Access Too Permissive
**Location:** `[firestore.rules:91-109]`
**Problem:** Rule allows any authenticated user to read any user document: `allow read: if isAuthenticated();` This exposes all user data (watchlists, settings) to any logged-in user.
**Risk:** High - Privacy violation, data exposure
**Fix:** Restrict to own document: `allow read: if isOwner(userId);`

#### Issue: No Rate Limiting on Post Creation
**Location:** `[firestore.rules:23-29]`
**Problem:** Authenticated users can create unlimited posts. No rate limiting in security rules (client-side rate limiting exists but can be bypassed).
**Risk:** Medium - Spam, abuse, cost
**Fix:** Add Cloud Function middleware for rate limiting, or use Firestore security rules with request time tracking

#### Issue: FCM Token Not Validated
**Location:** `[firebase-messaging:ts:84-88]`
**Problem:** FCM token stored in user document without validation. Malicious user could store invalid token, causing Cloud Function failures.
**Risk:** Low - Cloud Function handles invalid tokens, but wastes resources
**Fix:** Validate token format before storing

---

### Performance Bottlenecks

#### Issue: No Pagination on Community Posts
**Location:** `[CommunityPanel:tsx:12-262]`
**Problem:** `onSnapshot` listener loads ALL posts from Firestore. With hundreds of posts, this causes:
- Slow initial load
- High Firestore read costs
- Large memory usage
- Slow re-renders on every new post
**Risk:** High - Will become critical as post count grows
**Fix:** Implement pagination with `limit()` and `startAfter()` queries

#### Issue: No Pagination on List Pages
**Location:** `[ListPage:tsx:1-300]`
**Problem:** Renders all items in list at once. Users with 1000+ items will experience:
- Slow initial render
- High memory usage
- Poor scroll performance
**Risk:** Medium - Affects power users with large libraries
**Fix:** Implement virtual scrolling or pagination

#### Issue: Large Firestore Listeners
**Location:** `[CommentList:tsx:15-201]`, `[ReplyList:tsx:1-142]`
**Problem:** Real-time listeners on comments/replies load all documents. For posts with 100+ comments, this is expensive.
**Risk:** Medium - High Firestore read costs
**Fix:** Paginate comments, load replies on-demand

#### Issue: No Image Lazy Loading
**Location:** `[Card:tsx:1-200]`, `[CardV2:tsx:1-300]`
**Problem:** All poster images load immediately, even if not visible. Causes:
- Slow page load
- High bandwidth usage
- Poor mobile performance
**Risk:** Medium - Affects users on slow connections
**Fix:** Implement `loading="lazy"` on images, or use intersection observer

#### Issue: FlickWord Stats Not Synced
**Location:** `[FlickWordModal:tsx:90-131]`
**Problem:** Stats stored in localStorage only. If user clears browser data or uses different device, stats are lost.
**Risk:** Low - User experience issue, not security
**Fix:** Sync stats to Firebase `users/{uid}/flickwordStats`

---

### Inconsistent Patterns

#### Issue: Modal State Management Inconsistency
**Location:** `[App:tsx:101-121]`
**Problem:** Some modals use separate state (`showNotesModal`, `showNotificationModal`), others use single modal component with props. Inconsistent patterns make code harder to maintain.
**Risk:** Low - Code maintainability
**Fix:** Standardize on single modal manager or context

#### Issue: Settings Sync Pattern Inconsistency
**Location:** `[settings:ts:1-200]`, `[firebaseSync:ts:11-429]`
**Problem:** Some settings sync immediately, others are debounced. Watchlists sync via `firebaseSync`, but settings may sync separately. Unclear which takes precedence on conflict.
**Risk:** Medium - Data consistency issues
**Fix:** Unify sync strategy, add conflict resolution

#### Issue: Error Handling Inconsistency
**Location:** Various components
**Problem:** Some components have try/catch blocks, others don't. Some show error messages, others fail silently. No consistent error boundary strategy.
**Risk:** Medium - Poor user experience on errors
**Fix:** Add error boundaries, standardize error handling pattern

---

### Brittle Error Handling

#### Issue: TMDB API Failures Not Handled Gracefully
**Location:** `[useTmdb:ts:1-100]`, `[tmdb:ts:1-200]`
**Problem:** If TMDB API is down or rate-limited, search and content loading fail with no fallback. User sees blank page or error.
**Risk:** Medium - Poor user experience
**Fix:** Add retry logic, fallback to cached data, show user-friendly error message

#### Issue: Firestore Connection Loss Not Handled
**Location:** `[CommunityPanel:tsx:12-262]`, `[PostDetail:tsx:1-300]`
**Problem:** If Firestore connection is lost, real-time listeners fail silently. User doesn't know data is stale.
**Risk:** Low - Rare, but confusing when it happens
**Fix:** Add connection state monitoring, show offline indicator

#### Issue: FCM Token Failure Silent
**Location:** `[firebase-messaging:ts:57-100]`
**Problem:** If FCM token request fails (permission denied, network error), error is only logged to console. User doesn't know notifications won't work.
**Risk:** Low - User experience issue
**Fix:** Show user-friendly error message, offer retry

---

### Code Duplication

#### Issue: Card Component Duplication
**Location:** `[Card:tsx:1-200]`, `[CardV2:tsx:1-300]`
**Problem:** Two card components with similar functionality. Unclear which to use, potential for bugs if one is updated but not the other.
**Risk:** Low - Code maintainability
**Fix:** Consolidate into single component, or clearly document when to use each

#### Issue: Modal State Pattern Duplication
**Location:** `[App:tsx:101-121]`
**Problem:** Same pattern repeated for each modal: `const [showModal, setShowModal] = useState(false); const [modalItem, setModalItem] = useState(null);`
**Risk:** Low - Code maintainability
**Fix:** Create `useModal` hook or modal context

#### Issue: Settings Sync Logic Duplication
**Location:** `[settings:ts:1-200]`, `[firebaseSync:ts:11-429]`
**Problem:** Settings may sync in multiple places with different strategies.
**Risk:** Medium - Potential for conflicts
**Fix:** Unify sync logic in single manager

---

## 7. MISSING CONNECTIONS (High-Value Opportunities)

### Opportunity 1: Auto-Generate Community Post from 5-Star Rating
**Description:** When user rates a show/movie 5 stars, prompt them to create a community post with pre-filled title: "I just 5-starred [Title]!" and optional review prompt.
**Implementation:**
- Add event listener in `StarRating` component: if rating === 5, show modal: "Share your love for [Title]?"
- Modal opens `NewPostModal` with pre-filled title and tag suggestions
- Deep link: Rating → Community post creation
**Value:** Increases community engagement, connects ratings to discussions
**File References:** `[StarRating:tsx:1-100]`, `[NewPostModal:tsx:1-200]`

---

### Opportunity 2: Personalized Trivia Questions Based on Watch History
**Description:** Trivia questions should prioritize shows/movies the user is currently watching or has watched. After getting a question wrong, show deep link to show detail page.
**Implementation:**
- Modify `getCachedTrivia` to accept user watch history
- Filter/prioritize questions about shows in user's library
- In `TriviaGame`, after wrong answer, show button: "Learn more about [Show Name]" → links to show detail or Discovery page
**Value:** Makes trivia more relevant, increases engagement with watched content
**File References:** `[triviaApi:ts:4-130]`, `[TriviaGame:tsx:1-906]`, `[storage:ts:224-490]`

---

### Opportunity 3: FlickWord Daily Word Related to User's Shows
**Description:** Daily word could be related to a show the user is watching (e.g., word "HOUSE" when user watches "House of Cards"). After game completion, show connection.
**Implementation:**
- Modify `getTodaysWord` to optionally suggest words related to user's watch history
- After game completion, if word matches a show name, show: "Did you know this word is in [Show Name]?"
- Deep link to show detail page
**Value:** Creates connection between games and content, increases discovery
**File References:** `[dailyWordApi:ts:1-100]`, `[FlickWordGame:tsx:1-921]`, `[storage:ts:224-490]`

---

### Opportunity 4: Unified User Profile Page
**Description:** Create a profile page showing: watch history stats (total watched, average rating), FlickWord stats, Trivia stats, recent community posts, achievements/badges.
**Implementation:**
- New page: `/profile` or `/user/{username}`
- Component: `UserProfilePage` aggregates data from:
  - `users/{uid}/watchlists` (Firestore) - watch history
  - `localStorage` - FlickWord stats (needs to sync to Firebase first)
  - `posts` collection filtered by `authorId` - community posts
- Display: Stats cards, recent activity feed, achievements
**Value:** Gives users a sense of progress, encourages engagement across all features
**File References:** `[storage:ts:224-490]`, `[FlickWordStats:tsx:13-101]`, `[CommunityPanel:tsx:12-262]`

---

### Opportunity 5: Game High Score → Community Post with Achievement Badge
**Description:** When user achieves a FlickWord streak or perfect Trivia score, auto-generate a community post: "I just got a 10-day FlickWord streak! 🎉" with achievement badge.
**Implementation:**
- In `FlickWordModal.handleGameComplete`, if streak reaches milestone (5, 10, 20), show prompt: "Share your achievement?"
- If yes, create post with pre-filled content and achievement badge emoji/tag
- Similar for Trivia: perfect score (10/10) triggers share prompt
**Value:** Increases community engagement, creates social proof, gamification
**File References:** `[FlickWordModal:tsx:90-131]`, `[TriviaGame:tsx:1-906]`, `[NewPostModal:tsx:1-200]`

---

### Opportunity 6: Deep Linking from Community Posts to Shows
**Description:** When a post mentions a show/movie name, make it clickable → links to show detail page or Discovery search.
**Implementation:**
- Parse post body for show/movie names (fuzzy match against TMDB database or user's library)
- Wrap matches in `<Link>` components pointing to `/discovery?q={showName}` or show detail if in library
- Add "Tagged Shows" section in `PostDetail` showing linked shows
**Value:** Connects community discussions to content, increases discovery
**File References:** `[PostDetail:tsx:1-300]`, `[DiscoveryPage:tsx:1-200]`, `[tmdb:ts:1-200]`

---

## 8. OUTPUT FORMAT

### File Reference Tags

**Components:**
- `[App:tsx:63-941]` - Main application component
- `[CommunityPanel:tsx:12-262]` - Community posts panel
- `[PostDetail:tsx:1-300]` - Post detail page
- `[FlickWordGame:tsx:1-921]` - FlickWord game component
- `[TriviaGame:tsx:1-906]` - Trivia game component
- `[Card:tsx:1-200]` - Media card component
- `[CardV2:tsx:1-300]` - Media card V2 component
- `[ListPage:tsx:1-300]` - List view page
- `[SettingsPage:tsx:1-300]` - Settings page
- `[NewPostModal:tsx:1-200]` - New post modal
- `[CommentComposer:tsx:16-125]` - Comment composer
- `[CommentList:tsx:15-201]` - Comment list
- `[ReplyList:tsx:1-142]` - Reply list
- `[VoteBar:tsx:1-100]` - Vote bar component
- `[StarRating:tsx:1-100]` - Star rating component
- `[AuthModal:tsx:1-200]` - Authentication modal
- `[UsernamePromptModal:tsx:1-150]` - Username prompt modal

**Libraries/Utils:**
- `[storage:ts:1-524]` - Library storage system
- `[firebaseSync:ts:11-429]` - Firebase sync manager
- `[auth:ts:49-468]` - Authentication manager
- `[settings:ts:1-200]` - Settings manager
- `[notifications:ts:54-334]` - Notification manager
- `[tmdb:ts:1-200]` - TMDB API client
- `[triviaApi:ts:4-130]` - Trivia API client
- `[dailyWordApi:ts:1-100]` - Daily word API client
- `[analytics:ts:1-19]` - Analytics tracking
- `[firebase-messaging:ts:1-122]` - FCM messaging

**Firebase Functions:**
- `[functions/index:ts:4-17]` - Main functions export
- `[functions/sanitizeComment:ts:1-100]` - Comment sanitization
- `[functions/aggregateVotes:ts:1-50]` - Vote aggregation
- `[functions/aggregateReplies:ts:1-100]` - Reply aggregation
- `[functions/sendPushOnReply:ts:1-96]` - Push notification on reply
- `[functions/setAdminRole:ts:1-100]` - Admin role management

**Configuration:**
- `[firestore.rules:1-122]` - Firestore security rules
- `[App:tsx:59-62]` - Route types and state

---

### Confidence Scores

| Section | Confidence | Notes |
|---------|-----------|-------|
| **1. User-Facing Features** | High | Comprehensive component scan completed, all major features identified |
| **2. Data Models** | High | Firestore rules and sync code analyzed, localStorage structure documented |
| **3. Integration Matrix** | High | Cross-referenced components and data flows, verified connections |
| **4. UI Component Architecture** | High | All major components analyzed, props and state documented |
| **5. User Flow Maps** | Medium | Flows traced through code, but some edge cases may exist |
| **6. Technical Debt** | High | Code patterns analyzed, security rules reviewed, performance issues identified |
| **7. Missing Connections** | High | Based on data model analysis and integration gaps |

---

## Appendix: Additional Findings

### Environment Variables Required
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - FCM sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_TMDB_API_KEY` - TMDB API key
- `VITE_FCM_VAPID_KEY` - FCM VAPID key (for push notifications)
- `VITE_SENTRY_DSN` - Sentry DSN (optional, not initialized)

### External APIs Used
- **TMDB API** - Movie/TV data, search, images
- **OpenTriviaDB API** - Trivia questions (fallback to hardcoded questions)
- **Daily Word API** - FlickWord daily word (fallback to "HOUSE")
- **SendGrid API** - Email notifications (Pro feature, via Netlify function)
- **Firebase Services** - Auth, Firestore, FCM, Storage

### Build/Deploy Configuration
- **Hosting:** Netlify (configured in `netlify.toml`)
- **Build:** Vite (configured in `vite.config.js`)
- **Functions:** Netlify Functions (`netlify/functions/`) + Firebase Functions (`functions/`)
- **Mobile:** Capacitor (Android/iOS apps)

---

**Report Complete.** This system map provides a comprehensive view of the Flicklet application, identifying all features, data models, integrations, and opportunities for improvement.

