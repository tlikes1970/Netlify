# Flicklet project instructions

## Version every implemented fix

For every implemented fix, increment the app's final version component by one
(the user's "hundredths place" rule), following the existing version format:
for example, `2.0.4` → `2.0.5` → `2.0.6`.

Update the user-visible `APP_VERSION` in `apps/web/src/version.ts` and keep other
existing release-version fields consistent. Include the version bump in the fix
commit so mobile builds can be distinguished using the version beside the
Flicklet logo. Read-only investigations do not require a version bump.
