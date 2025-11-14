# Phase 4 Health Check Report

**Generated:** 2025-01-XX  
**Scope:** Firestore posts visibility + comment Cloud Function triggers  
**Mode:** Read-only codebase analysis

---

## 1. Firestore Data Reality

### Expected Post Document Structure
**Collection:** `posts/{postId}`  
**Fields Required:**
- `id`: Document ID (Firestore auto-generated, typically not starting with `cmhicg`)
- `slug`: Unique slug string
- `title`: Post title
- `body` or `content`: Post content
- `publishedAt`: Firestore Timestamp
- `authorId`: User UID
- `authorName`: Display name
- `tagSlugs`: Array of tag slugs
- `score`: Number (default 0)
- `voteCount`: Number (default 0)
- `commentCount`: Number (default 0)

### Expected Comment Document Structure
**Collection:** `posts/{postId}/comments/{commentId}`  
**Fields Required:**
- `id`: Document ID (Firestore auto-generated)
- `authorId`: User UID
- `authorName`: Display name
- `authorAvatar`: Avatar URL (optional)
- `body`: Comment text
- `createdAt`: Firestore Timestamp (serverTimestamp)
- `updatedAt`: Firestore Timestamp (serverTimestamp)

### Note
**Cannot query actual Firestore data from codebase analysis.**  
To verify:
```bash
# Check Firebase Console or run:
# firebase firestore:get posts
```

---

## 2. Cloud Function Status

### Function: `aggregateVotes`
**Location:** `functions/src/index.ts`  
**Runtime:** Node.js (via firebase-functions)  
**Region:** Default (us-central1 if not specified)  
**Trigger Pattern:**
```typescript
.document('posts/{postId}/votes/{userId}')
.onWrite(async (change: any, context: any) => { ... })
```
**Exact Path:** `posts/{postId}/votes/{userId}`  
**Last Deploy Time:** Unknown (check with `firebase functions:list`)  
**Last Error:** Unknown (check with `firebase functions:log aggregateVotes`)

### Function: `sanitizeComment`
**Location:** `functions/src/sanitizeComment.ts`  
**Runtime:** Node.js (via firebase-functions)  
**Region:** Default (us-central1 if not specified)  
**Trigger Pattern:**
```typescript
.document('posts/{postId}/comments/{commentId}')
.onWrite(async (change: any, context: any) => { ... })
```
**Exact Path:** `posts/{postId}/comments/{commentId}`  
**Export:** Yes, exported via `functions/src/index.ts` (line 17)  
**Last Deploy Time:** Unknown (check with `firebase functions:list`)  
**Last Error:** Unknown (check with `firebase functions:log sanitizeComment`)

### Deployment Check
**To verify deployment:**
```bash
cd functions
firebase functions:list
# Should show both aggregateVotes and sanitizeComment
```

---

## 3. API Endpoint Reality

### GET `/api/v1/posts`
**Handler:** `getPosts()` in `server/src/routes/posts.js`  
**Firestore Fallback Logic:**
- ✅ Condition: `if (page === 1 && transformedPosts.length < pageSize)`
- ✅ Query: `database.collection("posts").orderBy("publishedAt", "desc")`
- ✅ Filter: Excludes Prisma posts by slug
- ⚠️ **POTENTIAL ISSUE:** Only runs if `transformedPosts.length < pageSize`
  - If Prisma returns 5 posts and pageSize=5, Firestore fallback **never runs**
  - If Prisma returns 20 posts (pageSize=20), Firestore fallback **never runs**

**Response Shape:**
```javascript
{
  posts: [...],  // Array of post objects
  total: number, // Total count
  page: number,  // Current page
  pageSize: number // Page size
}
```

**ID Pattern Check:**
- Prisma IDs: Start with `cmhicg` (Prisma default prefix)
- Firestore IDs: Do NOT start with `cmhicg` (Firestore uses random alphanumeric)

