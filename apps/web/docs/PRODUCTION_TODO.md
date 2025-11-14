# Production Readiness Todo List

This document tracks open items that need to be addressed before production deployment.

## Theme & UI Issues

### ✅ Completed

- [x] Fix Community section dark colors in light mode (2024-11-XX)
  - Updated CommunityPanel component to use CSS variables
  - Updated CommunityPlayer component to use CSS variables
  - All hardcoded `bg-neutral-900`, `text-neutral-200/400/500` replaced with theme-aware variables

### 🔄 In Progress

- [ ] Verify all Community section components render correctly in light mode
- [ ] Test theme switching between light/dark modes
- [ ] Check for any remaining hardcoded dark colors in other components

### 📋 Open Items

- [ ] Audit all components for hardcoded color values (search for `bg-neutral-`, `text-neutral-`, etc.)
- [ ] Ensure all hover states work correctly in both themes
- [ ] Verify accessibility contrast ratios meet WCAG AA standards in both themes
- [ ] Test responsive design in both light and dark modes

## Code Quality

### 📋 Open Items

- [ ] Fix linter warnings in CommunityPanel.tsx (any types on window properties)
- [ ] Fix linter warning in CommunityPlayer.tsx (useEffect dependency)
- [ ] Review and fix any TypeScript `any` types throughout codebase
- [ ] Ensure all components have proper TypeScript types
- [ ] Add error boundaries where missing

## Testing

### 📋 Open Items

- [ ] Write tests for CommunityPanel component
- [ ] Write tests for CommunityPlayer component
- [ ] Test theme switching functionality
- [ ] Test responsive layouts on mobile/tablet/desktop
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Test accessibility with screen readers

## Performance

### 📋 Open Items

- [ ] Audit bundle size and optimize if needed
- [ ] Check for memory leaks in components
- [ ] Verify lazy loading is working correctly
- [ ] Optimize image/video loading

## Documentation

### 📋 Open Items

- [ ] Update component documentation for theme-aware styling
- [ ] Document CSS variable usage patterns
- [ ] Create style guide for future theme-aware components

## Community Player Queue

### 📋 Open Items

- [ ] Design queue UI/UX
  - Display upcoming films in queue
  - Show current film and next film preview
  - Add queue management controls (skip, reorder, etc.)
- [ ] Implement queue data structure
  - Move hardcoded playlist to Firestore collection or config file
  - Add metadata for each film (title, year, description, thumbnail)
  - Store queue order and rotation logic
- [ ] Build queue display component
  - Show upcoming films list
  - Display film thumbnails/metadata
  - Add "Next up" indicator
- [ ] Add queue management features
  - Allow admins to reorder queue
  - Allow users to see upcoming films
  - Implement skip functionality (if authorized)
- [ ] Update weekly rotation automation
  - Ensure automation updates queue correctly
  - Add error handling for rotation failures
- [ ] Add film metadata display
  - Show film title, year, director, description
  - Add film poster/thumbnail images
  - Link to Archive.org film page
- [ ] Test queue functionality
  - Verify queue displays correctly
  - Test rotation logic
  - Verify metadata loads properly

## Settings Page Redesign

### 📋 Layout Improvements

- [ ] Redesign desktop layout
  - Optimize sidebar navigation for better UX
  - Improve spacing and visual hierarchy
  - Ensure consistent styling across all tabs
  - Add section dividers and better grouping
- [ ] Improve tab organization
  - Review and optimize tab structure
  - Ensure logical grouping of settings
  - Add icons to tabs for better visual recognition
- [ ] Enhance visual design
  - Improve contrast and readability
  - Add subtle animations/transitions
  - Ensure consistent button/input styling
  - Add loading states for async operations

### 📋 Mobile Optimization

- [ ] Implement mobile-first responsive design
  - Replace desktop sidebar with bottom sheet or modal on mobile
  - Use SettingsSheet component for mobile view
  - Ensure touch-friendly tap targets (min 44x44px)
- [ ] Optimize mobile navigation
  - Use segmented controls or tabs at top/bottom for mobile
  - Implement swipe gestures for tab switching
  - Add mobile-specific navigation patterns
- [ ] Improve mobile form inputs
  - Ensure inputs are properly sized for mobile
  - Add proper keyboard types (email, tel, etc.)
  - Implement proper form validation feedback
- [ ] Test mobile settings experience
  - Test on various screen sizes (320px - 768px)
  - Verify touch interactions work smoothly
  - Ensure settings are accessible on mobile
  - Test with iOS and Android devices
- [ ] Add mobile-specific features
  - Add pull-to-refresh for settings sync
  - Implement proper safe area insets for notched devices
  - Optimize for one-handed use

### 📋 Additional Improvements

- [ ] Add search functionality
  - Allow users to search for specific settings
  - Implement search highlighting
- [ ] Improve accessibility
  - Ensure proper ARIA labels
  - Add keyboard navigation support
  - Test with screen readers
- [ ] Add settings export/import
  - Allow users to export settings as JSON
  - Allow users to import settings
  - Add settings reset functionality

## Pro System Validation (Bloopers & Extras)

### 📋 Open Items

