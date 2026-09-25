# Firebase Cloud Functions

Cloud Functions for admin access, Pro status, trial reset, and goofs ingestion.

## Exports

| Function | Purpose |
|----------|---------|
| `setAdminRole` | HTTP — grant admin custom claim |
| `manageAdminRole` | Callable — grant/revoke admin on other users |
| `manageProStatus` | Callable — admin Pro/billing flags |
| `resetTrialEntitlement` | Callable (2nd gen, `us-central1`) — admin trial reset for QA test accounts |
| `ingestGoofs` | Callable — admin TMDB goofs → Firestore insights |

## Admin scripts

| Script | Command |
|--------|---------|
| Reset trial | `npm run reset:trial -- <FIREBASE_UID> [trialStartMs]` |

See [docs/ADMIN_OPERATIONS.md](../docs/ADMIN_OPERATIONS.md) and [docs/TRIAL_TEST_ACCOUNT_RESET.md](../docs/TRIAL_TEST_ACCOUNT_RESET.md).

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
