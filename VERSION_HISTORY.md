# Flicklet Version History

## Version 23.84 - Phase B Complete (Accessibility & Performance)

**Date**: January 12, 2025  
**Type**: Major Enhancement  
**Scope**: Accessibility, Performance, UX

### Changes Made
- **ARIA Hygiene**: Removed prohibited combinations, ensured proper structure
- **Contrast Tokens**: Updated to WCAG AA compliance (4.5:1 ratio)
- **Mobile Font Floor**: Enforced 16px base, 12px clamped for accessibility
- **Critical CSS**: Inlined above-the-fold styles for faster loading
- **Async CSS**: Non-critical styles load asynchronously with preload
- **Script Deferring**: 6+ non-critical scripts deferred for performance
- **Build System**: Added production build script for minification
- **Focus Styles**: Enhanced focus-visible outlines for keyboard navigation

### Technical Improvements
- **Accessibility**: Target 95+ Lighthouse score (from 88)
- **Performance**: Mobile 65+, Desktop 80+ (from 52/73)
- **Bundle Optimization**: Critical path optimization implemented
- **WCAG Compliance**: AA standards met for contrast and font sizes

### Files Modified
- `www/index.html` - Critical CSS inlined, async loading, script deferring
- `www/styles/components.css` - Contrast tokens updated
- `www/styles/mobile.css` - Font size enforcement added
- `www/styles/card-system.css` - ARIA hygiene fixes
- `www/build.js` - Production build system

---

## Version 15.3 - KISS Responsive Sizing System

**Date**: January 9, 2025  
**Type**: Feature Enhancement  
**Scope**: Responsive Design System

### Changes Made
- **Implemented KISS responsive system**: Mobile-first approach with simple breakpoints
- **Created responsive container system**: 16px mobile, 24px tablet, 32px desktop padding
- **Standardized card sizing**: 64px mobile, 120px tablet, 184px desktop
- **Added CSS variables**: Centralized sizing system for easy maintenance
- **Created documentation**: KISS_RESPONSIVE_SYSTEM.md with usage guide
- **Added test page**: test-responsive-sizing.html for validation
- **Fixed tab switching**: App now starts on home page instead of watching tab
- **Disabled conflicting systems**: Removed SimpleTabManager override that was interfering

### Technical Details
- Mobile-first CSS approach (0-767px default, scale up)
- Three clear breakpoints: Mobile, Tablet (768px+), Desktop (1024px+)
- Touch-friendly 44px minimum touch targets
- Consistent 2:3 aspect ratio for all cards
- CSS variables for easy maintenance and updates

### Files Modified
- `www/index.html` - Version bump to v15.3
- `www/styles/main.css` - KISS responsive system implementation
- `www/scripts/inline-script-02.js` - Fixed DOM detection for tab switching
- `www/scripts/simple-tab-manager.js` - Disabled conflicting override
- `www/scripts/refactor-validation.js` - Fixed auto-switching tests

### Files Created
- `www/KISS_RESPONSIVE_SYSTEM.md` - Complete usage documentation
- `www/test-responsive-sizing.html` - Interactive test page
- `www/ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md` - Updated architecture docs

### Testing
- Responsive sizing works across all screen sizes
- Touch targets meet accessibility standards
- Cards scale properly from mobile to desktop
- Container padding adjusts correctly
- Tab switching starts on home page

---

## Version 14.7 - Overflow Menu Crash Fix

**Date**: January 9, 2025  
**Type**: Hotfix  
**Scope**: Card Component Overflow Menu

### Changes Made
- **Fixed scope issue**: Replaced `isMenuOpen` variable with proper closure-scoped `menuOpen` state
- **Named event handlers**: Implemented `openMenu()`, `closeMenu()`, `onDocClick()`, `onKeyDown()` for proper cleanup
- **Event listener cleanup**: Added proper `removeEventListener` calls to prevent memory leaks
- **Menu positioning**: Updated CSS for better menu positioning and z-index stacking
- **Accessibility**: Maintained keyboard navigation and focus management

### Technical Details
- Fixed `ReferenceError: isMenuOpen is not defined` crash in Card.js line ~275
- Menu now opens/closes reliably without scope conflicts
- Proper event delegation and cleanup prevents memory leaks
- Menu positioned correctly above cards with `z-index: 1000`

### Files Modified
- `www/scripts/components/Card.js` - Fixed scope and event handling
- `www/styles/components.css` - Updated menu positioning styles
- `www/index.html` - Version bump to v14.7

### Testing
- Overflow menu opens/closes consistently
- No console errors related to scope issues
- Proper cleanup on outside clicks and Escape key
- Maintains accessibility features