- [ ] Validate Pro feature gating works correctly
  - Verify Pro status check in TabCard component
  - Ensure bloopers/extras buttons are disabled for non-Pro users
  - Verify Pro badge/indicator displays correctly
- [ ] Test bloopers functionality end-to-end
  - Verify ExtrasProvider.fetchBloopers() works correctly
  - Test TMDB API integration for bloopers
  - Test YouTube search integration for bloopers
  - Verify BloopersModal displays content correctly
  - Test video playback in modal
  - Verify empty states display correctly
- [ ] Test extras functionality end-to-end
  - Verify ExtrasProvider.fetchExtras() works correctly
  - Test TMDB API integration for extras
  - Test YouTube search integration for extras
  - Verify ExtrasModal displays content correctly
  - Test video playback in modal
  - Verify empty states display correctly
- [ ] Validate Pro feature flags
  - Test settings.pro.isPro flag propagation
  - Verify settings.pro.features.bloopersAccess flag
  - Verify settings.pro.features.extrasAccess flag
  - Test Pro status toggle in AdminExtrasPage
- [ ] Test Pro feature UI states
  - Verify disabled state styling (opacity, tooltips)
  - Test upgrade prompts for non-Pro users
  - Verify Pro badge displays on cards
- [ ] Validate content quality and moderation
  - Review AdminExtrasPage approval workflow
  - Test video approval/rejection process
  - Verify UGC submission handling
  - Test content reporting functionality
- [ ] Test error handling
  - Verify API failures are handled gracefully
  - Test network timeout scenarios
  - Verify fallback content loading
- [ ] Performance testing
  - Test loading performance for bloopers/extras
  - Verify caching works correctly
  - Test with large video lists

## Payment Method & Process

### 📋 Open Items

- [ ] Set up Stripe account and configuration
  - Create Stripe account (if not exists)
  - Configure Stripe API keys (test and production)
  - Set up webhook endpoints
  - Configure Stripe dashboard settings
- [ ] Implement Stripe integration
  - Install Stripe SDK/package
  - Create Stripe checkout session endpoint (Cloud Function)
  - Implement client-side checkout flow
  - Add Stripe Elements for payment form
- [ ] Build Pro subscription management
  - Create subscription plans (monthly/yearly)
  - Implement subscription creation flow
  - Add subscription status checking
  - Implement subscription cancellation flow
  - Add subscription renewal handling
- [ ] Create payment UI components
  - Build Pro upgrade modal/page
  - Add pricing display component
  - Create payment method selection UI
  - Add subscription management UI in Settings
- [ ] Implement payment webhooks
  - Set up webhook handler (Cloud Function)
  - Handle payment.succeeded event
  - Handle payment.failed event
  - Handle customer.subscription.updated event
  - Handle customer.subscription.deleted event
  - Update user Pro status based on webhook events
- [ ] Add payment security
  - Implement server-side payment validation
  - Add payment fraud detection
  - Secure API keys and webhook secrets
  - Add rate limiting for payment endpoints
- [ ] Test payment flow end-to-end
  - Test with Stripe test cards
  - Test successful payment flow
  - Test failed payment handling
  - Test subscription cancellation
  - Test subscription renewal
  - Verify Pro status updates correctly
- [ ] Add payment error handling
  - Handle declined cards gracefully
  - Show user-friendly error messages
  - Add retry logic for failed payments
  - Log payment errors for debugging
- [ ] Compliance and legal
  - Add terms of service acceptance
  - Add privacy policy link
  - Add refund policy
  - Ensure PCI compliance
  - Add tax calculation (if needed)

## First Visit Intro / Onboarding

### 📋 Open Items

- [ ] Design onboarding flow
  - Map user journey for first-time visitors
  - Identify key features to highlight
  - Determine intro length and steps
  - Design skip/next/back navigation
- [ ] Build intro component system
  - Create IntroModal or IntroOverlay component
  - Implement step-by-step progression
  - Add progress indicator
  - Implement skip functionality
- [ ] Create intro content
  - Write welcome message
  - Create feature highlight slides
  - Add screenshots/mockups for key features
  - Write clear, concise copy for each step
- [ ] Implement intro triggers
  - Detect first visit (localStorage/cookie)
  - Check if user has completed intro before
  - Add manual trigger option in Settings
  - Respect user preference to skip
- [ ] Add intro steps for key features
  - Welcome and app overview
  - How to add shows/movies
  - How to use lists (Currently Watching, Want to Watch, etc.)
  - How to search and discover content
  - How to use Community features (games, player)
  - How to access Settings
  - Pro features overview (if applicable)
- [ ] Implement intro animations
  - Add smooth transitions between steps
  - Highlight UI elements with spotlight/overlay
  - Add tooltip-style pointers to features
  - Ensure animations are performant
- [ ] Add intro persistence
  - Store completion status in localStorage
  - Store completion status in user profile (if signed in)
  - Allow users to replay intro from Settings
- [ ] Test intro experience
  - Test on mobile devices
  - Test on desktop
  - Test with different screen sizes
  - Verify intro doesn't interfere with app functionality
  - Test skip functionality
  - Test completion tracking
