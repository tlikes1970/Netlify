# Drag Handle Verification Commands

## Quick Verification Commands

### 1. Check Feature Flags Status
```javascript
// Check all drag-related flags
console.log({
  'drag-handle-v1': localStorage.getItem('flag:drag-handle-v1'),
  'drag-animation-v1': localStorage.getItem('flag:drag-animation-v1'),
  'drag-touch-hold-reduced': localStorage.getItem('flag:drag-touch-hold-reduced')
});

// Check via scrollFeatures API (if available)
window.scrollFeatures?.list();
```

### 2. Verify Touch Hold Duration
```javascript
// Should return 200 (default) unless explicitly disabled
// Run this in console while on a tabbed list page
const getTouchHoldDuration = () => {
  if (typeof window !== 'undefined') {
    try {
      const flagValue = localStorage.getItem('flag:drag-touch-hold-reduced');
      if (flagValue === 'false') return 400;
    } catch {}
  }
  return 200;
};
console.log('Touch hold duration:', getTouchHoldDuration(), 'ms');
```

### 3. Verify Animation is Enabled
```javascript
// Should return false (not disabled) by default
const isAnimationDisabled = () => {
  if (typeof window !== 'undefined') {
    try {
      const flagValue = localStorage.getItem('flag:drag-animation-v1');
      return flagValue === 'false';
    } catch {}
  }
  return false;
};
console.log('Animation disabled?', isAnimationDisabled());
```

### 4. Test Desktop Handle Visibility
```javascript
// Check if handles are visible (should be opacity 0.3 by default)
const handles = document.querySelectorAll('.tab-card .handle');
console.log('Found handles:', handles.length);
handles.forEach((handle, i) => {
  const style = window.getComputedStyle(handle);
  console.log(`Handle ${i}: opacity =`, style.opacity, 'visible =', style.visibility);
});
```

### 5. Enable Debug Logging
```javascript
// The code already has console.log statements - check browser console for:
// [DragHandle] native-touch listener attaching
// [DragHandle] touch-hold complete
// [DragHandle] touchmove deltaY=
// [DragHandle] touchend – resetting drag state
// [ListPage] touchdragover
```

### 6. Force Enable Features (if needed)
```javascript
// Enable all drag features explicitly
localStorage.setItem('flag:drag-handle-v1', 'true');
localStorage.setItem('flag:drag-animation-v1', 'true');
localStorage.setItem('flag:drag-touch-hold-reduced', 'true');
console.log('✅ All drag features explicitly enabled');
location.reload(); // Reload to apply
```

### 7. Test Drag on Desktop
```javascript
// Hover over a card - handle should be visible at 30% opacity
// Click and drag handle - should see smooth reorder with FLIP animation
// Check console for no errors
```

### 8. Test Drag on Mobile
```javascript
// Long-press handle for ~200ms (should feel faster than before)
// Should feel haptic feedback (if device supports)
// Drag card - should follow finger smoothly
// Drop - should see smooth "settle" animation
```

### 9. Verify Persistence
```javascript
// After reordering, check if order persisted
const tabKey = 'watching'; // or 'want', 'watched'
const customOrder = localStorage.getItem(`flk.tab.${tabKey}.order.custom`);
console.log('Custom order:', customOrder ? JSON.parse(customOrder) : 'Not set');
```

### 10. Check for Console Errors
```javascript
// Open DevTools Console and look for:
// - Any errors during drag
// - Any warnings about flags
// - Debug logs from DragHandle and ListPage
```

## What Should Be Different

### Desktop:
- ✅ Handle visible at 30% opacity (was 0% before)
- ✅ Handle becomes 100% opacity on hover
- ✅ Smooth FLIP animation when dropping (not snap)
- ✅ No redundant animations on filter/sort changes

### Mobile:
- ✅ Long-press feels faster (200ms vs 400ms before)
- ✅ Haptic feedback on drag start (15ms vibration)
- ✅ Drag follows finger smoothly
- ✅ Smooth "settle" animation on drop

## Troubleshooting

If you see no difference:

1. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R) to clear cache
2. **Check if features are explicitly disabled**:
   ```javascript
   localStorage.getItem('flag:drag-animation-v1') === 'false' // Should be null or 'true'
   ```
3. **Verify you're on a tabbed list** (Watching/Want/Watched, not Discovery)
4. **Check browser console** for errors or debug logs
5. **Try explicitly enabling**:
   ```javascript
   localStorage.setItem('flag:drag-animation-v1', 'true');
   localStorage.setItem('flag:drag-touch-hold-reduced', 'true');
   location.reload();
   ```

## Expected Behavior

- **Desktop**: Handle partially visible → hover → drag → smooth animation → reload → order persists
- **Mobile**: Long-press 200ms → haptic → drag → smooth settle → reload → order persists
- **Keyboard**: ArrowUp/Down → reorder → aria-live announcement


















