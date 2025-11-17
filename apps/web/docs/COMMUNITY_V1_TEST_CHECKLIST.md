# Community v1 Test Checklist

**Date:** 2024  
**Purpose:** Manual test scenarios for Community v1 features  
**Branch:** `community-v2`

---

## Pre-Test Setup

1. **Clear browser cache/localStorage** (optional, but recommended for clean state)
2. **Open browser DevTools** (F12) - Console tab for error checking
3. **Have two test accounts ready:**
   - One Free account (or set Pro to false in settings)
   - One Pro account (or set Pro to true in settings)

---

## Test Suite A: Pro Badge Display

### A1. Pro Badge on New Posts

- [ ] **Steps:**
  1. Sign in as Pro user
  2. Create a new post
  3. View the post in CommunityPanel
  4. View the post in PostDetail page
- [ ] **Expected:** Gold "PRO" badge appears next to your username in:
  - PostCard (list view)
  - PostDetail (full view)

### A2. Pro Badge on Comments

- [ ] **Steps:**
  1. Sign in as Pro user
  2. Create a comment on any post
  3. View the comment
- [ ] **Expected:** Gold "PRO" badge appears next to your username in CommentList

### A3. Pro Badge on Replies

- [ ] **Steps:**
  1. Sign in as Pro user
  2. Reply to a comment
  3. View the reply
- [ ] **Expected:** Gold "PRO" badge appears next to your username in ReplyList

### A4. No Badge for Free Users

- [ ] **Steps:**
  1. Sign in as Free user (or set Pro to false)
  2. Create a post, comment, and reply
  3. View each
- [ ] **Expected:** No PRO badge appears

### A5. Legacy Content (No authorIsPro field)

- [ ] **Steps:**
  1. View an old post/comment created before this update
- [ ] **Expected:** No PRO badge appears (graceful handling of missing field)

---

## Test Suite B: Spoiler Handling

### B1. Spoiler Flag on Posts

- [ ] **Steps:**
  1. Create a new post
  2. Check "Contains spoilers" checkbox
  3. Enter post content
  4. Submit post
  5. View post in CommunityPanel and PostDetail
- [ ] **Expected:**
  - Post content is blurred/collapsed
  - "Reveal Spoilers" button appears
  - Clicking button reveals content
  - Spoiler badge/warning visible

### B2. Spoiler Flag on Comments

- [ ] **Steps:**
  1. Create a comment
  2. Check "Contains spoilers" checkbox
  3. Enter comment text
  4. Submit comment
  5. View comment
- [ ] **Expected:**
  - Comment text is blurred/collapsed
  - "Reveal Spoilers" button appears
  - Clicking reveals comment text

### B3. Non-Spoiler Content

- [ ] **Steps:**
  1. Create post/comment WITHOUT checking spoiler box
  2. View content
- [ ] **Expected:** Content displays normally, no blur or reveal button

### B4. Spoiler Title Visibility

- [ ] **Steps:**
  1. Create a post with spoiler flag
  2. View in list (PostCard)
- [ ] **Expected:** Post title is visible, only body/excerpt is blurred

---

## Test Suite C: Topics Selection

### C1. Topic Selection in NewPostModal

- [ ] **Steps:**
  1. Open NewPostModal
  2. View "Topic(s)" section
  3. Click multiple topics (e.g., "TV Shows", "Horror")
  4. Create post
- [ ] **Expected:**
  - Topic buttons are visible and clickable
  - Selected topics highlight/change color
  - Topics are saved with post

### C2. Topic Display

- [ ] **Steps:**
  1. Create post with topics
  2. View post in PostDetail
- [ ] **Expected:** Topics appear as tags/chips on the post

### C3. Topics vs Tags

- [ ] **Steps:**
  1. Create post with:
     - Selected topics (e.g., "TV Shows")
     - Additional tags (e.g., "discussion", "review")
  2. View post
- [ ] **Expected:** Both topics and additional tags appear

### C4. Curated Topic List

- [ ] **Steps:**
  1. Open NewPostModal
  2. Check available topics
- [ ] **Expected:** Only curated topics appear (TV Shows, Movies, Horror, Sci-Fi, Comedy, Drama, Gaming, Off-Topic)

---

## Test Suite D: Data Model & Firestore

### D1. Post Fields in Firestore

- [ ] **Steps:**
  1. Create a post with topics and spoiler flag as Pro user
  2. Check Firestore console (or use browser DevTools Network tab)
- [ ] **Expected:** Post document contains:
  - `containsSpoilers: true`
  - `authorIsPro: true`
  - `topics: ["tv-shows", "horror"]` (array of topic slugs)
  - `tagSlugs: [...]` (includes topics + additional tags)

