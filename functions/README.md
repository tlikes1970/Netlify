# Firebase Cloud Functions

Cloud Functions for secure administrator roles, Full Access grants and QA trial reset.

## Exports

| Function | Purpose |
|----------|---------|
| `manageAdminRole` | Callable — grant/revoke admin on other users |
| `manageProStatus` | Callable — server-authorized Full Access grant/revoke |
| `resetTrialEntitlement` | Callable (2nd gen, `us-central1`) — admin trial reset for QA test accounts |

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
| `check:insights` | Inspect Firestore insights |
| `clear:insights` | Clear insights (dev/admin) |
