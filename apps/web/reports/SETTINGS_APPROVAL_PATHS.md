# SETTINGS_APPROVAL_PATHS

## Section gating matrix

| Section ID | Label | Requires auth? | Requires Pro? | Admin only? | Upgrade-to-Pro CTA | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `account` | Account & Profile | No | No | No | No | Always rendered via `renderSettingsSection('account')`. |
| `notifications` | Notifications | No | No | No | Yes (banner) | `NotificationsSection` reads `useProStatus` for Pro-only rows and renders `<UpgradeToProCTA variant="banner" />` when not Pro. |
| `display` | Display & Layout | No | No | No | Yes (inline when condensed view disables episode tracking) | Episode tracking gated for non-Pro when condensed view is on. |
| `pro` | Pro | No | No (controls respond to `useProStatus`) | No (except testing toggle) | Yes (button when not Pro) | Admin-only “Treat this device as Pro” when `useAdminRole().isAdmin`. |
| `data` | Data & Backups | No | No | No | No | Backup, restore, wipe — same for all visitors. |
| `about` | About | No | No | No | No | Static copy. |
| `admin` | Admin | Yes | No | Yes | No | Hidden unless `getVisibleSections(isAdmin)` includes admin. |

## Upgrade-to-Pro CTA placements

- **Notifications**: `<UpgradeToProCTA variant="banner" />` for non-Pro users.
- **Display**: inline CTA when condensed view blocks episode tracking for free users.
- **Pro**: button CTA until `useProStatus().isPro` is true.

## User-type summaries

- **Anonymous**: Same sections as signed-in guests except `Admin` is hidden. Upgrade CTAs in Notifications, Display, and Pro.
- **Authenticated Free**: Account form available; upgrade messaging in Notifications, Display, and Pro. Admin hidden unless admin role.
- **Authenticated Pro**: Pro headline and CTAs update; notification/display Pro features unlock.
- **Admin**: `Admin` section visible; optional “Treat this device as Pro” testing toggle in Pro section.
