# Pro Framework v1 Implementation Notes

**Date:** 2024  
**Branch:** `pro-framework-v1`  
**Status:** ✅ Complete

---

## Overview

Pro Framework v1 establishes a clean, consistent Pro status system and a payment framework skeleton that can be plugged into Stripe/App Store later without hard-coding payment logic everywhere.

---

## Part A: Pro Status Integrity

### 1. Central Pro Status Helper

**File:** `apps/web/src/lib/proStatus.ts`

- **`getProStatus()`**: Non-React function for Pro status resolution
- **`useProStatus()`**: React hook that automatically updates when settings change
- Returns: `{ isPro: boolean; source: 'alpha' | 'gift' | 'stripe' | 'ios' | 'android' | 'manual' | null }`

**Resolution Logic:**
- Currently: `isPro = settings.pro.isPro || billing.isPro`
- Source: `billing.source ?? (settings.pro.isPro ? 'alpha' : null)`
- When billing is integrated, billing status will take precedence

### 2. Default Pro OFF

**File:** `apps/web/src/lib/settings.ts`

- Changed `DEFAULT_SETTINGS.pro.isPro` from `true` to `false`
- All new users start as Free users
- Pro features are disabled by default

### 3. Alpha/Testing Toggle

**File:** `apps/web/src/components/SettingsPage.tsx` (ProTab)

- Added toggle: "Treat this device as Pro (Alpha / Testing)"
- Updates `settings.pro.isPro` via `settingsManager.updateProStatus()`
- Clear note: "This is for testing only and is not a real purchase"
- Located in Settings → Pro tab

### 4. Notification Pro Checks

**File:** `apps/web/src/lib/notifications.ts`

- Fixed `isProUser()` to use `getProStatus()` helper
- Now correctly respects Pro status for notification features
- Pro-only features (precise timing, email notifications) now properly gated

### 5. Bloopers/Extras Pro Gating

**Files:**
- `apps/web/src/components/extras/BloopersModal.tsx`
- `apps/web/src/components/extras/ExtrasModal.tsx`

**Behavior:**
- If `!isPro`: Shows Pro-only stub view with message and "Go to Pro settings" button
- If `isPro`: Loads and displays content as before
- Does NOT fetch remote content if not Pro (prevents unnecessary API calls)

**Stub View:**
- Message: "Bloopers/Extras are Pro features. Upgrade in Settings → Pro to unlock."
- Button: "Go to Pro settings" (calls `startProUpgrade()`)

### 6. Settings → Pro Wording Cleanup

**File:** `apps/web/src/components/SettingsPage.tsx` (ProTab)

**Reorganized into sections:**

**Available Now:**
- Bloopers & Behind-the-Scenes
- Advanced Notifications
- Simple Reminder (Free feature)

**Coming Soon:**
- Smart Notifications
- Advanced Analytics
- Premium Themes
- Extra Trivia Content
- CSV Export
- Social Features
- (Other planned features)

---

## Part B: Payment Framework Skeleton

### 7. User Billing Structure

**File:** `apps/web/src/lib/billing.ts`

**TypeScript Interface:**
```typescript
interface BillingStatus {
  isPro: boolean;
  source: 'alpha' | 'gift' | 'stripe' | 'ios' | 'android' | 'manual' | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
}
```

**Storage:**
- Future: Firestore `users/{uid}/billing/status`
- For now: Placeholder that returns default (no active billing)

**Helper Functions:**
- `getBillingStatus(uid?)`: Returns billing status (placeholder for now)
- `updateBillingStatus(uid, status)`: Updates billing status (placeholder for now)

### 8. Unified Pro Resolution

**File:** `apps/web/src/lib/proStatus.ts`

- `getProStatus()` combines settings + billing
- Logic: `isPro = settings.pro.isPro || billing.isPro`
- Source prioritization: billing source takes precedence, falls back to 'alpha' if settings-based
- Clearly documented for future refinement

### 9. Single Upgrade Entrypoint

**File:** `apps/web/src/lib/proUpgrade.ts`

**Function:** `startProUpgrade()`

**Current Behavior (Alpha Mode):**
- Navigates to Settings → Pro tab
- Dispatches `navigate-to-pro-settings` custom event
- SettingsPage listens and switches to Pro tab

**Future Behavior (When Payment Integration Added):**
- Stripe: Call backend `createCheckoutSession`, redirect to Stripe
- iOS: Trigger native in-app purchase flow
- Android: Trigger native in-app purchase flow

**Usage:**
- All "Upgrade to Pro" buttons call this function
- Centralized navigation/payment flow

### 10. Wired Upgrade Buttons

**Files Updated:**
- `apps/web/src/components/SettingsPage.tsx` (ProTab) - "Upgrade to Pro" button
- `apps/web/src/components/modals/NotificationSettings.tsx` - "Upgrade" button
- `apps/web/src/components/extras/BloopersModal.tsx` - "Go to Pro settings" button
- `apps/web/src/components/extras/ExtrasModal.tsx` - "Go to Pro settings" button

**All buttons now:**
- Call `startProUpgrade()` on click
- Navigate to Settings → Pro (or future payment flow)
- Centralized behavior, no duplicated logic

---

## Part C: Wrap-Up

### Verification Checklist

✅ **Fresh users have `isPro = false` by default**
- `DEFAULT_SETTINGS.pro.isPro = false`

