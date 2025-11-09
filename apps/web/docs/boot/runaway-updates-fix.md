# Runaway Updates Fix - Hard No-Op Guards

## Problem

After implementing first-paint sequencing, renders jumped to 1100 in 60s (~2.70 per sub, was ~1.55–2.18). Bursts increased to 1502 with peak-in-50ms of 390. Containment is ON with one emit per frame, indicating spam is upstream of the batcher - something keeps deciding "new" translations exist every frame.

## Root Cause

Continuous translation updates triggered by:
- Boot collector emitting redundant updates
- `emitChange()` not checking store state before queuing
- No content hash comparison (only reference equality)
- Missing one-time settle window for startup churn

## Solution

### 1. Strict Equality + Content Hash Guards

**File:** `apps/web/src/i18n/translationStore.ts`

- Added `hashDict()` function for stable content hash
- Store now tracks `dictHash` alongside `dict` reference
- `commit()` function checks both reference AND hash equality
- Prevents commits when content is identical even if object reference differs

### 2. One-Time Settle Window (1000ms)

**File:** `apps/web/src/i18n/translationStore.ts`

- Tracks app start time (`startTs`)
- During first 1000ms, ignores redundant updates (same hash + locale)
- Prevents startup feedback loop where same dictionary keeps getting re-emitted

### 3. Hard Guard in emitChange()

**File:** `apps/web/src/lib/language.ts`

- Checks store's current state via `getSnapshot()` before queuing
- Skips entirely if store already has exact same dict + locale
- Prevents `LanguageManager` from queuing redundant updates

### 4. Boot Collector Guard

**File:** `apps/web/src/i18n/bootCollector.ts`

- Checks store state before emitting boot updates
- Skips emission if store already has the values
- Prevents redundant boot emissions

### 5. Hash Guard in queueUpdate()

**File:** `apps/web/src/i18n/translationStore.ts`

- Added hash-based guard before queuing dict updates
- Drops updates if content hash matches current (catches object recreation)

### 6. DEV Probe for Commits/Min

**File:** `apps/web/src/i18n/translationStore.ts`

- Tracks commits per minute in DEV mode
- Logs `[i18n] commits/min: N` every 60 seconds
- Expected: single digits after first second when idle

### 7. Normalized Provider/Hooks

**File:** `apps/web/src/lib/language.ts`

- `getTranslations()` returns direct reference (never synthesizes new objects)
- `useT()` memoizes keys string to prevent selector recreation
- Shallow equality in slice selector prevents re-renders when content unchanged

## Implementation Details

### Hash Function
```typescript
function hashDict(d: Record<string, any>): string {
  let h = 0;
  const s = JSON.stringify(d);
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return String(h);
}
```

### Commit Function
```typescript
function commit(nextDict: Dict, nextLocale: string) {
  const nextHash = hashDict(nextDict);
  
  // Hard no-op guard: both identity and content equal
  if (current.dict === nextDict && current.locale === nextLocale) return;
  if (current.dictHash === nextHash && current.locale === nextLocale) return;

  // ... commit logic
}
```

### Settle Window
```typescript
const now = performance.now();
const redundant = hashDict(lastDict) === current.dictHash && lastLocale === current.locale;

if (now - startTs < 1000 && redundant) {
  // ignore redundant startup "updates"
  return;
}
```

## Expected Results

- **Renders per subscription:** Drop back to <~2.2 (from 2.70)
- **Burst count:** May still exist, but visible flicker stops completely
- **Frames with multiple emits:** Stays at 0 (already verified)
- **Commits/min in DEV:** Single digits after first second when idle
- **Containment mode:** "raf" (already verified)
- **Provider identity:** Stable (already verified)

## Files Modified

1. `apps/web/src/i18n/translationStore.ts` - Hash guards, settle window, commit function, DEV probe
2. `apps/web/src/lib/language.ts` - Hard guard in emitChange(), normalized getTranslations()
3. `apps/web/src/i18n/bootCollector.ts` - Store state check before emission

## Rollback

All changes contained to i18n store and language manager. Reversible in one commit. No copy or language logic changes.

