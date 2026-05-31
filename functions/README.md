# Firebase Cloud Functions

Cloud Functions for admin access, Pro status, and goofs ingestion.

## Exports

| Function | Purpose |
|----------|---------|
| `setAdminRole` | HTTP — grant admin custom claim |
| `manageAdminRole` | Callable — grant/revoke admin on other users |
| `manageProStatus` | Callable — admin Pro/billing flags |
| `ingestGoofs` | Callable — admin TMDB goofs → Firestore insights |

## Setup

```bash
cd functions
npm install
npm run build
```

## Deploy

```bash
npm run deploy
# or
firebase deploy --only functions
```

## Local emulators

```bash
npm run serve
```

## Scripts

| Script | Purpose |
|--------|---------|
| `seed:titles` | Seed `/titles` for goofs pipeline |
| `check:insights` | Inspect Firestore insights |
| `clear:insights` | Clear insights (dev/admin) |
| `test:netlify` | Smoke-test Netlify goofs-fetch |