- [ ] Accessibility for intro
  - Ensure keyboard navigation works
  - Add proper ARIA labels
  - Test with screen readers
  - Ensure intro doesn't trap focus
- [ ] Analytics for intro
  - Track intro start events
  - Track intro completion events
  - Track intro skip events
  - Track which steps users spend most time on
  - Use data to optimize intro flow

## "Where Am I Watching This" Feature

### 📋 Open Items

- [ ] Design "where am I watching this" UI/UX
  - Determine where to display viewing platform info (show detail page, card, list view)
  - Design platform selector/input component
  - Add visual indicators for viewing platform (icons, badges)
  - Consider quick actions (change platform, remove platform)
- [ ] Implement data model for viewing platforms
  - Add `viewingPlatform` field to library entries
  - Store platform name/service (Netflix, Hulu, Disney+, etc.)
  - Consider storing platform URL/link if applicable
  - Update Firestore schema if needed
- [ ] Build platform selection component
  - Create dropdown/selector for common streaming services
  - Allow custom platform entry
  - Add platform icons/logos if available
  - Implement search/filter for platform list
- [ ] Add platform management features
  - Allow users to set platform when adding to library
  - Allow users to update platform for existing items
  - Show platform info in library views
  - Add quick platform change action
- [ ] Integrate with library system
  - Update Library.upsert() to handle viewingPlatform
  - Update Firebase sync to include viewingPlatform
  - Ensure platform data persists across devices
  - Handle platform data in import/export
- [ ] Add platform display in UI
  - Show platform badge/icon on show/movie cards
  - Display platform in detail views
  - Add platform filter/sort in library views
  - Show platform in list views
- [ ] Test platform tracking functionality
  - Test adding platform when adding new items
  - Test updating platform for existing items
  - Test platform display in various views
  - Verify platform data syncs correctly
  - Test platform data in export/import

## Search & UI Improvements

### 📋 Open Items

- [ ] Fix search issue
  - Investigate search state management and error handling
  - Verify search results reset properly when switching views
  - Test search functionality across different scenarios
- [ ] Improve search results readability
  - Increase text sizes (especially meta info from `text-sm` to larger)
  - Improve color contrast for better visibility
  - Fix synopsis truncation (currently `max-h-12` may cut off text)
  - Increase spacing/padding in search result cards
  - Ensure sufficient contrast in both light and dark modes
- [ ] Add scroll up/down arrow (missing)
  - Currently only scroll-to-top arrow exists
  - Add scroll-to-bottom arrow component
  - Show down arrow when not at bottom of page
  - Show up arrow when not at top of page
  - Position arrows to avoid overlap
- [ ] Search results on mobile: swipe/clicking takes you to TMDB (should not)
  - Fix search result cards to prevent navigation to TMDB on mobile swipe/click
  - Ensure proper touch event handling
  - Verify card interactions work correctly on mobile devices
- [ ] Trivia and wordle answers repeat
  - Investigate answer generation logic
  - Fix duplicate answers appearing in trivia/wordle games
  - Ensure unique answers for each question/puzzle

## Deployment

### 📋 Open Items

- [ ] Verify environment variables are set correctly
- [ ] Check Firebase configuration for production
- [ ] Ensure all API endpoints are production-ready
- [ ] Set up error monitoring/logging
- [ ] Configure analytics tracking
- [ ] Test deployment process in staging environment

---

## Summary of Remaining Items

**Theme & UI Issues:** 7 items

- Community section verification and testing
- Component audit for hardcoded colors
- Accessibility and responsive design testing

**Code Quality:** 5 items

- Fix linter warnings
- TypeScript type improvements
- Error boundary additions

**Testing:** 6 items

- Component tests
- Cross-browser and accessibility testing

**Performance:** 4 items

- Bundle optimization
- Memory leak checks
- Loading optimizations

**Documentation:** 3 items

- Component documentation updates
- Style guide creation

**Community Player Queue:** 7 items

- Queue UI/UX design and implementation
- Queue management features
- Film metadata display

**Settings Page Redesign:** 11 items

- Desktop layout improvements
- Mobile optimization
- Additional features (search, export/import)

**Pro System Validation:** 8 items

- Feature gating validation
- Bloopers/extras testing
- Content moderation

**Payment Method & Process:** 9 items

- Stripe integration
- Subscription management
- Payment security and compliance

**First Visit Intro / Onboarding:** 10 items

- Onboarding flow design and implementation
- Intro content creation
- Analytics integration

**"Where Am I Watching This" Feature:** 7 items

- Platform tracking UI/UX
- Data model implementation
- Library integration

**Search & UI Improvements:** 5 items

- Search state management fixes
- Readability improvements
- Scroll arrow additions
- Mobile interaction fixes
- Game answer deduplication

**Deployment:** 6 items

- Environment configuration
- Production readiness checks
- Monitoring and analytics setup

**Total Open Items: 88**

---

## Notes

- Last updated: 2024-12-XX
- Email Digest section removed (completed)
- Mobile Search redesign completed (v0.1.151)
- This list should be updated as new issues are identified
- Items should be moved to "Completed" section when finished
- Use checkboxes to track progress
