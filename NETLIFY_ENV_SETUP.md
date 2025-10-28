# Netlify Environment Variables Setup

## Problem
The build is failing with `auth/invalid-api-key` because Firebase environment variables are not configured in Netlify.

## Solution
Add these environment variables to your Netlify site:

### Steps:
1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site Settings** > **Environment Variables**
4. Click **Add variable** and add each of the following:

### Required Variables:
```
VITE_FIREBASE_API_KEY=AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM
VITE_FIREBASE_AUTH_DOMAIN=flicklet-71dff.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flicklet-71dff
VITE_FIREBASE_STORAGE_BUCKET=flicklet-71dff.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1034923556763
VITE_FIREBASE_APP_ID=1:1034923556763:web:bba5489cd1d9412c9c2b3e
VITE_FIREBASE_MEASUREMENT_ID=G-YL4TJ4FHJC
```

### Also Ensure You Have:
```
VITE_TMDB_KEY=your_tmdb_key
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM=your_email
TMDB_TOKEN=your_tmdb_token
```

5. After adding all variables, trigger a new deployment (or wait for next git push)

### Note
These variables are used at build time and embedded into the JavaScript bundle. They are safe to expose as they're meant for client-side Firebase initialization.

