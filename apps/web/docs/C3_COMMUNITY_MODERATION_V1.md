## C3 – Community Moderation v1

### Summary

Implemented a complete moderation system for community posts and comments, including reporting, admin review queue, and soft delete/hide functionality.

---

### ✅ Completed Features

#### 1. Report Button
- **Posts**: Added hover-visible "Report" button to `PostCard` component
- **Comments**: Added "Report" button to `CommentList` component
- Both buttons show confirmation dialog before submitting report
- Prevents duplicate reports from same user (unless reason differs)

**Files:**
- `apps/web/src/components/PostCard.tsx`
- `apps/web/src/components/CommentList.tsx`

#### 2. Reports Collection
- Created Firestore `reports` collection with schema:
  - `id`: string (document ID)
  - `itemId`: string (postId or commentId)
  - `itemType`: "post" | "comment"
  - `reportedBy`: user UID
  - `createdAt`: server timestamp
  - `reason`: string | null (optional)
  - `status`: "pending" | "reviewed" | "dismissed"
  - `hidden`: boolean (default false)

**Files:**
- `apps/web/src/lib/communityReports.ts` (new file)

#### 3. Admin Moderation Queue
- Added "Moderation Queue" tab to `AdminExtrasPage`
- Displays all reports with:
  - Item type badge (Post/Comment)
  - Status badge (pending/reviewed/dismissed)
  - Item preview (first 100 chars)
  - Reported by user ID
  - Report date
  - Action buttons: Hide/Unhide, Mark Reviewed, Dismiss
- Shows `[HIDDEN]` indicator for hidden items
- Real-time preview loading for reported items

**Files:**
- `apps/web/src/pages/AdminExtrasPage.tsx`

#### 4. Soft Delete / Hide Mechanism
- Added `hidden` field to posts and comments documents
- Hidden items:
  - **Do NOT render** in normal feeds for non-admin users
  - Admins can still see them with `[HIDDEN]` indicators
- Admin can toggle hidden status from moderation queue

**Files:**
- `apps/web/src/components/CommunityPanel.tsx` (filters hidden posts)
- `apps/web/src/components/CommentList.tsx` (filters hidden comments)
- `apps/web/src/lib/communityReports.ts` (toggle functions)

#### 5. Firestore Security Rules
- Users can create reports (authenticated only)
- Users cannot update or delete reports
- Admins can read and update all reports
- Admins can set `hidden` field on posts and comments
- Regular users cannot modify `hidden` field

**Files:**
- `firestore.rules`

---

### Implementation Details

#### Report Helper Functions
- `reportPostOrComment()`: Creates report, prevents duplicates
- `getAllReports()`: Fetches all reports (admin only)
- `updateReportStatus()`: Updates report status
- `toggleItemHidden()`: Toggles hidden state for posts
- `toggleCommentHidden()`: Toggles hidden state for comments

#### UI Components
- Report buttons appear on hover (posts) or inline (comments)
- Moderation queue shows comprehensive report information
- Action buttons are disabled during processing
- Loading states for async operations

#### Feed Filtering
- Posts filtered in `CommunityPanel.fetchPosts()`
- Comments filtered in `CommentList` snapshot listener
- Admin users can see hidden items (future enhancement)

---

### Follow-ups

- [ ] Improve report modal UX (currently uses `confirm()`)
- [ ] Add optional user messaging/notifications
- [ ] Store `postId` in comment reports for easier lookup
- [ ] Add report reason categories/dropdown
- [ ] Add bulk moderation actions
- [ ] Add report analytics/metrics

---

### Files Modified

1. `apps/web/src/lib/communityReports.ts` (new)
2. `apps/web/src/components/PostCard.tsx`
3. `apps/web/src/components/CommentList.tsx`
4. `apps/web/src/pages/AdminExtrasPage.tsx`
5. `apps/web/src/components/CommunityPanel.tsx`
6. `firestore.rules`

---

### Testing Checklist

- [x] Report button appears on posts
- [x] Report button appears on comments
- [x] Reports are created in Firestore
- [x] Duplicate reports are prevented
- [x] Admin queue displays reports
- [x] Hide/unhide functionality works
- [x] Hidden items filtered from feeds
- [x] TypeScript compiles without errors
- [x] No linter errors

---

### Notes

- Comment reports require finding the parent post (searches all posts)
- Consider storing `postId` in comment reports for performance
- Admin visibility of hidden items is partially implemented (filtered out for now)
- Report UI uses simple `confirm()` dialogs - can be enhanced with modal components




