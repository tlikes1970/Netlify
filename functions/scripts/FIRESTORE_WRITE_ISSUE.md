# Firestore Write Issue - Diagnosis

## Problem

Bulk ingestion reports success (319/319) but no insights are written to Firestore.

## Root Cause

The Netlify function is **not initializing Firestore** properly. The function returns 200 OK even when Firestore writes fail silently.

## Diagnosis Steps

### Step 1: Check Netlify Function Logs

1. Go to Netlify Dashboard → Functions → goofs-fetch → Logs
2. Look for these error messages:
   - `[goofs-fetch] ❌ Firestore not available - insights were NOT written to database!`
   - `[goofs-fetch] Firebase Admin init error:`
   - `[goofs-fetch] Firestore write error:`

### Step 2: Check Environment Variables

The function needs `FIREBASE_SERVICE_ACCOUNT_JSON` to initialize Firestore in Netlify.

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Check if `FIREBASE_SERVICE_ACCOUNT_JSON` is set
3. If not set, you need to add it

### Step 3: Get Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `flicklet-71dff`
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the entire JSON content

### Step 4: Set Environment Variable in Netlify

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Add new variable:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value**: Paste the entire JSON content from step 3
   - **Scope**: Production (and other environments as needed)
3. **Important**: The value must be the entire JSON object as a string (Netlify will handle it)

### Step 5: Redeploy

After adding the environment variable:

1. Go to Netlify Dashboard → Deploys
2. Click "Trigger deploy" → "Deploy site"
3. Wait for build to complete

### Step 6: Test Again

After redeploy, test a single title:

```bash
cd functions
npm run test:netlify <your-admin-token>
```

Then check if insights were written:

```bash
npm run check:insights <tmdbId>
```

## Why This Happens

Netlify functions don't have access to Google Cloud default credentials like Firebase Cloud Functions do. They need explicit service account credentials via `FIREBASE_SERVICE_ACCOUNT_JSON`.

The function currently:

1. Tries to initialize with `FIREBASE_SERVICE_ACCOUNT_JSON` (if set)
2. Falls back to default credentials (which don't work in Netlify)
3. Returns `{ admin: null, db: null }` on error
4. Still returns 200 OK even when Firestore is null
5. Skips Firestore writes silently

## Fix Applied

I've improved error logging so you can see:

- Whether Firestore initialized successfully
- What error occurred during initialization
- Whether writes are being skipped

Check the Netlify function logs after the next deployment to see the actual error.
