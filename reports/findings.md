# Root Cause Analysis - Core Stabilization Issues

## A. Tabs > Search Results (z-order & mount order) - SEVERITY: HIGH

### Root Cause
**Multiple conflicting z-index systems and DOM mount order inconsistencies**

**Evidence:**
- Tab container: `z-index: 10` (components.css:1266)
- Search results: `z-index: 5` (components.css:1280)
- Search results positioned outside home section (index.html:190-195)
- Multiple tab positioning scripts running simultaneously

**Issues Found:**
1. **Z-Index Conflicts**: Modal z-indexes (99999) override tab container (10)
2. **Mount Order Issues**: Search results container positioned between search bar and tabs
3. **Multiple Tab Managers**: 4+ different scripts managing tab positioning
4. **CSS Conflicts**: Duplicate tab container rules across multiple files

**Minimal Fix:**
- Consolidate z-index system: tabs (z-index: 100), search results (z-index: 50)
- Ensure DOM order: `.top-search` → `.tab-container` → `#searchResults` → content
- Remove duplicate tab positioning scripts
- Single source of truth for tab container CSS

## B. Theming Tokens & Modes - SEVERITY: HIGH

### Root Cause
**Three separate theme systems running simultaneously with conflicting CSS variables**

**Evidence:**
- Main theme system: `www/js/app.js:68-75` (flicklet-theme)
- MP-ThemePacks system: `www/scripts/inline-script-01.js:3612-3668` (flicklet:theme)
- Mardi Gras system: `www/scripts/inline-script-01.js:867-875` (mardi-gras)
- Duplicate CSS variables across multiple files

**Issues Found:**
1. **Conflicting Storage Keys**: `flicklet-theme` vs `flicklet:theme` vs `mardi-gras`
2. **CSS Variable Duplication**: Dark mode variables defined in 3+ places
3. **Theme Application Race Conditions**: Multiple systems applying themes simultaneously
4. **Inconsistent Token Usage**: Hardcoded colors instead of CSS variables

**Minimal Fix:**
- Single theme storage key: `flicklet-theme`
- Centralized CSS variables in `:root` with theme-specific overrides
- Remove MP-ThemePacks system, keep only main theme + Mardi Gras
- Replace hardcoded colors with CSS variables

## C. i18n Pipeline - SEVERITY: MEDIUM

### Root Cause
**Multiple language switching systems with inconsistent delegation patterns**

**Evidence:**
- LanguageManager: `www/js/language-manager.js:359-386`
- App language: `www/js/app.js:77-86`
- Inline script delegation: `www/scripts/inline-script-01.js:845-865`
- Raw translation keys found: `all_genres` (index.html:170)

**Issues Found:**
1. **Delegation Chain Complexity**: LanguageManager → FlickletApp → applyTranslations
2. **Raw Translation Keys**: `all_genres` not translated
3. **Inconsistent Loading**: Translation bundles may load after first render
4. **Multiple Language Storage**: Settings vs localStorage inconsistency

**Minimal Fix:**
- Single `t(key, vars?)` utility function
- Ensure translation bundles load before first render
- Replace all raw keys with translated strings
- Consistent language storage in app settings

## D. Auth → Profile ViewModel - SEVERITY: HIGH

### Root Cause
**Fragmented authentication state management with multiple UI update paths**

**Evidence:**
- Main auth listener: `www/js/app.js:169-359`
- Account button management: `www/scripts/inline-script-01.js:1756-1797`
- User data loading: `www/scripts/inline-script-02.js:466-566`
- Settings auth check: `www/scripts/inline-script-02.js:2477`

**Issues Found:**
1. **Multiple Auth Listeners**: Main listener + disabled legacy listener
2. **Inconsistent UI Updates**: Account button vs profile display vs settings access
3. **Settings Auth Gates**: "Please sign in" warnings even when authenticated
4. **Username/Snark Display**: Inconsistent population of user profile elements

**Minimal Fix:**
- Single auth observer producing `UserViewModel { isAuthenticated, displayName, alias, avatarUrl }`
- Centralized UI updates from single ViewModel
- Remove duplicate auth listeners
- Consistent settings access control

## E. Mobile Base Layout / Cards - SEVERITY: MEDIUM

### Root Cause
**Inconsistent mobile detection and responsive breakpoint management**

**Evidence:**
- Mobile detection: `www/index.html:71-72` (user agent + viewport)
- Card system: `www/styles/components.css:86-137` (component tokens)
- Mobile adjustments: `www/styles/components.css:1064-1143`
- Poster standardization: `www/styles/components.css:1107-1120`

**Issues Found:**
1. **Mobile Detection Inconsistency**: User agent vs viewport width
2. **Card Grid Instability**: Inconsistent `minmax()` usage across breakpoints
3. **Poster Dimension Conflicts**: Multiple poster width/height definitions
4. **Horizontal Scroll Issues**: Overflow not properly contained

**Minimal Fix:**
- Single mobile detection system using viewport width
- Consistent card grid using `minmax()` and container queries
- Standardized poster dimensions with single source of truth
- Proper overflow containment

## F. FlickWord & Daily Trivia Containers - SEVERITY: LOW

### Root Cause
**Container sizing and scroll management inconsistencies**

**Evidence:**
- FlickWord mount: `www/index.html:1197-1265`
- Trivia mount: `www/index.html:1754-1777`
- Container styling: `www/styles/main.css:1579-2459`
- Game modal sizing: `www/styles/main.css:2379-2425`

**Issues Found:**
1. **Container Height Issues**: Fixed heights may not work on all screen sizes
2. **Scroll Management**: Inconsistent overflow handling
3. **Modal Sizing**: Game modals may not fit properly on mobile
4. **Mount Point Conflicts**: Multiple systems trying to mount games

**Minimal Fix:**
- Consistent container height using `clamp()` and viewport units
- Proper scroll management with `overflow-y: auto`
- Responsive modal sizing
- Single mount point system

## Summary of Critical Issues

### Must Fix (Phase B Priority 1)
1. **Z-Index System** - Consolidate to single z-index hierarchy
2. **Theme System** - Remove duplicate theme systems, use single CSS variables
3. **Auth ViewModel** - Single auth observer with centralized UI updates

### Should Fix (Phase B Priority 2)
4. **i18n Pipeline** - Single translation utility with proper loading order
5. **Mobile Layout** - Consistent responsive system with proper overflow

### Nice to Fix (Phase B Priority 3)
6. **Game Containers** - Consistent sizing and scroll management

## Success Criteria Validation

### Tabs Above Results ✅ (After Fix)
- Tabs: `z-index: 100`
- Search Results: `z-index: 50`
- DOM order: search → tabs → results → content

### Theming Consistency ✅ (After Fix)
- Single theme storage key
- Centralized CSS variables
- No hardcoded colors
- Consistent dark/regular/Mardi Gras modes

### i18n Working ✅ (After Fix)
- Single `t()` function
- No raw translation keys
- Live language switching
- Proper bundle loading order

### Auth Profile Display ✅ (After Fix)
- Single auth observer
- Username + snark display
- Settings access control
- No false "sign in" prompts

### Mobile Stability ✅ (After Fix)
- Consistent card grid
- No horizontal scroll
- Proper poster dimensions
- Responsive breakpoints

### Game Containers ✅ (After Fix)
- Proper sizing
- Scroll management
- No clipped content
- Responsive modals