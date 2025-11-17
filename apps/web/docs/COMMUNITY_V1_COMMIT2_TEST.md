# Community v1 - Commit 2 Test Checklist

**Commit:** `a44457b` - "Community v1: Complete implementation - filtering, sorting, infinite scroll, and limits"  
**Focus:** Test the advanced features added in the second commit

---

## Quick Test (10 minutes)

### 1. Topic Filtering
- [ ] **As Free User:**
  - Click a topic chip (e.g., "TV Shows")
  - Verify only posts with that topic appear
  - Click another topic - verify it replaces the first (single-select)
  - Click "Clear" - verify all posts show again

- [ ] **As Pro User:**
  - Click multiple topic chips (e.g., "TV Shows" + "Horror")
  - Verify posts matching ANY selected topic appear (multi-select)
  - Click "Clear" - verify all posts show again

### 2. Sort Controls
- [ ] **As Free User:**
  - Open sort dropdown
  - Verify only "Newest" and "Oldest" options available
  - Select "Oldest" - verify posts reverse order
  - Try to access Pro sort modes (should show alert if attempted)

- [ ] **As Pro User:**
  - Open sort dropdown
  - Verify all options: Newest, Oldest, Top (All-time), Top (Past Week), Hot, Trending
  - Test each sort mode:
    - **Newest**: Most recent posts first
    - **Oldest**: Oldest posts first
    - **Top (All-time)**: Highest score first
    - **Top (Past Week)**: Highest score from last 7 days
    - **Hot**: Recent activity + votes (Reddit-like)
    - **Trending**: Recent velocity + engagement

### 3. Topic Following
- [ ] Click star (☆) next to a topic chip
- [ ] Verify star turns gold (★)
- [ ] Clear topic filter (if any selected)
- [ ] Verify posts with followed topic appear first in feed
- [ ] Click star again - verify it unfollows (☆)
- [ ] Verify feed returns to normal order

### 4. Infinite Scroll
- [ ] Scroll down in the posts feed
- [ ] When near bottom (within ~100px), verify "Loading more..." appears
- [ ] Verify new posts load and append to list
- [ ] Continue scrolling - verify more posts load
- [ ] When no more posts, verify "No more posts" message appears
- [ ] Change sort mode - verify feed resets and starts from top
- [ ] Change topic filter - verify feed resets and starts from top

### 5. Daily Limits
- [ ] **As Free User:**
  - Open NewPostModal
  - Verify shows "X posts remaining today" (should show 3 or less)
  - Create 3 posts (or check if already at limit)
  - Verify submit button disabled when limit reached
  - Verify error message shows: "You've reached your daily limit of 3 posts..."
  
- [ ] **As Pro User:**
  - Open NewPostModal
  - Verify shows "X posts remaining today" (should show 100 or less)
  - Create multiple posts - verify limit is much higher

- [ ] **Comment Limits:**
  - Open CommentComposer
  - Verify shows "X comments remaining today"
  - As Free: Create 10 comments, verify limit reached
  - As Pro: Verify much higher limit (500)

---

## Detailed Test Scenarios

### Test A: Topic Filtering Behavior

**A1. Single-Select (Free User)**
1. Sign in as Free user
2. Click "TV Shows" topic chip
3. **Expected:** Only posts with "TV Shows" topic appear
4. Click "Horror" topic chip
5. **Expected:** "TV Shows" deselected, only "Horror" posts show
6. Click "Clear"
7. **Expected:** All posts show again

**A2. Multi-Select (Pro User)**
1. Sign in as Pro user
2. Click "TV Shows" topic chip
3. Click "Horror" topic chip (without clearing)
4. **Expected:** Both chips highlighted, posts matching EITHER topic appear
5. Click "TV Shows" again
6. **Expected:** "TV Shows" deselected, only "Horror" posts remain
7. Click "Clear"
8. **Expected:** All posts show again

**A3. Filter + Sort Interaction**
1. Select a topic filter
2. Change sort mode to "Top (All-time)"
3. **Expected:** Filtered posts sorted by score
4. Change sort mode to "Hot"
5. **Expected:** Filtered posts sorted by Hot algorithm

---

### Test B: Sorting Algorithms

**B1. Newest/Oldest (All Users)**
1. Select "Newest"
2. **Expected:** Posts ordered by publishedAt desc (newest first)
3. Select "Oldest"
4. **Expected:** Posts ordered by publishedAt asc (oldest first)

**B2. Top (All-time) - Pro Only**
1. As Pro user, select "Top (All-time)"
2. **Expected:** Posts ordered by score descending
3. Verify highest-scored posts appear first
4. Check that posts with score: 10 appear before score: 5

