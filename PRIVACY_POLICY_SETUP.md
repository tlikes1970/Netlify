# Privacy Policy Setup - Complete

## What Was Created

### Privacy Policy Document
**Location:** `apps/web/public/privacy.html`

**Public URL:** `https://flicklet.netlify.app/privacy.html`

This privacy policy document covers:
- ✅ What data is collected (all user data, watchlists, preferences, etc.)
- ✅ How data is used
- ✅ Third-party services (Firebase, Sentry, SendGrid, TMDB)
- ✅ Data storage locations (Firestore, LocalStorage)
- ✅ User rights (access, correction, deletion, opt-out)
- ✅ Children's privacy
- ✅ International data transfers
- ✅ Data retention
- ✅ Contact information

## Next Steps for Google Play Store

### 1. Verify Privacy Policy is Accessible
After deploying to Netlify, verify the privacy policy is accessible at:
- `https://flicklet.netlify.app/privacy.html`

### 2. Add Privacy Policy URL to Google Play Console
When setting up your app listing in Google Play Console:
1. Go to **Store presence** → **Store listing**
2. Find the **Privacy Policy** field
3. Enter: `https://flicklet.netlify.app/privacy.html`

### 3. Complete Google Play Data Safety Form
In Google Play Console, go to **Policy** → **App content** → **Data safety** and complete the form based on this information:

#### Data Collected and Shared
**Personal Info:**
- ✅ Email address (collected, linked to user, not shared)
- ✅ Name (display name/username, collected, linked to user, not shared)

**App Activity:**
- ✅ App interactions (collected, linked to user, not shared)
- ✅ In-app search history (collected, linked to user, not shared)

**App Info and Performance:**
- ✅ Crash logs (collected, not linked to user, shared with Sentry)
- ✅ Diagnostics (collected, not linked to user, shared with Sentry)

**Other:**
- ✅ User content (watchlists, ratings, notes - collected, linked to user, not shared)
- ✅ Game activity (scores, statistics - collected, linked to user, not shared)

#### Data Security
- ✅ Data is encrypted in transit
- ✅ Users can request data deletion
- ✅ Data is encrypted at rest (Firebase Firestore)

#### Third-Party Data Sharing
- ✅ Sentry (error tracking - anonymized data only)
- ✅ Firebase/Google (authentication and data storage)
- ✅ TMDB (content metadata - no user data shared)

### 4. Optional: Create Terms of Service
While not strictly required, consider creating a Terms of Service document at:
- `apps/web/public/terms.html`
- URL: `https://flicklet.netlify.app/terms.html`

## Privacy Policy Content Summary

The privacy policy includes:
1. **Information Collection:** What data is collected and how
2. **Data Usage:** How the data is used
3. **Data Sharing:** Third-party services used
4. **Data Security:** How data is protected
5. **User Rights:** How users can access, correct, or delete their data
6. **Children's Privacy:** Statement about age restrictions
7. **International Transfers:** Data transfer disclosures
8. **Data Retention:** How long data is kept
9. **Policy Updates:** How changes are communicated
10. **Contact Information:** How to reach support

## Contact Email

**Note:** The privacy policy currently lists `support@flicklet.app` as the contact email. You may want to:
1. Set up this email address, or
2. Update the privacy policy with your actual support email address

## Deployment

The privacy policy will be automatically deployed with your next Netlify deployment since it's in the `apps/web/public/` directory.

To verify it's live:
```bash
# After deployment, check:
curl https://flicklet.netlify.app/privacy.html
```

## Legal Disclaimer

**Important:** This privacy policy is a template based on the data collection audit. You should:
1. Review it with legal counsel if possible
2. Ensure all statements are accurate for your specific use case
3. Update contact information with your actual support email
4. Add any additional disclosures required by your jurisdiction

---

**Status:** ✅ Privacy Policy Created  
**Next:** Deploy and add URL to Google Play Console


