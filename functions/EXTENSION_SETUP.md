# Firebase Extension Setup - Email Digest

## Step 1: Install Extension

Run this command once to install the firestore-send-email extension:

```bash
firebase ext:install firebase/firestore-send-email --project=flicklet-71dff
```

When prompted, enter these values:

- **SMTP_CONNECTION_URI**: `smtp://apikey:${SENDGRID_API_KEY}@smtp.sendgrid.net:587`
- **DEFAULT_FROM**: `noreply@flicklet.app`

## Step 2: Configure Environment Variables

Add to your `.env.local` file (or Firebase Functions config):

```bash
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_SENDER=noreply@flicklet.app
```

## Step 3: How It Works

The extension watches for documents added to the `mail` collection and automatically sends them via SendGrid.

The `weeklyDigest` function adds documents to `mail` collection with this structure:

```javascript
{
  to: "user@example.com",
  message: {
    subject: "Your Weekly Flicklet Digest",
    html: "<html>...</html>",
    text: "Plain text version"
  }
}
```

## Step 4: Deploy

```bash
firebase deploy --only functions:weeklyDigest,functions:unsubscribe,extensions
```

## Notes

- The extension will automatically create the `mail` collection if it doesn't exist
- Make sure your SendGrid API key has SMTP access enabled
- The extension handles email sending, tracking, and delivery status
- Unsubscribe links use JWT tokens that expire after 30 days

