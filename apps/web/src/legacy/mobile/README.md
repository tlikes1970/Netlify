# Legacy Mobile Swipe Implementation

**Date Deprecated:** October 25, 2025  
**Reason:** Consolidated to unified SwipeableCard + useSwipe implementation

## Deprecated Files

- `SwipeRowOverlay.tsx` - Left-swipe only overlay component
- `CardBaseMobile.tsx` - Mobile card base using SwipeRowOverlay
- `useSwipeActions.ts` - Old swipe actions hook (replaced by useSwipe)

## Migration Notes

**Old Implementation:**
- SwipeRowOverlay: Left-swipe only, transform-based, 60px/100px thresholds
- CardBaseMobile: Complex mobile card wrapper with swipe integration
- useSwipeActions: Context-based actions, touch/mouse events

**New Implementation:**
- SwipeableCard: Bi-directional swipes, unified physics, 100px threshold
- useSwipe: Single physics model, configurable thresholds, pointer events
- Mobile cards now use SwipeableCard directly

## Context

These files were part of the original mobile card implementation that used a left-swipe-only overlay system. The new implementation provides:

1. **Bi-directional swipes** (left and right)
2. **Unified physics model** across all swipe components
3. **Consistent thresholds** and behavior
4. **Better accessibility** with pointer events
5. **Simplified API** with useSwipe hook

## Rollback

To rollback to the old implementation:
1. Move files back from `legacy/mobile/` to their original locations
2. Update TvCardMobile.tsx and MovieCardMobile.tsx to use CardBaseMobile
3. Revert SwipeableCard.tsx to use useSwipeActions
4. Update imports across the codebase

**Note:** This rollback would lose bi-directional swipe support and unified physics.