---

## Version 14.6 - Phase 1 Card Standardization
**Date:** January 9, 2025
**Changes:**
- Implemented unified Card component with compact/expanded variants
- Updated all Home rows to use standardized Card component:
  - Currently Watching Preview row
  - Next Up This Week row  
  - Curated rows (Trending, Staff Picks, New This Week)
  - Personalized rows
- Removed synopsis from Home rows (compact variant only shows poster + overlay)
- Standardized star ratings across all cards (no thumbs)
- Implemented consistent badge system (small ribbons, not pills)
- Added unified overflow menu pattern ("••• More" button)
- Updated CSS with proper design tokens and responsive behavior
- Added comprehensive i18n support for all card actions
- Maintained backward compatibility with feature flag system
- Fixed sticky search behavior (no overflow/transform on ancestors)

## Version 12.0 - Version Management System
**Date:** January 9, 2025
**Changes:**
- Created comprehensive version history documentation
- Added VERSION_HISTORY.md with detailed change log
- Added VERSION_QUICK_REFERENCE.md for quick rollback reference
- Created main README.md with version management info
- Established version tracking system for easy rollbacks
- Documented all recent episode tracking fixes and improvements

## Version 11.9 - Episode Tracking Modal UI Improvements
**Date:** January 9, 2025
**Changes:**
- Fixed episode tracking modal overflow and scrolling issues
- Reduced font sizes throughout modal for better content density
- Added custom scrollbar styling for better visibility
- Improved modal sizing (85vh height, 90vw width)
- Enhanced season and episode container layouts
- Individual season episodes now scroll independently (max 250px height)

## Version 11.8 - Episode Tracking Modal Layout Fix
**Date:** January 9, 2025
**Changes:**
- Fixed episode tracking modal content extending beyond boundaries
- Added specific CSS overrides for episode tracking modal
- Set proper overflow handling and flex layouts
- Constrained seasons content within modal boundaries

## Version 11.7 - Episode Tracking API Key Fix
**Date:** January 9, 2025
**Changes:**
- Fixed TMDB API key lookup in episode tracking system
- Updated API key resolution to check multiple sources:
  - `window.TMDB_CONFIG?.apiKey` (primary)
  - `window.__TMDB_API_KEY__` (secondary)
  - `window.TMDB_API_KEY` (fallback)
- Added debug logging for API key detection
- Resolved 401 Unauthorized errors when opening episode modal

## Version 11.6 - Episode Tracking Event Handler Fix
**Date:** January 9, 2025
**Changes:**
- Fixed episode tracking click event listener not being initialized
- Moved event listener outside conditional DOMContentLoaded block
- Added event capture phase to ensure proper event handling
- Added comprehensive debug logging for event detection
- Removed duplicate event listener that was causing conflicts

## Version 11.5 - Episode Tracking Button Display Fix
**Date:** January 9, 2025
**Changes:**
- Fixed "Track Episodes" button not appearing on watching list cards
- Updated `createShowCard` function to include button for non-search cards
- Added debug logging for button creation and visibility
- Fixed conditional rendering logic for episode tracking buttons

## Version 11.4 - Episode Tracking Stack Overflow Fix
**Date:** January 9, 2025
**Changes:**
- Fixed infinite recursion in `updateEpisodeTrackingUI` function
- Removed recursive call that was causing "Maximum call stack size exceeded" error
- Added proper UI update handling without recursion
- Fixed episode tracking toggle functionality

## Version 11.3 - Previous Version
**Date:** [Previous session]
**Changes:**
- [Previous changes not documented]

## Version 11.2 - Previous Version
**Date:** [Previous session]
**Changes:**
- [Previous changes not documented]

## Version 11.1 - Previous Version
**Date:** [Previous session]
**Changes:**
- [Previous changes not documented]

---

## How to Use This Version History

### Rolling Back to a Previous Version
1. Check the version number in the top-left corner of the app (versionIndicator)
2. Find the desired version in this table
3. Use git to revert to the commit that created that version
4. Or manually apply the reverse changes listed in the "Changes" section

### Finding Issues
- If you encounter a bug, check this table to see when it might have been introduced
- Look for the most recent version that worked correctly
- Consider rolling back to that version temporarily

### Development Notes
- Each version increment should be accompanied by a clear description of changes
- Include both what was fixed and what new functionality was added
- Note any breaking changes or important behavioral differences
- Always test thoroughly before marking a version as complete

---

## Current Status
**Latest Version:** 11.9
**Last Updated:** January 9, 2025
**Current Issue:** Episode tracking modal UI improvements completed
**Next Steps:** Continue testing and refinement as needed
