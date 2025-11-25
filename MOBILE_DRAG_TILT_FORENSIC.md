# Mobile Drag Tilt Forensic Analysis

## Problem
When dragging cards on mobile (Watching/Want/Watched tabs), the dragged card appears tilted/slanted instead of lifting straight up.

## Root Causes Identified

### 1. CSS Animation Rotation (cards.css:410-419)
**Location:** `apps/web/src/styles/cards.css` lines 410-419

```css
@keyframes dragStartAnimation {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(1.02) rotate(2deg);  /* ⚠️ Adds 2deg rotation */
    opacity: 0.95;
  }
}
```

**Impact:** When `.card-mobile.is-dragging` is applied, this animation adds a 2-degree rotation to the card.

### 2. DragHandle Touch Drag Rotation (DragHandle.tsx:296)
**Location:** `apps/web/src/components/cards/DragHandle.tsx` line 296

```typescript
wrapperElementRef.current.style.transform = `translateY(${deltaY}px) rotate(${rotationDirection}deg) scale(${scale})`;
```

**Impact:** During touch drag, rotation is calculated based on drag distance (up to 8 degrees), which stacks with the CSS animation rotation.

### 3. Stacking Effect
Both transforms apply simultaneously:
- CSS animation: `rotate(2deg)` 
- Inline style: `rotate(±8deg)` based on drag direction
- Result: Card appears tilted/slanted (up to 10 degrees total)

## Solution Strategy

1. **Separate mobile drag animation** - Remove rotation from mobile `.card-mobile.is-dragging` animation
2. **Remove rotation from DragHandle** - Keep only translate/scale for mobile touch drag
3. **Preserve desktop behavior** - Desktop TabCard can keep rotation if desired (different code path)

## Files to Modify

1. `apps/web/src/styles/cards.css` - Update `dragStartAnimation` to be flat for mobile
2. `apps/web/src/components/cards/DragHandle.tsx` - Remove rotation from touch drag transform

## Desktop vs Mobile Paths

- **Desktop:** Uses `TabCard` component, drag handled differently (mouse events)
- **Mobile:** Uses `TvCardMobile`/`MovieCardMobile`, drag handled via `DragHandle` touch events
- **Safety:** Changes scoped to mobile-only selectors won't affect desktop



