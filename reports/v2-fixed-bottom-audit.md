# Fixed-Bottom Overlays Audit - React V2 App

## Fixed-Bottom Elements Found

### 1. Mobile Navigation (.mobile-nav)
- **File**: `apps/web/src/styles/global.css` (lines 77-92)
- **Z-Index**: 9999
- **Positioning**: `position: fixed; bottom: 0; left: 0; right: 0;`
- **Padding Strategy**: Uses `--mobile-nav-height: 80px` variable
- **Safe Area**: Uses `env(safe-area-inset-bottom)` in MobileTabs component
- **GPU Layering**: Uses `transform: translate3d(0, 0, 0)` for iOS Safari stability

### 2. Floating Action Buttons (FABs)
- **File**: `apps/web/src/components/FABs.tsx`
- **Z-Index**: 9999
- **Positioning**: 
  - Settings FAB: `fixed bottom-4 left-4 lg:bottom-8 lg:left-8`
  - Theme/Mardi Gras FABs: `fixed bottom-4 right-4 lg:bottom-8 lg:right-8`
- **Padding Strategy**: Uses responsive spacing (16px mobile, 32px desktop)
- **Safe Area**: Accounts for viewport offset from Visual Viewport API

### 3. Scroll-to-Top Arrow
- **File**: `apps/web/src/components/ScrollToTopArrow.tsx`
- **Z-Index**: 9998 (below FABs)
- **Positioning**: `fixed bottom-20 right-4 lg:bottom-24 lg:right-8`
- **Padding Strategy**: Positioned above mobile nav (80px + 20px = 100px from bottom)

### 4. Game Modals
- **Files**: 
  - `apps/web/src/components/games/FlickWordModal.tsx`
  - `apps/web/src/components/games/TriviaModal.tsx`
- **Z-Index**: 9999 (same as mobile nav)
- **Positioning**: `position: fixed; bottom: 0;` for modal backdrop
- **Padding Strategy**: Full-screen overlay with centered dialog

### 5. Performance Debug Component
- **File**: `apps/web/src/components/PerformanceComponents.tsx`
- **Z-Index**: 50
- **Positioning**: `fixed bottom-20 right-4`
- **Padding Strategy**: Positioned above mobile nav

## Z-Index Hierarchy

1. **9999**: Mobile nav, FABs, Game modals (highest priority)
2. **9998**: Scroll-to-top arrow (below FABs)
3. **1000**: FlickWord game elements
4. **90**: Header marquee
5. **50**: Performance debug component (lowest)

## Safe Area Handling

- **Mobile Navigation**: Uses `env(safe-area-inset-bottom)` for iOS devices
- **Visual Viewport API**: MobileTabs component handles iOS Safari keyboard
- **Viewport Offset**: FABs adjust position based on keyboard visibility

## Padding Strategy Analysis

- **Main Content**: Uses `padding-bottom: var(--mobile-nav-height)` to avoid overlap
- **FABs**: Positioned with responsive spacing that accounts for mobile nav
- **Scroll Arrow**: Positioned above mobile nav with additional spacing
- **Safe Areas**: Properly handled for iOS devices with notches/home indicators

## Recommendations

1. **Z-Index Consolidation**: Consider creating a z-index token system for better management
2. **Safe Area Consistency**: Ensure all fixed-bottom elements use consistent safe area handling
3. **Mobile-First Positioning**: Current responsive approach is well-implemented
4. **GPU Layering**: Good use of `transform3d` for iOS Safari stability







