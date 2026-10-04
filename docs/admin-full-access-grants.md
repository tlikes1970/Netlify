# Administrator Full Access grants

Use Settings > Admin > Full Access grants. Enter an existing account's exact email or Firebase account ID, or choose **Use my account**, then choose **Grant Full Access** or **Revoke grant**. A confirmation identifies the account the server updated. Recipient accounts do not need administrator privileges.

The caller must have the Firebase Auth custom claim `role: admin`. Hiding the UI is not the authorization boundary: the callable verifies that claim before looking up the target or writing anything.

Release prerequisite: deploy the updated Firebase callable `manageProStatus` and ship the updated web/native application. This implementation task does not deploy either. An older deployed callable cannot process the new email/ID request contract.

The server writes only `users/{uid}/billing/adminGrant`, with `active`, `version: 1`, target `userId`, authenticated administrator `updatedBy`, and server `updatedAt`. Existing billing security rules restrict writes to administrators. Clients read only their own grant. Grant changes refresh recipient entitlement through a document listener, with the existing periodic refresh as fallback.

Verified Google Play purchases take precedence in presentation. A grant enables Full Access without representing a purchase. Revoking a grant does not revoke a purchase, reset a trial, remove Library content or change settings. Historical manual/isPro records remain inert; they are not automatically converted. Grants are not ordinary settings and are not backed up or restored with user settings. Account-scoped entitlement caches prevent transfer between signed-in accounts.

Manual production verification after deployment: grant yourself, verify Full Access features and administrator-granted wording; grant another account by email and check that account; revoke and check its appropriate trial/read-only fallback; verify a legitimately purchased account remains entitled after grant revocation; check sign-out/account switch and EN/ES presentation.
