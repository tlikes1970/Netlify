# Flicklet Admin Operations

**Last updated:** 2026-06-04  
**Firebase project:** `flicklet-71dff`

Operational reference for trial entitlements, billing, admin functions, and QA resets.  
For architecture context see [CURRENT_ARCHITECTURE.md](../CURRENT_ARCHITECTURE.md). For open product issues see [KNOWN_ISSUES.md](../KNOWN_ISSUES.md).

> **Historical note:** [O_AND_M_MANUAL.md](./O_AND_M_MANUAL.md) (Jan 2025) describes legacy community/email infrastructure. Use **this document** for current trial, billing, and admin function operations.

---

## Firebase project

| Item | Value |
|------|--------|
| **Project ID** | `flicklet-71dff` |
| **Console** | https://console.firebase.google.com/project/flicklet-71dff/overview |
| **Functions region** | `us-central1` |
| **Firestore rules file** | `firestore.rules` (repo root) |

---

## Trial entitlement system

### Authoritative Firestore path

```text
users/{uid}/entitlements/trial
```

### Schema

| Field | Type | Notes |
|-------|------|--------|
| `trialStartMs` | int | Epoch ms when lifetime trial started |
| `version` | int | `2` (current) |
| `createdAt` | server timestamp | Set on first create |
| `updatedAt` | server timestamp | Updated on admin reset |
| `resetAt` | server timestamp | Optional — admin reset audit |
| `resetBy` | string | Optional — admin UID or `admin-script` |

### Local cache (not authoritative)

`localStorage` key `flicklet.trial.v1` — `{ userId, startMs, version }` — cache only; **Firestore wins** on sign-in.

### Business rules

- One Firebase account receives **one lifetime** 21-day Full Access trial.
- Trial survives **reinstall**, **sign-out/sign-in**, and **device changes** (server-backed).
- **Guest users do not receive a trial** (sign-in required).
- After 21 days without purchase: **read-only** mode (mutations blocked).
- Read-only users can still **view**, **export**, and **purchase** Full Access.
- **Full Access purchase** (`billing/status.isPro`) overrides trial expiration.
- Trial reset is **admin/test-only** — not available in production UI.

### Client code (reference)

| Module | Role |
|--------|------|
| `apps/web/src/lib/trialEntitlement.ts` | Firestore read/create/migrate |
| `apps/web/src/lib/entitlements.ts` | `resolveEntitlements`, read-only logic |
| `apps/web/src/hooks/useEntitlements.ts` | React hook + cache sync |
| `apps/web/src/lib/readOnlyGuard.ts` | Mutation blocking when read-only |

### Firestore security rules (deployed)

Under `users/{userId}/entitlements/{docId}`:

- **Read:** owner only
- **Create:** owner once (`docId == 'trial'`, `version == 2`, valid `trialStartMs`)
- **Update/delete:** admin only (`request.auth.token.role == 'admin'`)

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

**Status (2026-06-04):** Rules released to `flicklet-71dff`.

---

## Billing / Full Access (unchanged)

Purchased access is separate from trial and remains account-bound.

| Item | Path / detail |
|------|----------------|
| **Firestore doc** | `users/{uid}/billing/status` |
| **Client read** | `apps/web/src/lib/billing.ts` → `getBillingStatus()` |
| **Paid flag** | Verified version-2 Play ownership; unverified legacy paid flags are ignored |
| **Override** | Paid status wins over expired trial in `useEntitlements` |
| **Validation** | `POST /api/billing/validate` — Firebase identity + real Play ProductPurchaseV2 validation, account binding and acknowledgement |

Current security/configuration/recovery contract: [Full Access purchase and recovery](./FULL_ACCESS_PURCHASE_RECOVERY.md).

Manual billing QA: [tests/manual/PLAY_BILLING_ONE_TIME.md](../tests/manual/PLAY_BILLING_ONE_TIME.md)

---

## Trial reset for test accounts

**Full procedure:** [TRIAL_TEST_ACCOUNT_RESET.md](./TRIAL_TEST_ACCOUNT_RESET.md)

Normal users **cannot** reset trial via uninstall, reinstall, sign-out, local storage clear, or client manipulation.

### Callable function (deployed)

