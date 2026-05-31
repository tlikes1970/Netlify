# Netlify Environment Variables Setup

## Problem

Build or runtime fails with `auth/invalid-api-key` when Firebase `VITE_*` variables are missing in Netlify.

## Solution

Add variables in the Netlify UI: **Site settings → Environment variables** (same keys as repo-root `.env.example`).

### Required (build + runtime)

```
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
TMDB_TOKEN=your_tmdb_v4_read_access_token
```

### Optional (by feature)

```
VITE_TMDB_KEY=your_tmdb_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM=noreply@yourdomain.app
GOOFS_INGESTION_ADMIN_TOKEN=your_admin_token
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

After changes, trigger a new deploy.

### Local development

Copy `.env.example` to `.env` at the repo root — do not commit `.env`. See [docs/ENV.md](docs/ENV.md).

### Note

`VITE_*` Firebase keys are embedded in the client bundle by design. Server-only secrets (`TMDB_TOKEN`, SendGrid, service accounts) must not be prefixed with `VITE_`.
