# Deploy Netlify Function - Quick Fix Guide

## Problem Identified ✅
The test script confirmed: **404 Error - Function not deployed to Netlify**

**Root Cause:** The function was in the wrong location!
- ❌ Was at: `netlify/functions/goofs-fetch.cjs` (repo root)
- ✅ Should be at: `apps/web/netlify/functions/goofs-fetch.cjs` (inside build base)

Since `netlify.toml` has `base = "apps/web"`, Netlify looks for functions in `apps/web/netlify/functions/`, not the repo root.

## Solution: Deploy to Netlify

Netlify functions are automatically deployed when you push changes to your connected Git repository. Here's how to fix it:

### Option 1: Git Push (Recommended - Automatic Deployment)

1. **Commit the function file** (if not already committed):
   ```bash
   git add netlify/functions/goofs-fetch.cjs
   git commit -m "Add goofs-fetch Netlify function for insights ingestion"
   ```

2. **Push to your repository**:
   ```bash
   git push
   ```

3. **Wait for Netlify to build**:
   - Go to Netlify Dashboard → Your Site → Deploys
   - Wait for the build to complete (usually 2-5 minutes)
   - The function will be automatically deployed

4. **Verify deployment**:
   - Go to Netlify Dashboard → Functions
   - You should see `goofs-fetch` in the list
   - Or run the test script again:
     ```bash
     cd functions
     npm run test:netlify <your-admin-token>
     ```

### Option 2: Manual Deploy via Netlify CLI

If you have Netlify CLI installed:

```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy functions only
netlify deploy --functions
```

### Option 3: Trigger Deploy in Netlify Dashboard

1. Go to Netlify Dashboard → Your Site
2. Click "Trigger deploy" → "Deploy site"
3. This will rebuild and redeploy everything, including functions

## After Deployment: Set Environment Variables

Once the function is deployed, make sure these environment variables are set in Netlify:

1. **Go to Netlify Dashboard** → Site settings → Environment variables
2. **Add/Verify these variables:**

   ```
   GOOFS_INGESTION_ADMIN_TOKEN=bb656d2c5aac3d48394e0005ff895464aee24803fd086d9b2c450c927482ab22
   ```

   (Use the same token value as in Firebase Functions)

3. **Optional but recommended:**
   ```
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```
   (Only if you need explicit Firestore access - otherwise Netlify uses default credentials)

4. **Redeploy after adding variables:**
   - Variables are only available after a new deployment
   - Go to Deploys → Trigger deploy

## Verify Function is Working

After deployment, test again:

```bash
cd functions
npm run test:netlify <your-admin-token>
```

**Expected result:**
- ✅ Status: 200 OK
- ✅ Content-Type: application/json
- ✅ Response contains `success: true` and `itemsGenerated`

## Troubleshooting

### If function still returns 404 after deployment:

1. **Check function name matches:**
   - File: `netlify/functions/goofs-fetch.cjs`
   - URL: `/.netlify/functions/goofs-fetch`
   - Function name in Netlify Dashboard should be `goofs-fetch`

2. **Check build logs:**
   - Netlify Dashboard → Deploys → Click on latest deploy → Build log
   - Look for errors during function bundling

3. **Verify netlify.toml:**
   - Functions directory should be: `netlify/functions`
   - Check that `[functions]` section exists

### If function returns 401 Unauthorized:

- The `GOOFS_INGESTION_ADMIN_TOKEN` in Netlify doesn't match Firebase
- Or the token wasn't set before deployment (variables are only available after deployment)

### If function returns 500 Internal Server Error:

- Check Netlify Dashboard → Functions → goofs-fetch → Logs
- Look for Firebase initialization errors
- May need to set `FIREBASE_SERVICE_ACCOUNT_JSON`

## Next Steps After Successful Deployment

1. ✅ Function is deployed and accessible
2. ✅ Environment variables are set
3. ✅ Test script passes
4. **Run bulk ingestion again** - it should now work!

