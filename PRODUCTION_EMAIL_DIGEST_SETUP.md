# Production Email Digest Setup Guide

## Step 1: Configure SendGrid API Key

The code uses `functions.config().sendgrid.key` and `functions.config().mail.from`.

### Set Firebase Functions Config:

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY" --project=flicklet-71dff
firebase functions:config:set mail.from="noreply@flicklet.app" --project=flicklet-71dff
```

**To get your SendGrid API Key:**

1. Go to SendGrid Dashboard → Settings → API Keys
2. Create a new API Key (or use existing)
3. Give it "Mail Send" permissions
4. Copy the key (you'll only see it once!)

**Note:** If you're using Firebase Functions v2, you may need to use environment variables instead:

```bash
firebase functions:secrets:set SENDGRID_API_KEY --project=flicklet-71dff
```

## Step 2: Verify SendGrid Domain Authentication

1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Authenticate your domain `flicklet.app` (or use single sender verification for `noreply@flicklet.app`)
3. Complete DNS verification (add TXT records to your domain)
4. Wait for verification (can take a few hours)

## Step 3: Deploy Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions:weeklyDigest,functions:digestPreview,functions:unsubscribe --project=flicklet-71dff
```

**Verify deployment:**

```bash
firebase functions:list --project=flicklet-71dff
```

You should see:

- `weeklyDigest` (scheduled function)
- `digestPreview` (HTTP function)
- `unsubscribe` (callable function)

## Step 4: Create Initial Digest Config in Firestore

The digest won't send emails until you create an active config document.

1. Go to Firebase Console → Firestore Database
2. Create collection: `digestConfig`
3. Create document with ID: `current`
4. Add these fields:

```json
{
  "title": "🎬 Flicklet Weekly — We actually shipped things.",
  "intro": "Here's your Flicklet update in under a minute.",
  "productPulseChanged": "Ratings now stick between sessions.",
  "productPulseNext": "• Smarter discovery rails • Swipe gestures that don't argue with gravity",
  "productPulseHowTo": "Tap ★ once. It remembers now.",
  "productPulseBonus": "Library loads faster so you spend less time staring at spinners.",
  "tipHeadline": "The One Thing You Didn't Know You Needed",
  "tipBody": "Hold your finger on a card to reorder your list. Saves 10 clicks and a small piece of your soul.",
  "footerNote": "Was this worth your 42 seconds?",
  "isActive": true
}
```

**Or use the Admin UI:**

- Go to Settings → Admin tab
- Use the "Weekly Digest Email Configuration" section
- Fill in the fields and click "Save Digest Config"

## Step 5: Test the Setup

### Test 1: Test Unsubscribe Function

1. Generate a test token:

   ```bash
   cd functions
   node test-unsubscribe-simple.js YOUR_USER_UID
   ```

2. Open the unsubscribe URL in production:

   ```
   https://flicklet.app/unsubscribe?token=YOUR_TOKEN
   ```

3. Verify:
   - Page loads correctly
   - Shows success message
   - User document updated: `emailSubscriber: false`

### Test 2: Test Email Preview (digestPreview)

1. Call the HTTP function:

   ```bash
   curl "https://us-central1-flicklet-71dff.cloudfunctions.net/digestPreview?to=your-email@example.com"
   ```

   Or open in browser:

   ```
   https://us-central1-flicklet-71dff.cloudfunctions.net/digestPreview?to=your-email@example.com
   ```

2. Check your email inbox
3. Verify email renders correctly

### Test 3: Verify Scheduled Function

1. Check function logs:

   ```bash
   firebase functions:log --only weeklyDigest --project=flicklet-71dff
   ```

2. The function runs every Friday at 9:00 AM UTC
3. To test immediately, you can trigger it manually via Firebase Console → Functions → weeklyDigest → "Test function"

## Step 6: Set Up Monitoring (Optional but Recommended)

### Firebase Console Monitoring:

1. Go to Firebase Console → Functions
2. Click on `weeklyDigest`
3. Set up alerts:
   - Function execution failures
   - Execution time > 10 seconds
   - Error rate > 5%

### SendGrid Monitoring:

1. Go to SendGrid Dashboard → Activity
2. Monitor:
   - Email delivery rates
   - Bounce rates
   - Spam reports
   - Unsubscribe requests

## Step 7: Verify Everything Works

### Checklist:

- [ ] SendGrid API key configured in Firebase Functions
- [ ] SendGrid domain authenticated
- [ ] Functions deployed successfully
- [ ] `digestConfig/current` document exists in Firestore with `isActive: true`
- [ ] Test unsubscribe page works
- [ ] Test email preview sends email
- [ ] Email renders correctly in inbox
- [ ] Unsubscribe link in email works
- [ ] User subscription toggle in Settings works

## Troubleshooting

### "Missing functions config sendgrid.key" Error

**Solution:**

```bash
firebase functions:config:set sendgrid.key="YOUR_KEY" --project=flicklet-71dff
firebase deploy --only functions --project=flicklet-71dff
```

### "No active digest config found" in Logs

**Solution:**

- Create `digestConfig/current` document in Firestore
- Set `isActive: true`
- Or use Admin UI to create/config

### Emails Not Sending

**Check:**

1. SendGrid API key is valid
2. Domain is authenticated in SendGrid
3. `digestConfig/current` exists and `isActive: true`
4. Users have `emailSubscriber: true` and `emailVerified: true`
5. Check function logs for errors

### Unsubscribe Page Not Working

**Check:**

1. Unsubscribe function is deployed
2. Route `/unsubscribe` is accessible
3. Token format is correct (base64url encoded JSON)
4. Check browser console for errors

## Next Steps After Setup

1. **Monitor first weekly digest send** (next Friday at 9 AM UTC)
2. **Check SendGrid activity** for delivery rates
3. **Review unsubscribe requests** to see if users are opting out
4. **Update digest config** via Admin UI as needed
5. **Add email verification check** in Settings UI (optional improvement)

## Quick Reference Commands

```bash
# Set SendGrid config
firebase functions:config:set sendgrid.key="SG.xxx" mail.from="noreply@flicklet.app" --project=flicklet-71dff

# Deploy functions
firebase deploy --only functions:weeklyDigest,functions:digestPreview,functions:unsubscribe --project=flicklet-71dff

# View logs
firebase functions:log --only weeklyDigest --project=flicklet-71dff

# List functions
firebase functions:list --project=flicklet-71dff

# Generate test token
cd functions && node test-unsubscribe-simple.js USER_UID
```
