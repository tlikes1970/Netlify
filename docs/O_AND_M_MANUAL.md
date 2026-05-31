# Flicklet Operations & Maintenance Manual

**Project:** flicklet-71dff  
**Version:** 28.163.0  
**Last Updated:** January 2025  
**Maintainer:** Flicklet Development Team

> **Superseded sections (May 2026):** Community hub, Express/Prisma backend, `weeklyDigest`, `unsubscribe`, and community push/reply functions are removed. References below to those features are historical only. Current runtime: Netlify Functions + Firebase (see [docs/LOCAL_DEV.md](LOCAL_DEV.md)).

---

## Table of Contents

- [A. Architecture Diagram](#a-architecture-diagram)
- [B. Daily Checklist](#b-daily-checklist)
- [C. Weekly Checklist](#c-weekly-checklist)
- [D. Monthly Checklist](#d-monthly-checklist)
- [E. Incident Run-books](#e-incident-run-books)
- [F. Environment Variables & Secrets Inventory](#f-environment-variables--secrets-inventory)
- [G. API Reference](#g-api-reference)
- [H. Dependency Matrix](#h-dependency-matrix)
- [I. Rollback Plan](#i-rollback-plan)
- [J. Contact Sheet](#j-contact-sheet)

---

## A. Architecture Diagram

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  (Chrome/Edge/Safari) - PWA Client                              │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│   NETLIFY CDN    │          │  FIREBASE HOSTING│
│  flicklet.app    │          │  (fallback)      │
│  (Primary)       │          │                  │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │                              │
         ▼                              ▼
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              FIREBASE SERVICES                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FIRESTORE DATABASE                                      │  │
│  │  Collections:                                            │  │
│  │    • posts/{postId}                                      │  │
│  │    • posts/{postId}/votes/{userId}                      │  │
│  │    • posts/{postId}/comments/{commentId}                │  │
│  │    • posts/{postId}/comments/{commentId}/replies/{replyId}│  │
│  │    • users/{userId}                                      │  │
│  │    • mail (extension)                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FIREBASE AUTH                                            │  │
│  │  • Google Sign-In                                        │  │
│  │  • Apple Sign-In                                         │  │
│  │  • Custom Claims (admin role)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CLOUD FUNCTIONS (us-central1)                           │  │
│  │  • weeklyDigest (scheduled: Fri 9am UTC)                 │  │
│  │  • unsubscribe (callable)                                 │  │
│  │  • setAdminRole (callable)                               │  │
│  │  • sanitizeComment (trigger: onCommentWrite)             │  │
│  │  • aggregateReplies (trigger: onReplyWrite)              │  │
│  │  • aggregateVotes (trigger: onVoteWrite)                 │  │
│  │  • sendPushOnReply (trigger: onReplyCreate)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FIREBASE EXTENSIONS                                     │  │
│  │  • firestore-send-email@0.2.4                            │  │
│  │    - SMTP: SendGrid (smtp.sendgrid.net:587)              │  │
│  │    - Collection: mail                                    │  │
│  │    - From: noreply@flicklet.app                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FCM (FIREBASE CLOUD MESSAGING)                         │  │
│  │  • Push notifications for comment replies                │  │
│  │  • VAPID key stored in env vars                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │   SENDGRID       │  │   TMDB API        │                  │
│  │   Email Service  │  │   Movie/TV Data   │                  │
│  │   SMTP:587       │  │   API Key Req'd   │                  │
│  └──────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request → Netlify CDN → Firebase Hosting (fallback)**
2. **PWA Client → Firestore (real-time listeners)**
3. **Vote/Comment → Firestore → Cloud Functions → Aggregation**
4. **Email Digest → Cloud Function → Firestore (mail collection) → Extension → SendGrid**
5. **Push Notification → Cloud Function → FCM → User Device**

### Service Regions

- **Firebase Functions:** us-central1
- **Firestore:** nam5 (default)
- **Netlify:** Global CDN
- **SendGrid:** US region

---

## B. Daily Checklist

### Morning (9:00 AM UTC)

- [ ] **Check Firebase Console Logs** 📊
  - Navigate to: https://console.firebase.google.com/project/flicklet-71dff/functions/logs
  <!-- SCREENSHOT: Firebase Functions logs page -->
  - Look for errors in the last 24 hours
  - Check for function timeouts or quota exceeded errors

- [ ] **Check Netlify Deploy Status** 🚀
  - Navigate to: https://app.netlify.com/sites/[site-name]/deploys
  <!-- SCREENSHOT: Netlify Deploys page -->
  - Verify latest deploy is successful
  - Check for build failures

- [ ] **Check SendGrid Activity** 📧
  - Navigate to: https://app.sendgrid.com/activity
  <!-- SCREENSHOT: SendGrid Activity dashboard -->
  - Review email delivery rates (should be >95%)
  - Check for bounces or spam reports
  - Verify no sender reputation issues

- [ ] **Monitor Error Rates** ⚠️
  - Firebase Console → Functions → Metrics
  <!-- SCREENSHOT: Firebase Functions metrics page -->
  - Check for 500 errors or function failures

### Afternoon (2:00 PM UTC)

- [ ] **Check Database Quotas** 💾
  - Firebase Console → Firestore → Usage
  <!-- SCREENSHOT: Firestore Usage page -->
  - Verify reads/writes within limits
  - Check storage usage

- [ ] **Review User Feedback** 💬
  - Check email: feedback@[domain]
  - Review GitHub issues (if applicable)
  - Prioritize critical bugs

- [ ] **Test Critical Paths** ✅
  - Sign in flow
  - Search functionality
  - Comment posting
  - Vote functionality

### Evening (6:00 PM UTC)

- [ ] **Cost Monitoring** 💰
  - Firebase Console → Usage and Billing
  <!-- SCREENSHOT: Firebase Billing page -->
  - Netlify Dashboard → Billing
  <!-- SCREENSHOT: Netlify Billing page -->
  - Verify no unexpected spikes
  - Set alerts if approaching limits

- [ ] **Security Check** 🔒
  - Review Firestore security rules violations (if any)
  <!-- SCREENSHOT: Firestore Rules violations log -->
  - Check for unauthorized access attempts
  - Review admin role grants (if any)
  <!-- SCREENSHOT: Firebase Auth users list -->

### Automated Alerts (Set Up)

Configure these in Firebase Console and Netlify:

- **Function Error Rate > 5%**
- **Quota Usage > 80%**
- **Email Delivery Rate < 90%**
- **Function Execution Time > 10s**
- **Daily Cost > $X threshold**

---

## C. Weekly Checklist

### Monday: Backup & Recovery Test 💾

- [ ] **Firestore Backup**

  ```bash
  # Export Firestore data
  gcloud firestore export gs://flicklet-71dff-backup/$(date +%Y%m%d) \
    --project=flicklet-71dff
  ```

  <!-- SCREENSHOT: GCloud CLI export command output -->
  - Verify backup completes successfully
  - Check backup size matches expectations

- [ ] **Test Restore Process**
  - Create a test collection
  - Export it
  - Delete it
  - Restore from backup
  - Verify data integrity

### Tuesday: Dependency Updates 📦

- [ ] **Check for Updates**

  ```bash
  cd apps/web
  npm outdated
  cd ../../functions
  npm outdated
  ```

  - Review security advisories
  - Test updates in staging before production

- [ ] **Update Changelog**
  - Document any changes made during the week
  - Update version numbers

### Wednesday: Security Rules Review 🔒

- [ ] **Review Firestore Rules**
  - File: `firestore.rules`
  - Test rule changes in emulator
  - Verify no overly permissive rules

- [ ] **Review Admin Access**
  - List all users with admin role
  <!-- SCREENSHOT: Firebase Auth users filtered by custom claims -->
  - Verify admin grants are legitimate
  - Revoke access if needed

### Thursday: Performance Audit ⚡

- [ ] **Lighthouse Audit**

  ```bash
  npm run lh:mobile
  ```

  - Check performance scores
  <!-- SCREENSHOT: Lighthouse report results -->
  - Review bundle sizes
  - Optimize if needed

- [ ] **Function Performance**
  - Review function execution times
  <!-- SCREENSHOT: Firebase Functions performance metrics -->
  - Check for cold starts
  - Optimize slow functions

### Friday: Email Digest Verification 📧

- [ ] **Verify Weekly Digest Sent**
  - Check function logs for `weeklyDigest`
  <!-- SCREENSHOT: weeklyDigest function logs -->
  - Verify emails sent count matches subscriber count
  - Test unsubscribe link in a digest email
  <!-- SCREENSHOT: Unsubscribe link test -->

- [ ] **SendGrid Stats**
  - Review weekly email metrics
  <!-- SCREENSHOT: SendGrid weekly stats dashboard -->
  - Check unsubscribe rates
  - Monitor bounce rates

---

## D. Monthly Checklist

### First Week: Quota Audit

- [ ] **Firebase Quotas**
  - Firestore: Reads, writes, deletes
  - Functions: Invocations, execution time
  - Storage: Total size
  - Auth: Active users

- [ ] **Netlify Quotas**
  - Build minutes
  - Bandwidth
  - Function invocations

- [ ] **SendGrid Quotas**
  - Emails sent
  - Contacts
  - API calls

### Second Week: Key Rotation

- [ ] **SendGrid API Key**
  - Generate new API key
  - Update in Firebase Functions config
  - Update in Netlify env vars
  - Revoke old key after 24 hours

- [ ] **Service Account Keys**
  - Review active service accounts
  - Rotate if older than 90 days
  - Update in deployment configs

### Third Week: Disaster Recovery Test

- [ ] **Full System Restore**
  - Simulate data loss scenario
  - Restore from backup
  - Verify all services operational
  - Document recovery time

- [ ] **Function Rollback Test**
  - Deploy a test function
  - Roll it back
  - Verify rollback process works

### Fourth Week: Cost Review

- [ ] **Monthly Cost Analysis**
  - Firebase costs
  - Netlify costs
  - SendGrid costs
  - Total and compare to budget

- [ ] **Optimization Opportunities**
  - Identify cost drivers
  - Plan optimizations
  - Implement if time permits

---

## E. Incident Run-books

### 🔴 SEV-1: 500 Internal Server Error

**Symptoms:**

- Users see "500 Internal Server Error"
- Functions failing in logs
- High error rate in Firebase Console

**Steps:**

1. **Check Firebase Function Logs** 📊

   ```bash
   firebase functions:log --only weeklyDigest
   ```

   <!-- SCREENSHOT: Firebase Functions logs terminal output -->
   - Look for stack traces
   - Identify failing function

2. **Check Function Status** 🔍
   - Navigate to: Firebase Console → Functions → Logs
   <!-- SCREENSHOT: Firebase Functions logs page -->
   - Review recent errors

3. **Common Causes:**
   - Missing environment variable
   - SendGrid API key expired
   - Firestore quota exceeded
   - Function timeout

4. **Resolution:**
   - Fix the root cause
   - Redeploy function if needed
   - Monitor for recurrence

**Rollback:**

```bash
firebase functions:rollback --only [function-name]
```

<!-- SCREENSHOT: Firebase CLI rollback command output -->

---

### 🟡 SEV-2: 429 Rate Limit Exceeded

**Symptoms:**

- Users see "Too many requests"
- API calls failing
- Function invocations hitting limit

**Steps:**

1. **Check Current Usage** 📊
   - Firebase Console → Usage and Billing
   <!-- SCREENSHOT: Firebase Usage and Billing page -->
   - Check function invocations
   - Check Firestore reads/writes

2. **Identify Source**
   - Review function logs for high-frequency calls
   - Check for infinite loops
   - Look for misconfigured listeners

3. **Immediate Actions:**
   - Disable non-critical functions if needed
   - Increase rate limiting in code
   - Contact Firebase support for quota increase

4. **Prevention:**
   - Implement client-side rate limiting
   - Add debouncing to listeners
   - Cache frequently accessed data

---

### 🔴 SEV-1: Quota Exceeded

**Symptoms:**

- Functions stop executing
- Firestore operations fail
- "Quota exceeded" errors in logs

**Steps:**

1. **Identify Quota Type** 🔍
   - Firestore: Reads, writes, deletes, storage
   - Functions: Invocations, execution time
   - Auth: Active users

2. **Check Usage** 📊
   - Firebase Console → Usage and Billing
   <!-- SCREENSHOT: Firebase Usage and Billing with quota details -->
   - Review daily/monthly usage graphs

3. **Emergency Actions:**
   - Disable non-essential features
   - Implement stricter rate limiting
   - Request quota increase from Firebase

4. **Long-term Fix:**
   - Optimize queries (add indexes)
   - Implement caching
   - Reduce unnecessary function calls
   - Archive old data

---

### 🟡 SEV-2: Extension Failure (firestore-send-email)

**Symptoms:**

- Emails not being sent
- Errors in extension logs
- Mail collection documents not processed

**Steps:**

1. **Check Extension Status** 🔍
   - Firebase Console → Extensions → firestore-send-email
   <!-- SCREENSHOT: Extension status page -->
   - Review logs for errors
   <!-- SCREENSHOT: Extension logs -->

2. **Verify SendGrid Configuration** ⚙️
   - Firebase Console → Extensions → firestore-send-email → Configuration
   <!-- SCREENSHOT: Extension configuration page -->
   - Check `SENDGRID_API_KEY` in extension config
   - Verify SMTP connection URI is correct
   - Test SendGrid API key manually

3. **Check Mail Collection** 📬
   - Firestore Console → mail collection
   <!-- SCREENSHOT: Firestore mail collection -->
   - Verify documents are being created
   - Check for stuck documents

4. **Resolution:**
   - Fix SendGrid config if needed
   - Manually trigger extension if stuck
   - Restart extension if necessary

---

### 🟡 SEV-2: Email Bounce/Spam Reports

**Symptoms:**

- High bounce rate in SendGrid
- Spam reports
- Sender reputation issues

**Steps:**

1. **Check SendGrid Activity** 📊
   - Navigate to: https://app.sendgrid.com/activity
   <!-- SCREENSHOT: SendGrid Activity page showing bounces/spam -->
   - Review bounce reasons
   - Check spam reports
   - Verify sender authentication

2. **Immediate Actions:**
   - Remove bounced emails from subscriber list
   - Review email content for spam triggers
   - Verify SPF/DKIM records

3. **Long-term Fix:**
   - Implement double opt-in
   - Improve email content
   - Use email templates
   - Monitor sender reputation

---

### 🟢 SEV-3: PWA Install Fail

**Symptoms:**

- Install button not appearing
- Installation fails
- Service worker errors

**Steps:**

1. **Check Manifest** 📄
   - Verify `manifest.webmanifest` is accessible
   <!-- SCREENSHOT: Manifest file in DevTools -->
   - Check manifest validity
   - Verify icons exist

2. **Check Service Worker** 🔧
   - Verify `sw.js` is registered
   <!-- SCREENSHOT: Service Worker registration in DevTools -->
   - Check service worker scope
   - Review service worker errors in DevTools
   <!-- SCREENSHOT: Service Worker errors in DevTools -->

3. **Browser Compatibility:** 🌐
   - Test on Chrome/Edge (desktop)
   - Test on Chrome/Edge (Android)
   - Note: iOS requires manual "Add to Home Screen"

4. **Resolution:**
   - Fix manifest if invalid
   - Fix service worker errors
   - Update install prompt logic if needed

---

## F. Environment Variables & Secrets Inventory

### Firebase Functions Environment Variables

**Location:** Firebase Console → Functions → Configuration → Environment Variables

| Variable                            | Purpose                      | Rotation Date  | Last Updated |
| ----------------------------------- | ---------------------------- | -------------- | ------------ |
| `SENDGRID_API_KEY`                  | SendGrid SMTP authentication | Quarterly      | [Date]       |
| `VITE_FIREBASE_API_KEY`             | Firebase client API key      | Never (public) | -            |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain         | Never          | -            |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID          | Never          | -            |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket      | Never          | -            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID                | Never          | -            |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID              | Never          | -            |
| `VITE_FCM_VAPID_KEY`                | FCM VAPID key                | Annually       | [Date]       |

### Netlify Environment Variables

**Location:** Netlify Dashboard → Site Settings → Environment Variables

| Variable                            | Scope      | Purpose              | Rotation Date |
| ----------------------------------- | ---------- | -------------------- | ------------- |
| `SENDGRID_API_KEY`                  | Production | SendGrid API key     | Quarterly     |
| `SENDGRID_FROM`                     | Production | Default sender email | Never         |
| `SENDGRID_REPLY_TO`                 | Production | Reply-to email       | Never         |
| `VITE_FIREBASE_API_KEY`             | All        | Firebase API key     | Never         |
| `VITE_FIREBASE_AUTH_DOMAIN`         | All        | Auth domain          | Never         |
| `VITE_FIREBASE_PROJECT_ID`          | All        | Project ID           | Never         |
| `VITE_FIREBASE_STORAGE_BUCKET`      | All        | Storage bucket       | Never         |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | All        | FCM sender ID        | Never         |
| `VITE_FIREBASE_APP_ID`              | All        | App ID               | Never         |
| `VITE_FCM_VAPID_KEY`                | All        | FCM VAPID key        | Annually      |
| `NODE_VERSION`                      | All        | Node.js version      | As needed     |

### Extension Configuration (firestore-send-email)

**Location:** Firebase Console → Extensions → firestore-send-email → Configuration

| Variable              | Value                                                   | Purpose                         |
| --------------------- | ------------------------------------------------------- | ------------------------------- |
| `AUTH_TYPE`           | UsernamePassword                                        | SMTP auth type                  |
| `OAUTH_CLIENT_ID`     | (blank)                                                 | OAuth2 client ID (not used)     |
| `OAUTH_CLIENT_SECRET` | (blank)                                                 | OAuth2 client secret (not used) |
| `OAUTH_REFRESH_TOKEN` | (blank)                                                 | OAuth2 refresh token (not used) |
| `DATABASE`            | (default)                                               | Firestore database              |
| `DATABASE_REGION`     | nam5                                                    | Firestore region                |
| `DEFAULT_FROM`        | noreply@flicklet.app                                    | Default sender                  |
| `MAIL_COLLECTION`     | mail                                                    | Firestore collection            |
| `SMTP_CONNECTION_URI` | smtp://apikey:${SENDGRID_API_KEY}@smtp.sendgrid.net:587 | SMTP connection                 |
| `USERS_COLLECTION`    | users                                                   | Users collection                |
| `OAUTH_PORT`          | 465                                                     | SMTP port                       |
| `OAUTH_SECURE`        | true                                                    | Use SSL                         |
| `TTL_EXPIRE_TYPE`     | never                                                   | TTL expiration                  |
| `TTL_EXPIRE_VALUE`    | 1                                                       | TTL value                       |

### Rotation Schedule

- **SendGrid API Key:** Every 90 days
- **Service Account Keys:** Every 90 days
- **FCM VAPID Key:** Annually
- **Other:** As needed (security incidents, etc.)

---

## G. API Reference

### Cloud Functions

#### 1. weeklyDigest (Scheduled)

**Type:** Scheduled Function (v1)  
**Schedule:** `0 9 * * 5` (Every Friday at 9:00 AM UTC)  
**Region:** us-central1  
**Trigger:** Pub/Sub schedule

**Function:**

```typescript
functions.pubsub.schedule('0 9 * * 5')
  .timeZone('UTC')
  .onRun(async () => { ... })
```

**What it does:**

- Fetches top 5 posts from last 7 days (by voteCount)
- Fetches new comments from last 7 days
- Finds mentions (@username) for each subscriber
- Sends personalized email digest via firestore-send-email extension

**Dependencies:**

- Firestore: `posts`, `users`, `comments` collections
- Extension: `firestore-send-email`

**Logs:**

```bash
firebase functions:log --only weeklyDigest
```

---

#### 2. unsubscribe (Callable)

**Type:** Callable Function (v1)  
**Region:** us-central1  
**Trigger:** HTTPS call

**Function:**

```typescript
functions.https.onCall(async (data, context) => { ... })
```

**Request:**

```typescript
{
  token: string; // JWT token from email unsubscribe link
}
```

**Response:**

```typescript
{
  message: "Unsubscribed";
}
```

**What it does:**

- Verifies JWT token from unsubscribe link
- Sets `emailSubscriber=false` on user document
- Returns confirmation

**Client Usage:**

```typescript
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const unsubscribe = httpsCallable(functions, "unsubscribe");
await unsubscribe({ token: unsubscribeToken });
```

---

#### 3. setAdminRole (Callable)

**Type:** Callable Function (v2)  
**Region:** us-central1  
**Trigger:** HTTPS call  
**Auth Required:** Yes

**Function:**

```typescript
onCall({ cors: true }, async (req) => { ... })
```

**Request:** None (uses authenticated user)

**Response:**

```typescript
{
  message: "Admin role granted";
}
```

**What it does:**

- Grants admin role to the authenticated user
- Sets custom claim: `{ role: 'admin' }`

**Client Usage:**

```typescript
const setAdminRole = httpsCallable(functions, "setAdminRole");
await setAdminRole();
```

---

---

#### 5. sanitizeComment (Trigger)

**Type:** Firestore Trigger (v2)  
**Region:** us-central1  
**Trigger:** `posts/{postId}/comments/{commentId}` write

**Function:**

```typescript
onDocumentWritten(
  { document: 'posts/{postId}/comments/{commentId}', region: 'us-central1' },
  async (event) => { ... }
)
```

**What it does:**

- Sanitizes comment body (filters profanity)
- Updates `commentCount` on parent post
- Deletes comments with disallowed words

**Dependencies:**

- `bad-words.json` file in functions directory

---

#### 6. aggregateReplies (Trigger)

**Type:** Firestore Trigger (v2)  
**Region:** us-central1  
**Trigger:** `posts/{postId}/comments/{commentId}/replies/{replyId}` write

**Function:**

```typescript
onDocumentWritten(
  { document: 'posts/{postId}/comments/{commentId}/replies/{replyId}', region: 'us-central1' },
  async (event) => { ... }
)
```

**What it does:**

- Updates `replyCount` on parent comment document
- Runs on reply create/update/delete

---

#### 7. aggregateVotes (Trigger)

**Type:** Firestore Trigger (v2)  
**Region:** us-central1  
**Trigger:** `posts/{postId}/votes/{userId}` write

**Function:**

```typescript
onDocumentWritten(
  { document: 'posts/{postId}/votes/{userId}', region: 'us-central1' },
  async (event) => { ... }
)
```

**What it does:**

- Aggregates all votes for a post
- Updates `score` and `voteCount` on parent post document

---

#### 8. sendPushOnReply (Trigger)

**Type:** Firestore Trigger (v1)  
**Region:** us-central1  
**Trigger:** `posts/{postId}/comments/{commentId}/replies/{replyId}` create

**Function:**

```typescript
functions.firestore
  .document('posts/{postId}/comments/{commentId}/replies/{replyId}')
  .onCreate(async (snap, context) => { ... })
```

**What it does:**

- Sends FCM push notification to comment author when reply is created
- Skips if user replies to own comment
- Cleans up invalid FCM tokens

**Dependencies:**

- FCM token stored in `users/{uid}/fcmToken`
- Firebase Admin SDK messaging

---

---

### Firestore Security Rules

**File:** `firestore.rules`

**Key Rules:**

1. **Posts:**
   - Read: Anyone
   - Create: Authenticated users only
   - Update: Post author or admin
   - Delete: Post author or admin

2. **Votes:**
   - Read: Anyone
   - Write: Authenticated users (own vote only)

3. **Comments:**
   - Read: Anyone
   - Create: Authenticated users
   - Update: Comment author
   - Delete: Comment author, post author, or admin

4. **Replies:**
   - Read: Anyone
   - Create: Authenticated users
   - Update/Delete: Reply author

5. **Users:**
   - Read: Authenticated users
   - Write: Own user document only

6. **Admin:**
   - Catch-all rule: Admins can read/write anything

**Rate Limiting:**

- Client-side: Implemented in middleware (60 req/min per IP)
- Firestore: Built-in quota limits

---

## H. Dependency Matrix

### Frontend (apps/web)

| Package               | Version | Purpose         | Critical |
| --------------------- | ------- | --------------- | -------- |
| react                 | ^18.2.0 | UI framework    | Yes      |
| react-dom             | ^18.2.0 | React rendering | Yes      |
| firebase              | ^12.4.0 | Firebase SDK    | Yes      |
| @tanstack/react-query | ^5.56.2 | Data fetching   | Yes      |
| vite                  | ^4.4.0  | Build tool      | Yes      |
| typescript            | ^5.0.0  | Type safety     | Yes      |
| @sendgrid/mail        | ^8.1.6  | Email (client)  | No       |
| @sentry/react         | ^7.0.0  | Error tracking  | No       |

**Node.js:** >=18 <21  
**Build Command:** `npm run build`  
**Publish Directory:** `apps/web/dist`

---

### Functions (functions)

| Package            | Version  | Purpose       | Critical |
| ------------------ | -------- | ------------- | -------- |
| firebase-admin     | ^11.11.1 | Admin SDK     | Yes      |
| firebase-functions | ^6.6.0   | Functions SDK | Yes      |
| typescript         | ^5.0.0   | Type safety   | Yes      |

**Node.js:** 20  
**Build Command:** `npm run build` (tsc)  
**Deploy Command:** `firebase deploy --only functions`

---

### Firebase Services

| Service    | Version/Region             | Purpose                   |
| ---------- | -------------------------- | ------------------------- |
| Firestore  | nam5                       | Database                  |
| Functions  | v1/v2, us-central1         | Serverless functions      |
| Auth       | -                          | Authentication            |
| Hosting    | -                          | Static hosting (fallback) |
| Extensions | firestore-send-email@0.2.4 | Email sending             |

---

### External Services

| Service  | Version | Purpose        | API Key Required |
| -------- | ------- | -------------- | ---------------- |
| SendGrid | -       | Email delivery | Yes              |
| TMDB API | v3      | Movie/TV data  | Yes              |
| Netlify  | -       | Hosting/CDN    | No               |

---

### Browser Compatibility

| Browser | Min Version | PWA Support | Push Support |
| ------- | ----------- | ----------- | ------------ |
| Chrome  | 90+         | Yes         | Yes          |
| Edge    | 90+         | Yes         | Yes          |
| Safari  | 14+         | Limited     | Limited      |
| Firefox | 90+         | Limited     | Yes          |

---

## I. Rollback Plan

### Function Rollback

**Single Function:**

```bash
firebase functions:rollback --only [function-name]
```

**All Functions:**

```bash
firebase functions:rollback
```

**Specific Version:**

```bash
# List versions
firebase functions:list --only [function-name]

# Rollback to specific version
firebase functions:rollback --only [function-name] --version [version-id]
```

---

### Extension Rollback

**Disable Extension:**

```bash
firebase ext:uninstall firestore-send-email --project=flicklet-71dff
```

**Reinstall Previous Version:**

- Firebase Console → Extensions → firestore-send-email → Configuration
- Check version history
- Reinstall previous version if needed

---

### Firebase Hosting Rollback (Clone)

**Clone Previous Deployment:**

```bash
# List all hosting releases
firebase hosting:clone --project=flicklet-71dff

# Clone a specific release
firebase hosting:clone SOURCE_SITE_ID TARGET_SITE_ID --project=flicklet-71dff

# Or use Firebase Console
# Navigate to: Firebase Console → Hosting → Releases
# Select previous release → Click "Rollback" or "Clone"
```

<!-- SCREENSHOT: Firebase Hosting releases page -->

---

### Firestore Rules Rollback

**Revert to Previous Version:**

```bash
# View rule history
firebase firestore:rules:list --project=flicklet-71dff

# Deploy previous version (if backed up)
firebase deploy --only firestore:rules
```

**Emergency Lockdown Rules:**

```javascript
// Emergency: Deny all writes
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

### Database Rollback

**Restore from Backup:**

```bash
# Import from GCS backup
gcloud firestore import gs://flicklet-71dff-backup/20250101 \
  --project=flicklet-71dff
```

**⚠️ WARNING:** This will overwrite current data. Only use in emergency.

---

### Feature Flag Rollback

**Disable Feature:**

```javascript
// In code, check localStorage flag
if (localStorage.getItem("flag:feature-name") === "true") {
  // Feature enabled
}
```

**Disable via Console:**

```javascript
// Run in browser console
localStorage.removeItem("flag:feature-name");
location.reload();
```

---

## J. Contact Sheet

### Firebase Support

**Console:** https://console.firebase.google.com/project/flicklet-71dff  
**Support:** https://firebase.google.com/support  
**Status:** https://status.firebase.google.com  
**Documentation:** https://firebase.google.com/docs

**Project ID:** flicklet-71dff  
**Project Number:** [Find in Firebase Console → Project Settings]

---

### SendGrid Support

**Dashboard:** https://app.sendgrid.com  
**Support:** https://support.sendgrid.com  
**Documentation:** https://docs.sendgrid.com  
**Status:** https://status.sendgrid.com

**Account Email:** [Your SendGrid account email]  
**API Key:** [Stored in Firebase/Netlify env vars]

---

### Netlify Support

**Dashboard:** https://app.netlify.com  
**Support:** https://www.netlify.com/support  
**Documentation:** https://docs.netlify.com  
**Status:** https://www.netlifystatus.com

**Site Name:** [Your Netlify site name]  
**Team:** [Your Netlify team]

---

### GCP Billing

**Console:** https://console.cloud.google.com/billing  
**Support:** https://cloud.google.com/support  
**Documentation:** https://cloud.google.com/docs

**Billing Account:** [Your GCP billing account]  
**Project:** flicklet-71dff

---

### Internal Contacts

**Development Team:**

- Email: [Your team email]
- GitHub: [Your GitHub org/repo]
- Slack/Discord: [Your team channel]

**Emergency Contacts:**

- On-call: [Phone number]
- Escalation: [Email/Phone]

---

## Appendix: Useful Commands

### Firebase CLI

```bash
# Deploy all
firebase deploy

# Deploy specific service
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only hosting

# View logs
firebase functions:log
firebase functions:log --only weeklyDigest

# Start emulators
firebase emulators:start

# List functions
firebase functions:list
```

### Netlify CLI

```bash
# Deploy
netlify deploy
netlify deploy --prod

# View logs
netlify functions:log

# Open dashboard
netlify open
```

### GCloud CLI

```bash
# Firestore export
gcloud firestore export gs://[bucket]/[path] --project=flicklet-71dff

# Firestore import
gcloud firestore import gs://[bucket]/[path] --project=flicklet-71dff
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** February 2025
