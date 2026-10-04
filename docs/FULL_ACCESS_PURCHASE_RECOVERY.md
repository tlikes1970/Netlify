# Full Access purchase and recovery (#31)

## Authority and migration
Full Access is a one-time, non-consumable Google Play product (`flicklet_full_access`) for Android package `com.TravisL.tvtracker`. Firebase identity is verified server-side. The first verified ownership is durably bound to that UID; it cannot silently transfer to another account.

There are no known paying customers. Historical unverified `isPro`, purchased, manual and development billing records remain historical data but do not grant purchased access. A successful verified upgrade preserves the prior billing snapshot in the private ownership ledger. Legitimate account trial metadata is independent and unchanged.

Only server billing documents with verified version-2 ownership markers grant purchased access. Client billing writes and private ownership-ledger reads/writes remain forbidden by Firestore rules. Tokens are stored only in the private `playPurchases` ledger, not normal client-readable billing documents or backups.

## Required production configuration
- Netlify function environment `FIREBASE_SERVICE_ACCOUNT`: JSON service-account credentials for the production Firebase project. Keep private/server-side; Firebase Admin verifies current ID tokens including revocation.
- Netlify function environment `GOOGLE_PLAY_SERVICE_ACCOUNT`: JSON containing `client_email` and `private_key` for a service account authorized in Google Play Console for this app and purchase verification/acknowledgement. Enable Google Play Android Developer API in that credential project.
- Publish/configure the one-time product `flicklet_full_access` in the correct Play application. Use a Play test track and licensed testers before customer release.
- Deploy the flat Netlify `billing-validate` function and existing `/api/billing/validate` redirect, plus reviewed Firestore rules. Deployment is a separate authorized operation; this task does not deploy.

Missing credentials or provider errors fail closed. There is no production development bypass. Package/product IDs are fixed server-side. Price and currency come from Play ProductDetails, not hard-coded prices.

## Flow
Native Billing 8 queries eligible buy offers, binds launch to an obfuscated initiating UID, and distinguishes pending/cancelled/completed purchases. The client sends a refreshed Firebase ID token and purchase token. The server verifies ProductPurchaseV2 purchase/product/payment/quantity/consumption state, reserves ownership transactionally, acknowledges when needed, then writes verified entitlement. It never consumes the product. Failed acknowledgement is recoverable by validating the same ownership again, not reported as a clean success.

Android exposes Restore Purchases, including for purchased accounts and active trials. Sign-in/startup/foreground reconciliation uses the same secure validation path. If Play lists no device-owned purchase, an already-bound account can revalidate its private server token. Different-account ownership fails with recovery guidance. Account changes invalidate client caches and stale asynchronous results.

Web/PWA honors server entitlement and explains Android purchase/restore; it presents no fake checkout or Restore button. Account-associated trial remains 21 days, with expiry refreshed at day boundaries and on resume. Protected settings, episode progress and series reminder mutations guard before state changes.

## Verification gates
Automated tests mock Play/Firebase server responses and native purchase boundaries; Firestore rules are exercised in a local emulator. These cannot prove actual Play configuration or device billing behavior.

Before release, verify on a licensed Play test-track device: live price/product availability; active-trial purchase; cancellation; pending-to-completed recovery; acknowledgement; app interruption; reinstall/clear-data/second-device restore; same-account idempotency; different-account refusal; account switch during purchase; offline/provider failure; refund/revocation detected at reconciliation; EN/ES and expired read-only behavior. Check physical Android notification scheduling and app-resume trial expiry.

Authoritative cancelled/refunded/no-longer-owned responses revoke matching ownership on reconciliation. Continuous refund monitoring/RTDN is not introduced; a cached web entitlement may remain until Android/server revalidation. Server verification and credential configuration plus real Play testing remain release gates.

Backup/restore excludes purchase/trial/auth authority. Start Over and Reset Settings preserve server billing/trial authority. No paying-customer migration is needed under the approved policy.
