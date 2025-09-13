# Test Plan - Core Stabilization Verification

## Test Environment Setup
- **Desktop**: Chrome/Firefox on Windows 10, 1920x1080
- **Mobile**: Chrome DevTools responsive mode, 375x667 and 414x896
- **Test Data**: Sample user with authentication, sample TV shows/movies in lists

## 1. Tabs Above Results Test

### Test Steps
1. **Home Tab Test**
   - Navigate to home tab
   - Perform search with query "test"
   - Verify tabs remain visible above search results
   - Verify search results appear below tabs
   - Clear search and verify tabs remain visible

2. **Non-Home Tab Test**
   - Navigate to "Watching" tab
   - Perform search with query "test"
   - Verify tabs remain visible above search results
   - Verify search results appear below tabs
   - Switch to "Wishlist" tab and verify search results hidden

3. **Z-Index Verification**
   - Open browser dev tools
   - Inspect tab container element
   - Verify `z-index: 100` is applied
   - Inspect search results element
   - Verify `z-index: 50` is applied

### Expected Results
- ✅ Tabs always visible during search
- ✅ Search results appear below tabs
- ✅ Z-index hierarchy: tabs (100) > search results (50)
- ✅ No visual overlap or layering issues

## 2. Theming Consistency Test

### Test Steps
1. **Dark Mode Test**
   - Switch to dark mode
   - Verify all text is readable (contrast ≥ 4.5:1)
   - Check tab counts are visible
   - Verify search results styling
   - Test on all tabs (Home, Watching, Wishlist, Watched, Discover)

2. **Regular Mode Test**
   - Switch to regular/light mode
   - Verify consistent styling across all components
   - Check tab counts are visible
   - Verify search results styling

3. **Mardi Gras Mode Test**
   - Switch to Mardi Gras mode
   - Verify festive styling applied consistently
   - Check tab counts are visible
   - Verify search results styling

4. **Theme Persistence Test**
   - Switch themes multiple times
   - Refresh page and verify theme persists
   - Verify no theme conflicts or race conditions

### Expected Results
- ✅ All text readable in all themes
- ✅ Tab counts visible in all themes
- ✅ Consistent styling across components
- ✅ Theme persistence across page refreshes
- ✅ No hardcoded colors visible

## 3. i18n Pipeline Test

### Test Steps
1. **English to Spanish Test**
   - Start with English interface
   - Switch to Spanish
   - Verify all visible text updates to Spanish
   - Check search results language
   - Verify no raw translation keys visible

2. **Spanish to English Test**
   - Start with Spanish interface
   - Switch to English
   - Verify all visible text updates to English
   - Check search results language
   - Verify no raw translation keys visible

3. **Raw Key Detection Test**
   - Search for "all_genres" in page source
   - Verify it's translated to "All Genres" or "Todos los Géneros"
   - Check for any other raw translation keys

4. **Live Translation Test**
   - Perform search in English
   - Switch to Spanish
   - Verify search results update to Spanish
   - Switch back to English
   - Verify search results update to English

### Expected Results
- ✅ All text translates live without page refresh
- ✅ No raw translation keys visible
- ✅ Search results language updates correctly
- ✅ Translation persistence across page refreshes

## 4. Auth Profile Display Test

### Test Steps
1. **Signed Out State Test**
   - Sign out if currently signed in
   - Verify account button shows "Sign In"
   - Verify no username/snark displayed
   - Check settings access (should prompt sign in)

2. **Sign In Test**
   - Sign in with test account
   - Verify account button shows username
   - Verify snark text appears
   - Check settings access (should work without prompts)

3. **Profile Update Test**
   - Update username in settings
   - Verify account button updates
   - Verify snark text updates
   - Check profile persistence

4. **Settings Access Test**
   - While signed in, access settings
   - Verify no "please sign in" prompts
   - Verify all settings accessible
   - Test profile editing functionality

### Expected Results
- ✅ Username displayed when signed in
- ✅ Snark text appears when signed in
- ✅ Settings accessible without prompts when signed in
- ✅ Profile updates reflect immediately
- ✅ No false "sign in" prompts

## 5. Mobile Layout Stability Test

### Test Steps
1. **Mobile Card Grid Test**
   - Set viewport to 375x667 (iPhone SE)
   - Verify card grid is stable
   - Check for horizontal scroll issues
   - Verify poster dimensions are consistent
   - Test on different screen sizes (414x896, 360x640)

2. **Mobile Search Test**
   - Perform search on mobile
   - Verify search results display properly
   - Check for overflow issues
   - Verify tabs remain accessible

3. **Mobile Responsive Test**
   - Test breakpoints: 320px, 375px, 414px, 768px
   - Verify layout adapts smoothly
   - Check for content clipping
   - Verify touch targets are appropriate size

4. **Mobile Container Test**
   - Test FlickWord container on mobile
   - Test Daily Trivia container on mobile
   - Verify containers are usable
   - Check for content clipping

### Expected Results
- ✅ Stable card grid on all mobile sizes
- ✅ No horizontal scroll issues
- ✅ Consistent poster dimensions
- ✅ Proper responsive breakpoints
- ✅ Usable game containers

## 6. FlickWord & Daily Trivia Containers Test

### Test Steps
1. **FlickWord Container Test**
   - Open FlickWord modal
   - Verify container sizes properly
   - Check for content clipping
   - Test scrolling if needed
   - Verify responsive behavior

2. **Daily Trivia Container Test**
   - Open Daily Trivia modal
   - Verify container sizes properly
   - Check for content clipping
   - Test scrolling if needed
   - Verify responsive behavior

3. **Container Height Test**
   - Test on different screen sizes
   - Verify containers adapt to viewport
   - Check for overflow issues
   - Verify content is fully visible

4. **Modal Sizing Test**
   - Test game modals on mobile
   - Verify proper sizing
   - Check for content accessibility
   - Test close/open functionality

### Expected Results
- ✅ Containers size properly
- ✅ No content clipping
- ✅ Proper scroll management
- ✅ Responsive modal sizing
- ✅ Usable on all screen sizes

## Success Criteria Summary

### Must Pass (Critical)
1. ✅ Tabs always above search results
2. ✅ All themes readable and consistent
3. ✅ Username + snark display when signed in
4. ✅ Settings accessible without false prompts

### Should Pass (Important)
5. ✅ Live language switching works
6. ✅ No raw translation keys visible
7. ✅ Mobile layout stable and responsive

### Nice to Pass (Enhancement)
8. ✅ Game containers properly sized
9. ✅ No content clipping anywhere
10. ✅ Smooth responsive transitions