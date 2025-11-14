# Flicklet Email Digest Infrastructure Audit Report

**Date:** 2024  
**Scope:** Complete monorepo audit for weekly email digest implementation  
**Type:** Factual findings only (no code changes)

---

## Table of Contents

1. [Firebase + Functions](#1-firebase--functions)
2. [Email Templating](#2-email-templating)
3. [Firestore Data Model](#3-firestore-data-model)
4. [Admin UI](#4-admin-ui)
5. [Scheduling/Cron](#5-schedulingcron)
6. [Routing](#6-routing)
7. [SendGrid](#7-sendgrid)

---

## 1. Firebase + Functions

### 1.1 Firebase Projects/Environments Referenced

**File:** `.firebaserc`
```json
{
  "projects": {
    "staging": "flicklet-71dff",
    "default": "flicklet-71dff"
  }
}
```

**File:** `apps/web/src/lib/firebaseBootstrap.ts:33`
```typescript
projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "flicklet-71dff",
```

**Findings:**
- Single Firebase project ID: `flicklet-71dff`
- Used for both staging and default environments
- Project ID also hardcoded as fallback in client code

---

### 1.2 Existing Cloud Functions

**File:** `functions/src/index.ts`

**Functions List:**

1. **aggregateVotes** (Firestore trigger)
   - **File:** `functions/src/index.ts:4-17`
   - **Trigger:** `onDocumentWritten` on `posts/{postId}/votes/{userId}`
   - **Runtime:** Node 20 (from `functions/package.json:15`)
   - **Region:** us-central1

2. **sanitizeComment** (Firestore trigger)
   - **File:** `functions/src/sanitizeComment.ts:92-154`
   - **Trigger:** `onDocumentWritten` on `posts/{postId}/comments/{commentId}`
   - **Runtime:** Node 20
   - **Region:** us-central1

3. **aggregateReplies** (Firestore trigger)
   - **File:** `functions/src/aggregateReplies.ts:12-37`
   - **Trigger:** `onDocumentWritten` on `posts/{postId}/comments/{commentId}/replies/{replyId}`
   - **Runtime:** Node 20
   - **Region:** us-central1

4. **sendPushOnReply** (Firestore trigger)
   - **File:** `functions/src/sendPushOnReply.ts:13-105`
   - **Trigger:** `onDocumentCreated` on `posts/{postId}/comments/{commentId}/replies/{replyId}`
   - **Runtime:** Node 20
   - **Region:** us-central1

5. **setAdminRole** (HTTP callable)
   - **File:** `functions/src/setAdminRole.ts:32-91`
   - **Trigger:** `onRequest` (HTTP)
   - **Runtime:** Node 20
   - **Region:** us-central1

6. **manageAdminRole** (Callable)
   - **File:** `functions/src/manageAdminRole.ts:12-61`
   - **Trigger:** `onCall` (callable)
   - **Runtime:** Node 20
   - **Region:** us-central1

7. **weeklyDigest** (Scheduled)
   - **File:** `functions/src/weeklyDigest.ts:14-160`
   - **Trigger:** `functions.pubsub.schedule('0 9 * * 5')` (Friday 9am UTC)
   - **Runtime:** Node 20 (firebase-functions v1)
   - **Region:** us-central1

8. **unsubscribe** (Callable)
   - **File:** `functions/src/unsubscribe.ts:13-51`
   - **Trigger:** `functions.https.onCall` (callable)
   - **Runtime:** Node 20 (firebase-functions v1)
   - **Region:** us-central1

9. **syncPostToPrisma** (Firestore trigger)
   - **File:** `functions/src/syncPostToPrisma.ts:15-83`
   - **Trigger:** `onDocumentWritten` on `posts/{postId}`
   - **Runtime:** Node 20
   - **Region:** us-central1

---

### 1.3 Functions Touching SendGrid/Email

**File:** `functions/src/weeklyDigest.ts:137-149`
```typescript
// Send email via firestore-send-email extension
await db.collection("mail").add({
  to: subscriber.email,
  message: {
    subject: "Your Weekly Flicklet Digest",
    html: emailHtml,
    text: buildPlainTextTemplate({...}),
  },
});
```

**File:** `apps/web/netlify/functions/send-email.cjs:1-127`
```javascript
const sgMail = require('@sendgrid/mail');
// ... sends emails via SendGrid Dynamic Templates
```

**File:** `netlify/functions/send-email.cjs:1-95`
```javascript
const sgMail = require('@sendgrid/mail');
// ... sends feedback emails via SendGrid
```

**Findings:**
- `weeklyDigest` function writes to `mail` collection (extension sends emails)
- Two Netlify Functions use SendGrid directly: `apps/web/netlify/functions/send-email.cjs` and `netlify/functions/send-email.cjs`

---

### 1.4 Firebase "firestore-send-email" Extension

**File:** `firebase.json:38-40`
```json
"extensions": {
  "firestore-send-email": "firebase/firestore-send-email@0.2.4"
}
```

**File:** `.firebaserc:9-11`
```json
"extensionInstances": {
  "firestore-send-email": "a3a80cb222030ef74d14cf4155befb48b2999847d0e068b7bc9cdda0c9281f97"
}
```

**File:** `extensions/firestore-send-email.env:13`
```
SMTP_CONNECTION_URI=smtp://apikey:${SENDGRID_API_KEY}@smtp.sendgrid.net:587
```

**File:** `docs/O_AND_M_MANUAL.md:83`
```
│  │  • firestore-send-email@0.2.4                            │  │
```

**Findings:**
- Extension installed: `firebase/firestore-send-email@0.2.4`
- Configured to use SendGrid SMTP
- Extension instance ID present in `.firebaserc`

---

### 1.5 Functions Config Keys

**File:** `extensions/firestore-send-email.env:1-16`
```
AUTH_TYPE=UsernamePassword
DATABASE=(default)
DATABASE_REGION=nam5
DEFAULT_FROM=noreply@flicklet.app
MAIL_COLLECTION=mail
SMTP_CONNECTION_URI=smtp://apikey:${SENDGRID_API_KEY}@smtp.sendgrid.net:587
USERS_COLLECTION=users
```

**File:** `apps/web/netlify/functions/send-email.cjs:10,54,65,76`
```javascript
hasApiKey: !!process.env.SENDGRID_API_KEY,
if (!process.env.SENDGRID_API_KEY) { ... }
const FROM = process.env.SENDGRID_FROM;
const REPLY_TO = process.env.SENDGRID_REPLY_TO;
```

**File:** `docs/O_AND_M_MANUAL.md:575-592`
```
| `SENDGRID_API_KEY`                  | SendGrid SMTP authentication | Quarterly      |
| `SENDGRID_FROM`                     | Production | Default sender email | Never         |
| `SENDGRID_REPLY_TO`                 | Production | Reply-to email       | Never         |
```

**File:** `NETLIFY_ENV_SETUP.md:29-31`
```
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM=your_email
```

**Findings:**
- Extension reads: `SENDGRID_API_KEY` (from environment variable substitution in SMTP_CONNECTION_URI)
- Netlify Functions read: `SENDGRID_API_KEY`, `SENDGRID_FROM`, `SENDGRID_REPLY_TO`
- Extension config: `DEFAULT_FROM=noreply@flicklet.app`
- Extension config: `MAIL_COLLECTION=mail`

---

## 2. Email Templating

### 2.1 HTML/MJML/Email Templates

**File:** `functions/src/weeklyDigest.ts:182-270`
```typescript
function buildEmailTemplate({
  subscriberName,
  posts,
  commentsByPost,
  mentions,
  unsubscribeToken,
}: {...}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Flicklet Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: ...">
  <!-- HTML email template with inline styles -->
</body>
</html>
  `.trim();
}
```

**File:** `functions/src/weeklyDigest.ts:275-309`
```typescript
function buildPlainTextTemplate({...}): string {
  // Plain text version of email
}
```

**File:** `netlify/functions/send-email.cjs:50-68`
```javascript
const emailContent = `
New Flicklet Feedback
Theme: ${theme}
Timestamp: ${timestamp}
Message:
${message}
`.trim();
```

**Findings:**
- HTML template: Inline HTML with table-based layout in `functions/src/weeklyDigest.ts`
- Plain text template: Separate function in same file
- Feedback email: Simple text template in Netlify function
- No MJML files found
- No separate template files/partials found

---

### 2.2 Handlebars/EJS/MJML Usage

**File:** `functions/src/weeklyDigest.ts:197-269`
```typescript
return `
<!DOCTYPE html>
<html>
...
Hi ${subscriberName},
...
${posts.length > 0 ? `...` : ""}
...
`.trim();
```

**File:** `apps/web/netlify/functions/send-email.cjs:85-86`
```javascript
templateId,
dynamicTemplateData: dynamicTemplateData || {},
```

**Findings:**
- Weekly digest: String template literals (no Handlebars/EJS/MJML)
- Netlify function: Uses SendGrid Dynamic Templates (templateId + dynamicTemplateData)
- No Handlebars, EJS, or MJML rendering libraries found

---

### 2.3 Unsubscribe Mechanisms

**File:** `functions/src/weeklyDigest.ts:195`
```typescript
const unsubscribeUrl = `https://flicklet.app/unsubscribe?token=${unsubscribeToken}`;
```

**File:** `functions/src/weeklyDigest.ts:165-177`
```typescript
async function generateUnsubscribeToken(uid: string): Promise<string> {
  const payload = {
    uid,
    type: "unsubscribe",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
```

**File:** `functions/src/unsubscribe.ts:13-51`
```typescript
export const unsubscribe = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const { token } = data;
    // Decode token (simple base64url decode)
    // Update user document
    await db.collection("users").doc(uid).update({
      emailSubscriber: false,
    });
});
```

**File:** `apps/web/docs/PRODUCTION_TODO.md:78`
```
- [ ] Create unsubscribe page/route (`/unsubscribe`)
```

**Findings:**
- Token generation: Base64url-encoded JWT-like token (30-day expiration)
- Unsubscribe function: Callable Cloud Function that sets `emailSubscriber=false`
- Unsubscribe route: **Not implemented** (TODO item)
- Token format: `{uid, type: "unsubscribe", exp: timestamp}`

---

## 3. Firestore Data Model

### 3.1 Users Document Structure

**File:** `functions/src/weeklyDigest.ts:73-97`
```typescript
const usersSnapshot = await db
  .collection("users")
  .where("emailSubscriber", "==", true)
  .get();

// Check if email is verified via Firebase Auth
const authUser = await auth.getUser(uid);
if (authUser.emailVerified && authUser.email) {
  subscribers.push({
    uid,
    email: authUser.email,
    displayName: userData.displayName || userData.profile?.displayName,
  });
}
```

**File:** `functions/src/unsubscribe.ts:39-41`
```typescript
await db.collection("users").doc(uid).update({
  emailSubscriber: false,
});
```

**File:** `apps/web/src/components/SettingsPage.tsx:594-596`
```typescript
await updateDoc(userRef, {
  emailSubscriber: enabled,
});
```

**File:** `firestore.rules:92-109`
```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && userId == request.auth.uid;
  allow update: if isAuthenticated() && userId == request.auth.uid;
  allow delete: if isAuthenticated() && userId == request.auth.uid;
}
```

**Findings:**
- Field: `emailSubscriber` (boolean) - stored in Firestore `users` collection
- Email verification: Checked via Firebase Auth (`authUser.emailVerified`)
- Email address: Retrieved from Firebase Auth (`authUser.email`), not stored in Firestore
- Display name: `userData.displayName` or `userData.profile?.displayName`
- No other email preference flags found

---

### 3.2 Announcements/Digests/Newsletters Collections

**File:** `functions/src/weeklyDigest.ts:137`
```typescript
await db.collection("mail").add({...});
```

**File:** `extensions/firestore-send-email.env:10`
```
MAIL_COLLECTION=mail
```

**File:** `docs/O_AND_M_MANUAL.md:615`
```
| `MAIL_COLLECTION`     | mail                                                    | Firestore collection            |
```

**Findings:**
- Collection: `mail` - used by firestore-send-email extension
- Structure: `{to: string, message: {subject: string, html: string, text: string}}`
- No separate collections for announcements, digests, or newsletters found
- Weekly digest writes directly to `mail` collection

---

### 3.3 Firestore Security Rules

**File:** `firestore.rules:92-109`
```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && userId == request.auth.uid;
  allow update: if isAuthenticated() && userId == request.auth.uid;
  allow delete: if isAuthenticated() && userId == request.auth.uid;
}
```

**File:** `firestore.rules:133-136`
```javascript
match /{document=**} {
  allow read, write: if request.auth.token.role == 'admin';
}
```

**File:** `firestore.rules:138-141`
```javascript
match /{document=**} {
  allow read, write: if false;
}
```

**Findings:**
- Users collection: Users can read any user doc, write only their own
- Mail collection: No explicit rules found (defaults to admin-only or deny)
- Admin override: Admins can read/write any document
- Default deny: All other collections default to deny

---

## 4. Admin UI

### 4.1 Admin/Settings Area

**File:** `apps/web/src/pages/AdminPage.tsx`
- Route: `/admin`
- Component: `AdminPage` (lazy loaded)

**File:** `apps/web/src/pages/AdminExtrasPage.tsx:36-1277`
- Route: Accessed via Settings → Admin tab
- Component: `AdminExtrasPage` (lazy loaded)

**File:** `apps/web/src/components/SettingsPage.tsx:186-192`
```typescript
{activeTab === "admin" && (
  <Suspense fallback={<div className="loading-spinner">Loading admin...</div>}>
    <AdminExtrasPage />
  </Suspense>
)}
```

**File:** `apps/web/src/App.tsx:69`
```typescript
const isAdmin = currentPath === '/admin';
```

**Findings:**
- Admin route: `/admin` → `AdminPage` component
- Settings admin tab: Settings → Admin → `AdminExtrasPage` component
- Both components are lazy loaded

---

### 4.2 Forms/Utilities for CRUD

**File:** `apps/web/src/pages/AdminExtrasPage.tsx:48-51`
```typescript
const [adminEmail, setAdminEmail] = useState("");
const [adminUserId, setAdminUserId] = useState("");
const [adminManagementLoading, setAdminManagementLoading] = useState(false);
```

**File:** `apps/web/src/components/SettingsPage.tsx:586-604`
```typescript
const handleEmailSubscriptionToggle = async (enabled: boolean) => {
  const { doc, updateDoc } = await import("firebase/firestore");
  const { db } = await import("../lib/firebaseBootstrap");
  const userRef = doc(db, "users", user.uid);
  await updateDoc(userRef, {
    emailSubscriber: enabled,
  });
};
```

**File:** `apps/web/src/pages/AdminExtrasPage.tsx`
- Contains admin management forms (grant/revoke admin roles)
- Uses Firebase Firestore directly via `updateDoc`, `getDoc`, etc.

**Findings:**
- CRUD operations: Direct Firestore SDK calls (`updateDoc`, `getDoc`, `setDoc`)
- No dedicated CRUD hooks or services found
- Email subscription toggle: Direct `updateDoc` call in Settings component

---

### 4.3 Image Uploads/Asset URLs

**File:** `apps/web/src/components/OptimizedImage.tsx`
- Component for displaying images with optimization
- Uses `posterUrl`, `backdropUrl` props

**File:** `apps/web/src/lib/firebaseBootstrap.ts:34-36`
```typescript
storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "flicklet-71dff.appspot.com",
```

**Findings:**
- Firebase Storage bucket configured: `flicklet-71dff.appspot.com`
- Image optimization component exists but no upload functionality found
- No image upload handlers or Firebase Storage upload code found
- Images appear to be URLs from external sources (TMDB, etc.)

---

## 5. Scheduling/Cron

### 5.1 Cloud Scheduler/Cron Usage

**File:** `functions/src/weeklyDigest.ts:14-16`
```typescript
export const weeklyDigest = functions.pubsub.schedule('0 9 * * 5')
  .timeZone('UTC')
  .onRun(async () => {
```

**File:** `docs/O_AND_M_MANUAL.md:72`
```
│  │  • weeklyDigest (scheduled: Fri 9am UTC)                 │  │
```

**File:** `docs/O_AND_M_MANUAL.md:639-641`
```
**Schedule:** `0 9 * * 5` (Every Friday at 9:00 AM UTC)  
**Region:** us-central1  
**Trigger:** Pub/Sub schedule
```

**Findings:**
- One scheduled function: `weeklyDigest`
- Schedule: `0 9 * * 5` (Cron: Every Friday at 9:00 AM UTC)
- Trigger type: Pub/Sub schedule (Firebase Functions v1)
- No other scheduled functions found

---

### 5.2 Other Scheduled Functions

**Findings:**
- No other scheduled functions found in codebase
- All other functions are event-triggered (Firestore triggers, HTTP, callable)

---

## 6. Routing

### 6.1 Unsubscribe Route

**File:** `apps/web/docs/PRODUCTION_TODO.md:78`
```
- [ ] Create unsubscribe page/route (`/unsubscribe`)
```

**File:** `functions/src/weeklyDigest.ts:195`
```typescript
const unsubscribeUrl = `https://flicklet.app/unsubscribe?token=${unsubscribeToken}`;
```

**File:** `apps/web/src/App.tsx:66-74`
```typescript
const [currentPath, setCurrentPath] = useState(
  typeof window !== 'undefined' ? window.location.pathname : '/'
);
const isAdmin = currentPath === '/admin';
const isDebugAuth = currentPath === '/debug/auth';

// Detect post routes
const postSlugMatch = currentPath.match(/^\/posts\/([^/]+)$/);
```

**Findings:**
- Unsubscribe route: **Not implemented** (TODO item)
- Unsubscribe URL referenced in email template: `https://flicklet.app/unsubscribe?token=...`
- No route handler found for `/unsubscribe`

---

### 6.2 Router Type and Structure

**File:** `apps/web/src/App.tsx:66-90`
```typescript
const [currentPath, setCurrentPath] = useState(
  typeof window !== 'undefined' ? window.location.pathname : '/'
);

useEffect(() => {
  const handleLocationChange = () => {
    setCurrentPath(window.location.pathname);
  };
  
  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('pushstate', handleLocationChange);
  
  return () => {
    window.removeEventListener('popstate', handleLocationChange);
    window.removeEventListener('pushstate', handleLocationChange);
  };
}, []);
```

**File:** `apps/web/src/App.tsx:73-74`
```typescript
const postSlugMatch = currentPath.match(/^\/posts\/([^/]+)$/);
const postSlug = postSlugMatch ? postSlugMatch[1] : null;
```

**Findings:**
- Router type: **Custom client-side routing** (no React Router, no Next.js router)
- Routing method: Manual path detection via `window.location.pathname` and regex matching
- Route handling: Conditional rendering based on `currentPath` state
- New routes: Add path detection logic in `App.tsx` and conditional rendering

---

## 7. SendGrid

### 7.1 SendGrid SDK Packages and Versions

**File:** `apps/web/package.json:24`
```json
"@sendgrid/mail": "^8.1.6",
```

**File:** `netlify.toml:17`
```
external_node_modules = ["@sendgrid/mail"]
```

**File:** `docs/O_AND_M_MANUAL.md:909`
```
| @sendgrid/mail        | ^8.1.6  | Email (client)  | No       |
```

**File:** `functions/package.json`
- No `@sendgrid/mail` dependency (functions use extension instead)

**Findings:**
- Package: `@sendgrid/mail` version `^8.1.6`
- Location: `apps/web/package.json` (client-side)
- Netlify Functions: Use `require('@sendgrid/mail')` (bundled via netlify.toml)
- Firebase Functions: No SendGrid SDK (uses firestore-send-email extension)

---

### 7.2 SendGrid Webhook Endpoints

**Findings:**
- No SendGrid webhook endpoints found in codebase
- No webhook handlers for SendGrid events (bounces, opens, clicks, etc.)

---

### 7.3 Domain/Sender Config References

**File:** `extensions/firestore-send-email.env:4`
```
DEFAULT_FROM=noreply@flicklet.app
```

**File:** `apps/web/netlify/functions/send-email.cjs:65`
```javascript
const FROM = process.env.SENDGRID_FROM;
```

**File:** `netlify/functions/send-email.cjs:65`
```javascript
from: process.env.FROM_EMAIL || 'noreply@flicklet.app',
```

**File:** `SENDGRID_PRODUCTION_SETUP.md:9,22`
```
- `SENDGRID_FROM` = notifications@yourdomain.com (must be verified sender)
Use `notifications@flicklet.app` as your `SENDGRID_FROM`
```

**File:** `functions/EXTENSION_SETUP.md:14`
```
- **DEFAULT_FROM**: `noreply@flicklet.app`
```

**Findings:**
- Extension default sender: `noreply@flicklet.app`
- Netlify Functions: Read `SENDGRID_FROM` from environment variables
- Documentation references: `notifications@flicklet.app` and `noreply@flicklet.app`
- Domain: `flicklet.app` (referenced in multiple configs)
- No domain verification config files found (DNS setup would be in SendGrid dashboard)

---

## Summary

### Key Findings

1. **Firebase Project:** Single project `flicklet-71dff` used for all environments
2. **Cloud Functions:** 9 functions total (3 scheduled/HTTP, 6 Firestore triggers)
3. **Email Extension:** `firestore-send-email@0.2.4` installed and configured
4. **Email Templates:** Inline HTML string templates, no templating engine
5. **Unsubscribe:** Function exists, but UI route (`/unsubscribe`) not implemented
6. **Scheduling:** One scheduled function (`weeklyDigest`) runs Fridays 9am UTC
7. **SendGrid:** SDK v8.1.6 used in Netlify Functions, extension uses SMTP
8. **Routing:** Custom client-side routing (no framework router)

### Missing Components

- `/unsubscribe` route/page (referenced in email but not implemented)
- SendGrid webhook handlers (no event tracking)
- Email template files/partials (all inline code)

---

**End of Report**





