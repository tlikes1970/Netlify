# Flicklet Beta Test Plan

**Version:** 1.0  
**Date:** January 2025  
**Project:** flicklet-71dff  
**Production URL:** https://flicklet.app (or https://flicklet.netlify.app)

---

## Welcome, Beta Tester! 👋

Thank you for joining the Flicklet beta test. Your feedback helps us create the best TV and movie tracking experience possible. This guide will walk you through everything you need to test.

---

## What We're Testing

We're gathering feedback on six core features:

1. **Search & Discovery** - Find movies and TV shows using text search and tag filters
2. **PWA Installation** - Install Flicklet as a native app on your phone or desktop
3. **Admin Dashboard** - Content moderation and user management (admin users only)
4. **Email Digest** - Weekly email summaries of top posts and mentions
5. **Offline Support** - Use the app without internet connection
6. **Push Notifications** - Get notified when someone replies to your comments

---

## How to Join the Beta

### Step 1: Access the App

Visit: **https://flicklet.app** (or https://flicklet.netlify.app)

### Step 2: Sign Up

1. Click **Sign In** in the top right corner
2. Choose **Google Sign-In** (required for sync and admin features)
3. Complete the authentication flow
4. You'll be redirected back to the app

### Step 3: Become an Admin (Optional)

If you've been invited to test admin features:

1. Run this script in Firebase Functions Shell to grant admin role:
   ```bash
   cd functions
   firebase functions:shell
   ```
   Then run these commands in the shell:
   ```javascript
   const { getAuth } = require('firebase-admin/auth');
   const u = await getAuth().getUserByEmail('your-email@example.com');
   await getAuth().setCustomUserClaims(u.uid, { role: 'admin' });
   console.log({ message: 'Admin role granted', uid: u.uid, email: u.email });
   ```
   Exit with `process.exit(0)` or press `Ctrl+C` twice

2. **Sign out and sign back in** to activate the admin role
3. You'll see the **Admin Dashboard** link in the header

<!-- SCREENSHOT: Firebase Functions Shell showing admin grant commands -->

---

## Step-by-Step Testing Tasks

### Task 1: Search & Tag Filters ⭐ REQUIRED

- [ ] **Complete**

**Goal:** Test the search functionality and tag filtering

**Steps:**

1. **Text Search:**
   - Click the search bar at the top
   <!-- SCREENSHOT: Search bar in header -->
   - Type a movie or TV show title (e.g., "The Office")
   - Press Enter or click search
   - Verify results appear with posters
   <!-- SCREENSHOT: Search results page with posters -->
   - Try searching for an actor name

2. **Tag Search:**
   - Type `tag:` followed by a tag name in the search bar (e.g., `tag:comedy`)
   - Press Enter
   - Verify only items with that tag appear
   <!-- SCREENSHOT: Tag search results -->

3. **Tag Filtering:**
   - On a search results page, look for tag chips
   - Click a tag chip to filter by that tag
   - Verify results update to show only matching items
   <!-- SCREENSHOT: Tag chips on search results page -->

**Expected Result:** Search returns relevant results, tag filtering works correctly

**Report Issues:** If search returns no results when it should, or tag filtering doesn't work

---

### Task 2: Install as PWA ⭐ REQUIRED

- [ ] **Complete**

**Goal:** Install Flicklet as a Progressive Web App

**Mobile (Chrome/Edge on Android):**

1. Open https://flicklet.app in Chrome or Edge
   <!-- SCREENSHOT: App homepage on mobile browser -->
2. Look for an **Install** button in the header (or browser menu)
   <!-- SCREENSHOT: Install button in mobile header -->
3. Tap **Install** or **Add to Home Screen**
   <!-- SCREENSHOT: Browser install prompt -->
4. Confirm installation
5. Open the installed app from your home screen
   <!-- SCREENSHOT: Home screen with Flicklet icon -->
6. Verify it opens in standalone mode (no browser UI)
   <!-- SCREENSHOT: App in standalone mode on mobile -->

**Desktop (Chrome/Edge):**

1. Open https://flicklet.app in Chrome or Edge
   <!-- SCREENSHOT: App homepage on desktop -->
