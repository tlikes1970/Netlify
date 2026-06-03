# Quick Fix for Invalid API Key Error

## The Issue
You added environment variables in Netlify that are overriding the fallback values. If the values don't exactly match what was in production, you'll get `auth/invalid-api-key`.

## Solution Options:

### Option 1: Remove Netlify Environment Variables (Easiest)
1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Delete all the `VITE_FIREBASE_*` variables you just added
3. The app will use the hardcoded fallback values (which are what production has been using)
4. Trigger a new deployment or wait for it to redeploy

### Option 2: Verify the Values Match Exactly
The values you add to Netlify must **exactly** match the hardcoded fallback values:

```
VITE_FIREBASE_API_KEY=AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM
VITE_FIREBASE_AUTH_DOMAIN=flicklet-71dff.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flicklet-71dff
VITE_FIREBASE_STORAGE_BUCKET=flicklet-71dff.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1034923556763
VITE_FIREBASE_APP_ID=1:1034923556763:web:bba5489cd1d9412c9c2b3e
VITE_FIREBASE_MEASUREMENT_ID=G-YL4TJ4FHJC
```

Make sure there are no extra spaces, typos, or different values.

## Recommended: Remove the Netlify Variables
Since production was working fine with hardcoded values, and we added fallback values, you don't need to configure anything in Netlify. The fallback values will be used automatically and the app will work exactly as before.