| Item | Value |
|------|--------|
| **Name** | `resetTrialEntitlement` |
| **Region** | `us-central1` |
| **Generation** | 2nd gen |
| **Auth** | Caller must have custom claim `role === 'admin'` |

Deploy:

```bash
firebase deploy --only functions:resetTrialEntitlement
```

**Status (2026-06-04):** Function created on `flicklet-71dff`.

Callable example (admin-authenticated client):

```js
const fn = firebase.functions().httpsCallable('resetTrialEntitlement');
await fn({ userId: '<FIREBASE_UID>' });
// Optional custom start: await fn({ userId: '<UID>', trialStartMs: 1717200000000 });
```

### Admin CLI (recommended for local QA)

From repo `functions/` with Firebase Admin credentials:

```bash
cd functions
npm run reset:trial -- <FIREBASE_UID>
```

Optional epoch ms start:

```bash
npm run reset:trial -- <FIREBASE_UID> 1717200000000
```

Default: `trialStartMs = Date.now()` → fresh 21-day window from reset time.

### What reset affects

| Affected | Not affected |
|----------|----------------|
| `users/{uid}/entitlements/trial` | `users/{uid}/billing/status` |
| Trial days / read-only vs full access | Library, lists, ratings, settings |

---

## Admin Cloud Functions (current)

| Function | Type | Purpose |
|----------|------|---------|
| `setAdminRole` | Callable | Grant admin claim to self |
| `manageAdminRole` | Callable | Grant/revoke admin on others |
| `manageProStatus` | Callable | Admin billing/settings Pro flags |
| `resetTrialEntitlement` | Callable (2nd gen) | Reset trial for QA test accounts |
| `ingestGoofs` | Callable | Admin TMDB goofs → Firestore insights |

See [functions/README.md](../functions/README.md) for build/deploy.

### Admin scripts (Firebase Admin SDK)

| Script | Command |
|--------|---------|
| Reset trial | `npm run reset:trial -- <uid> [trialStartMs]` |
| Set Pro (legacy settings path) | `npx ts-node --project tsconfig.json scripts/set-pro-status.ts <uid> true\|false` |

Prefer **`resetTrialEntitlement`** / **`reset:trial`** for trial QA — not Pro status toggles.

---

## Deployment notes (2026-06-04)

Completed deploys:

```bash
firebase deploy --only firestore:rules
firebase deploy --only functions:resetTrialEntitlement
```

Informational warnings observed during function deploy:

- **Node.js 20** runtime deprecated 2026-04-30; decommission **2026-10-30** — plan upgrade before then.
- **`firebase-functions`** package reported outdated — upgrade when convenient (may include breaking changes).

---

## Manual QA checklists

| Doc | Scope |
|-----|--------|
| [tests/manual/TRIAL_REMINDERS_PRO_UX_SMOKE.md](../tests/manual/TRIAL_REMINDERS_PRO_UX_SMOKE.md) | Trial banner, reminders, read-only UX |
| [tests/manual/PLAY_BILLING_ONE_TIME.md](../tests/manual/PLAY_BILLING_ONE_TIME.md) | Play INAPP purchase, reinstall, billing doc |
| [docs/TRIAL_ENTITLEMENT_AUDIT.md](./TRIAL_ENTITLEMENT_AUDIT.md) | Gate inventory (May 2026; see header for staleness) |

Automated entitlement tests:

```bash
cd apps/web
npm test -- --run src/lib/__tests__/entitlements.test.ts src/lib/__tests__/trialEntitlement.test.ts
```

---

## Verify trial persistence (smoke)

1. Sign in as test user → note `users/{uid}/entitlements/trial` in Firestore Console.
2. Uninstall app → reinstall → sign in same account → **same** `trialStartMs`, days remaining unchanged.
3. Sign out → sign in → **same** trial (local cache cleared on sign-out; server restores).
4. Second device, same account → **same** trial start.
5. Admin reset test account → fresh 21-day window; `resetAt` / `resetBy` populated.

---

## Safety

- Use **dedicated test Firebase accounts** for resets — never reset production user UIDs casually.
- Reset does **not** grant or revoke purchased Full Access — check `billing/status` separately.
- Do **not** expose trial reset in production UI.
