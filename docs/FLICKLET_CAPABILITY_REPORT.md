# Flicklet Capability Report (v2)

**Generated:** January 2025  
**Project:** flicklet-71dff  
**Purpose:** Complete current-state capability map for PM/O&M documentation

---

## 1. Core Features

### Watching List
**What it does:** Users track TV shows and movies they're currently watching. Shows appear in the "Currently Watching" tab with episode tracking support.

**Dependencies:** 
- LocalStorage (`flicklet.library.v2`)
- Firebase Firestore sync (when signed in)
- TMDB API for show metadata

**Test Tasks:**
- Add a show to Watching list from search results
- Verify show appears in "Currently Watching" tab
- Move show to Wishlist or Watched
- Test episode tracking (if enabled in Settings)
- Verify data syncs across devices when signed in

**O&M Tasks:**
- Monitor Firestore read/write quotas
- Check for sync failures in Firebase Console
- Review storage usage for user documents

---

### Wishlist
**What it does:** Users save movies and TV shows they want to watch later. Items appear in the "Want to Watch" tab.

**Dependencies:** 
- LocalStorage
- Firebase Firestore sync
- TMDB API

**Test Tasks:**
- Add item to Wishlist from search or discovery
- Move item from Wishlist to Watching
- Remove item from Wishlist
- Verify items persist after page refresh

**O&M Tasks:**
- Monitor Firestore operations
- Check for data loss reports

---

### Watched List
**What it does:** Users mark content as completed. Items appear in the "Already Watched" tab with user ratings and notes.

**Dependencies:**
- LocalStorage
- Firebase Firestore sync
- TMDB API

**Test Tasks:**
- Mark show/movie as watched
- Add rating (1-5 stars)
- Add notes/review
- Verify watched items appear in Discover recommendations exclusion

**O&M Tasks:**
- Monitor storage growth (watched lists can grow large)
- Review data export functionality

---

### Custom Lists
**What it does:** Users create up to 3 custom lists (e.g., "Holiday Movies", "Date Night"). Items can be organized into custom categories.

**Dependencies:**
- LocalStorage (`flicklet.customLists.v2`)
- Firebase Firestore sync
- Custom list manager

**Test Tasks:**
- Create a new custom list
- Add items to custom list via "My List +" button
- Edit list name/description
- Set default list
- Delete list (verify items are preserved)
- Verify limit of 3 lists (free tier)

**O&M Tasks:**
- Monitor list creation/deletion rates
- Check for custom list sync issues

---

### Discovery & Recommendations
**What it does:** Smart algorithm analyzes user's watching/wishlist/watched lists and ratings to suggest personalized content. Shows 3 customizable genre rows on home page.

**Dependencies:**
- TMDB API (trending, popular, genre endpoints)
- User library data (watching, wishlist, watched, ratings)
- Smart discovery algorithm (`smartDiscovery.ts`)

**Test Tasks:**
- Verify recommendations appear after adding rated content
- Test genre customization in Settings → Layout
- Verify "Not Interested" items are excluded
- Check that recommendations update when library changes

**O&M Tasks:**
- Monitor TMDB API rate limits
- Review recommendation quality (user feedback)
- Check algorithm performance (response times)

---

### Search
**What it does:** Multi-platform search for movies, TV shows, and actors. Supports text search, tag filtering (`tag:comedy`), and genre filtering.

