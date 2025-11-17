# FlickWord UI Fixes - Manual Test Checklist

## Prerequisites

- Dev server running: `npm run dev` (from apps/web)
- Browser DevTools open (F12)
- Test on both desktop and mobile viewports

---

## Critical Issues

### FW-1: Modal Touch Support ✅

- [ ] Open FlickWord on mobile device (or mobile viewport)
- [ ] Try dragging modal by touching and dragging the header
- [ ] **Expected**: Modal should move smoothly with touch
- [ ] **Expected**: No scrolling while dragging

### FW-2: CSS Variable for z-index ✅

- [ ] Open FlickWord modal
- [ ] Check DevTools → Elements → `.gm-dialog`
- [ ] **Expected**: z-index should use `var(--z-modal, 9999)` not hardcoded `10000`

### FW-3: Testing Buttons Hidden ✅

- [ ] Open FlickWord modal
- [ ] Look for 🧪 testing button
- [ ] **Expected**: No testing button visible (or only in dev mode)

### FW-4: Error State Handling ✅

- [ ] Open DevTools → Network tab
- [ ] Block API requests (Right-click → Block request URL)
- [ ] Refresh and open FlickWord
- [ ] **Expected**: Error message shown or fallback word loaded
- [ ] **Expected**: "Try Again" button available if error

### FW-5: Keyboard Focus Management ✅

- [ ] Open FlickWord modal
- [ ] Press Tab to navigate
- [ ] **Expected**: Focus moves through tiles and keyboard keys
- [ ] **Expected**: Focus indicators visible (outline)

---

## Major Issues

### FW-6: ARIA Labels on Grid ✅

- [ ] Open FlickWord with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Navigate to game grid
- [ ] **Expected**: Screen reader announces grid structure
- [ ] **Expected**: Announces current guess count and game state

### FW-7: Keyboard Focus Indicators ✅

- [ ] Open FlickWord modal
- [ ] Tab through keyboard keys
- [ ] **Expected**: Each key shows clear focus outline
- [ ] **Expected**: Focus outline is 3px solid accent color

### FW-8: Notification Accessibility ✅

- [ ] Type invalid word (e.g., "ABCDE")
- [ ] Press Enter
- [ ] **Expected**: Notification appears with error message
- [ ] **Expected**: Screen reader announces notification
- [ ] **Expected**: Notification has dismiss button

### FW-9: Loading State Accessibility ✅

- [ ] Open FlickWord modal quickly
- [ ] **Expected**: Loading spinner visible
- [ ] **Expected**: "Loading today's word..." text shown
- [ ] **Expected**: Screen reader announces loading state

### FW-10: Community Panel Keyboard Navigation ✅

- [ ] Navigate to home page
- [ ] Tab to FlickWord card
- [ ] **Expected**: Card receives focus
- [ ] **Expected**: Press Enter/Space opens modal
- [ ] **Expected**: Stats inside card don't trigger parent click

---

## Minor Issues

### FW-11: Tile Focus Indicators ✅

- [ ] Open FlickWord modal
- [ ] Tab to current row tiles
- [ ] **Expected**: Focused tile shows outline
- [ ] **Expected**: Outline is 3px solid accent color

### FW-12: Button Text Responsiveness ✅

- [ ] Open FlickWord modal
- [ ] Resize browser to mobile width (375px)
- [ ] **Expected**: "Enter" and "⌫" buttons fit on screen
- [ ] **Expected**: No horizontal scrolling

### FW-13: Color Contrast ✅

- [ ] Complete a guess (type "HOUSE" and press Enter)
- [ ] Wait for tiles to reveal colors
- [ ] **Expected**: Green (correct), Yellow (present), Gray (absent) are visible
- [ ] **Expected**: Text on colored tiles is white (good contrast)
- [ ] Use browser extension to check WCAG AA compliance

### FW-14: Modal Header Stats Update ✅

- [ ] Open FlickWord modal
- [ ] Check header stats
- [ ] **Expected**: Shows current streak (even if 0)
- [ ] **Expected**: Shows countdown to next word (HH:MM format)
- [ ] Complete a game and check stats update

### FW-15: Reduced Motion Support ✅

- [ ] Enable reduced motion in OS settings
  - Windows: Settings → Ease of Access → Display → Show animations
  - Mac: System Preferences → Accessibility → Display → Reduce motion
- [ ] Open FlickWord modal
- [ ] Type a word and press Enter
- [ ] **Expected**: Animations are minimal or disabled
- [ ] **Expected**: Tiles still change color but without flip animation

### FW-16: Invalid Input Feedback ✅

- [ ] Type invalid word (e.g., "ABCDE")
- [ ] Press Enter
- [ ] **Expected**: Current row shakes or notification appears
- [ ] **Expected**: Clear error message shown

### FW-17: Close Button Keyboard Hint ✅

- [ ] Open FlickWord modal
- [ ] Hover over close button (×)
- [ ] Check tooltip/aria-label
- [ ] **Expected**: Mentions "Press Escape to close"
- [ ] Press Escape
- [ ] **Expected**: Modal closes

### FW-18: Stats View Button Labels ✅

- [ ] Complete a FlickWord game
- [ ] Wait for stats view to appear
- [ ] Check "Play Again" and "Close" buttons
- [ ] **Expected**: Both have descriptive aria-labels
- [ ] **Expected**: Screen reader announces button purpose

### FW-19: Word Info Keyboard Navigation ✅

- [ ] Open FlickWord modal
- [ ] If hint is shown, Tab to it
- [ ] **Expected**: Hint section receives focus
- [ ] **Expected**: Can navigate with keyboard

### FW-20: Mobile Touch Targets ✅

- [ ] Open FlickWord on mobile device (or mobile viewport)
- [ ] Try tapping keyboard keys
- [ ] **Expected**: Keys are easy to tap (at least 44x44px)
- [ ] **Expected**: No accidental taps on adjacent keys

---

## Additional Accessibility Tests

### Screen Reader Test

- [ ] Open with NVDA (Windows) or VoiceOver (Mac)
- [ ] Navigate through entire game flow
- [ ] **Expected**: All game elements are announced
- [ ] **Expected**: Game state is clear
- [ ] **Expected**: Notifications are announced

### Keyboard-Only Test

- [ ] Unplug mouse/trackpad
- [ ] Complete entire game using only keyboard
- [ ] **Expected**: Can type letters
- [ ] **Expected**: Can press Enter to submit
- [ ] **Expected**: Can press Backspace to delete
- [ ] **Expected**: Can close modal with Escape

### Mobile Device Test

- [ ] Test on actual mobile device
- [ ] **Expected**: Modal is draggable with touch
- [ ] **Expected**: Keyboard is usable
- [ ] **Expected**: No horizontal scrolling
- [ ] **Expected**: Touch targets are adequate size

### Cross-Browser Test

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] **Expected**: All features work consistently

---

## Notes

- Mark each item as ✅ when verified
- Note any issues found in the "Issues Found" section below
- Test both desktop and mobile viewports
- Use browser DevTools to inspect elements

---

## Issues Found

_Record any problems discovered during testing:_

1.
2.
3.

---

## Test Results Summary

- **Date**: ****\_\_\_****
- **Tester**: ****\_\_\_****
- **Browser**: ****\_\_\_****
- **Viewport**: Desktop / Mobile / Both
- **Overall Status**: ✅ Pass / ❌ Fail / ⚠️ Partial










