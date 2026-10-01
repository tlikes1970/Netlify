# Flicklet #4 — Preferred Name

Implemented for 2.0.7 / Android versionCode 12, from verified baseline 2.0.6 / 11.

## Authoritative value and persistence

`users/{uid}.settings.preferredName` is the sole authoritative Flicklet preferred
name. It is private, non-unique, and separate from `settings.username`, the global
`usernames/{handle}` reservation collection, provider identity, and
`profile.displayName`. The existing username field cannot safely be repurposed
because the handle reservation flow still uses it.

`lib/preferredName.ts` owns account-scoped shared state and Firestore persistence.
`hooks/usePreferredName.ts` exposes that state to every consumer. Saves trim outer
whitespace, allow spaces/punctuation, require a nonempty name, and limit newly
entered names to 100 characters. A dotted Firestore update writes only
`settings.preferredName`. No username availability check, reservation, or Firebase
Auth profile update occurs. General Settings sync now also uses dotted updates so
it cannot replace this independently saved field with a stale settings map.

## Existing users

An existing string-valued `settings.preferredName` always wins, including an
explicit empty string. Otherwise the migration resolves a nonempty
`settings.username` marked `usernamePrompted`, the marker set by both the historical
“What should we call you?” prompt and its Settings editor. If absent, it resolves
the legacy user-entered `settings.displayName`, excluding default placeholders
Guest, User, and Flicklet User. It never reads Auth/provider `displayName`,
`profile.displayName`, email, or a name from another account's local storage.

The legacy field mixed prompt-answer and handle semantics, so historical answers
cannot be distinguished more precisely with the current model. Migration copies
the marked answer and leaves its old handle/reservation untouched. An unmarked
handle alone is not used. Future name edits never write back to these legacy fields.

Migration uses a transaction: a preferred name written by another device during
migration is retained. Reads and saves from a previous account cannot publish into
the next account. Failed reads do not trigger a prompt over unknown existing data;
Settings offers retry, and the existing post-document-creation auth notification
retries initial document-not-ready failures without changing the auth flow.

## Prompt, Settings, and Home

`FlickletHeader` opens `PreferredNamePromptModal` for a signed-in user with a
successfully loaded but missing preferred name. Its title is “What should we call
you?” It renders the same `PreferredNameEditor` used by the Account Settings
section. Successful persistence updates shared state immediately and closes the
prompt. A save failure leaves the prompt available for retry. “Not now”, Escape,
and Android Back dismiss only for the current sign-in; they do not establish a
name or permanently suppress the prompt. Returning users with a name are not
prompted. There is no authentication-identity suggestion or input default.

The desktop and mobile Account Settings section both render `PreferredNameEditor`.
Changing Travis to TJ updates the same Firestore field and all shared consumers.
The existing #3 AccountButton, AuthModal, authentication services, and logout flow
are unchanged.

`HomeGreeting` is mounted in the existing header/banner area below the trial banner
and above navigation, only on Home outside active search and screenshot mode. It
renders only for a signed-in user with a loaded preferred name. Signed-out and
missing-name states show no personalized greeting. It consumes no identity or
handle fallback. The other personality banner also receives only preferredName.

## Personality findings and #29

The original eight personalities remain in `apps/web/src/data/personalities.ts`:
Valley Girl, Detective Noir, Sports Announcer, Zen, Surfer, Medieval Bard, Grumpy
Old Man, and Fantasy Wizard. Each has three `welcome` variants. The existing
`getPersonalityText` selector and session-stable variant cache are functional;
`settings.personality` still stores the selected personality (default Zen).

#4 reconnects this selector and unchanged welcome copy using preferredName as the
value of the historical `{username}` template token. It does not read a username
to populate that token. Substitution treats dollar characters literally. The
neutral `Hello, {preferredName}` fallback remains only for an empty selector result.

A second, currently active personality-level system (Minimal/Standard/Maximum)
lives in `lib/flickletPersonality.ts`, `data/flickletPersonalityPhase2.ts`, and
`data/flickletContent.ts`. The Settings selector controls those levels, while the
original eight-personality selection no longer has an active chooser. #29 still
needs to define/reconcile the personality selection UX, the relationship between
the eight stored personas and the three levels, and the greeting-preview behavior.
#4 does not rebuild either system or rewrite their copy.

## Versions and validation

Updated APP_VERSION, root/web package manifests and their root lockfile version
entries, and Android VERSION_NAME/VERSION_CODE: **2.0.6 / 11 → 2.0.7 / 12**.

- 120 tests passed across 14 focused/regression Vitest files, including 27
  preferred-name tests, Settings sync preservation, all eight greetings, and #3
  account/auth/native Google regressions.
- 15 browser tests passed: ten #3 account-control cases plus five preferred-name
  workflows at 320/360/390/768/1280 pixels, using production CSS and Chrome.
  Auth and Firestore boundaries are mocked; these tests do not contact live OAuth
  or Firestore accounts.
- Typecheck passed. Repository lint: zero errors, 568 existing warnings. New
  workflow and browser/test files: zero lint errors or warnings.
- `npm run web:build` and `npm run mobile:build` passed. Mobile build here means
  the repository's Vite mobile-mode build; it is not a Gradle APK/emulator test.
  Existing browser-data and mixed dynamic/static import build warnings remain.
- No push, deployment, or `mobile:sync` was performed.
