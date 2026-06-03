# Google Play Data Safety Form - Completion Guide

**Privacy Policy URL:** `https://flicklet.netlify.app/privacy.html`  
**Last Updated:** 2025-01-27

---

## Overview

This guide provides step-by-step instructions for completing the Google Play Data Safety form based on Flicklet's privacy policy and data collection practices.

**Where to Find:** Google Play Console → Policy → App content → Data safety

---

## Section 1: Data Collection and Security

### Question: "Does your app collect or share any of the required user data types?"

**Answer: YES**

---

## Section 2: Data Types Collected

### 2.1 Personal Information

#### Email Address
- **Collected:** ✅ Yes
- **Purpose:** Account creation, authentication, account management
- **Required or Optional:** Required
- **Data Type:** Personal info
- **Is data encrypted in transit?** ✅ Yes
- **Is data encrypted at rest?** ✅ Yes
- **Can users request deletion?** ✅ Yes
- **Is data shared?** ❌ No (only with Firebase for authentication/storage)

#### Name
- **Collected:** ✅ Yes
- **Purpose:** Display name/username for account personalization
- **Required or Optional:** Optional (display name), Optional (username)
- **Data Type:** Personal info
- **Is data encrypted in transit?** ✅ Yes
- **Is data encrypted at rest?** ✅ Yes
- **Can users request deletion?** ✅ Yes
- **Is data shared?** ❌ No (only with Firebase for storage)

---

### 2.2 App Activity

#### App Interactions
- **Collected:** ✅ Yes
- **Purpose:** Improve service, personalize experience, monitor usage patterns
- **Required or Optional:** Optional (automatic collection)
- **Data Type:** App activity
- **Is data encrypted in transit?** ✅ Yes
- **Is data encrypted at rest?** ✅ Yes
- **Can users request deletion?** ✅ Yes
- **Is data shared?** ❌ No

#### In-App Search History
- **Collected:** ✅ Yes
- **Purpose:** Improve search functionality, personalize recommendations
- **Required or Optional:** Optional (automatic collection)
- **Data Type:** App activity
- **Is data encrypted in transit?** ✅ Yes
- **Is data encrypted at rest?** ✅ Yes (stored locally)
- **Can users request deletion?** ✅ Yes
- **Is data shared?** ❌ No

---

### 2.3 App Info and Performance

#### Crash Logs
- **Collected:** ✅ Yes
- **Purpose:** Error tracking, performance monitoring, technical issue detection
- **Required or Optional:** Optional (automatic collection)
- **Data Type:** App info and performance
- **Is data encrypted in transit?** ✅ Yes
- **Is data encrypted at rest?** ✅ Yes
- **Can users request deletion?** ✅ Yes
- **Is data shared?** ✅ Yes (with Sentry - anonymized data only)
- **Shared with:** Sentry (error tracking service)

#### Diagnostics
- **Collected:** ✅ Yes
- **Purpose:** Performance monitoring, technical issue detection
- **Required or Optional:** Optional (automatic collection)
- **Data Type:** App info and performance
- **Is data encrypted in transit?** ✅ Yes
- **Is data encrypted at rest?** ✅ Yes
- **Can users request deletion?** ✅ Yes
- **Is data shared?** ✅ Yes (with Sentry - anonymized data only)
- **Shared with:** Sentry (error tracking service)

---

### 2.4 Other User Content

#### User Content (Watchlists, Ratings, Notes, Tags)
- **Collected:** ✅ Yes
- **Purpose:** Core app functionality - tracking TV shows and movies
- **Required or Optional:** Required for core functionality
- **Data Type:** Other (User content)
- **Is data encrypted in transit?** ✅ Yes
- **Is data encrypted at rest?** ✅ Yes (Firebase Firestore)
- **Can users request deletion?** ✅ Yes
- **Is data shared?** ❌ No (only stored in Firebase for syncing across devices)

#### Game Activity (FlickWord, Trivia scores)
- **Collected:** ✅ Yes
- **Purpose:** Game functionality, statistics tracking
- **Required or Optional:** Optional
- **Data Type:** Other (Game activity)
- **Is data encrypted in transit?** ✅ Yes
- **Is data encrypted at rest?** ✅ Yes (Firebase Firestore)
- **Can users request deletion?** ✅ Yes
- **Is data shared?** ❌ No

---

## Section 3: Data Sharing

### Third-Party Services

#### 1. Firebase (Google)
- **What data is shared:** Email, Name, User content (watchlists, ratings, notes), Game statistics
- **Purpose:** Authentication, data storage (Firestore), push notifications (Cloud Messaging)
- **Is data encrypted?** ✅ Yes (Firebase encrypts data in transit and at rest)
- **Can users request deletion?** ✅ Yes (via account deletion)

