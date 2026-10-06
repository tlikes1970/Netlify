# Trusted administrator bootstrap

There is no public `setAdminRole` function in the supported deployment. An ordinary Firebase sign-in cannot bootstrap administrator authority.

For the first administrator or recovery, a project operator with trusted Firebase Admin credentials runs the local script:

```powershell
cd functions
node grant-admin.js <existing-account-email>
```

Use Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS` configured securely for a service account with the required Firebase Authentication permissions. Never put that credential in the browser/mobile app or commit it. Firebase CLI login alone is not guaranteed to provide Admin SDK application-default credentials.

The script preserves all existing custom claims and changes only `role` to `admin`. Verify the account email before running it. The user must sign out and back in to obtain an updated Firebase ID token. Existing administrators can then use the admin-protected `manageAdminRole` callable for later role changes. Revocation preserves unrelated claims and continues rejecting self-demotion.

## Required production security rollout (not performed by implementation)

1. Delete the LIVE obsolete `setAdminRole` function in project `flicklet-71dff`, region `us-central1`. Removing its source/export alone does not delete the already deployed function. Verify it is absent and cannot grant claims.
4. Verify unauthenticated and ordinary-user denial, administrator grant/revoke, unrelated-claim preservation, Full Access grant by email/ID, and self-demotion denial in a controlled environment.
5. Because the previous public endpoint was active, separately review administrator assignments and privileged operations for unexpected changes. This repair does not automatically revoke existing administrator accounts or rotate credentials.

This guide does not authorize deployment, deletion of live functions, or changes to production account claims during the code repair.

## Local validation

Run `npm run test:security` from `functions` to build and test the production callable handlers and the Netlify ingestion authorization path. Firebase identity, account lookups, and database writes are mocked; these tests do not alter production users or content.
