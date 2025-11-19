# Forensic Audit — Drag Handle, Reordering & Animation (Desktop + Mobile)

**Date:** 2025-01-11  
**Scope:** Tabbed lists (Watching/Want/Watched/Returning) only  
**Status:** AUDIT ONLY — No code changes

---

## Step 1 — Repo Hunt (Suspects Identified)

### Core Components
- **`apps/web/src/components/cards/DragHandle.tsx`** (327 lines)
  - Native touch listeners with `TOUCH_HOLD_DURATION = 400ms`
  - Desktop: `draggable={true}` on handle element
  - Mobile: long-press via `setTimeout` + global touch listeners
  
- **`apps/web/src/components/cards/TabCard.tsx`** (698 lines)
  - Desktop drag handle: `onDragStart` at line 644-648
  - Keyboard reorder: `onKeyDown` ArrowUp/ArrowDown at line 651-656
  - Mobile cards: `TvCardMobile` / `MovieCardMobile` wrapped in `SwipeableCard`
  
- **`apps/web/src/components/cards/mobile/TvCardMobile.tsx`** (181 lines)
- **`apps/web/src/components/cards/mobile/MovieCardMobile.tsx`** (156 lines)
  - Both wrap content in `<div className="card-mobile">` with `DragHandle` component
  - Pass `onDragStart` / `onDragEnd` props from parent

### DnD Hook & State
- **`apps/web/src/hooks/useDragAndDrop.ts`** (116 lines)
  - Custom hook (no external library)
  - State: `draggedItem`, `draggedOverIndex`, `isDragging`
  - Handlers: `handleDragStart`, `handleDragEnd`, `handleDragOver`, `handleDragLeave`, `handleDrop`

### List Page & Integration
- **`apps/web/src/pages/ListPage.tsx`** (802 lines)
  - Wires `useDragAndDrop` hook (line 288-295)
  - FLIP animation via `useLayoutEffect` (lines 321-376)
  - Keyboard reorder via `handleKeyboardReorder` (line 314-319)
  - Touch drag listener: `handleTouchDragOver` custom event (lines 379-401)
  - Persistence: calls `Library.reorder()` → switches to `'custom'` sort mode

### Persistence
- **`apps/web/src/lib/storage.ts`**
  - `Library.reorder(list, fromIndex, toIndex)` (lines 255-307)
  - Updates `addedAt` timestamps to maintain order
  - Saves custom order to `localStorage`: `flk.tab.{tabKey}.order.custom`
  - `Library.resetCustomOrder(list)` (lines 310-318)

### Styles
- **`apps/web/src/styles/cards.css`**
  - `.tab-card .handle` — opacity 0, shows on hover/focus (lines 4-23)
  - `.tab-card.is-dragging, .card-mobile.is-dragging` — lift animation (lines 361-367)
  
- **`apps/web/src/styles/cards-mobile.css`**
  - `.card-mobile.dragging` styles for swipe conflicts

### No External Libraries Found
- ❌ No `@dnd-kit/*`
- ❌ No `react-beautiful-dnd`
- ❌ No `react-dnd`
- ✅ Custom implementation only

### No Virtualization Found
- ❌ No `react-virtualized`, `react-window`, `react-virtuoso`
- ✅ All items rendered in DOM

---

## Step 2 — Code Extraction

### Component: DragHandle.tsx