**Question:** Does API return any doc whose id does NOT start with `cmhicg`?  
**Answer:** Only if:
1. Page 1 AND
2. `transformedPosts.length < pageSize` AND
3. Firestore query succeeds AND
4. Firestore has posts not in Prisma

### GET `/api/v1/posts/:slug/comments`
**Handler:** `getPostComments()` in `server/src/routes/posts.js`  
**Firestore Fallback Logic:**
- ❌ **NO FIRESTORE FALLBACK FOR COMMENTS**
- Only queries Prisma comments
- If post not in Prisma, returns empty array `[]`
- **Does NOT query Firestore comments sub-collection**

**Response Shape:**
```javascript
[] // Array of comment objects (only from Prisma)
```

**Question:** Does it return any doc whose id does NOT start with `cmhicg`?  
**Answer:** ❌ **NO** - This endpoint only returns Prisma comments.

---

## 4. Client Fetch Reality

### CommunityPanel Component
**File:** `apps/web/src/components/CommunityPanel.tsx`  
**Function:** `CommunityHub()`  
**Exact URL Called:**
```javascript
fetch(`http://localhost:4000/api/v1/posts?page=${page}&pageSize=${pageSize}&sort=newest`)
// Where: page = 1, pageSize = 5
// Full URL: http://localhost:4000/api/v1/posts?page=1&pageSize=5&sort=newest
```

**Response Handling:**
```javascript
.then(r => r.json())
.then(json => {
  setPosts(json.posts);  // Sets posts array
  setTotal(json.total);  // Sets total count
})
```

**Expected Response (First 3 Post Objects):**
```javascript
{
  posts: [
    {
      id: "cmhicg...",  // Prisma ID
      slug: "...",
      title: "...",
      // ... other fields
    },
    // ... more posts
  ],
  total: 50,  // Prisma total count
  page: 1,
  pageSize: 5
}
```

**Console Errors:**
- Check browser console for:
  - Network errors (CORS, connection refused)
  - JSON parse errors
  - `CommunityHub fetch` errors (line 174)

### CommentList Component
**File:** `apps/web/src/components/CommentList.tsx`  
**Firestore Query:**
```javascript
const commentsRef = collection(db, 'posts', postId, 'comments');
const q = query(commentsRef, orderBy('createdAt', 'asc'));
onSnapshot(q, ...)
```
**Direct Firestore:** ✅ Yes, queries Firestore directly (bypasses API)  
**Cloud Function Trigger:** ✅ Should trigger on comment write

---

## 5. Auth / Rules Reality

### Firebase Auth
**User Sign-in Status:** Cannot determine from codebase  
**To verify:**
```javascript
// In browser console:
import { authManager } from './lib/auth';
const user = authManager.getCurrentUser();
console.log('UID:', user?.uid);
```

### Firestore Rules
**File:** `firestore.rules`  
**Comment Write Rule Block (Lines 47-71):**
```javascript
// Comments sub-collection
match /comments/{commentId} {
  // Anyone can read comments
  allow read: if true;
  
  // Authenticated users can create comments
  allow create: if isAuthenticated()
    && request.resource.data.authorId == request.auth.uid
    && request.resource.data.keys().hasAll(['authorId', 'authorName', 'authorAvatar', 'body', 'createdAt', 'updatedAt'])
    && request.resource.data.body is string
    && request.resource.data.body.size() > 0
    && request.resource.data.body.size() <= 5000;
  
  // Comment authors can update their own comments
  allow update: if isAuthenticated()
    && resource.data.authorId == request.auth.uid
    && request.resource.data.authorId == resource.data.authorId
    && request.resource.data.body is string
    && request.resource.data.body.size() > 0
    && request.resource.data.body.size() <= 5000;
  
  // Comment authors or post authors can delete comments
  allow delete: if isAuthenticated()
    && (resource.data.authorId == request.auth.uid || get(/databases/$(database)/documents/posts/$(postId)).data.authorId == request.auth.uid);
}
```

**Rule Status:** ✅ Rules exist and appear correct

---

## 6. Missing Links Checklist

### Firestore Data
- [ ] **Firestore post doc exists?**  
  **Check:** Firebase Console → Firestore → `posts` collection
  **Action:** Verify posts created via NewPostModal appear in Firestore

- [ ] **Firestore comment doc exists?**  
  **Check:** Firebase Console → Firestore → `posts/{postId}/comments` sub-collection
  **Action:** Create a comment and verify it appears in Firestore

### Cloud Functions
- [ ] **Cloud Function deployed?**  
  **Check:** `firebase functions:list`  
  **Action:** Deploy if missing: `cd functions && npm run build && firebase deploy --only functions`

- [ ] **Cloud Function trigger path matches doc path?**  
  **Check:** Function path: `posts/{postId}/comments/{commentId}`  
  **Match:** ✅ Yes, matches Firestore structure  
  **Action:** None needed if paths match

### API Endpoints
- [ ] **API returns Firestore IDs?**  
  **Issue:** ⚠️ **Conditional** - Only if page=1 AND Prisma < pageSize  
  **Action:** If Prisma returns full pageSize, Firestore posts won't appear  
  **Fix:** Change condition to always include Firestore on page 1

- [ ] **API returns comment data?**  
  **Issue:** ❌ **NO** - Comments endpoint only returns Prisma comments  
  **Action:** Client uses Firestore directly (bypasses API), so this is OK

### Client-Side
- [ ] **Client calls the API?**  
  **Check:** ✅ Yes - `http://localhost:4000/api/v1/posts?page=1&pageSize=5&sort=newest`  
  **Action:** Verify server is running on port 4000

