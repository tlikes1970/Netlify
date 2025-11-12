# Community Hub Finalization - Localhost Test Plan

## Prerequisites

1. **Backend server running**: `cd server && npm start` (should be on port 4000)
2. **Frontend running**: `npm run dev` or `netlify dev` (should be on port 8888 or 3000)
3. **Database**: PostgreSQL with Prisma migrations applied
4. **Firebase**: Local Firebase emulator or production Firebase project configured

---

## Test 1: Tag Creation and Assignment

### Setup
- Sign in to the app
- Navigate to the Community Hub section on the home page

### Steps
1. Click the "Post" button in the Recent Posts section
2. **Test Tag Selection**:
   - Verify that existing tags appear as clickable chips below the textarea
   - Click on 2-3 existing tags
   - Verify selected tags appear as chips with an "×" button
   - Click "×" on one tag to remove it
   - Verify the tag is removed from selection

3. **Test New Tag Creation**:
   - In the "Add new tags" input field, type: `test-tag, another-tag, discussion`
   - Verify the input accepts comma-separated values
   - Create a post with content: "This is a test post with new tags"
   - Submit the post

4. **Verify Tags Were Created**:
   - Check backend logs for successful tag creation
   - Query database: `SELECT * FROM tags WHERE slug IN ('test-tag', 'another-tag', 'discussion');`
   - Verify tags exist in database

5. **Verify Tags on Post**:
   - After post creation, verify the post appears in Recent Posts
   - Click on the post to view details
   - Verify tags are displayed on the post
   - Verify tags are clickable and filter posts

### Expected Results
- ✅ Existing tags load and are selectable
- ✅ New tags can be created via comma-separated input
- ✅ Tags are saved to Prisma database
- ✅ Tags appear on posts
- ✅ Tags can be used to filter posts

---

## Test 2: Email Subscription Toggle

### Setup
- Sign in to the app
- Navigate to Settings (⚙️ icon)

### Steps
1. **Navigate to Notifications Tab**:
   - Click on "Notifications" tab in Settings sidebar
   - Verify "Weekly Email Digest" section appears

2. **Check Initial State**:
   - Verify toggle shows current subscription status
   - If loading, wait for status to load
   - Note the current state (on/off)

3. **Toggle Subscription ON**:
   - Click the toggle to enable email subscription
   - Verify toggle switches to "on" position
   - Verify confirmation message appears: "✓ You'll receive weekly emails every Friday at 9 AM UTC"
   - Check browser console for any errors

4. **Verify in Firestore**:
   - Open Firebase Console → Firestore
   - Navigate to `users/{your-uid}`
   - Verify `emailSubscriber: true` field exists

5. **Toggle Subscription OFF**:
   - Click the toggle again to disable
   - Verify toggle switches to "off" position
   - Verify confirmation message disappears
   - Check Firestore: `emailSubscriber: false`

6. **Test Edge Cases**:
   - Toggle rapidly multiple times
   - Verify no duplicate updates occur
   - Verify toggle is disabled during update (no flickering)

### Expected Results
- ✅ Toggle displays current subscription status
- ✅ Toggle updates Firestore `emailSubscriber` field
- ✅ Confirmation message appears when enabled
- ✅ No errors in console
- ✅ Toggle is disabled during update to prevent race conditions

---

## Test 3: Post Sync (Firestore → Prisma)

### Setup
- Backend server running on port 4000
- Database accessible
- Firebase configured

### Steps
1. **Create a New Post with Tags**:
   - In Community Hub, click "Post"
   - Enter content: "This post should sync to Prisma automatically"
   - Select 2 existing tags OR create 2 new tags
   - Submit the post

2. **Check Cloud Function Trigger** (if using emulator):
   - Check Firebase Functions logs
   - Verify `syncPostToPrisma` function was triggered
   - Check for any errors in function execution

3. **Verify Post in Prisma**:
   - Query database:
     ```sql
     SELECT p.*, u.email, u.username 
     FROM posts p 
     JOIN users u ON p."authorId" = u.id 
     WHERE p.slug LIKE '%should-sync%'
     ORDER BY p."createdAt" DESC 
     LIMIT 1;
     ```
   - Verify post exists with correct title, content, and publishedAt

4. **Verify Author Created**:
   - Check if author User exists in Prisma:
     ```sql
     SELECT * FROM users WHERE email = '{your-email}';
     ```
   - If not found by email, check for placeholder user:
     ```sql
     SELECT * FROM users WHERE username LIKE '%{your-username}%';
     ```

5. **Verify Tags Linked**:
   - Query PostTag relationships:
     ```sql
     SELECT pt.*, t.name, t.slug 
     FROM post_tags pt 
     JOIN tags t ON pt."tagId" = t.id 
     JOIN posts p ON pt."postId" = p.id 
     WHERE p.slug LIKE '%should-sync%';
     ```
   - Verify tags are linked to the post

6. **Test API Endpoint Directly** (Optional):
   - Use Postman or curl:
     ```bash
     curl -X POST http://localhost:4000/api/v1/sync/post \
       -H "Content-Type: application/json" \
       -d '{
         "firestoreId": "test-id-123",
         "slug": "manual-sync-test",
         "title": "Manual Sync Test",
         "content": "This is a manual sync test",
         "publishedAt": "2024-01-15T10:00:00Z",
         "authorId": "firebase-uid-123",
         "authorName": "Test User",
         "authorEmail": "test@example.com",
         "tagSlugs": ["discussion", "test"]
       }'
     ```
   - Verify response: `{"id": "...", "slug": "manual-sync-test", "message": "Post synced successfully"}`