**Full component structure:**
```typescript
// Lines 23-326
export function DragHandle({ onDragStart, onDragEnd, onTouchDragMove, itemId, index, className }: DragHandleProps) {
  const { ready, isDesktop } = useIsDesktop();
  const [isTouchHolding, setIsTouchHolding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchHoldTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const cardElementRef = useRef<HTMLElement | null>(null);
  const wrapperElementRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  // Mobile: Native touch listener (non-passive)
  useEffect(() => {
    if (isDesktop || !handleRef.current) return;
    const handle = handleRef.current;
    const handleNativeTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Non-passive listener
      e.stopPropagation();
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      // Find parent card-mobile and SwipeableCard
      // Disable swipe: swipeableElement.style.pointerEvents = 'none'
      touchHoldTimerRef.current = window.setTimeout(() => {
        setIsTouchHolding(true);
        setIsDragging(true);
        navigator.vibrate(30); // Haptic feedback
        onDragStart?.(syntheticEvent, index);
      }, TOUCH_HOLD_DURATION); // 400ms
    };
    handle.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
  }, [isDesktop, handleRef.current, isDragging, index, onDragStart]);

  // Global touch move/end when dragging
  useEffect(() => {
    if (!isDragging || isDesktop) return;
    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;
      // Apply transform to card-mobile element
      cardElementRef.current.style.transform = `translateY(${deltaY}px)`;
      // Find elementBelow, dispatch 'touchdragover' custom event
    };
    const handleGlobalTouchEnd = (e: TouchEvent) => {
      // Reset styles, re-enable swipe
      setIsDragging(false);
      onDragEnd?.();
    };
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
  }, [isDragging, isDesktop, index, onTouchDragMove, onDragEnd]);

  // Desktop: Native drag API
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart?.(e);
  };

  return (
    <div
      ref={handleRef}
      draggable={isDesktop && shouldShow}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      touchAction="none"
      style={{ opacity: isDesktop ? (shouldShow ? 1 : 0) : mobileOpacity }}
    >
      <span>⋮⋮</span>
    </div>
  );
}
```

### Hook: useDragAndDrop.ts

**Full hook implementation:**
```typescript
// Lines 14-110
export function useDragAndDrop<T extends { id: string }>(items: T[], onReorder: (fromIndex: number, toIndex: number) => void) {
  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    draggedOverIndex: null,
    isDragging: false,
  });
  const dragStartRef = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const item = items[index];
    dragStartRef.current = index;
    setDragState({ draggedItem: { id: item.id, index }, draggedOverIndex: null, isDragging: true });
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
      e.currentTarget.style.transform = 'rotate(2deg)';
    }
  }, [items]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (dragState.draggedItem && dragState.draggedOverIndex !== null && dragStartRef.current !== dragState.draggedOverIndex) {
      onReorder(dragStartRef.current, dragState.draggedOverIndex);
    }
    setDragState({ draggedItem: null, draggedOverIndex: null, isDragging: false });
    dragStartRef.current = null;
  }, [dragState, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragState.draggedOverIndex !== index) {
      setDragState(prev => ({ ...prev, draggedOverIndex: index }));
    }
  }, [dragState.draggedOverIndex]);

  return { dragState, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop };
}
```

### ListPage: FLIP Animation

**Full animation implementation:**
```typescript
// Lines 321-376
useLayoutEffect(() => {
  if (!processedItems.length) return;
  const cardMap = cardRefs.current; // Map<string, HTMLElement> - tracks by item ID
  const prevMap = prevRects.current; // Map<string, DOMRect>
  const nextRects = new Map<string, DOMRect>();

  // 1. Read old positions
  processedItems.forEach((item) => {
    const el = cardMap.get(String(item.id));
    if (el) prevMap.set(String(item.id), el.getBoundingClientRect());
  });

  // 2. Let React commit
  requestAnimationFrame(() => {
    // 3. Read new positions
    processedItems.forEach((item) => {
      const el = cardMap.get(String(item.id));
      if (el) nextRects.set(String(item.id), el.getBoundingClientRect());
    });

    // 4. FLIP animate
    nextRects.forEach((nextRect, itemId) => {
      const prevRect = prevMap.get(itemId);
      if (!prevRect) return;
      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      if (dx === 0 && dy === 0) return;
      const el = cardMap.get(itemId);
      if (!el) return;
      
      // INVERT
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'transform 0s';
      
      requestAnimationFrame(() => {
        // PLAY
        el.style.transform = '';
        el.style.transition = 'transform .30s cubic-bezier(.4,1,.6,1)';
        el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true });
      });
    });

    prevRects.current = nextRects;
  });
}, [processedItems.map(i => i.id).join(',')]);
```

