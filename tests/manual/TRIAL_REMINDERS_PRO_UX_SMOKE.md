# Trial, Watch Reminders & Pro UX — Manual Smoke Checklist

**Branch:** `simplify/try-before-buy-v1`  
**Scope:** 21-day full-access trial, read-only after expiry, Watch Reminders routing, Pro/purchase settings messaging  
**Related commits:** `fba43fa` (UX alignment), `c252cd1` (trial start fix + read-only → Pro settings)  
**Environment:** `npx netlify dev` at repo root → http://localhost:8888  
**Automated:** `npm test -- --run src/lib/__tests__/entitlements.test.ts` (from `apps/web`)  
**Date:** _______________  
**Tester:** _______________  
**Browser / device:** _______________

Mark each: **P** Pass · **F** Fail · **B** Blocked · **N/A**

---

## What changed (test focus)

| Area | Expected behavior |
|------|-------------------|
| Trial start | Fresh 21-day window at first sign-in on this device; legacy expired backfills reset once (v2 record) |
| Active trial | Full access; reminders open settings/modal — **not** upgrade paywall |
| Expired trial | Library read-only; reminders blocked → **Settings → Pro** (purchase section), not a fleeting toast |
| Pro screen | Transparent support copy (~$5, hosting, no ads, export always available) |
| Wording | “Watch Reminders” / “Reminder Settings” — no “Go Pro for notifications” during trial |

---

## Setup

- [ ] On branch `simplify/try-before-buy-v1`, latest from `origin`
- [ ] Root `.env` with Firebase `VITE_*` (and `TMDB_TOKEN` for library/search checks)
- [ ] `npx netlify dev` running; http://localhost:8888 loads
- [ ] DevTools → **Console** + **Application → Local Storage** open
- [ ] At least two test contexts:
  - **A:** Google account used before this trial work (older Firebase account)
  - **B:** Fresh account or incognito (optional)
- [ ] Optional: run automated entitlements tests (should be 7/7 pass)

```bash
cd apps/web
npm test -- --run src/lib/__tests__/entitlements.test.ts
```

---

## Debug helpers (local only)

| Goal | Steps |
|------|--------|
| Inspect trial record | Local Storage key `flicklet.trial.v1` — JSON `{ userId, startMs, version }` |
| Force fresh trial | Remove `flicklet.trial.v1` for your UID, sign out/in, or use v1 expired record then reload (migration resets once) |
| Simulate expired trial | Set `startMs` to >21 days ago, `version: 2`, reload while signed in |
| Clear entitlements cache | Hard refresh after changing storage |

**Do not** use these on production user data you care about without understanding export/backup.

---

## 1. Trial banner (signed in)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 1.1 | Sign in with test account **A** (older account) | Header shows trial strip (days remaining), not “trial ended” | |
| 1.2 | Text on banner | Mentions full-access trial + optional “upgrade anytime” (active trial) | |
| 1.3 | Sign in as **paid Pro** (if available) | Banner hidden or no “trial ended” message | |
| 1.4 | Signed out | No trial-ended / read-only banner | |

---

## 2. Fresh trial for existing users (regression for c252cd1)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 2.1 | Account **A**: before test, note `flicklet.trial.v1` or delete it | — | |
| 2.2 | Sign in | New or migrated record: `version: 2`, `startMs` ≈ now (not account creation date from years ago) | |
| 2.3 | `resolveEntitlements` behavior (UI) | Can add/move library items; not read-only | |
| 2.4 | Trial days remaining | Roughly 21 → 20 after a day (not 0 on first login) | |

---

## 3. Watch Reminders — active trial (must not upsell)

Test on **Watching** tab card overflow / actions (desktop and mobile if applicable).

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 3.1 | Open card menu → **Watch Reminders** | Opens per-show reminder modal/sheet (not Stripe/upgrade flow) | |
| 3.2 | **No** quick toast | Does **not** say “trial ended / read-only” during active trial | |
| 3.3 | Label | “Watch Reminders” (not “Advanced Notifications” + lock) | |
| 3.4 | Compact overflow menu (mobile) | Same: opens reminders, no Pro lock on notification row | |
| 3.5 | Settings → **Watch Reminders** section → Reminder Settings | Modal opens; device-oriented copy (in-app + push); **no** email digest UI | |
| 3.6 | Settings reminders section | **No** upgrade banner while trial active | |
| 3.7 | Push permission “default” | “Enable device notifications” (not “Go Pro”) | |

---