### D2. Comment Fields in Firestore

- [ ] **Steps:**
  1. Create a comment with spoiler flag as Pro user
  2. Check Firestore
- [ ] **Expected:** Comment document contains:
  - `containsSpoilers: true`
  - `authorIsPro: true`

### D3. Reply Fields in Firestore

- [ ] **Steps:**
  1. Create a reply as Pro user
  2. Check Firestore
- [ ] **Expected:** Reply document contains:
  - `authorIsPro: true`

### D4. Settings Storage

- [ ] **Steps:**
  1. Follow/unfollow topics (when UI is implemented)
  2. Check localStorage or settings
- [ ] **Expected:** `settings.community.followedTopics` array updates

---

## Test Suite E: UI/UX

### E1. NewPostModal Layout

- [ ] **Steps:**
  1. Open NewPostModal
  2. Check form layout
- [ ] **Expected:**
  - Content textarea at top
  - Topic selection section clearly labeled
  - Spoiler checkbox visible
  - Additional tags section below topics
  - Submit button works

### E2. Pro Badge Styling

- [ ] **Steps:**
  1. View Pro badge in various contexts
- [ ] **Expected:**
  - Gold/yellow background (#fbbf24)
  - Dark text (#1f2937)
  - Small, compact size
  - Doesn't break layout

### E3. Spoiler Wrapper Styling

- [ ] **Steps:**
  1. View spoiler content
- [ ] **Expected:**
  - Blur effect is visible
  - "Reveal Spoilers" button is prominent
  - Once revealed, content displays normally
  - Warning badge visible

### E4. Responsive Design

- [ ] **Steps:**
  1. Test on mobile viewport (DevTools responsive mode)
  2. Test on desktop
- [ ] **Expected:** All UI elements work on both screen sizes

---

## Test Suite F: Error Handling

### F1. Missing Fields (Legacy Content)

- [ ] **Steps:**
  1. View old posts/comments created before v1
- [ ] **Expected:** No errors, graceful fallback:
  - No PRO badge (authorIsPro missing)
  - No spoiler blur (containsSpoilers missing)
  - Content displays normally

### F2. Invalid Data

- [ ] **Steps:**
  1. Try to create post with empty content
  2. Try to create post exceeding character limit
- [ ] **Expected:** Validation errors display, post not created

### F3. Network Errors

- [ ] **Steps:**
  1. Disconnect internet
  2. Try to create post/comment
- [ ] **Expected:** Error message displays, doesn't crash

---

## Test Suite G: Console Errors

### G1. No JavaScript Errors

- [ ] **Steps:**
  1. Open browser DevTools Console
  2. Perform all above tests
  3. Check for red errors
- [ ] **Expected:** No uncaught errors or warnings related to:
  - ProBadge component
  - SpoilerWrapper component
  - NewPostModal
  - CommentComposer
  - TypeScript type errors

### G2. Firestore Errors

- [ ] **Steps:**
  1. Check console for Firestore permission errors
- [ ] **Expected:** No permission denied errors for new fields

---

## Quick Smoke Test (5 minutes)

**Minimum viable test to verify core features:**

1. ✅ Sign in as Pro user
2. ✅ Create post with:
   - Topic selected (e.g., "TV Shows")
   - Spoiler checkbox checked
   - Some content
3. ✅ Verify:
   - PRO badge appears next to your name
   - Post content is blurred with "Reveal Spoilers" button
   - Topic appears on post
4. ✅ Create comment with spoiler flag
5. ✅ Verify:
   - PRO badge on comment
   - Comment text is blurred

---

## Known Limitations (Not Yet Implemented)

These features are **NOT** implemented yet - don't test for them:

- ❌ Topic filtering UI in CommunityPanel
- ❌ Topic following/unfollowing UI
- ❌ Feed prioritization based on followed topics
- ❌ Sort modes (Top, Hot, Trending)
- ❌ Advanced filters for Pro users
- ❌ Infinite scroll (still uses limit(5))
- ❌ Daily posting/commenting limits enforcement

---

## Reporting Issues

If you find bugs, note:

1. **Test case** (e.g., "B1 - Spoiler Flag on Posts")
2. **Steps to reproduce**
3. **Expected vs Actual behavior**
4. **Console errors** (if any)
5. **Browser/OS** (e.g., Chrome 120, Windows 11)

---

## Next Steps After Testing

Once core features are verified:

1. Implement remaining features (filtering, sorting, infinite scroll)
2. Add daily limits enforcement
3. Create comprehensive documentation
