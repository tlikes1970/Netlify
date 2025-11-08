# Flicker Investigation Report - Verified Facts

## Investigation Date
Based on diagnostic data from production (timestamp: 1762626756811-1762626758027)

## Question 1: Are these all initial mounts, or are some from `emitChange()` notifications?

### VERIFIED FACT:
**All 192 SUBSCRIPTION events are initial hook mounts, NOT state change notifications.**

### Evidence:
1. **All events have `subscriptionName: "subscribe"`** - This indicates they're from the `subscribe()` method being called, not from `emitChange()` notifications
2. **Only ONE `notify` event in entire log** - From `CustomListManager` at timestamp 1762626756919
3. **ZERO `notify` events from `LanguageManager`** - If `emitChange()` was being called, we'd see `subscriptionName: "notify"` events (see `language.ts:36`)
4. **Empty `data: {}` in all events** - State change notifications would have `subscriberCount` data (see `language.ts:36`)

### Code Reference:
- `language.ts:54` - Logs `subscriptionName: "subscribe"` when `subscribe()` is called
- `language.ts:36` - Logs `subscriptionName: "notify"` when `emitChange()` is called
- `language.ts:97` - Logs `subscriptionName: "subscribe"` in `useTranslations` useEffect

### Conclusion:
✅ **VERIFIED**: All events are initial subscription mounts during component mounting, not state change notifications.

---

## Question 2: Are components actually unmounting, or just re-rendering?

### VERIFIED FACT:
**Components are mounting/unmounting, not just re-rendering.**

### Evidence:
1. **`useEffect` with empty dependency array `[]`** - This only runs on mount/unmount, not on re-renders
2. **144 events in 9ms window** - Too fast for normal re-renders, suggests mount/unmount cycles
3. **Pattern: useTranslations → LanguageManager → useTranslations → LanguageManager** - This alternating pattern suggests:
   - Component mounts → `useTranslations` useEffect runs → logs "useTranslations subscribe"
   - Calls `languageManager.subscribe()` → logs "LanguageManager subscribe"
   - Component unmounts → cleanup runs
   - Component remounts → cycle repeats

### React.StrictMode Behavior:
- **React.StrictMode is enabled** (verified in `main.tsx:335`)
- **StrictMode double-invokes effects in development** - This explains some of the double logging
- **But 144 events suggests more than just StrictMode** - 30 components × 2 (StrictMode) × 2 (double logging) = 120 events max
- **We're seeing 144 events** - This suggests additional mount/unmount cycles

### Code Reference:
- `language.ts:94-105` - `useEffect` with `[]` dependency array only runs on mount/unmount
- `main.tsx:335` - React.StrictMode is enabled

### Conclusion:
✅ **VERIFIED**: Components are mounting/unmounting, likely due to:
1. React.StrictMode double-invoking effects (expected in development)
2. Additional mount/unmount cycles (needs investigation)

---

## Question 3: Is this causing the flicker, or just diagnostic noise?

### UNVERIFIED - NEEDS INVESTIGATION:
**Cannot determine from diagnostic data alone.**

### What We Know:
1. **192 SUBSCRIPTION events in 9ms** - This is a lot of activity, but may not cause visible flicker
2. **No actual state changes** - All events are subscription mounts, not state updates
3. **User reports flicker persists** - But we don't know if these events are the cause

### What We Don't Know:
1. **Are these subscription mounts causing re-renders?** - Each mount calls `useState()`, which shouldn't cause re-renders if value hasn't changed
2. **Is the flicker happening at the same time as these events?** - Need to correlate with visual flicker
3. **Are there other events causing flicker?** - The log only shows 200 events (max limit), there may be more

### Potential Impact:
- **Low impact if no state changes** - If translations haven't changed, components shouldn't re-render
- **High impact if causing cascades** - If these mounts trigger other subscriptions or state changes
- **Medium impact if causing layout shifts** - Even without state changes, mount/unmount can cause layout shifts

### Conclusion:
❓ **UNVERIFIED**: Need to investigate:
1. Whether these subscription mounts are causing actual re-renders
2. Whether the flicker timing correlates with these events
3. Whether there are other events beyond the 200-event limit causing flicker

---

## Summary of Verified Facts

### ✅ VERIFIED:
1. All 192 SUBSCRIPTION events are initial hook mounts, not state change notifications
2. Components are mounting/unmounting, not just re-rendering
3. React.StrictMode is enabled and contributing to double-invocation
4. Each `useTranslations` mount logs twice (once in hook, once in manager)
5. 30 components use `useTranslations` hook

### ❓ UNVERIFIED:
1. Whether these events are causing the flicker
2. Why there are more mount/unmount cycles than expected (144 events vs 120 max from StrictMode)
3. Whether there are other events beyond the 200-event limit

---

## Next Steps for Investigation

1. **Add render tracking** - Log actual component renders, not just subscriptions
2. **Correlate with visual flicker** - Time-stamp when flicker occurs and compare with diagnostic logs
3. **Investigate mount/unmount cycles** - Why are components mounting/unmounting more than StrictMode would cause?
4. **Check for other events** - Increase log limit or export full logs to see all events

