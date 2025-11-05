# Firebase Messaging Extension Setup - Push Notifications

## Step 1: Install Extension

Run this command once to install the firebase/messaging extension:

```bash
firebase ext:install firebase/messaging --project=flicklet-71dff
```

When prompted, enter:

- **Server key**: Your FCM server key from Firebase Console → Project Settings → Cloud Messaging → Server key

## Step 2: Get VAPID Key

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under "Web configuration", find or generate the Web Push certificates
3. Copy the "Key pair" (VAPID key)
4. Add to your `.env.local` or environment variables:

```bash
VITE_FCM_VAPID_KEY=your_vapid_key_here
```

## Step 3: How It Works

### Client Side (apps/web)

1. **firebase-messaging.ts**:
   - Initializes Firebase Messaging
   - Gets FCM token and stores in user document (`fcmToken` field)
   - Handles foreground messages (shows toast)
   - Registers messaging service worker

2. **firebase-messaging-sw.js**:
   - Handles background messages (when app is closed)
   - Shows native push notifications
   - Handles notification clicks (opens post)

3. **useInstallPrompt.ts**:
   - Detects PWA install prompt
   - Shows "Install" button in header when available

### Server Side (functions)

1. **sendPushOnReply.ts**:
   - Triggers on reply creation
   - Fetches comment author's FCM token
   - Sends push notification via FCM

## Step 4: Deploy

```bash
firebase deploy --only hosting,functions:sendPushOnReply,extensions
```

## Testing

1. **Install Prompt**: Visit site on mobile Chrome - should see "Install" button
2. **Offline Support**: Go offline, visit `/posts/*` - should load from cache
3. **Push Notifications**: 
   - Grant notification permission
   - Have someone reply to your comment
   - Should receive push notification

## Notes

- FCM tokens are stored in Firestore `users/{uid}/fcmToken`
- Tokens are automatically cleaned up if invalid
- Background messages require the messaging service worker
- VAPID key is required for web push notifications

