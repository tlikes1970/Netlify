# Flicklet project instructions

## Version every implemented fix

For every implemented fix, increment the app's final version component by one
(the user's "hundredths place" rule), following the existing version format:
for example, `2.0.4` → `2.0.5` → `2.0.6`.

Update the user-visible `APP_VERSION` in `apps/web/src/version.ts` and keep other
existing release-version fields consistent. Include the version bump in the fix
commit so mobile builds can be distinguished using the version beside the
Flicklet logo. Read-only investigations do not require a version bump.

## Keep the normal build checkout current

The normal build checkout is `C:\Users\Likes\Side Projects\TV Tracker\Netlify`.
Completed fixes must be available there before handing them back for mobile
builds. If implementation uses an isolated worktree, bring the completed commits
into the normal checkout while preserving unrelated local changes. Verify that
its app version and Android versionCode match the delivered fix. Do not push,
deploy, or run mobile:sync unless the user authorizes those actions.