- [ ] **No console crash?**  
  **Check:** Browser console for errors  
  **Action:** Resolve any network or parse errors

---

## 🔴 Critical Issues Found

### Issue #1: Firestore Fallback Condition Too Restrictive
**Location:** `server/src/routes/posts.js` line 84  
**Problem:**
```javascript
if (page === 1 && transformedPosts.length < pageSize) {
```
**Why it fails:**
- If Prisma returns exactly `pageSize` posts (e.g., 5 posts when pageSize=5), condition is false
- Firestore fallback never runs
- Firestore posts never appear in CommunityPanel

**Fix Required:**
Change to always query Firestore on page 1, regardless of Prisma count:
```javascript
if (page === 1) {
  // Always try Firestore on page 1
}
```

### Issue #2: Comments API Doesn't Query Firestore
**Location:** `server/src/routes/posts.js` line 286-354  
**Problem:**
- `getPostComments()` only queries Prisma
- Returns empty array for Firestore posts
- **However:** Client uses Firestore directly, so this may not be an issue

**Status:** ✅ **Not blocking** - CommentList queries Firestore directly

### Issue #3: Cloud Function Deployment Status Unknown
**Location:** `functions/src/index.ts`, `functions/src/sanitizeComment.ts`  
**Problem:**
- Cannot verify if functions are deployed
- Cannot verify if functions are triggered

**Action Required:**
```bash
cd functions
npm run build
firebase deploy --only functions:sanitizeComment
firebase functions:log sanitizeComment --limit 10
```

---

## 🟡 Warnings

1. **Server must be running** on `http://localhost:4000` for CommunityPanel to work
2. **Firebase Admin must be initialized** - Check `server/src/lib/firebaseAdmin.js`
3. **Firestore rules must be deployed** - `firebase deploy --only firestore:rules`
4. **bad-words.json must be copied** during build - Check `functions/copy-assets.js` runs

---

## Next Steps

1. ✅ **Fix Firestore fallback condition** - Always run on page 1
2. ⚠️ **Deploy Cloud Functions** - Verify `sanitizeComment` is live
3. ⚠️ **Verify Firestore data** - Check Firebase Console for actual posts/comments
4. ⚠️ **Check server logs** - Look for Firestore query errors
5. ⚠️ **Test comment creation** - Verify Cloud Function triggers

---

**Report Complete**  
**Ready for fixes**





