**B3. Top (Past Week) - Pro Only**
1. As Pro user, select "Top (Past Week)"
2. **Expected:** Only posts from last 7 days appear
3. **Expected:** Ordered by score descending
4. Verify posts older than 7 days don't appear

**B4. Hot - Pro Only**
1. As Pro user, select "Hot"
2. **Expected:** Recent posts with votes prioritized
3. **Expected:** Formula: score / (age_in_hours + 2)^1.5
4. Verify newer posts with votes rank higher than older posts with same score

**B5. Trending - Pro Only**
1. As Pro user, select "Trending"
2. **Expected:** Posts with recent activity prioritized
3. **Expected:** Combines score, votes, comments with recency boost
4. Verify posts with recent comments/votes rank higher

**B6. Pro Gating**
1. As Free user, try to select "Hot" from dropdown
2. **Expected:** Alert: "Advanced sorting is a Pro feature. Upgrade in Settings → Pro."
3. **Expected:** Sort mode doesn't change
4. Verify dropdown still shows current sort mode

---

### Test C: Topic Following & Feed Prioritization

**C1. Follow Topic**
1. Click star (☆) next to "TV Shows"
2. **Expected:** Star turns gold (★)
3. **Expected:** Settings saved (check localStorage: `flicklet.settings.v2`)
4. Refresh page
5. **Expected:** Star still gold (followed state persists)

**C2. Feed Prioritization**
1. Follow "TV Shows" topic
2. Clear any topic filters (ensure no filters selected)
3. **Expected:** Posts with "TV Shows" topic appear first
4. **Expected:** Other posts appear below
5. Unfollow "TV Shows"
6. **Expected:** Feed returns to normal order (no prioritization)

**C3. Follow Multiple Topics**
1. Follow "TV Shows" and "Horror"
2. Clear filters
3. **Expected:** Posts matching EITHER followed topic appear first
4. **Expected:** Other posts appear below

