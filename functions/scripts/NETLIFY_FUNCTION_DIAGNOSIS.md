# Netlify Function Diagnosis Guide

## Problem
Bulk ingestion is failing with all 319 titles returning errors. The error logs show `<!DOCTYPE html>` which indicates the Netlify function is returning an HTML error page instead of JSON.

## Root Cause Analysis

### Symptoms
- All bulk ingestion requests fail (0 succeeded, 319 failed)
- Error messages contain `<!DOCTYPE html>` (HTML error page)
- Function appears to be returning Netlify's default error page

### Possible Causes

1. **Function Not Deployed to Netlify**
   - The function file exists locally at `netlify/functions/goofs-fetch.cjs`
   - But it may not be deployed to Netlify's production environment
   - Check: Netlify Dashboard → Functions → Should see `goofs-fetch` in the list

2. **Incorrect Function URL**
   - Current URL: `https://flicklet.netlify.app/.netlify/functions/goofs-fetch`
   - Verify this matches your actual Netlify site URL
   - Check: Netlify Dashboard → Site settings → General → Site details

3. **Missing Environment Variables in Netlify**
   - `GOOFS_INGESTION_ADMIN_TOKEN` must be set in Netlify (not just Firebase)
   - `FIREBASE_SERVICE_ACCOUNT_JSON` may be needed for Firestore access
   - Check: Netlify Dashboard → Site settings → Environment variables

4. **Function Crash Before Response**
   - Function may be crashing during initialization
   - Check: Netlify Dashboard → Functions → goofs-fetch → Logs

5. **Routing Issue**
   - The SPA fallback redirect (`/*` → `/index.html`) might be catching function requests
   - However, `/.netlify/functions/*` should be handled before the SPA fallback

## Configuration Check

### ✅ Netlify Configuration (`netlify.toml`)
- Functions directory: `netlify/functions` ✓
- Function file exists: `netlify/functions/goofs-fetch.cjs` ✓
- Redirect configured: `/api/goofs-fetch` → `/.netlify/functions/goofs-fetch` ✓

### ⚠️ Required Environment Variables

**In Netlify Dashboard:**
1. `GOOFS_INGESTION_ADMIN_TOKEN` - Must match the token in Firebase Functions
2. `FIREBASE_SERVICE_ACCOUNT_JSON` - Optional, for Firestore access (if not using default credentials)

**In Firebase Functions:**
1. `GOOFS_INGESTION_ADMIN_TOKEN` - Must match the token in Netlify
2. `NETLIFY_FUNCTION_URL` - Optional, defaults to `https://flicklet.netlify.app/.netlify/functions/goofs-fetch`

## Testing Steps

### Step 1: Test Function Directly

Run the test script:
```bash
cd functions
npm run test:netlify <your-admin-token>
```

Or manually:
```bash
node scripts/test-netlify-goofs-fetch.js <your-admin-token>
```

**Expected Results:**
- ✅ **200 OK with JSON**: Function is working correctly
- ❌ **401 Unauthorized**: Admin token is incorrect or missing in Netlify
- ❌ **404 Not Found**: Function is not deployed or URL is wrong
- ❌ **500 Internal Server Error**: Function is crashing
- ❌ **HTML Response**: Function endpoint doesn't exist or routing issue

### Step 2: Check Netlify Dashboard

1. **Verify Function is Deployed:**
   - Go to Netlify Dashboard → Your Site → Functions
   - Look for `goofs-fetch` in the list
   - If missing, trigger a new deployment

2. **Check Function Logs:**
   - Go to Netlify Dashboard → Functions → goofs-fetch → Logs
   - Look for errors during function execution
   - Check for authentication failures

3. **Verify Environment Variables:**
   - Go to Netlify Dashboard → Site settings → Environment variables
   - Ensure `GOOFS_INGESTION_ADMIN_TOKEN` is set
   - Ensure it matches the token in Firebase Functions

### Step 3: Test with curl

```bash
curl -X POST https://flicklet.netlify.app/.netlify/functions/goofs-fetch \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_TOKEN_HERE" \
  -d '{
    "tmdbId": 550,
    "metadata": {
      "tmdbId": 550,
      "title": "Fight Club",
      "mediaType": "movie",
      "genres": ["Drama"],
      "year": 1999
    }
  }'
```

## Common Fixes

### Fix 1: Deploy Function to Netlify
If the function isn't deployed:
1. Commit and push your changes to trigger a Netlify deployment
2. Or manually trigger a deploy in Netlify Dashboard

### Fix 2: Set Environment Variables
1. Go to Netlify Dashboard → Site settings → Environment variables
2. Add `GOOFS_INGESTION_ADMIN_TOKEN` with the same value as in Firebase
3. Redeploy the site (or wait for next deployment)

### Fix 3: Verify Function URL
1. Check your actual Netlify site URL
2. Update `NETLIFY_FUNCTION_URL` in Firebase Functions environment variables if different
3. Or update the default in `functions/src/ingestGoofs.ts`

### Fix 4: Check Function Logs
1. Go to Netlify Dashboard → Functions → goofs-fetch → Logs
2. Look for specific error messages
3. Common issues:
   - Firebase Admin initialization failures
   - Missing environment variables
   - Firestore permission errors

## Next Steps After Diagnosis

Once you've identified the issue:

1. **If function is not deployed**: Trigger a new Netlify deployment
2. **If environment variables are missing**: Add them in Netlify Dashboard
3. **If function is crashing**: Check logs and fix the underlying issue
4. **If URL is wrong**: Update the URL in Firebase Functions config

After fixing, run the test script again to verify the function is working.