#### 2. Sentry
- **What data is shared:** Crash logs, Diagnostics (anonymized only)
- **Purpose:** Error tracking and performance monitoring
- **Is data encrypted?** ✅ Yes
- **Can users request deletion?** ✅ Yes
- **Note:** Only anonymized error data is shared, no personal information

#### 3. SendGrid
- **What data is shared:** Email address (Pro users only)
- **Purpose:** Email delivery of notifications
- **Is data encrypted?** ✅ Yes
- **Can users request deletion?** ✅ Yes
- **Note:** Only used for Pro users who opt-in to email notifications

#### 4. The Movie Database (TMDB)
- **What data is shared:** ❌ No user data shared
- **Purpose:** TV show and movie metadata and images (content only)
- **Note:** TMDB provides content metadata only. No user data is sent to TMDB.

---

## Section 4: Data Security Practices

### Encryption
- **Data encrypted in transit:** ✅ Yes (HTTPS/TLS)
- **Data encrypted at rest:** ✅ Yes (Firebase Firestore encryption)

### Data Deletion
- **Can users request deletion?** ✅ Yes
- **How:** Users can delete their account and data by contacting support@flicklet.app
- **Deletion timeframe:** Within 30 days of request (except where required by law)

### Data Access
- **Can users access their data?** ✅ Yes
- **How:** Through the app settings, users can view and export their watchlist data

---

## Section 5: Children's Privacy

### Question: "Does your app target children?"
**Answer:** No

**Note:** The app is not intended for children under 13. We do not knowingly collect personal information from children under 13.

---

## Section 6: Data Collection Practices

### Question: "Is all of the data collected by your app encrypted in transit?"
**Answer:** ✅ Yes

### Question: "Is all of the data collected by your app encrypted at rest?"
**Answer:** ✅ Yes (for data stored in Firebase Firestore)

### Question: "Can users request that their data be deleted?"
**Answer:** ✅ Yes

---

## Section 7: Location Data

### Question: "Does your app collect, share, or use location data?"
**Answer:** ❌ No

**Note:** The app allows users to optionally provide city/region information for theater showtimes, but this is manually entered text, not GPS location data.

---

## Section 8: Financial Information

### Question: "Does your app collect, share, or use financial information?"
**Answer:** ✅ Yes (for Pro subscriptions)

**Details:**
- **Payment information:** Handled by Google Play Billing (not collected by app)
- **Purchase history:** Stored by Google Play (not collected by app)
- **Note:** The app uses Google Play Billing for in-app purchases. Payment information is handled entirely by Google Play and is not collected or stored by the app.

---

## Section 9: Health and Fitness

### Question: "Does your app collect health or fitness information?"
**Answer:** ❌ No

---

## Section 10: Sensitive Permissions

### Question: "Does your app use sensitive permissions or capabilities?"
**Answer:** Review based on AndroidManifest.xml

**Current Permissions:**
- `INTERNET` - Required for API calls
- `ACCESS_NETWORK_STATE` - Required for network status checks
- `BILLING` - Required for Google Play Billing (Pro subscriptions)

**No sensitive permissions required** (no camera, microphone, location, contacts, etc.)

---

## Quick Reference Checklist

When filling out the form, ensure you mark:

✅ **Data Collected:**
- Personal info: Email, Name
- App activity: App interactions, Search history
- App info: Crash logs, Diagnostics
- Other: User content, Game activity

✅ **Data Shared:**
- Firebase/Google: Email, Name, User content (for storage/auth)
- Sentry: Crash logs, Diagnostics (anonymized)
- SendGrid: Email (Pro users only)

✅ **Security:**
- Encrypted in transit: Yes
- Encrypted at rest: Yes
- Users can request deletion: Yes

❌ **Not Collected:**
- Location data (GPS)
- Health/fitness data
- Financial info (handled by Google Play)
- Sensitive permissions

---

## Privacy Policy Reference

All information in this guide is based on the privacy policy at:
**https://flicklet.netlify.app/privacy.html**

---

## After Submission

1. **Review:** Google will review your data safety form (usually within 24-48 hours)
2. **Updates:** If you change data collection practices, update the form within 7 days
3. **Privacy Policy:** Ensure your privacy policy URL is added to the Play Console listing

---

## Support

If you have questions about completing the form, refer to:
- [Google Play Data Safety Documentation](https://support.google.com/googleplay/android-developer/answer/10787469)
- Your privacy policy: https://flicklet.netlify.app/privacy.html

---

**Status:** ✅ Ready to complete  
**Estimated Time:** 30-45 minutes  
**Last Verified:** 2025-01-27