### Persistence: Library.reorder()

**Full implementation:**
```typescript
// Lines 255-307
reorder(list: ListName, fromIndex: number, toIndex: number) {
  const items = Library.getByList(list);
  const reorderedItems = [...items];
  const [movedItem] = reorderedItems.splice(fromIndex, 1);
  reorderedItems.splice(toIndex, 0, movedItem);
  
  // Update addedAt timestamps to maintain order
  const now = Date.now();
  reorderedItems.forEach((item, index) => {
    state[k(item.id, item.mediaType)] = { 
      ...state[k(item.id, item.mediaType)], 
      addedAt: now + index 
    };
  });
  
  save(state); emit();
  
  // Persist custom order
  const tabKey = list === 'wishlist' ? 'want' : list;
  const orderIds = reorderedItems.map(item => `${item.id}:${item.mediaType}`);
  localStorage.setItem(`flk.tab.${tabKey}.order.custom`, JSON.stringify(orderIds));
  
  // Trigger Firebase sync
  window.dispatchEvent(new CustomEvent('library:changed', { detail: { uid, operation: 'reorder' } }));
}
```

### Styles: Handle Visibility

**CSS rules:**
```css
/* apps/web/src/styles/cards.css lines 4-23 */
.tab-card .handle {
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}

.tab-card:hover .handle,
.tab-card:focus-within .handle,
.tab-card:focus-visible .handle,
.tab-card.is-dragging .handle {
  opacity: 1;
  pointer-events: auto;
}

/* Drag animation */
.tab-card.is-dragging,
.card-mobile.is-dragging {
  transition: transform .25s, opacity .25s;
  transform: scale(1.02) rotate(1deg);
  opacity: .9;
  z-index: 999;
}
```

---

## Step 3 — Behavior Map

### Event Sequence: Desktop (Mouse/Trackpad)

1. **Hover** → `.tab-card:hover .handle` → handle opacity: 0 → 1
2. **mousedown** → Not used (native drag API handles it)
3. **dragstart** → `TabCard.onDragStart` (line 644) → `useDragAndDrop.handleDragStart` → sets `dragState.isDragging = true` → visual feedback (opacity 0.5, rotate 2deg)
4. **dragover** → `TabCard.onDragOver` → `handleDragOver` → updates `draggedOverIndex` → drop target highlight
5. **drop** → `TabCard.onDrop` → `handleDrop` (no-op, reorder happens in dragend)
6. **dragend** → `handleDragEnd` → if valid drop: `Library.reorder(fromIndex, toIndex)` → switches sort mode to `'custom'` → FLIP animation runs → `addedAt` timestamps updated → localStorage persisted → Firebase sync event

### Event Sequence: Mobile (Touch/Long-Press)

1. **Touch start** → `DragHandle` native `touchstart` listener (non-passive) → `e.preventDefault()` → starts 400ms timer
2. **Touch hold** (400ms) → `setTimeout` fires → `setIsDragging(true)` → `navigator.vibrate(30)` → `onDragStart(syntheticEvent, index)` → finds `card-mobile` element → disables SwipeableCard swipe (`pointerEvents: 'none'`)
3. **Touch move** → Global `touchmove` listener → `e.preventDefault()` → calculates `deltaY` → applies `transform: translateY(${deltaY}px)` to `card-mobile` → finds `elementBelow` via `document.elementFromPoint` → dispatches `touchdragover` custom event → `ListPage.handleTouchDragOver` updates `dragState.draggedOverIndex`
4. **Touch end** → Global `touchend` listener → resets transforms → re-enables swipe → `onDragEnd()` → `handleDragEnd` → if valid drop: `Library.reorder()` → FLIP animation → persistence

### Keyboard Accessibility

