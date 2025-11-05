# Phase 8 - Email Digest Implementation

## Files Created

1. **`functions/src/weeklyDigest.ts`** - Scheduled function that runs every Friday at 9 AM UTC
2. **`functions/src/unsubscribe.ts`** - Callable function to handle unsubscribe requests
3. **`functions/EXTENSION_SETUP.md`** - Extension installation instructions
4. **`functions/src/index.ts`** - Updated with exports

## Setup Steps

### 1. Install Firebase Extension

Run this command once:

```bash
firebase ext:install firebase/firestore-send-email --project=flicklet-71dff
```

When prompted, enter:
- **SMTP_CONNECTION_URI**: `smtp://apikey:${SENDGRID_API_KEY}@smtp.sendgrid.net:587`
- **DEFAULT_FROM**: `noreply@flicklet.app`

### 2. Add Environment Variables

Add to your `.env.local` file (or set via `firebase functions:config:set`):

```bash
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_SENDER=noreply@flicklet.app
```

If using Firebase Functions config:

```bash
firebase functions:config:set sendgrid.api_key="your_key" email.sender="noreply@flicklet.app"
```

### 3. Deploy Functions

```bash
firebase deploy --only functions:weeklyDigest,functions:unsubscribe,extensions
```

## How It Works

### Weekly Digest Function

The `weeklyDigest` function:
1. Fetches top 5 posts from last 7 days (sorted by `score`)
2. Fetches new comments from last 7 days, grouped by post
3. Finds mentions (`@username` in comments) for each subscriber
4. Gets all users with `emailSubscriber=true` and verified emails
5. Builds personalized HTML email for each subscriber
6. Adds email to `mail` collection (extension sends it)

### Email Template

The email includes:
- **Top Posts Section**: Top 5 posts with title, excerpt, vote count, comment count
- **Mentions Section**: Comments where user was mentioned with `@username`
- **Unsubscribe Link**: JWT token-based unsubscribe link

### Unsubscribe Function

The `unsubscribe` callable function:
1. Verifies JWT token from unsubscribe link
2. Sets `emailSubscriber=false` on user document
3. Returns confirmation message

## User Subscription Management

To enable email subscriptions, users need:
1. `emailSubscriber=true` field in their Firestore user document
2. Verified email address (`emailVerified=true` in Firebase Auth)

You can add a UI toggle in settings to let users opt-in/opt-out.

## Testing

### Manual Trigger

To test the digest function manually:

```bash
firebase functions:shell
```

Then:
```javascript
const { weeklyDigest } = require('./lib/index');
await weeklyDigest();
```

### Test Unsubscribe

1. Generate a test token (or use the one from an email)
2. Call the unsubscribe function:
```javascript
const { unsubscribe } = require('./lib/index');
await unsubscribe({ token: 'your_token_here' });
```

## Next Steps

1. **Add UI for subscription management** - Allow users to toggle `emailSubscriber` in settings
2. **Improve mention detection** - Currently uses simple `@username` matching; could be enhanced
3. **Add email preferences** - Allow users to choose frequency (weekly, daily, etc.)
4. **Track email metrics** - Use SendGrid webhooks to track opens/clicks

## Notes

- The extension automatically creates the `mail` collection
- Unsubscribe tokens expire after 30 days
- The function runs every Friday at 9 AM UTC
- Make sure your SendGrid API key has SMTP access enabled