✅ **Alpha/test users can toggle Pro on via Settings → Pro**
- Toggle added in ProTab
- Updates settings immediately
- Persists across sessions

✅ **Notification behavior respects Pro status**
- `isProUser()` uses `getProStatus()`
- Pro-only features properly gated

✅ **Bloopers/Extras behavior respects Pro status**
- Pro gating implemented
- Stub view for non-Pro users
- No content fetching if not Pro

✅ **All Upgrade buttons have working onClick**
- All buttons call `startProUpgrade()`
- Centralized navigation flow

---

## How Pro Status is Resolved

1. **Settings-based (Alpha/Testing):**
   - User toggles Pro in Settings → Pro
   - Stored in `settings.pro.isPro` (localStorage)
   - Source: `'alpha'`

2. **Billing-based (Future):**
   - When payment integration added:
   - Read from Firestore `users/{uid}/billing/status`
   - Check subscription validity (`currentPeriodEnd > now`)
   - Source: `'stripe'`, `'ios'`, `'android'`, etc.

3. **Combined Resolution:**
   - `isPro = settings.pro.isPro || billing.isPro`
   - Billing takes precedence when available
   - Settings fallback for Alpha/testing

---

## Where Billing Will Be Integrated

### Backend Integration Points:

1. **Stripe Webhook Handler:**
   - Listen for `checkout.session.completed`
   - Call `updateBillingStatus(uid, { isPro: true, source: 'stripe', ... })`
   - Write to Firestore `users/{uid}/billing/status`

2. **App Store Receipt Validation:**
   - iOS: Validate receipt with Apple
   - Android: Validate purchase with Google Play
   - Call `updateBillingStatus()` with appropriate source

3. **Subscription Management:**
   - Listen for `customer.subscription.deleted` (Stripe)
   - Listen for subscription cancellations (App Store)
   - Update `cancelAtPeriodEnd` flag

### Frontend Integration Points:

1. **`startProUpgrade()` in `proUpgrade.ts`:**
   - Replace Alpha mode navigation with:
     - Stripe: `fetch('/api/create-checkout-session')` → redirect
     - iOS: `window.webkit.messageHandlers.purchase.postMessage(...)`
     - Android: `window.Android.purchase(...)`

2. **`getBillingStatus()` in `billing.ts`:**
   - Replace placeholder with Firestore read:
     ```typescript
     const doc = await getDoc(doc(db, 'users', uid, 'billing', 'status'));
     return doc.data() as BillingStatus;
     ```

3. **`updateBillingStatus()` in `billing.ts`:**
   - Replace placeholder with Firestore write:
     ```typescript
     await setDoc(doc(db, 'users', uid, 'billing', 'status'), status);
     ```

---

## How Testers Can Enable Pro in Alpha

**Method 1: Settings UI (Recommended)**
1. Open Settings
2. Go to "Pro" tab
3. Toggle "Treat this device as Pro (Alpha / Testing)" ON
4. Pro features immediately available

**Method 2: Browser Console**
```javascript
const settings = JSON.parse(localStorage.getItem('flicklet.settings.v2') || '{}');
settings.pro = {
  isPro: true,
  features: {
    advancedNotifications: true,
    themePacks: true,
    socialFeatures: true,
    bloopersAccess: true,
    extrasAccess: true,
  },
};
localStorage.setItem('flicklet.settings.v2', JSON.stringify(settings));
location.reload();
```

**Method 3: SettingsManager (If Import Works)**
```javascript
window.settingsManager?.updateProStatus(true);
location.reload();
```

---

## Files Changed

### New Files
- `apps/web/src/lib/proStatus.ts` - Central Pro status helper
- `apps/web/src/lib/billing.ts` - Billing structure skeleton
- `apps/web/src/lib/proUpgrade.ts` - Upgrade entrypoint
- `apps/web/docs/PRO_FRAMEWORK_V1.md` - This documentation

### Modified Files
- `apps/web/src/lib/settings.ts` - Default Pro OFF, added `updateProStatus()` method
- `apps/web/src/lib/notifications.ts` - Fixed `isProUser()` to use `getProStatus()`
- `apps/web/src/components/SettingsPage.tsx` - Added Alpha toggle, reorganized Pro features, wired upgrade button
- `apps/web/src/components/extras/BloopersModal.tsx` - Added Pro gating with stub view
- `apps/web/src/components/extras/ExtrasModal.tsx` - Added Pro gating with stub view
- `apps/web/src/components/modals/NotificationSettings.tsx` - Wired upgrade button

---

## Summary

Pro Framework v1 successfully implements:
- ✅ Consistent Pro status (default OFF)
- ✅ Clean Alpha/testing toggle
- ✅ Correct Pro gating in notifications and Bloopers/Extras
- ✅ Clean Settings → Pro wording (Available Now vs Coming Soon)
- ✅ Billing structure skeleton (ready for Stripe/App Store integration)
- ✅ Unified Pro resolution (settings + billing)
- ✅ Single upgrade entrypoint (`startProUpgrade()`)
- ✅ All upgrade buttons wired to centralized flow

**Next Steps (Future):**
- Integrate Stripe checkout flow
- Integrate App Store in-app purchases
- Implement Firestore billing status reads/writes
- Add subscription management UI
- Add receipt validation

All Pro status checks now go through the centralized helper, making future payment integration straightforward.

