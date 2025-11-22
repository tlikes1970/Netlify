# How to Check Netlify Function Logs

## Problem
Bulk ingestion reports success, but insights are not being written to Firestore. We need to check the Netlify function logs to see why Firestore initialization is failing.

## Steps to Check Logs

1. **Go to Netlify Dashboard**
   - Navigate to your site
   - Click on **Functions** in the left sidebar

2. **Find goofs-fetch function**
   - Look for `goofs-fetch` in the functions list
   - Click on it

3. **View Logs**
   - Click on the **Logs** tab
   - Look for recent logs (from when you ran bulk ingestion)

4. **Look for these key messages:**

   **If Firestore initialized successfully:**
   - `[goofs-fetch] ✅ Firestore initialized successfully`
   - `[goofs-fetch] Wrote X insights to Firestore for TMDB ID ...`

   **If Firestore failed to initialize:**
   - `[goofs-fetch] ⚠️ Firestore not initialized - writes will fail!`
   - `[goofs-fetch] Check FIREBASE_SERVICE_ACCOUNT_JSON environment variable in Netlify`
   - `[goofs-fetch] ❌ Firebase Admin init error: ...`

   **If Firestore write failed:**
   - `[goofs-fetch] Firestore write error: ...`
   - `[goofs-fetch] ❌ Firestore not available - insights were NOT written to database!`

## What to Look For

### Error 1: Firestore Not Initialized
If you see: `⚠️ Firestore not initialized - writes will fail!`

**Cause:** `FIREBASE_SERVICE_ACCOUNT_JSON` is either:
- Not set in Netlify environment variables
- Set incorrectly (malformed JSON)
- Not available to the function (wrong scope)

**Fix:**
1. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Netlify
2. Check it's a valid single-line JSON string
3. Ensure scope includes "Functions"
4. Redeploy after adding/updating

### Error 2: Firebase Admin Init Error
If you see: `❌ Firebase Admin init error: ...`

**Common causes:**
- Invalid service account JSON format
- Missing required fields in JSON
- Private key formatting issues (newlines)

**Fix:**
- Check the error message for specific details
- Verify JSON is valid (can test with `JSON.parse()`)
- Ensure private key has `\n` characters preserved

### Error 3: Firestore Write Error
If you see: `Firestore write error: ...`

**Common causes:**
- Firestore permissions issue
- Network/connectivity problem
- Invalid document structure

**Fix:**
- Check Firestore security rules
- Verify service account has write permissions
- Check error message for specific details

## Next Steps After Checking Logs

Once you identify the error:
1. Share the error message from the logs
2. We can fix the specific issue
3. Redeploy and test again



