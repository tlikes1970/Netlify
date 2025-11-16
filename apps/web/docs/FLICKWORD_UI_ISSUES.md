# FlickWord UI Issues - Priority List

## Critical Issues (Accessibility & Functionality)

### FW-1: Missing Touch Support for Modal Dragging

**Risk**: Mobile users can't drag the modal
**Issue**: `FlickWordModal` only handles mouse events, no touch events
**Impact**: Poor mobile UX

### FW-2: Hardcoded z-index Instead of CSS Variable

**Risk**: Z-index conflicts with other modals
**Issue**: Uses `zIndex: 10000` instead of `var(--z-modal, 9999)`
**Impact**: Potential layering issues

### FW-3: Testing Buttons Visible in Production

**Risk**: Confusing UI, exposes testing features
**Issue**: 🧪 buttons in both `FlickWordModal` and `FlickWordGame`
**Impact**: Unprofessional appearance

### FW-4: Missing Error State Handling

**Risk**: Users see broken state when API fails
**Issue**: No error state UI, only fallback word
**Impact**: Poor error communication

### FW-5: Keyboard Focus Management

**Risk**: Keyboard users can't navigate efficiently
**Issue**: No focus trapping, no focus indicators on tiles
**Impact**: Accessibility barrier

## Major Issues (UX & Responsiveness)

### FW-6: Missing ARIA Labels on Game Grid

**Risk**: Screen readers can't understand game state
**Issue**: Grid has basic ARIA but missing live regions for game state
**Impact**: Screen reader users can't play effectively

### FW-7: Keyboard Keys Need Better Focus Indicators

**Risk**: Keyboard users can't see which key is focused
**Issue**: Focus-visible styles exist but could be more prominent
**Impact**: Keyboard navigation difficulty

### FW-8: Notification Accessibility

**Risk**: Screen readers might miss notifications
**Issue**: Notifications use `aria-live="assertive"` but could be improved
**Impact**: Users miss important feedback

### FW-9: Loading State Accessibility

**Risk**: Screen readers don't know game is loading
**Issue**: Loading spinner has no aria-label or live region
**Impact**: Screen reader users don't know what's happening

### FW-10: Community Panel Card Keyboard Navigation

**Risk**: Keyboard users can't activate FlickWord card
**Issue**: FlickWord card in `CommunityPanel` not keyboard accessible
**Impact**: Keyboard-only users can't start game

## Minor Issues (Visual & Polish)

### FW-11: Tile Focus Indicators

**Risk**: Keyboard users can't see focused tile
**Issue**: Tiles don't have visible focus indicators
**Impact**: Keyboard navigation unclear

### FW-12: Button Text Responsiveness

**Risk**: Buttons overflow on small screens
**Issue**: "Enter" and "⌫" buttons might be too wide on mobile
**Impact**: Layout issues

### FW-13: Color Contrast on Keyboard Keys

**Risk**: Low contrast for some status colors
**Issue**: Need to verify WCAG AA compliance
**Impact**: Accessibility violation

### FW-14: Modal Header Stats Not Updating

**Risk**: Stats show "Streak: 0" and "Next: --:--" statically
**Issue**: Stats in modal header don't update from actual game state
**Impact**: Misleading information

### FW-15: Missing Reduced Motion Support for Some Animations

**Risk**: Animations play even when user prefers reduced motion
**Issue**: Some animations might not respect `prefers-reduced-motion`
**Impact**: Accessibility issue

### FW-16: Game Grid Missing Visual Feedback on Invalid Input

**Risk**: Users don't understand why input was rejected
**Issue**: Shake animation exists but could have better messaging
**Impact**: Confusion

### FW-17: Close Button Missing Keyboard Shortcut Hint

**Risk**: Users don't know they can press Escape
**Issue**: No indication that Escape closes modal
**Impact**: Discoverability issue

### FW-18: Stats View Buttons Need Better Labels

**Risk**: Screen readers don't understand button purpose
**Issue**: "Play Again" and "Close" buttons need better aria-labels
**Impact**: Accessibility

### FW-19: Word Info Section Missing Keyboard Navigation

**Risk**: Keyboard users can't access hint
**Issue**: Hint section not keyboard accessible
**Impact**: Accessibility barrier

### FW-20: Mobile Touch Targets Too Small

**Risk**: Buttons hard to tap on mobile
**Issue**: Some keyboard keys might be below 44x44px touch target
**Impact**: Mobile usability