- **Supported:** ArrowUp/ArrowDown on drag handle (TabCard line 651-656)
- **Handler:** `onKeyboardReorder(direction)` → `handleKeyboardReorder(fromIndex, toIndex)` → `Library.reorder()` → aria-live announcement
- **ARIA:** `aria-grabbed={isBeingDragged}` present on handle (line 659)
- **ARIA Live:** Announcements via `ariaAnnouncement` state (line 298, 634)

### Virtualization Compatibility

- **Status:** ❌ No virtualization in use
- **Impact:** N/A — all items rendered in DOM

### Persistence Model

- **Storage:** `localStorage` key: `flk.tab.{tabKey}.order.custom`
- **Format:** JSON array of `"${id}:${mediaType}"` strings
- **When:** On drop (in `Library.reorder()`)
- **Fallback:** Uses `addedAt` timestamps in main state
- **Reset:** `Library.resetCustomOrder(list)` removes localStorage key

### Known Blockers (Identified)

1. **Mobile handle visibility:** Always visible at 30% opacity (line 271), full opacity on touch-hold — ✅ Working
2. **Touch-action CSS:** `touchAction: 'none'` on handle (line 297) — ✅ Present
3. **Passive listeners:** Native listeners use `{ passive: false }` (lines 114, 190) — ✅ Correct
4. **Swipe conflict:** SwipeableCard disabled via `pointerEvents: 'none'` during drag (line 90) — ✅ Handled
5. **Animation timing:** FLIP runs on every order change (dependency array uses item IDs) — ⚠️ May run on unrelated changes

---

## Step 4 — Findings & Gaps

### Critical Issues

#### 1. **FLIP Animation Dependency Array Issue**
- **File:** `apps/web/src/pages/ListPage.tsx:376`
- **Issue:** Dependency `[processedItems.map(i => i.id).join(',')]` creates new string on every render, causing unnecessary re-runs
- **Impact:** Animation may trigger on filter/sort changes, not just reorder
- **Fix:** Use `useMemo` for stable dependency or compare IDs array directly

#### 2. **Mobile Card Transform Applied to Wrong Element**
- **File:** `apps/web/src/components/cards/DragHandle.tsx:135`
- **Issue:** Transform applied to `card-mobile` div (inside SwipeableCard), but FLIP animation targets wrapper div (ListPage level)
- **Impact:** Mobile drag visual feedback may not align with final animation
- **Fix:** Apply transform to wrapper div (`data-item-index` element) or coordinate both

#### 3. **Touch Hold Duration Too Long**
- **File:** `apps/web/src/components/cards/DragHandle.tsx:21`
- **Issue:** `TOUCH_HOLD_DURATION = 400ms` is longer than typical (150-250ms recommended)
- **Impact:** Users may think it's not working, accidental scroll may cancel
- **Fix:** Reduce to 200-250ms

#### 4. **No Debounce on Persistence**
- **File:** `apps/web/src/lib/storage.ts:287`
- **Issue:** `save(state)` called immediately on every reorder
- **Impact:** Performance hit on rapid reorders, potential race conditions
- **Fix:** Debounce persistence by 100-200ms

#### 5. **Desktop Handle Hidden Until Hover**
- **File:** `apps/web/src/styles/cards.css:4-8`
- **Issue:** Handle `opacity: 0` by default, only visible on hover/focus
- **Impact:** Discoverability issue — users may not know drag is available
- **Fix:** Consider always-visible on desktop or clearer visual hint

### Moderate Issues

#### 6. **Missing aria-dropeffect on Drop Targets**
- **File:** `apps/web/src/components/cards/TabCard.tsx` (onDragOver handler)
- **Issue:** No `aria-dropeffect` attribute set during drag over
- **Impact:** Screen reader users may not know drop target is active
- **Fix:** Add `aria-dropeffect="move"` to drop target elements

