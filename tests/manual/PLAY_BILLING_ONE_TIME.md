# Play Billing — One-Time Full Access (manual validation)

**Product ID (code + Play Console):** `flicklet_full_access`  
**Type:** Managed in-app product — **one-time / non-consumable** (INAPP, not subscription)  
**Package:** `com.TravisL.tvtracker`  
**Branch:** `simplify/try-before-buy-v1`

---

## Play Console setup

1. Open [Google Play Console](https://play.google.com/console) → **Flicklet** (`com.TravisL.tvtracker`).
2. **Monetize → Products → In-app products** (do **not** use Subscriptions for this unlock).
3. **Create product:**
   - Product ID: `flicklet_full_access` (must match exactly)
   - Name/description: Full Access one-time unlock (store listing should match app copy — no subscription wording)
   - **Purchase option:** One-time
   - **Product type:** Non-consumable (permanent unlock)
   - Status: **Active**
4. Deactivate or ignore legacy subscription SKUs (`pro_subscription_monthly`, `pro_subscription_yearly`) — app no longer references them.
5. **Monetization setup** and payments profile complete.

---

## Internal testing setup

1. **License testing:** Settings → License testing → add tester Gmail accounts.
2. **Build signed AAB/APK** from repo:
   ```bash
   npm run mobile:build
   npm run mobile:sync
   ```
   Release build via Android Studio (signing from `gradle.properties` if configured).
3. **Upload** to **Internal testing** track; roll out to testers.
4. Install from Play Store tester link (not sideloaded debug APK unless comparing).
5. **Netlify production** env:
   - `FIREBASE_SERVICE_ACCOUNT` — required for `POST /api/billing/validate` to write Firestore
   - TMDB/auth vars unchanged

---

## Code path (reference)

| Step | Component |
|------|-----------|
| Unlock CTA | `startProUpgrade()` → `proUpgrade.ts` |
| Native purchase | `BillingPlugin.java` (INAPP) |
| Validate | `netlify/functions/billing/validate.cjs` (stub; real Play API TODO) |
| Entitlement | Firestore `users/{uid}/billing/status` → `useProStatus` → `useEntitlements` |
| Success toast | `Purchase confirmed. Full Access unlocked.` |

---

## Active trial

- [ ] Sign in with tester account.
- [ ] Settings → Full Access shows trial messaging.
- [ ] Add/move show succeeds (full access during trial).
- [ ] **Unlock Full Access** CTA visible where expected.

---

## Forced read-only (expired trial)

- [ ] Backdate `flicklet.trial.v1` in WebView storage **or** use account with expired trial record:
  - `{ "userId": "<uid>", "startMs": <22+ days ago>, "version": 2 }`
- [ ] Library edit blocked; opens Full Access settings.
- [ ] **Export** / **Import backup** still work.
- [ ] Read-only banner/copy matches centralized strings.

---

## Purchase flow (one-time)

- [ ] Tap **Unlock Full Access**.
- [ ] Google Play shows **one-time** purchase UI (not monthly/yearly subscription plans).
- [ ] Complete test purchase (license tester).
- [ ] Toast: **Purchase confirmed. Full Access unlocked.**
- [ ] Logcat: `[Full Access]` success; no product-not-found for `flicklet_full_access`.
- [ ] Network: `POST https://flicklet.netlify.app/api/billing/validate` → 200.
- [ ] Firestore `users/{uid}/billing/status`:
  - `isPro: true`
  - `purchaseType: one_time`
  - `productId: flicklet_full_access`
  - `source: android`
- [ ] Editing works without waiting for long poll (immediate refresh via `pro-upgrade-success`).

---

## Reinstall flow

- [ ] Note Firestore shows paid status before uninstall.
- [ ] Uninstall app → reinstall from **internal testing** link.
- [ ] Sign in with **same** Google account.
- [ ] Full Access active without repurchasing (Firestore read).
- [ ] Optional: native `restorePurchases` queries INAPP only (no Settings button yet).

---

## Second Google account

- [ ] Sign out → sign in with **different** tester account.
- [ ] No Full Access unless that account purchased.
- [ ] Trial/read-only behavior independent per account.

---

## Sign-out / sign-in (same account)

- [ ] After purchase, sign out → sign in same account.
- [ ] Full Access still active (billing doc on server).

---

## Not in scope for this pass

- [ ] Real Google Play Developer API `purchases.products.get` validation
- [ ] Settings **Restore purchases** button (reinstall + Firestore is the v1 path)
- [ ] Web/iOS purchase flows

---

## Known limitations (document for testers)

- Server validation is a **stub** — do not treat as fraud-safe for production.
- Legacy subscription purchases in Play Console are **not** honored by current app code.
