# Compact Gate Forensics Report

## Executive Summary

The `data-compact-mobile-v1` attribute is controlled by a single gate function that **removes** the attribute instead of setting it to `"false"` when conditions aren't met. This creates inconsistent behavior where the attribute can be `"true"` or `null`, but never `"false"`.

## Key Findings

### 1. Gate Logic Location
**File:** `apps/web/src/lib/flags.tsx` (lines 33-81)
**Function:** `installCompactMobileGate()`

```typescript
const on = !!(enabled && densityOk && mobileOk);
if (on) {
  html.setAttribute('data-compact-mobile-v1', 'true');
} else {
  html.removeAttribute('data-compact-mobile-v1'); // ← REMOVES instead of "false"
}
```

### 2. Decision Table

| Width | Density | Flag | Expected Attr | Actual Attr | Issue |
|-------|---------|------|---------------|-------------|-------|
| ≤768px | compact | true | "true" | "true" | ✅ Correct |
| >768px | compact | true | "false" | null | ❌ Removes instead |
| any | compact | false | "false" | null | ❌ Removes instead |
| any | non-compact | any | "false" | null | ❌ Removes instead |

### 3. CSS Selector Analysis

**All CSS selectors use explicit value `="true"`:**
- `apps/web/src/styles/settings-sheet.css` (25 selectors)
- `apps/web/src/styles/compact-lists.css` (4 selectors)  
- `apps/web/src/styles/compact-a11y-perf.css` (8 selectors)
- `apps/web/src/styles/compact-cleanup.css` (25 selectors)
- `apps/web/src/styles/compact-actions.css` (20 selectors)
- `apps/web/src/styles/compact-home.css` (5 selectors)
- `apps/web/src/styles/tokens-compact-mobile.css` (1 selector)

**No CSS relies on mere presence** - all use `[data-compact-mobile-v1="true"]`

### 4. Settings Tab Selection Logic

**File:** `apps/web/src/components/settings/SettingsSheet.tsx` (lines 125-138)

```typescript
{VALID_TABS.map((t, i) => (
  <button
    role="tab"
    aria-selected={tab === t}  // ← Boolean, not string
    // ...
  >
))}
```

**Root Cause of `{selected:0}`:**
- `aria-selected` is set to boolean `true`/`false`
- When no tab matches current state, all tabs get `aria-selected={false}`
- This results in 0 tabs with `aria-selected="true"`

### 5. Attribute Writers

**Only one location writes `data-compact-mobile-v1`:**
- `apps/web/src/lib/flags.tsx:49` - Sets to `"true"`
- `apps/web/src/lib/flags.tsx:51` - **Removes attribute**

**No other code touches this attribute.**

### 6. Flag Source

**Flag:** `flag:mobile_compact_v1` in localStorage
**Function:** `flag('mobile_compact_v1')` in `apps/web/src/lib/flags.tsx:41`
**No APP_FLAGS object found** - uses localStorage directly

### 7. Density Source

**Set in:** `apps/web/src/main.tsx:21`
```typescript
document.documentElement.dataset.density = 'compact';
```
**No other code modifies `data-density`**

## Recommended Fix Pattern

**Always write 'true' or 'false'; never remove:**

```typescript
const on = !!(enabled && densityOk && mobileOk);
html.setAttribute('data-compact-mobile-v1', on ? 'true' : 'false');
```

## Settings Tab Fix Plan

**Issue:** `aria-selected` should be string `"true"`/`"false"`, not boolean
**Fix:** Convert boolean to string in JSX:

```typescript
aria-selected={tab === t ? 'true' : 'false'}
```

## Diagnostic Tools Added

1. **Runtime Snapshot:** `collectFlickletDiagnostics()` function
2. **Attribute Monitoring:** Console logs for all `data-compact-mobile-v1` writes
3. **Mutation Observer:** Tracks attribute changes with old/new values
4. **Playwright Tests:** Verify gate behavior at different viewport sizes

## Test Results Expected

- **375px + compact + flag=true:** `compactAttr: "true"`, `hasHScroll: false`
- **1024px + compact + flag=true:** `compactAttr: null` (current behavior)
- **Settings deep-link:** `tabs.selectedCount: 1`

## Files Modified

1. `apps/web/src/debug/compactGateDiagnostics.ts` - New diagnostic module
2. `apps/web/src/main.tsx` - Wire diagnostics in dev mode
3. `apps/web/tests/compact-gate.spec.ts` - New test suite

All changes are dev-only and guarded by `import.meta.env.DEV`.














































