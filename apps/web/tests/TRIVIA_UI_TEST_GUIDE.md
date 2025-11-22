# Trivia UI Fixes - Test Guide

## Quick Start

### Run All Trivia UI Tests

```bash
# From apps/web directory
cd apps/web
npm run test:e2e -- trivia-ui-fixes

# Or from root directory
npm run test:e2e -- --grep "trivia-ui-fixes"
```

### Run Tests with UI (Interactive)

```bash
cd apps/web
npm run test:e2e:ui -- trivia-ui-fixes
```

## Available Test Commands

### 1. Automated E2E Tests (Playwright)

**Test File**: `apps/web/tests/e2e/trivia-ui-fixes.spec.ts`

**Run specific test file:**

```bash
cd apps/web
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts
```

**Run with specific browser:**

```bash
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts --project=chromium
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts --project=firefox
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts --project=webkit
```

**Run in headed mode (see browser):**

```bash
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts --headed
```

**Run in debug mode:**

```bash
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts --debug
```

**Run specific test:**

```bash
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts -g "keyboard navigation"
```

### 2. Manual Test Checklist

**File**: `apps/web/tests/manual/trivia-ui-fixes-checklist.md`

**How to use:**

1. Open the checklist file
2. Go through each item manually
3. Check off as you test
4. Note any issues found

**Quick manual test:**

1. Start dev server: `npm run dev` (from apps/web)
2. Navigate to home page
3. Click "Daily Trivia" card
4. Test keyboard navigation (Tab, Arrow keys, Enter)
5. Test on mobile viewport (resize browser)
6. Check screen reader (if available)

### 3. Accessibility Tests

**Run axe accessibility audit:**

```bash
# Start dev server first
npm run dev

# In another terminal, from root:
npm run a11y:axe
```

**Check accessibility with Playwright:**

```bash
cd apps/web
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts -g "Accessibility"
```

### 4. Type Checking & Linting

**Type check:**

```bash
cd apps/web
npm run typecheck
```

**Lint check:**

```bash
cd apps/web
npm run lint
```

**Fix linting issues:**

```bash
cd apps/web
npm run lint:fix
```

**Check everything:**

```bash
cd apps/web
npm run check-all
```

### 5. Visual Regression (if configured)

**Take screenshots:**

```bash
cd apps/web
npx playwright test tests/e2e/trivia-ui-fixes.spec.ts --update-snapshots
```

## Test Coverage

The `trivia-ui-fixes.spec.ts` test file covers:

✅ **UI-1**: Keyboard navigation (arrow keys, Tab, Enter)  
✅ **UI-2**: ARIA labels and screen reader support  
✅ **UI-3**: Focus indicators  
✅ **UI-4**: Mobile responsiveness  
✅ **UI-5**: Loading spinner  
✅ **UI-6**: Pro game header styling  
✅ **UI-7**: Touch support for dragging  
✅ **UI-8**: Progress bar size  
✅ **UI-9**: Error message display  
✅ **UI-10**: Button click feedback  
✅ **UI-11**: Explanation animation  
✅ **UI-12**: Stats card click behavior  
✅ **UI-13**: Score circle aria-label  
✅ **UI-14**: Responsive button text  
✅ **UI-15**: Color contrast  
✅ **UI-16**: Disabled button explanation  
✅ **UI-17**: Button wrapping on mobile  
✅ **UI-18**: Answer animations  
✅ **UI-19**: Modal z-index  
✅ **UI-20**: Reduced motion support

Plus additional accessibility and cross-browser tests.

## Recommended Test Workflow

### 1. Quick Smoke Test (2 minutes)

```bash
cd apps/web
npm run test:e2e -- trivia-ui-fixes -g "keyboard|ARIA|focus"
```

### 2. Full Automated Suite (5-10 minutes)

```bash
cd apps/web
npm run test:e2e -- trivia-ui-fixes
```

### 3. Manual Visual Check (10 minutes)

- Open `apps/web/tests/manual/trivia-ui-fixes-checklist.md`
- Test in browser manually
- Check on real mobile device if possible

### 4. Accessibility Audit (5 minutes)

```bash
# Start dev server
npm run dev

# Run axe (from root)
npm run a11y:axe
```

## Troubleshooting

### Tests fail to find elements

- Make sure dev server is running: `npm run dev`
- Check that modal opens correctly
- Verify game loads (check console for errors)

### Playwright not installed

```bash
cd apps/web
npx playwright install
```

### Tests timeout

- Increase timeout in test file
- Check network conditions
- Verify API is responding

## Test Results Location

- **Playwright reports**: `apps/web/test-results/`
- **Screenshots**: `apps/web/test-results/` (on failure)
- **Video**: `apps/web/test-results/` (if configured)

## Next Steps After Tests

1. Review test results
2. Fix any failing tests
3. Update manual checklist with results
4. Document any edge cases found
5. Commit changes if all tests pass