**Dependencies:**
- TMDB API (search/multi, search/tv, search/movie, search/person)
- Local tag search (for user's library)
- Search ranking algorithm (`rank.ts`)

**Test Tasks:**
- Search for movie/TV show title
- Search for actor name
- Use tag search (`tag:action`)
- Filter by genre after search
- Verify search results are ranked correctly
- Test pagination for large result sets

**O&M Tasks:**
- Monitor TMDB API usage
- Check search response times
- Review error rates for failed searches

---

### Ratings
**What it does:** Users rate shows/movies with 1-5 star system. Ratings influence recommendations and are stored per item.

**Dependencies:**
- LocalStorage
- Firebase Firestore sync
- Discovery algorithm (uses ratings for scoring)

**Test Tasks:**
- Rate an item from Watching/Wishlist/Watched
- Change rating
- Verify rating appears on card
- Check that ratings influence Discover recommendations

**O&M Tasks:**
- Monitor rating data quality
- Review recommendation accuracy based on ratings

---

### Episode Tracking
**What it does:** Users track which episode they're on for TV series. Optional feature (disabled by default, can enable in Settings → Layout).

**Dependencies:**
- TMDB API (TV show details, seasons/episodes)
- LocalStorage
- Episode modal component

**Test Tasks:**
- Enable episode tracking in Settings
- Open episode modal on TV show card
- Select current season/episode
- Verify episode progress saves
- Test with shows that have many seasons

**O&M Tasks:**
- Monitor TMDB API calls for episode data
- Check for shows with missing episode data

---

### Notes & Tags
**What it does:** Users add personal notes and tags to any show/movie. Tags support local search (`tag:comedy`).

**Dependencies:**
- LocalStorage
- Firebase Firestore sync

**Test Tasks:**
- Add notes to an item
- Add tags to an item
- Search by tag
- Edit/delete notes
- Verify tags persist after refresh

**O&M Tasks:**
- Monitor storage usage (notes can be long)
- Review tag usage patterns

---

### Community Features

#### Posts & Comments
**What it does:** Users create posts about shows/movies. Other users can vote, comment, and reply. Posts appear on home page and in discovery.

**Dependencies:**
- Firestore (`posts` collection)
- Firebase Auth (for user identification)
- Cloud Functions (aggregation, sanitization)

**Test Tasks:**
- Create a new post
- Vote on a post (upvote/downvote)
- Add a comment
- Reply to a comment
- Mention a user (@username)
- Delete own comments
- Verify vote counts update in real-time

**O&M Tasks:**
- Monitor Firestore read/write quotas
- Review comment moderation (profanity filter)
- Check for spam/vote manipulation
- Monitor Cloud Function execution times

---

#### FlickWord Game
**What it does:** Daily word-guessing game (Wordle-style). Users guess 5-letter words with color feedback. Stats tracked locally.

**Dependencies:**
- LocalStorage (game state, stats)
- Daily word API (`dailyWordApi.ts`)
- Game component (`FlickWordGame.tsx`)

**Test Tasks:**
- Play daily word game
- Verify color feedback (green/yellow/gray)
- Check stats tracking
- Test keyboard input
- Verify game resets daily

**O&M Tasks:**
- Monitor word API availability
- Check for game state corruption
- Review user engagement metrics

---

#### Daily Trivia
**What it does:** Movie/TV trivia questions. Free users get 10 questions/day, Pro users get 50 questions/day. Stats tracked.

**Dependencies:**
- Open Trivia Database API (fallback to hardcoded questions)
- LocalStorage (game state, stats)
- Trivia component (`TriviaGame.tsx`)

**Test Tasks:**
- Play free trivia (10 questions)
- Verify Pro unlocks more questions (if Pro enabled)
- Check answer validation
- Test stats tracking
- Verify daily reset

**O&M Tasks:**
- Monitor trivia API availability
- Review fallback question quality
- Check for Pro feature gating

---

#### Community Player
**What it does:** YouTube player for curated entertainment videos. Currently uses seed data (`community-seed.json`), rotates daily.

**Dependencies:**
- YouTube embed API
- Seed data file
- Community player component

**Test Tasks:**
- Verify player loads on home page
- Check video playback controls
- Test daily rotation
- Verify YouTube embed works

**O&M Tasks:**
- Monitor YouTube API changes
- Update seed data periodically
- Review video availability

---

### Notifications
**What it does:** Users receive notifications for episode reminders, comment replies, and mentions. Supports in-app, push, and email (Pro only).

**Dependencies:**
- Firebase Cloud Messaging (FCM)
- SendGrid (email via extension)
- Notification settings (localStorage + Firestore)
- Cloud Functions (weeklyDigest, sendPushOnReply)

**Test Tasks:**
- Enable notifications in Settings
- Grant browser permission
- Test episode reminder notification
- Test push notification for comment reply
- Test email notification (Pro only)
- Verify unsubscribe link works
- Test per-show notification settings

**O&M Tasks:**
- Monitor FCM token registration
- Check SendGrid delivery rates
- Review weekly digest success rate
- Monitor notification permission prompts
- Review bounce/spam reports

---

### Pro Features (Preview-Only)
**What it does:** Pro features are visible but locked behind Pro subscription. Users can preview but not use until Pro is enabled.

**Pro Features:**
- Email notifications (custom timing)
- Advanced notifications (per-show timing override)
- Theme packs (holiday themes)
- Extended trivia (50 vs 10 questions)
- Bloopers & Extras access
- CSV export
- Custom list limit increase (3 → unlimited)

**Dependencies:**
- Settings.pro flag (localStorage)
- Feature gating logic
- Payment integration (not yet implemented)

**Test Tasks:**
- Verify Pro features show locked icon
- Check upgrade prompt appears
- Test Pro preview functionality
- Verify Pro features unlock when flag enabled

**O&M Tasks:**
- Monitor Pro feature usage (when enabled)
- Review upgrade conversion rates
- Check for Pro feature bugs

---

### PWA Installation
**What it does:** App can be installed as Progressive Web App on mobile and desktop. Works offline after installation.

**Dependencies:**
- Service Worker (`sw.js`)
- Web App Manifest (`manifest.webmanifest`)
- Install prompt hook (`useInstallPrompt.ts`)

**Test Tasks:**
- Verify install prompt appears (Chrome/Edge)
- Test installation on mobile Android
- Test installation on desktop
- Test iOS "Add to Home Screen" (Safari)
- Verify app works offline after installation
- Test service worker caching

**O&M Tasks:**
- Monitor install success rates
- Check service worker errors
- Review offline functionality reports
- Update manifest when needed

---

### Offline Support
**What it does:** App caches previously visited posts and pages. Works offline for cached content. New searches/comments queue until online.

**Dependencies:**
- Service Worker
- Cache API
- Offline queue (for comments)

**Test Tasks:**
- Visit posts while online
- Go offline
- Verify cached posts load
- Test offline search (should show error gracefully)
- Test comment queuing (offline)
- Verify comments send when back online

**O&M Tasks:**
- Monitor cache size
- Check for cache corruption
- Review offline error handling

---

### Feedback System
**What it does:** Users submit bug reports and feature requests via in-app form. Data stored in Firestore.

**Dependencies:**
- Firestore (`feedback` collection)
- Feedback panel component

**Test Tasks:**
- Submit feedback form
- Verify feedback appears in Firestore
- Test form validation
- Check error handling

**O&M Tasks:**
- Monitor feedback submission rate
- Review feedback regularly
- Respond to critical issues

---

### Authentication
**What it does:** Users sign in with Google or Apple. Syncs data across devices. Supports multi-tab detection.

**Dependencies:**
- Firebase Auth
- Google OAuth
- Apple OAuth
- Auth state management

**Test Tasks:**
- Sign in with Google
- Sign in with Apple
- Verify data syncs after sign-in
- Test sign out
- Test multi-tab auth handling
- Verify username prompt after first sign-in

**O&M Tasks:**
- Monitor auth success/failure rates
- Check for auth redirect issues
- Review user account creation
- Monitor Firebase Auth quota

---

### Settings
**What it does:** Comprehensive settings page with 6 tabs: General, Notifications, Layout, Data, Pro, About.

**Settings Sections:**
- General: Display name, personality level, language
- Notifications: Global settings, per-show overrides
- Layout: Theme, condensed view, home page rails, For You genres, episode tracking
- Data: Export/import, share with friends, reset data
- Pro: Pro status, upgrade prompt, feature list
- About: Version, help, feedback

**Dependencies:**
- LocalStorage (`flicklet.settings.v2`)
- Firebase Firestore sync
- Settings manager

**Test Tasks:**
- Change display name
- Toggle theme (light/dark)
- Enable/disable episode tracking
- Configure For You genres
- Export data (JSON)
- Import data
- Reset all data

**O&M Tasks:**
- Monitor settings sync issues
- Review data export functionality
- Check for settings corruption

---

## 2. Admin & Backend

### Admin Dashboard
**What it does:** Admin-only dashboard for content moderation, user management, and data export. Accessible at `/admin` route.

**Features:**
- Metrics cards (total posts, comments, users)
- Posts list with bulk actions
- User management (grant/revoke admin roles)
- Comments management (view/delete per post)
- CSV export

**Dependencies:**
- Firebase Auth (custom claims for admin role)
- Firestore (posts, comments, users collections)
- Cloud Functions (setAdminRole, manageAdminRole)

**Test Tasks:**
- Verify admin role grant (via Firebase Functions shell)
- Access `/admin` route
- View metrics cards
- Select multiple posts
- Delete posts (bulk)
- Grant admin role to another user
- Export data to CSV
- View comments for a post

**O&M Tasks:**
- Review admin role assignments
- Monitor admin dashboard access
- Check for unauthorized access attempts
- Review moderation actions

---

### Cloud Functions

#### weeklyDigest (Scheduled)
**What it does:** Sends weekly email digest every Friday at 9 AM UTC. Includes top posts, new comments, and mentions.

**Dependencies:**
- Firestore (posts, comments, users collections)
- firestore-send-email extension
- SendGrid SMTP

**Test Tasks:**
- Verify function runs on schedule
- Check emails are sent
- Test unsubscribe link
- Verify email content is correct

**O&M Tasks:**
- Monitor function execution logs
- Check email delivery rates
- Review unsubscribe rates
- Verify SendGrid quota

---

#### unsubscribe (Callable)
**What it does:** Handles email unsubscribe requests from digest emails. Sets `emailSubscriber=false` on user document.

**Dependencies:**
- Firebase Auth (JWT token verification)
- Firestore (users collection)

**Test Tasks:**
- Click unsubscribe link in email
- Verify user is unsubscribed
- Check token expiration handling

**O&M Tasks:**
- Monitor unsubscribe requests
- Check for token validation errors

---

#### setAdminRole (Callable)
**What it does:** Grants admin role to authenticated user. Sets custom claim `{role: 'admin'}`.

**Dependencies:**
- Firebase Auth
- Firebase Admin SDK

**Test Tasks:**
- Call function (authenticated)
- Verify admin role is granted
- Check user must sign out/in for changes to take effect

**O&M Tasks:**
- Audit admin role grants
- Monitor function calls
- Review security logs

---

#### manageAdminRole (Callable)
**What it does:** Admins can grant/revoke admin roles for other users. Prevents self-demotion.

**Dependencies:**
- Firebase Auth (admin check)
- Firebase Admin SDK

**Test Tasks:**
- Grant admin role to another user
- Revoke admin role
- Verify self-demotion prevention
- Check authorization

**O&M Tasks:**
- Monitor admin role changes
- Review security logs
- Audit admin user list

---

#### sanitizeComment (Trigger)
**What it does:** Automatically filters profanity from comments. Deletes comments with disallowed words. Updates comment count.

**Dependencies:**
- Firestore trigger (on comment write)
- Bad words list (`bad-words.json`)

**Test Tasks:**
- Post comment with profanity
- Verify comment is deleted
- Post clean comment
- Verify comment is saved
- Check comment count updates

**O&M Tasks:**
- Monitor profanity filter effectiveness
- Update bad words list as needed
- Review false positives

---

#### aggregateVotes (Trigger)
**What it does:** Updates post score and vote count when users vote. Runs automatically on vote create/update/delete.

**Dependencies:**
- Firestore trigger (on vote write)
- Firestore (posts collection)

**Test Tasks:**
- Vote on a post
- Verify score updates
- Change vote
- Verify score updates correctly
- Remove vote
- Verify score decreases

**O&M Tasks:**
- Monitor aggregation accuracy
- Check for vote manipulation
- Review function execution times

---

#### aggregateReplies (Trigger)
**What it does:** Updates reply count on parent comment when replies are created/updated/deleted.

**Dependencies:**
- Firestore trigger (on reply write)
- Firestore (comments collection)

**Test Tasks:**
- Reply to a comment
- Verify reply count updates
- Delete reply
- Verify count decreases

**O&M Tasks:**
- Monitor aggregation accuracy
- Check for function errors

---

#### sendPushOnReply (Trigger)
**What it does:** Sends push notification to comment author when someone replies. Skips if user replies to own comment.

**Dependencies:**
- Firestore trigger (on reply create)
- FCM token (from user document)
- Firebase Admin SDK messaging

**Test Tasks:**
- Reply to another user's comment
- Verify push notification is sent
- Reply to own comment
- Verify no notification
- Check invalid token cleanup

**O&M Tasks:**
- Monitor notification delivery rates
- Check for FCM token errors
- Review notification failures

---

## 3. Integrations

### TMDB API
**What it does:** Provides movie/TV show metadata, posters, search results, and trending content.

**Dependencies:**
- TMDB API key (in Netlify env vars)
- TMDB proxy function (deprecated, now direct calls)
- API client (`tmdb.ts`)

**Test Tasks:**
- Search for content
- Load movie/TV details
- Fetch trending content
- Load posters
- Verify API rate limiting

**O&M Tasks:**
- Monitor API rate limits
- Check API key rotation
- Review API response times
- Monitor quota usage

---

### Firebase Services

#### Firestore
**What it does:** Primary database for posts, comments, users, votes, and synced library data.

**Collections:**
- `posts/{postId}`
- `posts/{postId}/comments/{commentId}`
- `posts/{postId}/comments/{commentId}/replies/{replyId}`
- `posts/{postId}/votes/{userId}`
- `users/{uid}` (synced library data)
- `mail` (for email extension)

**Test Tasks:**
- Create a post
- Verify data is saved
- Check real-time updates
- Test security rules

**O&M Tasks:**
- Monitor read/write quotas
- Review security rules violations
- Check storage usage
- Perform regular backups

---

#### Firebase Auth
**What it does:** Handles user authentication (Google, Apple). Stores custom claims (admin role).

**Test Tasks:**
- Sign in with Google
- Sign in with Apple
- Verify custom claims (admin role)
- Test token refresh

**O&M Tasks:**
- Monitor auth quota
- Review user creation rates
- Check for auth errors
- Monitor admin role grants

---

#### Firebase Hosting
**What it does:** Serves static files as fallback (primary is Netlify CDN).

**Test Tasks:**
- Verify hosting is configured
- Test fallback routing

**O&M Tasks:**
- Monitor hosting usage
- Review deployment logs

---

#### Firebase Extensions

##### firestore-send-email@0.2.4
**What it does:** Sends emails when documents are added to `mail` collection. Used for weekly digest.

**Configuration:**
- AUTH_TYPE: UsernamePassword
- SMTP: SendGrid (smtp.sendgrid.net:587)
- From: noreply@[domain]
- Collection: mail

**Test Tasks:**
- Create mail document
- Verify email is sent
- Check SendGrid delivery

**O&M Tasks:**
- Monitor extension logs
- Check SendGrid configuration
- Review email delivery rates
- Monitor SendGrid quota

---

### SendGrid
**What it does:** Email delivery service for weekly digests and notifications.

**Dependencies:**
- SendGrid API key
- SMTP configuration
- firestore-send-email extension

**Test Tasks:**
- Verify API key is valid
- Test email sending
- Check bounce handling

**O&M Tasks:**
- Rotate API key quarterly
- Monitor delivery rates
- Review bounce/spam reports
- Check sender reputation

---

### Netlify
**What it does:** Primary hosting/CDN for the app. Handles builds and deployments.

**Test Tasks:**
- Verify latest deploy is successful
- Check build logs
- Test CDN caching

**O&M Tasks:**
- Monitor build times
- Review deploy success rates
- Check bandwidth usage
- Monitor build minutes quota

---

## 4. O&M Tasks & Monitoring

### Daily Tasks
- Check Firebase Console logs for errors
- Verify Netlify deploy status
- Review SendGrid activity (delivery rates, bounces)
- Monitor error rates (Firebase Functions, Netlify)
- Check database quotas (Firestore reads/writes)
- Review user feedback
- Test critical paths (sign in, search, comments)

### Weekly Tasks
- Backup Firestore data (Monday)
- Check dependency updates (Tuesday)
- Review security rules (Wednesday)
- Performance audit (Thursday)
- Verify weekly email digest sent (Friday)

### Monthly Tasks
- Quota audit (Firebase, Netlify, SendGrid)
- Key rotation (SendGrid API key, service accounts)
- Disaster recovery test
- Cost review and optimization

### Monitoring & Alerts
- Function error rate > 5%
- Quota usage > 80%
- Email delivery rate < 90%
- Function execution time > 10s
- Daily cost threshold exceeded

### Backup & Recovery
- Firestore: Weekly exports to GCS
- Settings: LocalStorage + Firestore sync
- User data: Automatic sync on sign-in

### Data Retention
- Posts: Indefinite (user-created content)
- Comments: Indefinite (user-created content)
- User library: Indefinite (until user deletes)
- Notification logs: 30 days (configurable)
- Feedback: Indefinite (for product improvement)

---

## Feature Status Summary

### ✅ Fully Active
- Watching/Wishlist/Watched lists
- Search & Discovery
- Ratings & Notes
- Posts, Comments, Votes
- FlickWord Game
- Daily Trivia (free tier)
- Notifications (in-app, push)
- PWA Installation
- Offline Support
- Admin Dashboard
- Custom Lists (up to 3)
- Episode Tracking (optional)

### 🔒 Pro Features (Preview-Only)
- Email notifications
- Advanced notifications (custom timing)
- Theme packs
- Extended trivia (50 questions)
- Bloopers & Extras
- CSV export
- Unlimited custom lists

### 🚧 Experimental/Disabled (Feature Flags)
- Community Player (disabled by default)
- Community Games (disabled by default)
- Episode Tracking (disabled by default, can enable)
- Mobile Compact V1 (disabled)
- Mobile Actions Split V1 (disabled)
- Extras/Bloopers Search Assist (disabled)

### 📋 Coming Soon
- Payment integration for Pro
- User-submitted community content
- Enhanced sharing features
- Additional theme packs

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** After major feature releases
















