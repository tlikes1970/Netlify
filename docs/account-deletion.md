# Account deletion

The public route is `https://flicklet.netlify.app/delete-account`. Settings → Account uses the same `deleteAccount` Firebase callable. Sign Out and Start Over retain their existing purposes and do not delete Firebase Authentication identities.

## Security and ordering

Only Firebase's verified callable identity supplies the target UID. The body contains `confirmation: "DELETE"`; no email, body UID or administrator assertion supplies authority. Authentication must be within five minutes and not precede the user's token-revocation timestamp.

Before cleanup, the server writes `accountDeletions/{uid}` with only `expiresAt`, 65 minutes in the future. Firestore rules block that UID's reads/writes/recreation while the timestamp is in the future, including administrator tokens. Server billing validation and administrator grant/trial operations also check the marker because their Admin SDK writes bypass rules. The trusted deletion callable remains permitted to finish. Expired markers have no authorization effect even if physical TTL cleanup is delayed.

The server removes username records, all purchase bindings owned by the UID and the recursively deleted `users/{uid}` tree. References identifying a deleted administrator on other users' grants/trial-reset records are anonymized, preserving the grant/trial. The marker is refreshed after cleanup, then Firebase Auth is deleted. Failures are not reported as success; cleanup is repeatable. A protected retry can finish after a lost response to Auth deletion.

No purchase-token fingerprint survives deletion. A purchase still bound to an existing account cannot transfer. After deletion, a new authenticated UID can bind only a freshly verified valid owned Google Play purchase. Play's original obfuscated account hint is not a permanent binding after the Flicklet binding has been deleted. Client caches, email and unverified tokens never grant access. Google Play transaction history remains outside Flicklet.

## Device cleanup and recovery

The client drains active tracked persistence and pauses writes before requesting deletion. It cancels Flicklet series reminders, then clears account content, progress, notifications, profile/access caches, recent searches and auth diagnostics. Device language/theme and shared provider/catalog caches are retained. Firebase signs out; native Google provider sessions are cleared without deleting the device's Google account. The application reloads signed out.

A local UID/confirmation journal routes an interrupted deletion back to recovery and prevents stale data saves. Confirmed server deletion can retry device cleanup without repeating the server operation. An ambiguous failure remains explicitly unconfirmed. An optional device-only cleanup signs out without claiming cloud deletion succeeded. Another currently signed-in UID is never silently cleared. Downloaded backup files remain user-controlled copies.

## Release gates (not performed by implementation)

- Deploy the Firebase callable and modified administrator functions, Firestore rules and indexes. Enable/verify the TTL policy on `accountDeletions.expiresAt`; authorization does not depend on prompt physical deletion.
- Deploy the web/public route and modified Netlify billing validator together with the updated rules/backend.
- Verify the runtime service account can delete Firebase Auth users and read/delete the mapped Firestore records; no new client credentials are required.
- Enter the public deletion URL in Google Play Console's account-deletion resource field.
- Use disposable accounts to verify Android Google/email reauthentication, cancellation, deletion, local reminders, interrupted recovery and clean signed-out startup; repeat on the public web page in EN/ES.
- On a real Play test track, verify deletion removes the old Flicklet purchase binding and a newly created account can reclaim only after fresh verification. Verify an existing undeleted binding still refuses transfer.
- Verify deletion from one device blocks old tokens on another device during the protection window. Offline copies on other devices and exported backup files cannot be erased remotely by this client flow.

Tests use mocks and an isolated Firestore emulator. They do not delete production accounts, prove deployment, or replace real Android/Google Play testing.

## Scoped files

- `android/gradle.properties`
- `package.json`
- `package-lock.json`
- `apps/web/package.json`
- `apps/web/package-lock.json`
- `apps/web/src/version.ts`
- `apps/web/public/privacy.html`
- `apps/web/src/boot/appBootstrap.tsx`
- `apps/web/src/components/settingsSections.tsx`
- `apps/web/src/components/DeleteAccountControl.tsx`
- `apps/web/src/components/__tests__/DeleteAccountControl.test.tsx`
- `apps/web/src/lib/accountDeletion.ts`
- `apps/web/src/lib/accountDeletionCopy.ts`
- `apps/web/src/lib/accountDeletionState.ts`
- `apps/web/src/lib/accountReauthentication.ts`
- `apps/web/src/lib/restoreBarrier.ts`
- `apps/web/src/lib/googleAuthNative.ts`
- `apps/web/src/lib/authLog.ts`
- `apps/web/src/lib/__tests__/accountDeletion.test.ts`
- `apps/web/src/lib/__tests__/accountDeletionBarrier.test.ts`
- `apps/web/src/lib/__tests__/accountReauthentication.test.ts`
- `apps/web/src/lib/__tests__/googleAuthNative.test.ts`
- `apps/web/src/pages/DeleteAccountPage.tsx`
- `apps/web/src/pages/__tests__/DeleteAccountPage.test.tsx`
- `apps/web/tests/account-deletion.spec.ts`
- `functions/src/accountDeletion.ts`
- `functions/src/deletionProtection.ts`
- `functions/src/index.ts`
- `functions/src/manageAdminRole.ts`
- `functions/src/manageProStatus.ts`
- `functions/src/resetTrialEntitlement.ts`
- `functions/tests/account-deletion.test.cjs`
- `functions/tests/account-deletion.emulator.cjs`
- `functions/tests/admin-authorization.test.cjs`
- `firestore.rules`
- `firestore.indexes.json`
- `netlify/functions/billing/validate.cjs`
- `tests/server/full-access.test.cjs`
- `tests/server/account-deletion-rules.test.cjs`
- `docs/account-deletion.md`
