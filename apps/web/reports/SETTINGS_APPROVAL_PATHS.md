# SETTINGS_APPROVAL_PATHS

## Section gating matrix

| Section ID | Label | Requires auth? | Requires Pro? | Admin only? | Upgrade-to-Pro CTA | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `account` | Account & Profile | No | No | No | No | Always rendered via `renderSettingsSection('account')`; no gating beyond the general settings store. |
| `notifications` | Notifications | No | No | No | Yes (banner) | `NotificationsSection` reads `useProStatus` to show Pro-only rows (custom timing, email) and renders `<UpgradeToProCTA variant="banner" />` when `isPro` is `false`. |
| `display` | Display & Layout | No | No | No | Yes (inline when condensed view disables episode tracking) | `Episode Tracking` checkbox is disabled when `settings.layout.condensedView` is `true` and `useProStatus().isPro` is `false`; a `<UpgradeToProCTA variant="inline" />` sentence appears for non-Pro users while the inline explanation switches to a success note for Pro members. |
| `community` | Community | No (but some content does) | No | No | No | The `Weekly Email Digest` card, toggle, and copy are wrapped in `isAuthenticated && (...)`, so anonymous viewers see only the static topic-following placeholder but no subscription controls. |
| `pro` | Pro | No | No (controls inside respond to `useProStatus`) | No (except the testing toggle) | Yes (button inside Pro panel when not Pro) | `ProSection` uses `useProStatus` to toggle the headline between “Upgrade to Flicklet Pro” and “You are a Pro User!”, hides `<UpgradeToProCTA variant="button" />` once `isPro` is `true`, and renders the “Treat this device as Pro (Alpha / Testing)” checkbox only when `useAdminRole().isAdmin` is `true`. `settingsManager.updateProStatus` is wired to that admin toggle, and the `PRO_FEATURES_AVAILABLE/COMING_SOON` lists only render when `settings.pro.isPro` is `true`. |
| `data` | Data & Backups | No | No | No | No | Backup, restore, and wipe flows are not gated; they rely on localStorage/file dialogs and show the same buttons to every visitor. |
| `about` | About | No | No | No | No | Static copy describing the app. |
| `admin` | Admin | Yes (must eventually authorize) | No | Yes | No | `SettingsSheet` calls `getVisibleSections(isAdmin)` to drop this button for non-admins, and `AdminSection` returns `null` until `useAdminRole().loading` is `false` and `isAdmin` is `true`. When visible it lazily renders `AdminExtrasPage`. |

## Upgrade-to-Pro CTA placements

- **Notifications**: always renders `<UpgradeToProCTA variant="banner" />` so anonymous/free audiences see the CTA right under the bugs list; Pro users don’t see that component because `useProStatus().isPro` short-circuits to `null`.
- **Display**: when condensed view is on and the user is not Pro, the inline copy embeds `<UpgradeToProCTA variant="inline" />`; Pro users see a success message instead.
- **Pro**: the hero panel headline says “Upgrade to Flicklet Pro” and renders `<UpgradeToProCTA variant="button" />` for non-Pro users; once `useProStatus().isPro` flips to `true`, the heading switches to “You are a Pro User!” and the CTA disappears.

## User-type summaries

- **Anonymous (not signed in)**: Sees the same section list as signed-in guests except the `Admin` button is absent because `useAdminRole().isAdmin` is `false`. `Community` shows only the static cards (no weekly digest toggle). `Notifications` and `Display` still expose upgrade CTAs that explain why pro unlocks custom timing/episode tracking, and the `Pro` section invites the visitor to upgrade. Admin-only toggles (like “Treat this device as Pro”) are hidden.
- **Authenticated Free user**: Gains the authenticated-only cards inside `Community` (weekly digest toggle) and can operate the account form, but still only sees the upgrade messaging in `Notifications`, `Display`, and `Pro`. The `Admin` row still stays hidden because `useAdminRole().isAdmin` remains `false`.
- **Authenticated Pro user**: The `Pro` section headline flips to “You are a Pro User!”, all `<UpgradeToProCTA />` instances vanish, the Notifications summary reflects “Custom (Pro)” timing, and the Display `Episode Tracking` toggle stays enabled even in condensed view. Admin-only sections/toggles are still absent unless `useAdminRole().isAdmin` also becomes `true`.
- **Admin user**: `getVisibleSections(isAdmin)` exposes the `Admin` button and `AdminSection` renders `AdminExtrasPage`. The `Pro` section still respects `useProStatus().isPro` for its headline, and because `useAdminRole().isAdmin` is `true` it now renders the “Treat this device as Pro (Alpha / Testing)” checkbox wired to `settingsManager.updateProStatus`. Admins typically verify this toggle while the rest of the UI (notifications, display, data, about) follows the same rules as the Pro tier.