2. Look for an install icon in the address bar (or "Install" button in header)
   <!-- SCREENSHOT: Install icon in address bar or header button -->
3. Click **Install**
   <!-- SCREENSHOT: Desktop install prompt dialog -->
4. Confirm installation
5. Open the installed app (should appear in your app launcher)
   <!-- SCREENSHOT: Desktop app launcher with Flicklet -->
6. Verify it opens in its own window
   <!-- SCREENSHOT: App in standalone window on desktop -->

**Expected Result:** App installs successfully and opens in standalone mode

**Report Issues:** If install button doesn't appear, installation fails, or app doesn't work offline

---

### Task 3: Admin Dashboard (Admin Users Only)

- [ ] **Complete**

**Goal:** Test content moderation and user management

**Steps:**

1. Sign in with an admin account
   <!-- SCREENSHOT: Admin sign-in page -->
2. Navigate to **/admin** (or click Admin Dashboard link if visible)
   <!-- SCREENSHOT: Admin Dashboard homepage -->
3. Review the dashboard:
   - **Metrics Cards:** Total posts, comments, users
     <!-- SCREENSHOT: Metrics cards section -->
   - **Posts List:** Recent posts with action buttons
     <!-- SCREENSHOT: Posts list with action buttons -->
   - **User Management:** Grant/revoke admin roles
     <!-- SCREENSHOT: User management section -->
   - **Export CSV:** Export data
     <!-- SCREENSHOT: Export CSV button/functionality -->
4. Try bulk actions:
   - Select multiple posts
     <!-- SCREENSHOT: Multiple posts selected -->
   - Delete selected posts
     <!-- SCREENSHOT: Delete confirmation dialog -->
   - Verify posts are deleted
     <!-- SCREENSHOT: Posts list after deletion -->

**Expected Result:** Dashboard loads, metrics update, actions work correctly

**Report Issues:** If dashboard doesn't load, metrics are wrong, or actions fail

---

### Task 4: Email Digest

- [ ] **Complete**

**Goal:** Receive and test weekly email summaries

**Steps:**

1. **Enable Email Subscription:**
   - Sign in to your account
   - Verify your email address in Firebase Auth (check your email for verification link)
   <!-- SCREENSHOT: Email verification prompt/email -->
   - Go to **Settings → Notifications**
   <!-- SCREENSHOT: Settings page, Notifications tab -->
   - Enable **Email notifications** toggle (if available)
   <!-- SCREENSHOT: Email notifications toggle in Settings -->
   - Or set `emailSubscriber=true` in your user document via Firebase Console if UI toggle not available

2. **Wait for Weekly Digest:**
   - Digest is sent every **Friday at 9 AM UTC**
   - Check your inbox for "Your Weekly Flicklet Digest"
   <!-- SCREENSHOT: Weekly digest email in inbox -->

3. **Test Unsubscribe:**
   - Click the **Unsubscribe** link at the bottom of the email
   <!-- SCREENSHOT: Unsubscribe link in email -->
   - Verify you're redirected to the unsubscribe page
   <!-- SCREENSHOT: Unsubscribe confirmation page -->
   - Confirm you're unsubscribed
   <!-- SCREENSHOT: Unsubscribe success message -->

**Expected Result:** Email arrives weekly, contains top posts and mentions, unsubscribe works

**Report Issues:** If email doesn't arrive, unsubscribe link doesn't work, or email format is broken

---

### Task 5: Offline Support

- [ ] **Complete**

**Goal:** Test app functionality without internet

**Steps:**

1. **Prepare:**
   - Visit https://flicklet.app while online
   <!-- SCREENSHOT: App homepage while online -->
   - Navigate to a few posts (e.g., `/posts/some-post-slug`)
   <!-- SCREENSHOT: Post page while online -->
   - Allow the service worker to cache content
   <!-- SCREENSHOT: Service worker registration in DevTools -->

2. **Go Offline:**
   - Turn off Wi-Fi and mobile data
   - Or use browser DevTools: Network tab → Check "Offline"
   <!-- SCREENSHOT: DevTools Network tab with Offline checked -->

