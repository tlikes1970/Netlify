## C3 – Original Post Reporting

### Summary

Added Report action to top-level Community posts in the main feed, matching the existing comment reporting UX.

---

### ✅ Completed

- **Report action added to top-level Community posts**: ✅
  - Report button appears on hover in the top-right corner of each post card
  - Uses same styling and positioning pattern as PostCard component
  
- **Wired into existing reports collection and helper**: ✅
  - Uses `reportPostOrComment()` helper with `itemType: "post"`
  - Creates report documents with correct `itemId` (post ID)
  - Prevents duplicate reports (same logic as comments)

- **Behavior matches comment reporting UX**: ✅
  - Same confirmation dialog: "Report this post? This will notify moderators for review."
  - Same success message: "Post reported. Thank you for helping keep the community safe."
  - Same error handling pattern
  - Same loading state ("Reporting..." while processing)

---

### Implementation Details

**File Modified:**
- `apps/web/src/components/CommunityPanel.tsx`

**Changes:**
1. Added imports: `useAuth`, `reportPostOrComment`
2. Added state: `reportingPosts` to track reporting status per post
3. Added handler: `handleReportPost()` function matching comment report pattern
4. Added UI: Report button with hover visibility (opacity-0 group-hover:opacity-100)
5. Button positioned absolutely in top-right corner of post card

**UX Pattern:**
- Button appears on hover (consistent with PostCard)
- Click stops propagation to prevent post navigation
- Confirmation dialog before submitting
- Success/error alerts match comment reporting
- Button disabled during reporting to prevent spam

---

### Testing Checklist

- [x] Report button appears on hover for Community feed posts
- [x] Clicking Report shows confirmation dialog
- [x] Confirming creates report in Firestore with `itemType: "post"`
- [x] Success message appears after reporting
- [x] Duplicate reports are prevented
- [x] Behavior matches comment reporting UX
- [x] TypeScript compiles without errors
- [x] No linter errors

---

### Notes

- Report button only visible to authenticated users
- Uses same helper function as comment reporting for consistency
- Positioned to not interfere with post content or click navigation
- Matches existing patterns in codebase (PostCard, CommentList)




