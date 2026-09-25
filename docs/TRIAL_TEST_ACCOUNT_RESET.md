# Trial test account reset

> **Parent doc:** [ADMIN_OPERATIONS.md](./ADMIN_OPERATIONS.md) — Firebase project, trial schema, deployment status, and safety overview.

Admin-only procedures for resetting the **21-day Full Access trial** on designated test accounts.

Normal users receive **one lifetime trial per Firebase account**, stored at:

```text
users/{uid}/entitlements/trial
```

This document does **not** grant production users a way to reset their trial.

**Deployed (2026-06-04, project `flicklet-71dff`):**

- Firestore rules: `users/{uid}/entitlements/trial` — create-once for owner, update/delete admin-only
- Cloud Function: `resetTrialEntitlement` (`us-central1`, 2nd gen)

---

## What reset affects

| Affected | Not affected |
|----------|----------------|
| `users/{uid}/entitlements/trial` (`trialStartMs`, timestamps) | `users/{uid}/billing/status` (purchases) |
| Local cache `flicklet.trial.v1` on next app load (overwritten from server) | Library / lists / ratings |
| Trial days remaining / read-only vs full access | Settings, notifications, For You rows |

Purchased Full Access (`billing/status.isPro`) always overrides trial expiration.

---

## Reset steps

### Method 1: Admin CLI (recommended)

From repo `functions/` directory, with Firebase Admin credentials configured:

```bash
cd functions
npm run reset:trial -- <FIREBASE_UID>
```

Optional custom start timestamp (epoch ms):

```bash
npm run reset:trial -- <FIREBASE_UID> 1717200000000
```

Default: `trialStartMs = Date.now()` → fresh 21-day window from reset time.

Underlying script: `functions/scripts/reset-trial.ts`

### Method 2: Callable Cloud Function

Caller must have Firebase Auth custom claim `role === 'admin'`.

```js
const fn = firebase.functions().httpsCallable('resetTrialEntitlement');
await fn({ userId: '<FIREBASE_UID>' });
// Optional: await fn({ userId: '<UID>', trialStartMs: 1717200000000 });
```

Deploy (if not already live):

```bash
firebase deploy --only functions:resetTrialEntitlement
```

### Method 3: Manual Firestore (emergency only)

1. Open Firebase Console → Firestore → project `flicklet-71dff`.
2. Navigate to `users/{uid}/entitlements/trial`.
3. Set `trialStartMs` to desired epoch ms and `version` to `2`.
4. Set `updatedAt` / `resetAt` / `resetBy` for audit if editing by hand.

**Do not delete** `billing/status` unless intentionally testing purchase flows separately.

---

## Verification steps

1. Confirm document exists at `users/{uid}/entitlements/trial` with expected `trialStartMs`.
2. Sign in as the test user on a device (or **reinstall app first** to prove server persistence).
3. Header strip should show trial days remaining from the **reset** start date.
4. Mutations (add to Want, edit lists) should work during active trial.
5. Set `trialStartMs` to >21 days ago (admin reset or Firestore edit) → user enters **read-only**; export still works; purchase flow still works.
6. If user has `billing/status.isPro: true`, they remain Full Access regardless of trial.

### Simulate expired trial (QA)

**Preferred:** Admin reset with old `trialStartMs`, or edit Firestore doc directly.

Local-only UI hint (server doc must match for cross-device truth):

```js
// DevTools — signed in; Firestore value wins after sync
localStorage.setItem('flicklet.trial.v1', JSON.stringify({
  userId: 'YOUR_UID',
  startMs: Date.now() - (22 * 24 * 60 * 60 * 1000),
  version: 2
}));
location.reload();
```

---

## Safety notes

- **Never** expose reset in production UI or client-accessible APIs for normal users.
- Firestore rules: users **create** trial once; **update/delete** require admin claim.
- Use dedicated test Firebase accounts; avoid resetting real user UIDs in production.
- Reset does **not** revoke or grant billing — verify `billing/status` separately for purchase tests.
- Callable and script set `resetAt` / `resetBy` for QA audit trails.

---

## Offline behavior

If a signed-in user has **no server trial** and **no local cache**, and the device is offline:

- App stays **read-only** (conservative) until Firestore create succeeds.
- Once online, first successful sign-in creates the server trial once.

If local cache exists but server unreachable:

- Cached `trialStartMs` is used until server sync succeeds.

---

## Related files

- Client: `apps/web/src/lib/trialEntitlement.ts`, `apps/web/src/lib/entitlements.ts`, `apps/web/src/hooks/useEntitlements.ts`
- Rules: `firestore.rules` → `users/{userId}/entitlements/trial`
- Admin: `functions/src/resetTrialEntitlement.ts`, `functions/scripts/reset-trial.ts`