**C4. Follow + Filter Interaction**
1. Follow "TV Shows"
2. Select "Horror" as filter
3. **Expected:** Only "Horror" posts show (filter takes precedence)
4. **Expected:** No prioritization (filtered view doesn't prioritize followed topics)
5. Clear filter
6. **Expected:** Prioritization resumes

---

### Test D: Infinite Scroll

**D1. Basic Infinite Scroll**
1. Scroll down in posts feed
2. When within ~100px of bottom
3. **Expected:** "Loading more..." indicator appears
4. **Expected:** New posts load and append to list
5. **Expected:** No duplicate posts
6. Continue scrolling
7. **Expected:** More posts continue loading

**D2. End of Feed**
1. Scroll to very bottom
2. Keep scrolling until no more posts
3. **Expected:** "No more posts" message appears
4. **Expected:** "Loading more..." doesn't appear

**D3. Reset on Sort Change**
1. Scroll down and load several pages
2. Change sort mode (e.g., Newest → Hot)
3. **Expected:** Feed resets to top
4. **Expected:** Cursor resets
5. **Expected:** Only first page of new sort shows
6. Scroll down
7. **Expected:** Infinite scroll works with new sort mode

**D4. Reset on Filter Change**
1. Scroll down and load several pages
2. Select a topic filter
3. **Expected:** Feed resets to top
4. **Expected:** Only filtered posts show
5. **Expected:** Infinite scroll works with filtered results
6. Clear filter
7. **Expected:** Feed resets again, all posts show

**D5. Scroll Performance**
1. Load many posts via infinite scroll (50+ posts)
2. Scroll up and down quickly
3. **Expected:** Smooth scrolling, no lag
4. **Expected:** Posts render correctly

---

### Test E: Daily Limits Enforcement

**E1. Post Limits - Free User**
1. Sign in as Free user
2. Open NewPostModal
3. **Expected:** Shows "X posts remaining today" (where X ≤ 3)
4. Create posts until limit reached
5. **Expected:** After 3rd post, submit button disabled
6. **Expected:** Error message: "You've reached your daily limit of 3 posts. Upgrade to Pro for higher limits."
7. **Expected:** Cannot submit 4th post

**E2. Post Limits - Pro User**
1. Sign in as Pro user
2. Open NewPostModal
3. **Expected:** Shows "X posts remaining today" (where X ≤ 100)
4. Create multiple posts
5. **Expected:** Much higher limit (100 posts/day)
6. **Expected:** No upgrade prompt in error message

**E3. Comment Limits - Free User**
1. Sign in as Free user
2. Open CommentComposer on any post
3. **Expected:** Shows "X comments remaining today" (where X ≤ 10)
4. Create 10 comments
5. **Expected:** After 10th comment, submit button disabled
6. **Expected:** Error message shows limit reached
7. **Expected:** Cannot submit 11th comment

**E4. Comment Limits - Pro User**
1. Sign in as Pro user
2. Open CommentComposer
3. **Expected:** Shows "X comments remaining today" (where X ≤ 500)
4. **Expected:** Much higher limit than Free users

**E5. Limit Display Updates**
1. Create a post
2. Open NewPostModal again
3. **Expected:** Remaining count decreases by 1
4. **Expected:** Display updates correctly

**E6. UTC Day Boundary**
1. Note current UTC time
2. Create posts until limit reached
3. Wait until UTC midnight (or manually adjust system time for testing)
4. **Expected:** Limits reset, can create posts again

---

### Test F: UI/UX

**F1. Sort Dropdown**
- [ ] Dropdown shows current sort mode
- [ ] Pro modes marked with ⭐
- [ ] Dropdown is accessible (keyboard navigation works)
- [ ] Dropdown styling matches app theme

**F2. Topic Chips**
- [ ] Chips are clickable and responsive
- [ ] Selected chips highlight correctly
- [ ] Star buttons are visible and clickable
- [ ] Followed topics show gold star
- [ ] "Clear" button appears when topics selected
- [ ] Chips wrap properly on mobile

**F3. Loading States**
- [ ] "Loading more..." appears during infinite scroll
- [ ] "No more posts" appears at end
- [ ] Loading states don't block UI
- [ ] Posts remain visible while loading more

**F4. Responsive Design**
- [ ] Topic chips wrap on mobile
- [ ] Sort dropdown works on mobile
- [ ] Infinite scroll works on mobile
- [ ] All UI elements accessible on small screens

---

### Test G: Edge Cases

**G1. No Posts**
- [ ] With filter selected that matches no posts
- [ ] **Expected:** "No posts yet" message
- [ ] **Expected:** No infinite scroll attempt

**G2. Single Post**
- [ ] With filter that matches only one post
- [ ] **Expected:** Post displays
- [ ] **Expected:** "No more posts" appears immediately

**G3. Rapid Filter Changes**
- [ ] Quickly click multiple topic filters
- [ ] **Expected:** No duplicate fetches
- [ ] **Expected:** Final filter state correct

**G4. Rapid Sort Changes**
- [ ] Quickly change sort modes
- [ ] **Expected:** No race conditions
- [ ] **Expected:** Final sort mode correct

**G5. Network Errors**
- [ ] Disconnect internet
- [ ] Try to load more posts
- [ ] **Expected:** Error handled gracefully
- [ ] **Expected:** Doesn't crash

---

## Console Checks

While testing, check browser DevTools Console for:

- [ ] No JavaScript errors
- [ ] No Firestore permission errors
- [ ] No infinite loop warnings
- [ ] Limit check queries complete successfully
- [ ] Infinite scroll queries complete successfully

---

## Performance Checks

- [ ] Infinite scroll loads smoothly (no jank)
- [ ] Filter changes respond quickly (< 500ms)
- [ ] Sort changes respond quickly (< 500ms)
- [ ] No memory leaks (check memory usage over time)
- [ ] Large post lists (100+ posts) render efficiently

---

## Quick Verification Checklist

**Must Work:**
- ✅ Topic filtering (single for Free, multi for Pro)
- ✅ Sort dropdown with Pro gating
- ✅ Topic following/unfollowing
- ✅ Infinite scroll loads more posts
- ✅ Daily limits block submission
- ✅ Feed prioritization when topics followed

**Must NOT Happen:**
- ❌ Duplicate posts in infinite scroll
- ❌ Infinite loops when changing filters/sorts
- ❌ Free users accessing Pro sort modes
- ❌ Posts created beyond daily limits
- ❌ Memory leaks from infinite scroll

---

## Known Issues to Watch For

1. **Comment Counting**: Uses simplified approach - may not count all comments if posts are old
2. **Sort Performance**: Advanced sorts fetch larger batches - may be slow with 1000+ posts
3. **Topic Filtering**: In-memory filtering - may be slow with very large datasets

---

## If Tests Fail

1. Check browser console for errors
2. Verify Firestore rules are deployed
3. Check that Pro status is set correctly
4. Verify localStorage settings are valid
5. Check network tab for failed Firestore queries

---

## Success Criteria

All features from commit 2 are working if:
- ✅ Topic filtering works correctly for Free and Pro
- ✅ All sort modes work (with Pro gating)
- ✅ Infinite scroll loads posts smoothly
- ✅ Topic following persists and prioritizes feed
- ✅ Daily limits enforce correctly
- ✅ No console errors
- ✅ UI is responsive and accessible