3. **Test Offline Features:**
   - Navigate to previously visited posts
   <!-- SCREENSHOT: Post page loading offline -->
   - Verify they load from cache
   <!-- SCREENSHOT: Cached post displayed offline -->
   - Try searching (should show cached results or error gracefully)
   <!-- SCREENSHOT: Search results or offline error message -->
   - Try creating a comment (should queue for when online)
   <!-- SCREENSHOT: Comment queued message or offline indicator -->

**Expected Result:** Previously visited pages load offline, new content gracefully handles offline state

**Report Issues:** If pages don't load offline, app crashes, or cached content doesn't appear

---

### Task 6: Push Notifications

- [ ] **Complete**

**Goal:** Receive push notifications for comment replies

**Steps:**

1. **Enable Notifications:**
   - Sign in to your account
   - Grant notification permission when prompted (or check browser settings)
   <!-- SCREENSHOT: Browser notification permission prompt -->
   - Verify FCM token is stored in your user document
   <!-- SCREENSHOT: Firebase Console showing FCM token in user document -->

2. **Test Notification:**
   - Have another user (or admin) reply to one of your comments
   <!-- SCREENSHOT: Reply being posted -->
   - Wait a few seconds
   - Verify you receive a push notification: "New Reply - [User] replied to your comment on [Post Title]"
   <!-- SCREENSHOT: Push notification displayed -->

3. **Click Notification:**
   - Click the notification
   <!-- SCREENSHOT: Notification being clicked -->
   - Verify it opens the app and navigates to the post with the reply
   <!-- SCREENSHOT: App opened to post with reply highlighted -->

**Expected Result:** Notification appears when someone replies, clicking opens the correct post

**Report Issues:** If notifications don't arrive, notification content is wrong, or clicking doesn't work

---

## Report a Bug

### Bug Report Template

When reporting a bug, please include:

1. **What you were doing:** (e.g., "Searching for 'The Office'")
2. **What you expected:** (e.g., "To see search results")
3. **What happened instead:** (e.g., "No results appeared, page froze")
4. **Browser/Device:** (e.g., "Chrome 120 on Windows 11" or "Safari on iPhone 15")
5. **Screenshots:** (if possible)
6. **Steps to reproduce:** (numbered list)

### Where to Report

**Option 1: GitHub Issues** (if you have access)
- Create an issue at: [GitHub Repository]
- Use the bug report template above

**Option 2: Email**
- Send to: feedback@[domain]
- Subject: "Beta Bug Report: [Brief Description]"
- Include all details from the template above

**Option 3: In-App Feedback** (if available)
- Go to Settings → Feedback
- Fill out the feedback form

---

## Known Issues

### Current Limitations

1. **PWA Install Prompt:**
   - May not appear on Safari (iOS)
   - Install button only shows on Chrome/Edge

2. **Email Digest:**
   - Sent weekly on Fridays only
   - Requires verified email address
   - UI toggle for subscription coming soon

3. **Offline Support:**
   - Only caches posts you've already visited
   - Search requires internet connection
   - Comments are queued but not sent until online

4. **Push Notifications:**
   - Requires HTTPS (production only)
   - May not work on Safari (iOS)
   - Requires notification permission

5. **Admin Dashboard:**
   - Admin role requires manual grant
   - Must sign out/in after role grant
   - Some features still in development

### Workarounds

- **PWA Install on iOS:** Use Safari "Add to Home Screen" from the share menu
- **Email Not Arriving:** Check spam folder, verify email address
- **Notifications Not Working:** Check browser settings, grant permission
- **Admin Dashboard Not Loading:** Verify admin role, sign out/in

---

## Testing Timeline

- **Week 1:** Focus on Search, PWA Install, Offline Support
- **Week 2:** Focus on Admin Dashboard, Email Digest
- **Week 3:** Focus on Push Notifications, Edge Cases
- **Week 4:** Final feedback, closing issues

---

## Success Criteria

Your testing is successful if:

✅ You can search and filter by tags  
✅ You can install the PWA  
✅ Admin dashboard works (if admin)  
✅ Email digest arrives weekly (if subscribed)  
✅ App works offline for cached content  
✅ Push notifications work for replies  

---

## Thank You!

Your feedback helps us build a better Flicklet. We appreciate your time and input!

**Questions?** Contact: feedback@[domain]

---

**Last Updated:** January 2025  
**Version:** 1.0