#### 7. **Touch Cancel Handling**
- **File:** `apps/web/src/components/cards/DragHandle.tsx:192`
- **Issue:** `touchcancel` listener exists but may not fully reset state if hold timer still running
- **Impact:** Stuck drag state if touch cancelled mid-hold
- **Fix:** Clear timer in touchcancel handler

#### 8. **FLIP Animation May Conflict with Drag Transform**
- **File:** `apps/web/src/pages/ListPage.tsx:360` vs `DragHandle.tsx:135`
- **Issue:** Mobile drag applies `translateY` while FLIP applies `translate(x, y)` — may conflict
- **Impact:** Janky animation during active drag
- **Fix:** Coordinate or disable FLIP during active drag

### Low Priority Issues

#### 9. **No Feature Flags for Drag Handle**
- **Issue:** No feature flag system for drag handle (unlike scroll/swipe fixes)
- **Impact:** Hard to rollback if issues arise
- **Fix:** Add `flag:drag-handle-v1`, `flag:drag-animation-v1` flags

#### 10. **Keyboard Reorder Only on Handle**
- **File:** `apps/web/src/components/cards/TabCard.tsx:651`
- **Issue:** Keyboard reorder only works when handle is focused
- **Impact:** Users must tab to handle first
- **Fix:** Consider allowing keyboard reorder when card is focused

---

## Step 5 — Recommended Implementation Plan

### Library Choice: **Keep Custom Implementation**

**Rationale:** Current implementation is functional and lightweight. No external library needed unless issues persist.

**Alternative (if needed):** `@dnd-kit/core` + `@dnd-kit/sortable` with:
- `MouseSensor` for desktop
- `TouchSensor` with `pressDelay: 200`
- `KeyboardSensor` for ArrowUp/Down

### Priority Fixes

#### Fix 1: Reduce Touch Hold Duration
- **File:** `apps/web/src/components/cards/DragHandle.tsx:21`
- **Change:** `TOUCH_HOLD_DURATION = 400` → `200`
- **Risk:** Low
- **Test:** Verify drag starts reliably on mobile

#### Fix 2: Fix FLIP Animation Dependency
- **File:** `apps/web/src/pages/ListPage.tsx:376`
- **Change:** Use `useMemo` for stable dependency:
  ```typescript
  const itemIds = useMemo(() => processedItems.map(i => String(i.id)).join(','), [processedItems]);
  }, [itemIds]);
  ```
- **Risk:** Low
- **Test:** Animation only runs on actual reorder

#### Fix 3: Coordinate Mobile Drag Transform
- **Files:** `DragHandle.tsx:135`, `ListPage.tsx:360`
- **Change:** Apply transform to wrapper div (`data-item-index` element) instead of `card-mobile`
- **Risk:** Medium (may affect swipe gesture)
- **Test:** Mobile drag visual matches final position

#### Fix 4: Add Debounce to Persistence
- **File:** `apps/web/src/lib/storage.ts:287`
- **Change:** Debounce `save(state)` by 150ms
- **Risk:** Low
- **Test:** Rapid reorders don't cause performance issues

#### Fix 5: Improve Desktop Handle Visibility
- **File:** `apps/web/src/styles/cards.css:4`
- **Change:** Consider `opacity: 0.3` by default, `opacity: 1` on hover
- **Risk:** Low
- **Test:** Handle is discoverable but not distracting

### Feature Flags (Optional)

Add to `apps/web/src/utils/scrollFeatureFlags.ts`:
```typescript
export type DragFeatureFlag = 
  | 'drag-handle-v1'
  | 'drag-animation-v1'
  | 'drag-touch-hold-reduced';
```

### Implementation Checklist

