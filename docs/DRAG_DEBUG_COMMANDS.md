# Drag Handle Debug Commands

## Quick Diagnostic Commands (Run in Browser Console)

### 1. Check if DragHandle is rendered
```javascript
// Mobile cards
const mobileHandles = document.querySelectorAll('.card-mobile .drag-handle');
console.log('Mobile handles found:', mobileHandles.length);
mobileHandles.forEach((h, i) => {
  const style = window.getComputedStyle(h);
  console.log(`Handle ${i}:`, {
    opacity: style.opacity,
    zIndex: style.zIndex,
    pointerEvents: style.pointerEvents,
    display: style.display,
    visible: style.opacity !== '0' && style.display !== 'none'
  });
});

// Desktop cards
const desktopHandles = document.querySelectorAll('.tab-card .handle');
console.log('Desktop handles found:', desktopHandles.length);
desktopHandles.forEach((h, i) => {
  const style = window.getComputedStyle(h);
  console.log(`Handle ${i}:`, {
    opacity: style.opacity,
    visible: style.opacity !== '0'
  });
});
```

### 2. Test Mobile Touch Events
```javascript
// Click/tap on a mobile handle - should see console logs:
// [DragHandle] touchstart detected
// [DragHandle] touch-hold complete (after 200ms)
// [DragHandle] touchmove deltaY=
```

### 3. Test Desktop Drag Events
```javascript
// Drag a handle - should see:
// [useDragAndDrop] drag start
// [ListPage] wrapper onDragOver (multiple times as you drag)
// [useDragAndDrop] drag over
// [ListPage] wrapper onDrop
// [useDragAndDrop] drag end
// [useDragAndDrop] reordering
```

### 4. Check if Handles are Clickable
```javascript
// Mobile
const handle = document.querySelector('.card-mobile .drag-handle');
if (handle) {
  const rect = handle.getBoundingClientRect();
  console.log('Handle position:', rect);
  console.log('Handle clickable?', {
    hasPointerEvents: window.getComputedStyle(handle).pointerEvents !== 'none',
    zIndex: window.getComputedStyle(handle).zIndex,
    opacity: window.getComputedStyle(handle).opacity
  });
  
  // Try clicking programmatically
  handle.click();
  console.log('Clicked handle - check for touchstart logs');
}
```

### 5. Check SwipeableCard Interference
```javascript
// Check if SwipeableCard is blocking touch events
const swipeable = document.querySelector('.swipeable');
if (swipeable) {
  const style = window.getComputedStyle(swipeable);
  console.log('SwipeableCard:', {
    pointerEvents: style.pointerEvents,
    zIndex: style.zIndex,
    overflow: style.overflow
  });
}
```

### 6. Force Enable All Features
```javascript
localStorage.setItem('flag:drag-handle-v1', 'true');
localStorage.setItem('flag:drag-animation-v1', 'true');
localStorage.setItem('flag:drag-touch-hold-reduced', 'true');
console.log('✅ All flags enabled - reload page');
location.reload();
```

### 7. Check Drag State
```javascript
// After trying to drag, check state
const cards = document.querySelectorAll('[data-item-index]');
console.log('Cards with drag state:', Array.from(cards).map(c => ({
  index: c.getAttribute('data-item-index'),
  hasAriaDropeffect: c.hasAttribute('aria-dropeffect'),
  zIndex: window.getComputedStyle(c).zIndex
})));
```

### 8. Test Handle Visibility
```javascript
// Make handle very visible for testing
const handle = document.querySelector('.card-mobile .drag-handle') || 
                document.querySelector('.tab-card .handle');
if (handle) {
  handle.style.opacity = '1';
  handle.style.backgroundColor = 'red';
  handle.style.border = '2px solid yellow';
  console.log('Handle made visible - try clicking/touching now');
}
```

## What to Check

1. **Mobile "nothing happens"**:
   - Is handle visible? (opacity > 0, z-index high enough)
   - Are touch events firing? (check console for `[DragHandle] touchstart`)
   - Is SwipeableCard blocking? (pointer-events: none)

2. **Desktop "won't move far"**:
   - Are dragOver events firing? (check console)
   - Is draggedOverIndex updating? (check logs)
   - Is drop target being set correctly?

3. **General**:
   - Are handles rendered? (check DOM)
   - Are event listeners attached? (check console logs on mount)
   - Any console errors?






















