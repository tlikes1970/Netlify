# Trivia Game UI Fixes - Manual Test Checklist

## Critical Priority Tests

### ✅ UI-1: Keyboard Navigation

- [ ] Open trivia game
- [ ] Press Tab to focus first answer option
- [ ] Press ArrowDown - should move to next option
- [ ] Press ArrowUp - should move to previous option
- [ ] Press Enter on an option - should select it
- [ ] After selecting, press Enter/Space - should go to next question
- [ ] **Expected**: All navigation works without mouse

### ✅ UI-2: ARIA Labels & Screen Reader Support

- [ ] Open trivia game with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Screen reader should announce "Trivia game"
- [ ] Screen reader should announce question number (e.g., "Question 1 of 5")
- [ ] Screen reader should announce each answer option
- [ ] After selecting, screen reader should announce "Correct answer" or "Incorrect answer"
- [ ] **Expected**: Screen reader can navigate and understand entire game

### ✅ UI-3: Focus Indicators

- [ ] Open trivia game
- [ ] Press Tab to focus elements
- [ ] **Expected**: Blue outline (3px) appears around focused elements
- [ ] Focus should be clearly visible on all buttons

### ✅ UI-4: Mobile Responsiveness

- [ ] Open trivia game on mobile device (or resize browser to 375x667)
- [ ] Modal should fit screen (95vw x 95vh)
- [ ] Content should be scrollable if needed
- [ ] Buttons should not be cut off
- [ ] **Expected**: Game is fully playable on mobile

## High Priority Tests

### ✅ UI-5: Loading Spinner

- [ ] Open trivia game
- [ ] **Expected**: Spinning animation appears while loading
- [ ] Spinner should be visible and animated

### ✅ UI-6: Pro Game Header Styling

- [ ] Log in as Pro user
- [ ] Open trivia game
- [ ] **Expected**: "Game 1 of 5" header appears with proper styling (background, border, padding)
- [ ] Completed games count should be visible

### ✅ UI-7: Touch Support for Dragging

- [ ] Open trivia game on touch device
- [ ] Touch and drag the modal header
- [ ] **Expected**: Modal moves with finger
- [ ] Modal should stay within viewport bounds

### ✅ UI-8: Progress Bar Visibility

- [ ] Open trivia game
- [ ] **Expected**: Progress bar is at least 150px wide and 8px tall
- [ ] Progress bar should be clearly visible
- [ ] Progress fill should animate smoothly

### ✅ UI-9: Error Message Display

- [ ] Disable network in DevTools (or mock API failure)
- [ ] Open trivia game
- [ ] **Expected**: Red error banner appears saying "Failed to load questions from server. Using backup questions."
- [ ] Game should still work with fallback questions

### ✅ UI-10: Button Click Feedback

- [ ] Open trivia game
- [ ] Click an answer option
- [ ] **Expected**:
  - Button has hover effect (slight lift, shadow)
  - Correct answers pulse/glow green
  - Incorrect answers shake/glow red
  - Visual feedback is immediate

## Medium Priority Tests

### ✅ UI-11: Explanation Animation

- [ ] Open trivia game
- [ ] Select an answer
- [ ] **Expected**: Explanation fades in smoothly (not instant)
- [ ] Animation should be subtle and professional

### ✅ UI-12: Stats Card Click Behavior

- [ ] Go to home page
- [ ] Hover over Trivia card
- [ ] **Expected**: Entire card highlights (not just button)
- [ ] Clicking anywhere on card opens game
- [ ] Stats inside card don't trigger separate click

### ✅ UI-13: Score Circle Accessibility

- [ ] Complete a trivia game
- [ ] **Expected**: Score circle has aria-label describing score
- [ ] Screen reader announces: "Score: X out of Y correct, Z percent"

### ✅ UI-14: Responsive Button Text

- [ ] Open trivia game on mobile (320px width)
- [ ] Complete a game to see completion screen
- [ ] **Expected**: Button text adapts (e.g., "Next" instead of "Next Question")
- [ ] Text should not overflow buttons

### ✅ UI-15: Color Contrast

- [ ] Open trivia game
- [ ] Check difficulty badge
- [ ] **Expected**: Text is clearly readable (dark gray background #404040, light gray text #e0e0e0)
- [ ] Should pass WCAG AA contrast ratio (4.5:1)

### ✅ UI-16: Disabled Button Explanation

- [ ] Open trivia game
- [ ] Select an answer
- [ ] Hover over disabled options
- [ ] **Expected**: Screen reader announces why buttons are disabled
- [ ] Visual indication (opacity, cursor) is clear

### ✅ UI-17: Button Wrapping on Mobile

- [ ] Complete a game on mobile (375px width)
- [ ] **Expected**: Completion buttons wrap to new line if needed
- [ ] Buttons stack vertically on very small screens
- [ ] No buttons are cut off

### ✅ UI-18: Answer Animations

- [ ] Open trivia game
- [ ] Select correct answer
- [ ] **Expected**: Green pulse animation
- [ ] Select incorrect answer
- [ ] **Expected**: Red shake animation
- [ ] Animations should be smooth (not janky)

## Low Priority Tests

### ✅ UI-19: Modal Z-Index

- [ ] Open trivia game
- [ ] Open another modal (if available)
- [ ] **Expected**: Trivia modal appears above other content
- [ ] No z-index conflicts

### ✅ UI-20: Reduced Motion Support

- [ ] Enable "Reduce motion" in OS settings
- [ ] Open trivia game
- [ ] Select answers
- [ ] **Expected**:
  - No animations play
  - Spinner doesn't spin (just shows static)
  - Transitions are instant
  - Game still fully functional

## Cross-Cutting Tests

### Accessibility Audit

- [ ] Run axe DevTools on trivia game
- [ ] **Expected**: No critical or serious violations
- [ ] All interactive elements have labels
- [ ] Color contrast passes WCAG AA

### Performance

- [ ] Open trivia game
- [ ] **Expected**: Game loads in < 2 seconds
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts

### Browser Compatibility

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] **Expected**: All features work in all browsers

## Test Results Template

```
Date: __________
Tester: __________
Browser: __________
Device: __________

Results:
- UI-1: ✅ Pass / ❌ Fail (Notes: ________)
- UI-2: ✅ Pass / ❌ Fail (Notes: ________)
- UI-3: ✅ Pass / ❌ Fail (Notes: ________)
... (continue for all 20 items)

Overall: ✅ All Pass / ❌ Issues Found

Issues Found:
1. ________
2. ________
```











