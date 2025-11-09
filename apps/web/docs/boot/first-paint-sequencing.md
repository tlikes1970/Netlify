# First-Paint Sequencing for i18n

## Objective

Eliminate startup initialization burst by sequencing translation and boot work to resolve in a single, predictable frame. This prevents visible flicker during first paint.

## Implementation Summary

### Files Touched

1. **`apps/web/src/i18n/bootCollector.ts`** (NEW)
   - Collects dict and locale separately
   - Emits only once when both are ready
   - Prevents piecemeal updates during boot

2. **`apps/web/src/lib/language.ts`** (MODIFIED)
   - Uses `stageBootDict`/`stageBootLocale` instead of direct `queueUpdate` during initialization
   - Added armed subscription guard in `useTranslations()` to suppress pre-armed boot updates
   - Subscribers ignore updates until after first microtask

3. **`apps/web/src/boot/bootCoordinator.ts`** (NEW)
   - Groups boot initializers into single rAF callback
   - Ensures all boot work runs in one frame

4. **`apps/web/src/main.tsx`** (MODIFIED)
   - Boot initializers (`initFlags`, `installCompactMobileGate`, `installActionsSplitGate`, `logAuthOriginHint`) grouped via `runFirstFrameBoot`

5. **`apps/web/src/i18n/translationStore.ts`** (MODIFIED)
   - Added guard to drop redundant first-paint dict update (when initial dict equals current and version is 0)
   - Already has microtask+RAF coalescing (verified)

6. **`apps/web/src/i18n/loadOptionalI18nLater.ts`** (NEW)
   - Utility for lazy-loading optional i18n bundles post-paint
   - Uses `requestIdleCallback` with 500ms fallback

7. **`apps/web/src/components/Tabs.tsx`** (MODIFIED)
   - Added `min-w-[4rem]` to Home tab button
   - Added `min-w-[5rem]` to main tab buttons
   - Prevents layout shift when translation text loads

8. **`apps/web/src/components/FlickletHeader.tsx`** (MODIFIED)
   - Added `min-w-[6rem]` to AppTitle component
   - Prevents header title width jump

## Boot Task Order

1. **Module Load (Synchronous)**
   - `LanguageManager` constructor loads language from localStorage
   - `initializeStore()` called with initial translations (for immediate reads)
   - `stageBootDict()` and `stageBootLocale()` called (for coordinated emission)

2. **First Frame (rAF)**
   - `runFirstFrameBoot()` executes:
     - `initFlags()` - Initialize mobile flags
     - `installCompactMobileGate()` - Install compact mobile gate
     - `installActionsSplitGate()` - Install actions split gate
     - `logAuthOriginHint()` - Log auth origin hint

3. **Boot Collector**
   - When both dict and locale are staged, emits single update
   - Store coalesces to one emit per frame

4. **Subscriber Arming**
   - `useTranslations()` hooks arm after first microtask
   - Pre-armed updates are ignored (prevent boot burst reactions)

## Key Mechanisms

### Frame-Coalesced Updates
- All translation updates queued and applied once per frame
- Last-write-wins coalescing ensures final snapshot per frame
- Microtask merge before rAF collapses same-tick microbursts

### Subscriber Suppression
- Subscribers ignore updates until armed (after first microtask)
- Prevents reactions to boot initialization burst
- After armed, normal subscription behavior resumes

### Layout Stabilization
- Tab buttons have `min-w-[4rem]` (Home) and `min-w-[5rem]` (main tabs)
- Header title has `min-w-[6rem]`
- Prevents visual jumps when translation text loads

### Redundant Update Guard
- First-paint dict update dropped if it equals current dict and version is 0
- Prevents no-op updates during initialization

## Verification

### Visual
- On cold load, at most one content settle visible
- No repeated flicker during first 1-2 seconds
- Text containers maintain stable width during load

### Numeric (if diagnostics enabled)
- Single emit per frame during boot
- Total renders in first 2 seconds reduced vs prior runs
- Subscriber reactions suppressed until armed

## Rollback

All changes are contained to:
- `apps/web/src/i18n/` (boot collector, store, lazy loader)
- `apps/web/src/lib/language.ts` (boot staging, armed subscription)
- `apps/web/src/boot/` (boot coordinator)
- `apps/web/src/main.tsx` (boot task grouping)
- `apps/web/src/components/Tabs.tsx` (layout stabilization)
- `apps/web/src/components/FlickletHeader.tsx` (layout stabilization)

Reversible in one commit. No copy changes, no language logic changes.

