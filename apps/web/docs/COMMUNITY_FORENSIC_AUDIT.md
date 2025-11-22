# Community / Hub / Comments System - Forensic Audit Report

**Date:** 2024  
**Purpose:** Complete audit of existing Community features before adding up/downvotes, tags, filters, and Pro gating  
**Status:** Read-only audit - no code changes made

---

## 1. Community-Related Files Inventory

### Main Entry Points

| File Path                                    | Type            | Description                                                               | Navigation Connection                                     |
| -------------------------------------------- | --------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/web/src/components/CommunityPanel.tsx` | Component       | **Main community hub** - displays recent posts sidebar, games, and player | Rendered in `App.tsx` home view under "Community" section |
| `apps/web/src/components/PostDetail.tsx`     | Page Component  | Full post detail page with comments, voting, and replies                  | Route: `/posts/:slug` (handled in `App.tsx` line 75-76)   |
| `apps/web/src/components/NewPostModal.tsx`   | Modal Component | Create new post form with tag selection                                   | Opened from "Post" button in `CommunityPanel`             |

### Post Components

| File Path                              | Type      | Description                                | Navigation Connection                         |
| -------------------------------------- | --------- | ------------------------------------------ | --------------------------------------------- |
| `apps/web/src/components/PostCard.tsx` | Component | Post preview card with voting UI           | Used in `CommunityPanel` to display post list |
| `apps/web/src/components/VoteBar.tsx`  | Component | Upvote/downvote buttons with score display | Used in `PostCard` and `PostDetail`           |

### Comment Components

| File Path                                     | Type      | Description                                                    | Navigation Connection                         |
| --------------------------------------------- | --------- | -------------------------------------------------------------- | --------------------------------------------- |
| `apps/web/src/components/CommentList.tsx`     | Component | Displays comments with real-time updates, delete functionality | Used in `PostDetail` page                     |
| `apps/web/src/components/CommentComposer.tsx` | Component | Form to create new comments                                    | Used in `PostDetail` page                     |
| `apps/web/src/components/ReplyList.tsx`       | Component | Displays 1-level deep replies to comments                      | Used in `CommentList` when "Reply" is clicked |

### Supporting Components

| File Path                                     | Type      | Description                            | Navigation Connection                    |
| --------------------------------------------- | --------- | -------------------------------------- | ---------------------------------------- |
| `apps/web/src/components/CommunityPlayer.tsx` | Component | YouTube community player (placeholder) | Rendered in `CommunityPanel` left column |
| `apps/web/src/hooks/useVote.ts`               | Hook      | Manages voting state and API calls     | Used by `VoteBar` component              |

### Admin/Management

| File Path                                | Type | Description                                                 | Navigation Connection                          |
| ---------------------------------------- | ---- | ----------------------------------------------------------- | ---------------------------------------------- |
| `apps/web/src/pages/AdminExtrasPage.tsx` | Page | Admin interface for managing posts/comments (lines 215-272) | Settings → Admin tab → "Community Content" tab |

### Backend/API

| File Path                           | Type           | Description                                                         | Navigation Connection                          |
| ----------------------------------- | -------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| `server/src/routes/posts.js`        | API Route      | REST endpoints for posts (getPosts, getPostBySlug, getPostComments) | Called by server-side rendering or API clients |
| `functions/src/index.ts`            | Cloud Function | `aggregateVotes` - aggregates votes when vote documents change      | Triggered automatically by Firestore           |
| `functions/src/aggregateReplies.ts` | Cloud Function | Updates `replyCount` on comments when replies change                | Triggered automatically by Firestore           |
| `functions/src/sanitizeComment.ts`  | Cloud Function | Validates and sanitizes comment content                             | Triggered on comment creation                  |
| `functions/src/syncPostToPrisma.ts` | Cloud Function | Syncs Firestore posts to PostgreSQL/Prisma                          | Triggered on post creation                     |
| `firestore.rules`                   | Security Rules | Firestore access control for posts/comments/votes                   | Enforced automatically by Firestore            |

---

## 2. Data Model: Comments, Replies, Posts, and Relationships

### Main Post Data Shape

**Location:** Firestore collection `posts/{postId}`

**Fields:**

- `id` (string): Document ID
- `slug` (string): URL-friendly identifier (unique)
- `title` (string): Post title (first 100 chars of content)
- `body` (string): Full post content (max 5000 chars)
- `excerpt` (string): Preview text (first 200 chars)
- `authorId` (string): Firebase Auth UID
- `authorName` (string): Display name
- `authorEmail` (string | null): Author email
- `tagSlugs` (string[]): Array of tag slugs (lowercase, hyphenated)
- `publishedAt` (Timestamp): Server timestamp
- `updatedAt` (Timestamp): Server timestamp
- `score` (number): Aggregated vote score (updated by Cloud Function)
- `voteCount` (number): Total number of votes (updated by Cloud Function)
- `commentCount` (number): Total number of comments (updated by Cloud Function)

**Defined in:**

- `apps/web/src/components/NewPostModal.tsx` (lines 180-195) - creation
- `apps/web/src/components/CommunityPanel.tsx` (lines 15-29) - TypeScript interface
- `apps/web/src/components/PostDetail.tsx` (lines 22-41) - TypeScript interface

### Comment Data Shape

**Location:** Firestore sub-collection `posts/{postId}/comments/{commentId}`

**Fields:**

- `id` (string): Document ID
- `authorId` (string): Firebase Auth UID
- `authorName` (string): Display name
- `authorAvatar` (string): Avatar URL (optional)
- `body` (string): Comment text (max 5000 chars, validated by security rules)
- `createdAt` (Timestamp): Server timestamp
- `updatedAt` (Timestamp): Server timestamp
- `replyCount` (number): Number of replies (updated by Cloud Function `aggregateReplies`)

**Defined in:**

- `apps/web/src/components/CommentList.tsx` (lines 23-31) - TypeScript interface
- `apps/web/src/components/CommentComposer.tsx` (lines 45-52) - creation

### Reply Data Shape

**Location:** Firestore sub-collection `posts/{postId}/comments/{commentId}/replies/{replyId}`

**Fields:**

- `id` (string): Document ID
- `authorId` (string): Firebase Auth UID
- `authorName` (string): Display name
- `authorAvatar` (string): Avatar URL (optional)
- `body` (string): Reply text (max 500 chars, validated by security rules)
- `createdAt` (Timestamp): Server timestamp

**Defined in:**

- `apps/web/src/components/ReplyList.tsx` (lines 14-21) - TypeScript interface

### Vote Data Shape

**Location:** Firestore sub-collection `posts/{postId}/votes/{userId}`

**Fields:**

- `value` (number): `1` for upvote, `-1` for downvote
- Document ID = user's Firebase Auth UID

**Defined in:**

- `apps/web/src/hooks/useVote.ts` (lines 14-20) - TypeScript interface
- `firestore.rules` (lines 39-49) - security rules

### How Replies Are Represented

**Structure:** Nested sub-collections (1 level deep)

- Posts → Comments → Replies
- Path: `posts/{postId}/comments/{commentId}/replies/{replyId}`
- **NOT** stored as nested arrays or `parentId` fields
- Replies are **not** nested further (no replies to replies)

### Data Flow: Creating Posts

1. User fills form in `NewPostModal.tsx`
2. On submit (line 118-243):
   - Generates slug from title + timestamp
   - Converts tag names to slugs (lowercase, hyphenated)
   - Creates document in Firestore `posts` collection
   - Sets initial `score: 0`, `voteCount: 0`, `commentCount: 0`
3. Cloud Function `syncPostToPrisma` syncs to PostgreSQL (if enabled)
4. `CommunityPanel` refreshes via `onPostCreated` callback

### Data Flow: Creating Comments

1. User fills form in `CommentComposer.tsx`
2. On submit (line 25-71):
   - Creates document in `posts/{postId}/comments` sub-collection
   - Sets `authorId`, `authorName`, `authorAvatar` from auth user
   - Sets `createdAt` and `updatedAt` to `serverTimestamp()`
3. Cloud Function `sanitizeComment` validates content (checks for disallowed words)
4. Cloud Function updates parent post `commentCount` (if implemented)
5. `CommentList` updates in real-time via `onSnapshot` listener

### Data Flow: Creating Replies

1. User clicks "Reply" button in `CommentList.tsx` (line 217-228)
2. `ReplyList` component renders with inline form
3. On submit (line 63-75):
   - Creates document in `posts/{postId}/comments/{commentId}/replies` sub-collection
   - Sets `authorId`, `authorName`, `authorAvatar` from auth user
   - Sets `createdAt` to `serverTimestamp()`
4. Cloud Function `aggregateReplies` updates parent comment `replyCount`
5. Cloud Function `sendPushOnReply` sends FCM notification to comment author
6. `ReplyList` updates in real-time via `onSnapshot` listener

### Data Flow: Reading Full Thread

1. `PostDetail.tsx` fetches post by slug (line 49-101)
2. `CommentList.tsx` subscribes to comments via `onSnapshot` (line 48-104)
   - Query: `orderBy("createdAt", "asc")` - oldest first
3. For each comment, `ReplyList.tsx` subscribes to replies (line 33-61)
   - Query: `orderBy("createdAt", "asc")` - oldest first
4. All updates happen in real-time via Firestore listeners

---

## 3. Existing Reactions: Likes, Votes, Scores

### Voting Implementation

**Status:** ✅ **FULLY WIRED** (UI + API + Data)

**Files:**

- `apps/web/src/components/VoteBar.tsx` - UI component
- `apps/web/src/hooks/useVote.ts` - State management and API calls
- `functions/src/index.ts` (lines 4-17) - `aggregateVotes` Cloud Function
- `firestore.rules` (lines 39-49) - Security rules

**How It Works:**

1. User clicks upvote/downvote in `VoteBar`
2. `useVote.toggleVote()` creates/updates/deletes document in `posts/{postId}/votes/{userId}`
3. Cloud Function `aggregateVotes` triggers on vote document write
4. Cloud Function sums all votes and updates parent post `score` and `voteCount`
5. `useVote` hook subscribes to post document for real-time score updates

**Vote Fields:**

- `value`: `1` (upvote) or `-1` (downvote)
- Toggling same vote removes it (sets to `0`)

**Score Display:**

- Shows formatted score: `+5`, `-3`, `0`, `1.2k` (if >= 1000)
- Displays `voteCount` in aria-label
- Score is **visible** as a number

**Current Behavior:**

- ✅ Upvotes work
- ✅ Downvotes work
- ✅ Score aggregation works
- ✅ Real-time updates work
- ✅ Vote state persists (user can see their vote)
- ✅ Score is visible to all users

**No "Like" or "Reaction" System:**

- No emoji reactions found
- No "like" button found
- Only upvote/downvote system exists

---

## 4. Tags, Filters, Categories, and Spoilers

### Tag Implementation

**Status:** ⚠️ **PARTIALLY IMPLEMENTED** (Data exists, UI exists, but no filtering)

**How Tags Are Stored:**

- Field: `tagSlugs` (string[]) on post documents
- Tags are stored as slugs (lowercase, hyphenated)
- Example: `["discussion", "review", "tv-shows"]`

**Where Tags Are Defined:**

- `apps/web/src/components/NewPostModal.tsx` (lines 40-105, 147-167)
  - Fetches existing tags from recent posts
  - Allows selecting existing tags or creating new ones
  - Converts tag names to slugs on submit

**How Tags Are Displayed:**

- `apps/web/src/components/PostDetail.tsx` (lines 219-234) - Shows tags as chips
- `apps/web/src/components/PostCard.tsx` (lines 85-97) - Shows up to 3 tags
- `apps/web/src/components/CommunityPanel.tsx` (lines 83-86) - Extracts tags from data

**Tag Display Format:**

- Rendered as rounded chips/badges
- Style: `px-3 py-1 rounded-full text-xs`
- Color: Uses CSS variables (`var(--muted)`, `var(--line)`)

### Filter UI

**Status:** ❌ **NOT IMPLEMENTED**

**No Filter UI Found:**

- No filter chips in `CommunityPanel`
- No tag-based filtering in UI
- No "Filter by tag" dropdown
- No search/filter bar in community area

**Backend Filtering:**

- `server/src/routes/posts.js` (lines 20-38) supports `?tag=slug` query parameter
- But this is **not used** by frontend components
- `CommunityPanel` does not pass tag filters to any API

### Spoiler Handling

**Status:** ❌ **NOT IMPLEMENTED**

**No Spoiler Fields Found:**

- No `spoiler`, `containsSpoilers`, `isSpoiler` fields in post/comment data models
- No spoiler reveal UI components
- No spoiler warnings

**Only Reference:**

- Found in legacy quotes file (`_legacy_v1/www/scripts/quotes-enhanced.js`) - just a quote text, not a feature

---

## 5. Sorting, Feeds, and Pagination

### Sorting Implementation

**Status:** ⚠️ **PARTIALLY IMPLEMENTED** (Backend supports it, frontend doesn't use it)

**Backend Sorting:**

- `server/src/routes/posts.js` (lines 20, 44-45):
  - Supports `?sort=newest` (default) or `?sort=oldest`
  - Orders by `publishedAt` (desc or asc)

**Frontend Sorting:**

- `apps/web/src/components/CommunityPanel.tsx` (line 64):
  - Uses `orderBy("publishedAt", "desc")` - **hardcoded to newest first**
  - No UI to change sort order
  - No "Hot", "Top", "Trending" options

**Comment Sorting:**

- `apps/web/src/components/CommentList.tsx` (line 67):
  - Uses `orderBy("createdAt", "asc")` - **hardcoded to oldest first**
  - No UI to change sort order

**Reply Sorting:**

- `apps/web/src/components/ReplyList.tsx` (line 37):
  - Uses `orderBy("createdAt", "asc")` - **hardcoded to oldest first**

**No Special Sort Modes:**

- No "Top" (by score) sorting
- No "Hot" (by recent activity) sorting
- No "Trending" sorting
- No sort UI dropdowns

### Pagination Implementation

**Status:** ⚠️ **PARTIALLY IMPLEMENTED** (Backend supports it, frontend uses fixed limits)

**Backend Pagination:**

- `server/src/routes/posts.js` (lines 15-19):
  - Supports `?page=1` and `?pageSize=20` (max 100)
  - Returns `total`, `page`, `pageSize` in response

**Frontend Pagination:**

- `apps/web/src/components/CommunityPanel.tsx` (line 65):
  - Uses `limit(5)` - **hardcoded to 5 posts**
  - No "Load more" button
  - No infinite scroll
  - No pagination controls

**Admin Pagination:**

- `apps/web/src/pages/AdminExtrasPage.tsx` (line 223):
  - Uses `limit(100)` for posts
  - Uses `limit(100)` for comments (line 254)
  - No pagination controls

**No Infinite Scroll:**

- No infinite scroll implementation found
- No "Load more" buttons found
- No cursor-based pagination

---

## 6. Pro vs Free Behavior in Community

### Pro Gating Search Results

**Status:** ❌ **NO PRO GATING FOUND**

**Search Results:**

- No `isPro`, `proOnly`, `pro feature`, or `upgrade` references in:
  - `CommunityPanel.tsx`
  - `PostDetail.tsx`
  - `NewPostModal.tsx`
  - `CommentComposer.tsx`
  - `CommentList.tsx`
  - `ReplyList.tsx`
  - `VoteBar.tsx`

**Current Behavior:**

- ✅ **Anyone authenticated** can post
- ✅ **Anyone authenticated** can comment
- ✅ **Anyone authenticated** can reply
- ✅ **Anyone authenticated** can vote
- ✅ **Anyone** (even unauthenticated) can read posts/comments

**No Pro Restrictions:**

- No Pro-only posting
- No Pro-only commenting
- No Pro-only voting
- No Pro-only access to certain feeds
- No Pro-only tag filters

**Authentication Requirements:**

- Posting: Requires authentication (`useAuth` check in `NewPostModal.tsx` line 121)
- Commenting: Requires authentication (`useAuth` check in `CommentComposer.tsx` line 28)
- Replying: Requires authentication (`useAuth` check in `ReplyList.tsx` line 65)
- Voting: Requires authentication (`canVote` check in `useVote.ts` line 116)

---

## 7. Moderation and Reports

### Moderation Tools

**Status:** ⚠️ **PARTIALLY IMPLEMENTED** (Delete only, no reports/flags)

**Delete Functionality:**

- **Posts:** Admin can delete via `AdminExtrasPage.tsx` (lines 433-472)
  - Only admins can delete (checked via `useAdminRole` hook)
  - Deletes post and all comments
- **Comments:** Comment author, post author, or admin can delete
  - `CommentList.tsx` (lines 106-130) - Delete button with permission check
  - `firestore.rules` (line 73-74) - Security rules enforce permissions
- **Replies:** Reply author can delete
  - `firestore.rules` (line 85-86) - Security rules enforce permissions

**No Report System:**

- ❌ No "Report" button found
- ❌ No "Flag" button found
- ❌ No report/flag data model found
- ❌ No admin view for flagged content

**Admin Tools:**

- `AdminExtrasPage.tsx` has "Community Content" tab (line 630-648)
  - Lists all posts with delete buttons
  - Shows comments for selected post
  - Can delete posts and comments
  - **No** moderation queue or flagged content view

**No Other Moderation Features:**

- ❌ No hide/mute user functionality
- ❌ No blocked content system
- ❌ No content moderation queue
- ❌ No automated moderation

---

## 8. Community Entry Points and Navigation

### Main Navigation

**Home Page:**

- `apps/web/src/App.tsx` (lines 930-933):
  - Renders `<CommunityPanel />` in "Community" section on home view
  - Always visible (not gated by any flag)

**Post Detail Pages:**

- Route: `/posts/:slug`
- `apps/web/src/App.tsx` (lines 74-76, 863-867):
  - Detects `/posts/:slug` route
  - Renders `<PostDetail slug={slug} />` component

**Navigation Triggers:**

- `CommunityPanel.tsx` (line 148-151):
  - Clicking post card calls `handlePostClick(slug)`
  - Uses `window.history.pushState` to navigate to `/posts/:slug`
- `PostCard.tsx` (lines 35-43):
  - Clicking card navigates to `/posts/:slug`
  - Uses `window.history.pushState` or calls `onClick` prop

**No Other Entry Points Found:**

- ❌ No "Discuss this show" button on show cards
- ❌ No "See comments" link elsewhere
- ❌ No community link in main navigation tabs
- ❌ No community link in sidebar
- ❌ No community link in settings

**Modal Entry:**

- `NewPostModal` opens from "Post" button in `CommunityPanel` (line 309)

---

## 9. Final Structured Summary

### Architecture Overview

**Main Entry Components:**

- **`CommunityPanel`** - Main hub on home page, shows recent 5 posts
- **`PostDetail`** - Full post page at `/posts/:slug` route

**Data Flow:**

1. **Fetch:** `CommunityPanel` queries Firestore `posts` collection, orders by `publishedAt desc`, limits to 5
2. **Display:** Posts shown in sidebar list, clicking navigates to `PostDetail`
3. **Post:** `NewPostModal` creates post in Firestore, Cloud Function syncs to Prisma
4. **Reply:** `CommentComposer` creates comment, `ReplyList` creates reply, Cloud Functions update counts

**Data Storage:**

- **Primary:** Firestore (real-time, used by frontend)
- **Secondary:** PostgreSQL/Prisma (synced via Cloud Function, used by server API)
- **Votes:** Firestore sub-collection `posts/{postId}/votes/{userId}`
- **Comments:** Firestore sub-collection `posts/{postId}/comments/{commentId}`
- **Replies:** Firestore sub-collection `posts/{postId}/comments/{commentId}/replies/{replyId}`

---

### Currently Implemented Features

#### ✅ Comments and Replies

- **Status:** Fully working
- Real-time comment display via Firestore listeners
- 1-level deep replies (no nested replies)
- Comment deletion (author, post author, or admin)
- Reply deletion (author only)
- Comment/reply counts updated by Cloud Functions

#### ✅ Voting System

- **Status:** Fully wired (UI + API + Data)
- Upvote/downvote buttons in `VoteBar`
- Vote state persists per user
- Score aggregation via Cloud Function `aggregateVotes`
- Real-time score updates
- Score visible as formatted number (`+5`, `-3`, `1.2k`)

#### ✅ Tags

- **Status:** Data and UI exist, but no filtering
- Tags stored as `tagSlugs` array on posts
- Tag selection UI in `NewPostModal`
- Tags displayed as chips in `PostDetail` and `PostCard`
- **Missing:** Tag-based filtering in UI

#### ❌ Spoiler Handling

- **Status:** Not implemented
- No spoiler fields in data model
- No spoiler reveal UI

#### ❌ Pro-Only Behavior

- **Status:** Not implemented
- No Pro gating found in community code
- All authenticated users have same permissions

---

### Partially Implemented or Dead Features

#### ⚠️ Tag Filtering

- **Backend:** `server/src/routes/posts.js` supports `?tag=slug` parameter
- **Frontend:** Not used - `CommunityPanel` doesn't call API with tag filters
- **UI:** No filter chips or tag selection UI in community area

#### ⚠️ Sorting Options

- **Backend:** Supports `?sort=newest` or `?sort=oldest`
- **Frontend:** Hardcoded to `orderBy("publishedAt", "desc")` - no UI to change
- **Missing:** "Top" (by score), "Hot", "Trending" sort modes

#### ⚠️ Pagination

- **Backend:** Supports `?page=1&pageSize=20`
- **Frontend:** Hardcoded to `limit(5)` - no pagination controls
- **Missing:** "Load more" button, infinite scroll, page navigation

#### ⚠️ Moderation Tools

- **Delete:** Works (admin can delete posts/comments)
- **Reports:** Not implemented - no report button or flagged content queue
- **Missing:** Report system, moderation queue, user blocking

---

### Community Gaps vs Target Vision

**Target Features:**

- ✅ Up/downvotes with stored scores - **IMPLEMENTED**
- ⚠️ Tags on posts - **DATA EXISTS, NO FILTERING UI**
- ❌ Tag-based filters in UI - **NOT IMPLEMENTED**
- ❌ Spoiler tag handling - **NOT IMPLEMENTED**
- ⚠️ Sorting options (New / Hot / Top) - **BACKEND SUPPORTS NEWEST/OLDEST, NO UI**
- ❌ Free vs Pro rules - **NOT IMPLEMENTED**
- ⚠️ Basic moderation (report, delete, freeze) - **DELETE EXISTS, NO REPORTS**
- ⚠️ Minimal user profiles (name, avatar, Pro badge) - **NAME/AVATAR EXISTS, NO PRO BADGE**

**Gap Analysis:**

| Feature                   | Current State                     | Gap                                   |
| ------------------------- | --------------------------------- | ------------------------------------- |
| **Up/downvotes**          | ✅ Fully working                  | None                                  |
| **Tags on posts**         | ✅ Data + display                 | Missing: Filter UI                    |
| **Tag filters**           | ❌ Not implemented                | Need: Filter chips, tag selection UI  |
| **Spoiler handling**      | ❌ Not implemented                | Need: `isSpoiler` field, reveal UI    |
| **Sorting (New/Hot/Top)** | ⚠️ Backend supports newest/oldest | Need: Hot/Top algorithms, sort UI     |
| **Pro gating**            | ❌ Not implemented                | Need: Pro checks, upgrade prompts     |
| **Reports**               | ❌ Not implemented                | Need: Report button, moderation queue |
| **User profiles**         | ⚠️ Name/avatar only               | Need: Pro badge display               |

---

### Open Questions for Product Decisions

**Q1. Who should be allowed to post?**

- Current: All authenticated users can post
- Options: Free users can post, Pro-only posting, or both

**Q2. Who should be allowed to comment/reply?**

- Current: All authenticated users can comment/reply
- Options: Free users can comment, Pro-only commenting, or both

**Q3. Who should be allowed to vote?**

- Current: All authenticated users can vote
- Options: Free users can vote, Pro-only voting, or both

**Q4. Are votes visible as numbers, or just used for sorting?**

- Current: Votes are visible as formatted numbers (`+5`, `-3`, `1.2k`)
- Options: Keep visible, hide numbers but use for sorting, or both

**Q5. Are downvotes allowed, or only upvotes?**

- Current: Both upvotes and downvotes are allowed
- Options: Keep both, remove downvotes (upvote-only), or remove voting entirely

**Q6. Which parts of community (if any) are Pro-only?**

- Current: No Pro gating
- Options: Posting Pro-only, commenting Pro-only, voting Pro-only, advanced filters Pro-only, or all free

**Q7. How strict should spoiler handling be?**

- Current: No spoiler handling
- Options: Optional spoiler tags, mandatory spoiler tags, auto-detection, or no spoiler handling

**Q8. What moderation capabilities are required for v1?**

- Current: Admin delete only
- Options: User reports, moderation queue, auto-moderation, user blocking, or minimal (delete only)

**Q9. Should tags be user-created or curated/admin-created?**

- Current: Users can create any tags
- Options: Free-form tags, curated tag list, or both

**Q10. What sorting modes should be available?**

- Current: Newest only (hardcoded)
- Options: New, Hot (recent activity), Top (by score), Trending, or all

**Q11. Should there be pagination or infinite scroll?**

- Current: Fixed limit of 5 posts
- Options: Pagination controls, infinite scroll, "Load more" button, or increase limit

**Q12. Should user profiles show Pro badges?**

- Current: Shows name and avatar only
- Options: Show Pro badge, hide Pro badge, or no user profiles

**Q13. Should there be a dedicated community/hub page?**

- Current: Community panel embedded in home page
- Options: Dedicated `/community` route, keep embedded, or both

**Q14. Should comments support nested replies (replies to replies)?**

- Current: 1 level deep only (comments → replies)
- Options: Keep 1 level, allow unlimited nesting, or allow 2-3 levels

**Q15. Should there be post categories or just tags?**

- Current: Tags only
- Options: Categories + tags, categories only, or tags only

---

## Conclusion

The community system has a **solid foundation** with working voting, comments, and replies. However, it's **missing key features** for a complete community experience:

1. **Tag filtering** - Data exists but no UI
2. **Spoiler handling** - Not implemented
3. **Pro gating** - Not implemented
4. **Report system** - Not implemented
5. **Sorting UI** - Backend supports it, frontend doesn't use it
6. **Pagination** - Fixed limit, no controls

The voting system is **fully functional** and can serve as a model for implementing other features. The data model is well-structured and can support the target features with minimal changes.

**Next Steps:**

1. Answer the 15 open questions above
2. Implement tag filtering UI
3. Add Pro gating where needed
4. Add report system
5. Add sorting UI (Hot/Top algorithms)
6. Add pagination or increase limits
7. Add spoiler handling (if needed)