7. **Test Duplicate Prevention**:
   - Try to sync the same post again (same slug)
   - Verify response: `{"id": "...", "message": "Post already exists in Prisma"}`
   - Verify no duplicate posts created

### Expected Results
- ✅ Cloud Function triggers on new post creation
- ✅ Post appears in Prisma database
- ✅ Author User is created or found
- ✅ Tags are linked via PostTag relationships
- ✅ Duplicate posts are prevented
- ✅ API endpoint works correctly

---

## Test 4: End-to-End Post Flow

### Steps
1. **Create Post with Tags**:
   - Sign in
   - Go to Community Hub
   - Click "Post"
   - Enter: "This is a comprehensive test post"
   - Select tags: "Discussion", "Review"
   - Create new tag: "e2e-test"
   - Submit

2. **Verify Post Appears**:
   - Post should appear in Recent Posts immediately
   - Click on post to view details
   - Verify all tags are displayed
   - Verify author name is correct

3. **Verify Post in API**:
   - Call: `GET http://localhost:4000/api/v1/posts?page=1&pageSize=5&sort=newest`
   - Verify your post appears in the response
   - Verify tags are included in response

4. **Verify Post Sync**:
   - Check Prisma database for the post
   - Verify it was synced from Firestore
   - Verify tags are linked

5. **Test Tag Filtering**:
   - Click on one of the tags on your post
   - Verify URL updates with `?tag=discussion` (or similar)
   - Verify posts are filtered by that tag
   - Verify your post appears in filtered results

### Expected Results
- ✅ Complete flow works: Create → Display → Sync → Filter
- ✅ All tags are preserved throughout the flow
- ✅ Post is accessible via API
- ✅ Tag filtering works correctly

---

## Test 5: Error Handling

### Steps
1. **Test Tag Creation with Invalid Data**:
   - Try to create a post with empty tag names
   - Try to create a post with special characters in tags
   - Verify errors are handled gracefully

2. **Test Email Subscription Without Auth**:
   - Sign out
   - Try to access Settings → Notifications
   - Verify email subscription section doesn't appear (or shows sign-in prompt)

3. **Test Post Sync Failure**:
   - Stop backend server
   - Create a new post
   - Verify post still creates in Firestore
   - Verify Cloud Function logs show sync failure (but doesn't break)
   - Restart server
   - Manually trigger sync or verify it retries

4. **Test Duplicate Tags**:
   - Create a post with duplicate tag names: "test, test, test"
   - Verify only one tag is created
   - Verify post is linked to single tag instance

### Expected Results
- ✅ Errors are handled gracefully
- ✅ User experience is not broken by errors
- ✅ Appropriate error messages are shown
- ✅ System degrades gracefully when services are unavailable

---

## Quick Verification Checklist

Run through this quick checklist after all tests:

- [ ] Tags can be selected from existing list
- [ ] New tags can be created via comma-separated input
- [ ] Tags are saved to Prisma database
- [ ] Tags appear on posts
- [ ] Email subscription toggle works
- [ ] Email subscription status persists in Firestore
- [ ] Posts sync from Firestore to Prisma
- [ ] Author users are created/found correctly
- [ ] Tag relationships are created correctly
- [ ] Posts appear in API responses
- [ ] Tag filtering works
- [ ] No console errors
- [ ] No database constraint violations
- [ ] No duplicate posts created

---

## Database Verification Queries

Run these SQL queries to verify data integrity:

```sql
-- Check recent posts
SELECT p.id, p.title, p.slug, p."publishedAt", u.username, u.email
FROM posts p
JOIN users u ON p."authorId" = u.id
ORDER BY p."publishedAt" DESC
LIMIT 10;

-- Check tag relationships
SELECT p.title, t.name, t.slug
FROM posts p
JOIN post_tags pt ON p.id = pt."postId"
JOIN tags t ON pt."tagId" = t.id
ORDER BY p."publishedAt" DESC
LIMIT 20;

-- Check for orphaned tags (tags with no posts)
SELECT t.*
FROM tags t
LEFT JOIN post_tags pt ON t.id = pt."tagId"
WHERE pt."tagId" IS NULL;

-- Check for posts without tags
SELECT p.*
FROM posts p
LEFT JOIN post_tags pt ON p.id = pt."postId"
WHERE pt."postId" IS NULL;
```

---

## Notes

- **Cloud Function**: If using Firebase emulator, ensure it's running and configured
- **Environment Variables**: Ensure `PRISMA_SYNC_ENDPOINT` is set correctly (defaults to `http://localhost:4000/api/v1/sync/post`)
- **CORS**: Verify CORS is configured correctly for API calls from frontend
- **Rate Limiting**: Be aware of rate limits on API endpoints (60 requests/minute)

---

## Troubleshooting

### Tags not appearing
- Check backend server is running
- Check API endpoint: `GET http://localhost:4000/api/v1/tags`
- Check browser console for errors
- Verify CORS is configured

### Email subscription not saving
- Check Firestore rules allow user to update their own document
- Check browser console for errors
- Verify user is authenticated
- Check Firestore console for document updates

### Posts not syncing
- Check Cloud Function logs
- Verify backend server is accessible from Cloud Function
- Check `PRISMA_SYNC_ENDPOINT` environment variable
- Verify database connection
- Check for duplicate slug errors

### Author not found/created
- Check if user email exists in Prisma
- Verify placeholder user creation logic
- Check for unique constraint violations on username/email


