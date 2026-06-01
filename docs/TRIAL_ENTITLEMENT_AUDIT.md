# Trial / Pro entitlement audit (simplify branch)

**Date:** 2026-05-31  
**Model:** 21-day full-access trial → paid Pro OR expired read-only (view + export)

## Phase 1 — Gate inventory

| File | Gate / copy | Feature | Was | Trial (active) | Expired (unpaid) | Risk |
|------|-------------|---------|-----|----------------|------------------|------|
| `TabCard.tsx` | Goofs / Extras / Advanced Notifications buttons | Card pro strip | Upgrade if not Pro | Open feature | Read-only toast / upgrade | High — fixed |
| `LibraryActions.tsx` | Same pro strip (mobile menu) | Library actions | Upgrade | Open | Blocked | High — fixed |
| `CompactOverflowMenu.tsx` | `proOnly` actions | Overflow menu | Upgrade | Execute | Blocked | High — fixed |
| `GoofsModal.tsx` | `!isPro` panel | Insights | Upgrade CTA | Load + show | Upgrade CTA | High — fixed |
| `ExtrasModal.tsx` | `!isPro` | BTS videos | Upgrade | Load | Upgrade | High — fixed |
| `BloopersModal.tsx` | `!isPro` | Bloopers | Upgrade | Load | Upgrade | Med — fixed |
| `NotificationSettings.tsx` | Pro timing / email | Notifications | Disabled + CTA | Full options | Blocked save | High — fixed |
| `ShowNotificationSettingsModal.tsx` | Email / timing | Per-show | Disabled | Enabled | Blocked | Med — fixed |
| `notifications.ts` | `isProUser()` | Notification manager | Block pro fields | Allow | Block updates | Med — fixed |
| `settingsSections.tsx` | Pro banner, condensed view, Pro section | Settings UX | Go Pro | Trial copy | Upgrade + export | Med — fixed |
| `UpgradeToProCTA.tsx` | All variants | Upgrade prompts | Always (non-Pro) | Hidden | Shown | Med — fixed |
| `ListSelectorModal.tsx` | List limit CTA | Custom lists | At cap | Unlimited trial | Block add | Med — fixed |
| `proConfig.ts` | `getMaxCustomLists()` | List cap | 3 free | Unlimited | 3 cap | Med — fixed |
| `TriviaGame.tsx` / `FlickWordGame.tsx` | `isPro` game caps | Games | 1 game | Pro limits | Block? (view only) | Low — full limits in trial |
| `customLists.ts` | create/update/delete | Lists | Cap / throw | Unlimited | Block | Med — fixed |
| `storage.ts` | upsert/move/remove/reorder/rating | Library | Open | Open | **guardMutation** | High — fixed |
| `settings.ts` | `saveSettings()` | Settings persist | Open | Open | **guardMutation** | High — fixed |
| `AdminExtrasPage.tsx` | `isPro` toggle | Admin | Unchanged | N/A | N/A | Low — admin only |
| `proStatus.ts` / `billing.ts` | Paid source of truth | Billing | Unchanged | + trial layer | Paid unlocks | Low |

## Central entitlement API

- `apps/web/src/lib/entitlements.ts` — `resolveEntitlements`, trial storage `flicklet.trial.v1`
- `apps/web/src/hooks/useEntitlements.ts` — React hook + sync cache
- `apps/web/src/lib/readOnlyGuard.ts` — mutation guard + toast
- `apps/web/src/components/TrialStatusBanner.tsx` — countdown under header

## Simulate expired trial (manual)

```js
// DevTools console while signed in (replace UID)
localStorage.setItem('flicklet.trial.v1', JSON.stringify({
  userId: 'YOUR_FIREBASE_UID',
  startMs: Date.now() - (22 * 24 * 60 * 60 * 1000)
}));
location.reload();
```

## Read-only gaps (follow-up)

- Episode progress / tab order / notification sync writes (Firebase) may still attempt background sync until those paths call `guardMutation`
- Destructive import / admin tools not gated
- Logged-out users: not read-only (local guest use unchanged)