- [ ] Reduce `TOUCH_HOLD_DURATION` to 200ms
- [ ] Fix FLIP dependency array with `useMemo`
- [ ] Coordinate mobile drag transform target
- [ ] Add debounce to `Library.reorder()` persistence
- [ ] Improve desktop handle visibility (optional)
- [ ] Add `aria-dropeffect` to drop targets
- [ ] Fix `touchcancel` handler to clear timer
- [ ] Add feature flags (optional)
- [ ] Test desktop drag → drop → persistence
- [ ] Test mobile long-press → drag → drop → persistence
- [ ] Test keyboard ArrowUp/Down reorder
- [ ] Test FLIP animation only runs on reorder
- [ ] Test rapid reorders don't break persistence

### Risk Estimate

**Overall Risk:** **LOW-MEDIUM**

- Core functionality works
- Fixes are isolated and testable
- No breaking changes to API
- Easy rollback via feature flags (if added)

### Test Plan (Proposed)

See Step 6 below.

---

## Step 6 — Test Plan

### Desktop Tests

1. **Drag Item 3 to Position 1**
   - Hover over card 3 → handle appears
   - Drag handle → card becomes semi-transparent
   - Drop on card 1 → FLIP animation runs
   - Reload page → order persists (card 3 is now first)
   - Verify sort mode switched to "Custom"

2. **Keyboard Reorder**
   - Focus drag handle → ArrowDown → card moves down → aria-live announcement
   - ArrowUp → card moves up → announcement
   - Reload → order persists

3. **Animation Smoothness**
   - Drag item → drop → verify 300ms cubic-bezier transition (not snap)
   - All other cards animate smoothly to new positions

### Mobile Tests

1. **Long-Press Then Drag**
   - Long-press handle (200ms) → haptic feedback → drag starts
   - Drag card up/down → visual feedback follows finger
   - Drop on target → FLIP animation runs
   - Reload → order persists

2. **List Scroll During Drag**
   - Start drag → continue dragging → verify list can scroll while dragging
   - Drop → order correct

3. **Swipe Conflict Resolution**
   - Long-press handle → swipe gesture disabled
   - Release → swipe re-enabled
   - Verify normal swipe still works when not dragging

### Keyboard Accessibility Tests

1. **Arrow Navigation**
   - Tab to drag handle → ArrowUp/Down → reorder works
   - aria-live region announces movement

2. **Screen Reader**
   - NVDA/JAWS: "Drag to reorder" announced
   - `aria-grabbed` state changes during drag

### Animation Tests

1. **FLIP Only on Reorder**
   - Change filter → no animation
   - Change sort mode → no animation
   - Drag-drop reorder → animation runs

2. **60 FPS During Drag**
   - DevTools Performance tab → record drag → verify 60fps
   - No jank during transform

### Dark/Light Theme Tests

1. **Handle Visibility**
   - Light theme → handle visible with sufficient contrast
   - Dark theme → handle visible with sufficient contrast
   - Verify icon (⋮⋮) is readable

### Edge Cases

1. **Rapid Reorders**
   - Drag item 1 to 5 → immediately drag item 5 to 1 → verify no race condition
   - Persistence correct after reload

2. **Touch Cancel**
   - Start long-press → cancel (touchcancel) → verify no stuck state
   - Handle returns to normal

3. **Empty List**
   - Drag on empty list → no crash
   - Handle not shown when no items

---

## Summary

**Current State:** Functional custom drag-and-drop with FLIP animation, working on desktop and mobile.

**Top 5 Blockers:**
1. Touch hold duration too long (400ms → should be 200ms)
2. FLIP animation dependency array may cause unnecessary runs
3. Mobile drag transform target mismatch with FLIP
4. No debounce on persistence
5. Desktop handle discoverability (opacity 0 by default)

**Recommended Path:** Fix top 3 issues, add optional feature flags, test thoroughly, then optimize.

**Files to Touch:**
- `apps/web/src/components/cards/DragHandle.tsx` (reduce hold duration)
- `apps/web/src/pages/ListPage.tsx` (fix FLIP dependency, coordinate transforms)
- `apps/web/src/lib/storage.ts` (add debounce)
- `apps/web/src/styles/cards.css` (improve handle visibility)

**All referenced files confirmed to exist.**




