## 4. Pro / purchase settings copy (active trial)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 4.1 | Settings → **Pro** | Headline along lines of “fully unlocked for your trial” | |
| 4.2 | Body copy | Mentions 21-day trial, read-only after, export always, ~$5 one-time, hosting/TMDB/Firebase, no ads/subscriptions | |
| 4.3 | Tone | Supportive / transparent — not “unlock elite premium powers” | |
| 4.4 | Feature list | “Watch Reminders” (not “Advanced Notifications” + email) | |
| 4.5 | During active trial | Soft optional upgrade note OK; primary CTA not aggressive on every screen | |

---

## 5. Expired trial — read-only + Pro navigation

**Prep:** Simulate expired trial (see Debug helpers) or use account past 21 days with v2 record.

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 5.1 | Banner | “Trial ended” / read-only messaging | |
| 5.2 | Add show from search | Blocked or read-only guard; no silent data loss | |
| 5.3 | Move/remove library item | Blocked with read-only behavior | |
| 5.4 | **Watch Reminders** on card | Does **not** open reminder modal | |
| 5.5 | **Watch Reminders** when blocked | Opens **Settings → Pro** section (purchase/support) | |
| 5.6 | **No** reliance on toast only | User lands on Pro tab to read pricing/support (toast optional/absent) | |
| 5.7 | Settings → Pro | Upgrade CTA visible; export still mentioned | |
| 5.8 | Data export path | Still reachable (Settings → Data or documented export) | |

---

## 6. Goofs / Extras / games (trial vs expired)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 6.1 | Active trial: **Goofs** / **Extras** | Opens content or modal (not hard paywall at first click) | |
| 6.2 | Expired: **Goofs** / **Extras** | Upgrade or read-only path (consistent with entitlements) | |
| 6.3 | Notifications vs extras | Reminders behave differently from Goofs (reminders = core during trial) | |

---

## 7. Paid Pro (if test account available)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 7.1 | Pro user: Watch Reminders | Opens normally | |
| 7.2 | Pro user: Settings → Pro | “Thanks for supporting” style copy | |
| 7.3 | Pro user: trial banner | No false “trial ended” | |

---

## 8. Anonymous / signed out

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 8.1 | Signed out: open app | Not read-only mode (no false “trial ended”) | |
| 8.2 | Signed out: reminders | Auth may be required elsewhere; no incorrect read-only toast | |

---

## 9. Upgrade entry points (sanity)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 9.1 | Trial banner “Upgrade” (if shown when expired) | Routes to Pro / purchase flow | |
| 9.2 | `startProUpgrade()` from Pro section (web) | Opens Settings → Pro or billing stub without crash | |
| 9.3 | TMDB search still works during trial and read-only | Proxy 200 | |

---

## 10. Persistence across refresh

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 10.1 | Active trial: set reminder toggle on a show; refresh | Setting persists (if mutations allowed) | |
| 10.2 | Active trial: hard refresh | Trial banner + days remaining still correct | |
| 10.3 | Expired: refresh | Still read-only; `flicklet.trial.v1` unchanged | |

---

## 11. Console / network hygiene

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 11.1 | Open/close reminder modals | No uncaught errors | |
| 11.2 | Read-only block paths | No infinite settings open loop | |
| 11.3 | No calls to removed email digest / unsubscribe routes from reminder UI | |

---

## 12. Android / production deploy (post-merge)

| # | Steps | Expected | P/F/B |
|---|--------|----------|-------|
| 12.1 | After `npm run build` + Cap copy | Bundled web assets include latest settings/reminder chunks | |
| 12.2 | Device: trial banner + reminders | Same behavior as web smoke | |

---

## Sign-off

| Area | Result | Notes |
|------|--------|-------|
| Trial start / migration | | |
| Watch Reminders (active trial) | | |
| Pro settings copy | | |
| Read-only → Pro navigation | | |
| Automated entitlements tests | | |
| Blockers | | |

---

## Quick reference — files under test

| Topic | Location |
|-------|----------|
| Trial logic | `apps/web/src/lib/entitlements.ts` |
| Hook + cache | `apps/web/src/hooks/useEntitlements.ts` |
| Read-only → Pro | `apps/web/src/lib/readOnlyGuard.ts` |
| Reminder buttons | `TabCard.tsx`, `LibraryActions.tsx`, `CompactOverflowMenu.tsx` |
| Reminder modals | `NotificationSettings.tsx`, `ShowNotificationSettingsModal.tsx` |
| Pro UI | `settingsSections.tsx` (`ProSection`), `settingsProConfig.ts` |
| Banner | `TrialStatusBanner.tsx` |
| Unit tests | `apps/web/src/lib/__tests__/entitlements.test.ts` |

---

## Related checklists

- Broad simplify regression: `tests/manual/SIMPLIFY_REGRESSION_SMOKE.md`
- Entitlement design notes: `docs/TRIAL_ENTITLEMENT_AUDIT.md`
