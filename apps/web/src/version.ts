// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
// ⚠️ VERSION 0.1.173: Improved drag-and-drop visuals - smoother desktop animations, better mobile floating effect
// - Desktop: Removed redundant inline transforms from useDragAndDrop, simplified to single CSS animation
// - Desktop: Reduced rotation from 2deg to 1deg for smoother feel
// - Mobile: Enhanced shadow (layered shadows) for clearer floating effect above neighbors
// - Mobile: Removed redundant inline width/maxWidth assignments, CSS handles constraints
// - All drag functionality preserved: FLIP animations and custom order persistence unchanged
// - Rollback: Revert this commit to restore previous drag visual behavior
// ⚠️ VERSION 0.1.172: Pro-gating cleanup - Standardized Pro status checks, unified upgrade CTAs, improved error messages
// - Replaced settings.pro.isPro with useProStatus() hook in games and settings components
// - Replaced custom upgrade UIs with unified UpgradeToProCTA component (GoofsModal, CommunityPanel)
// - Improved custom list limit error message for better user guidance
// - Rollback: Revert this commit to restore previous Pro status checks and upgrade flows
// ⚠️ VERSION 0.1.171: Merged trivia-question-fixes branch with main
// - Merged latest changes from main branch into trivia-question-fixes
// - Rollback: Revert this commit to restore previous version
// ⚠️ VERSION 0.1.170: Fixed FlickWord Enter key lag and added validation feedback
// - Added isSubmittingUI state to show visual feedback during word validation
// - Wrapped handleSubmit in try/finally to guarantee guards never get stuck
// - Disabled all keyboard input (physical and on-screen) during validation
// - Enter button now shows "Checking..." with spinner during validation
// - All submission paths (valid, invalid, error) properly reset flags
// - Users now see immediate feedback when pressing Enter, eliminating "dead air" feeling
// - Rollback: Revert this commit to restore previous submit behavior
// ⚠️ VERSION 0.1.169: Fixed FlickWord share → review flow - links now correctly open intended games
// - Created FlickWordShareParams type and parseFlickWordShareParams() helper for type-safe share params
// - Fixed share params flow: App.tsx → localStorage → FlickWordGame → FlickWordModal → FlickWordReview
// - Single game shares now show only the specific game (filtered by gameNumber)
// - Share all games links now show all games for that date (sharedAll mode)
// - Past date shares now correctly show games for the specified date, not today
// - Review screen now properly filters by date and gameNumber from share params
// - Fixed localStorage cleanup ownership (FlickWordReview clears params after reading)
// - Rollback: Revert this commit to restore previous share behavior
// ⚠️ VERSION 0.1.168: Fixed Settings CTA navigation - opens directly to personalization section
// - Created centralized openSettingsAtSection() helper in settingsNavigation.ts
// - Updated "Click here to personalize these rows" CTA to use helper
// - Works reliably on both desktop and mobile
// - Opens Settings directly to "display" section (home rows/For You config)
// - Rollback: Revert this commit to restore previous CTA behavior
// ⚠️ VERSION 0.1.167: Fixed onboarding, FlickWord, and Trivia issues
// - Onboarding: Fixed welcome box showing for returning users
// - FlickWord: Fixed word repetition, same-letter patterns, and share deep-linking
// - Trivia: Fixed question rotation, added share functionality, improved cache keys and fallback rotation
// - Improved rate limit handling for Trivia API (429 errors)
// ⚠️ VERSION 0.1.166: B3 - Final Pro-Gate Validation - Unified Pro config and consistent gating
// - Created centralized Pro config (proConfig.ts) with list limits and helpers
// - Fixed lists gating: Free (3 lists), Pro (unlimited) using dynamic Pro status
// - Replaced alert() with UpgradeToProCTA in ListSelectorModal
// - Added backend validation in notifications to prevent free users enabling Pro features
// - Added sanitization in CommunityPanel to block Pro sort modes for free users
// - Replaced hardcoded isPro checks with centralized useProStatus() hook
// - Added comprehensive Pro gating documentation comments throughout codebase
// - Rollback: Revert this commit to restore previous Pro gating behavior
// ⚠️ VERSION 0.1.165: Fixed duplicate goofs issue - made insights title-specific with variation
// - Updated buildInsightsForTitle to include title names in all insights
// - Added variation logic based on tmdbId to prevent identical insights for similar metadata
// - Fixed duplicate goofs being written for all titles with same genres/decade
// - Added comprehensive debug logging to track ingestion pipeline
// - Added test mode to limit bulk ingestion to 5 titles for safe testing
// - Rollback: Revert this commit to restore previous generic insights behavior
// ⚠️ VERSION 0.1.164: Fixed goofs-fetch Netlify function deployment - moved to correct location
// - Moved goofs-fetch.cjs from netlify/functions/ to apps/web/netlify/functions/
// - Function now deploys correctly since build base is apps/web
// - Fixes 404 errors during bulk ingestion - function now accessible at /.netlify/functions/goofs-fetch
// - Rollback: Revert this commit to restore previous function location
// ⚠️ VERSION 0.1.163: Increased onboarding timeout for better UX
// - Increased fallback timeout from 30 seconds to 3 minutes (180 seconds) for login modal and location permission
// - Gives users plenty of time to complete the onboarding flow without rushing
// - Login modal and location requests still wait for onboarding completion event, with longer fallback
// ⚠️ VERSION 0.1.162: Added debug logging for onboarding component
// - Added comprehensive debug logging to diagnose why onboarding doesn't appear in production
// - Logs hook initialization, localStorage checks, component mount, and early returns
// - Added window.__onboardingDebug object for easy inspection in browser console
// - Helps identify if component is mounting, what step is initialized, and why it might return null
// ⚠️ VERSION 0.1.161: Onboarding Walkthrough with Coachmarks
// - Added complete onboarding flow with 4 steps: welcome, search, addShow, homeDone, help
// - Implemented coachmark bubbles with arrows pointing to UI elements
// - Added action-oriented language encouraging user interaction
// - Delayed login modal and location permission requests until onboarding completes
// - Added fallback mechanisms to ensure login/location still work if onboarding is skipped
// - Implemented automatic scrolling to show relevant sections during onboarding
// - Added SearchTip component for additional guidance during addShow step
// - Rollback: Revert this commit to remove onboarding and restore immediate login/location prompts
// ⚠️ VERSION 0.1.160: Admin Tab Restructure - Community Content and Moderation First
// - Changed default Admin tab from Auto Content to Community Content
// - Reordered tabs: Community Content first, Moderation second, then other tools
// - Updated tab CSS to allow wrapping on desktop (flex-wrap: wrap)
// - Added specific headings for each tab matching tab labels
// - Updated helper text for Community Content and Moderation tabs
// - Improved tab visibility - Community Content and Moderation are now immediately visible
// - Rollback: Revert this commit to restore previous Admin tab order and default
// ⚠️ VERSION 0.1.159: B2 - Settings Architecture Consolidation
// - Centralized Pro features config (settingsProConfig.ts) - single source of truth for all Pro features
// - Created unified UpgradeToProCTA component with 4 variants (banner, panel, inline, button)
// - Replaced scattered upgrade CTAs across Settings sections with unified component
// - Added Community settings section/tab with Weekly Email Digest and topic following
// - Moved community-related settings from NotificationsSection to dedicated CommunitySection
// - Verified stats are not duplicated (Account stats only in AccountSection)
// - All changes incremental, follow existing patterns, TypeScript passes
// - Rollback: Revert this commit to restore previous Settings architecture
// ⚠️ VERSION 0.1.91: Added comment counter and NEW badge to community posts
// - Added clickable reply counter with show/hide thread functionality in comments
// - Added comment count display on post cards with standout accent styling
// - Added NEW badge indicator for posts published within 24 hours
// - Comment counters encourage engagement by showing discussion activity
// - Rollback: Revert this commit to restore previous post/comment display
// ⚠️ VERSION 0.1.158: Community v1 - Complete implementation with topics, spoilers, Pro badges, sorting, filtering, infinite scroll, and daily limits
// - Added Pro badges, spoiler handling, topic selection and following
// - Implemented sorting (Newest, Oldest, Top, Hot, Trending) with Pro gating
// - Added topic filtering (single-select Free, multi-select Pro)
// - Implemented infinite scroll with cursor-based pagination
// - Added daily posting/commenting limits (3/10 for Free, 100/500 for Pro)
// - Fixed CommunityPanel scrolling and game card sizing
// - Rollback: Revert this commit to restore previous community behavior
// ⚠️ VERSION 0.1.157: Fixed all 23 FlickWord and Trivia game issues - comprehensive game improvements
// - Fixed game state restoration, race conditions, localStorage quota handling
// - Added cache versioning, centralized cache keys, API retry logic
// - Added offline detection, duplicate prevention, proper null checks
// - Improved keyboard color contrast (absent keys now clearly visible)
// - All 23 audit issues resolved, games now production-ready
// ⚠️ VERSION 0.1.156: Improved mobile search result card layout - better use of space
// - Moved rating inline with title on mobile for better space utilization
// - Made action buttons smaller (36px height instead of 44px) for more compact design
// - Added back synopsis description (2-line truncated) to fill white space
// - Better visual balance and information density on mobile cards
// - Rollback: Revert this commit to restore previous mobile card layout
// ⚠️ VERSION 0.1.155: Fixed mobile search result cards - made mobile detection reactive to viewport changes
// - Changed isMobile from one-time check to reactive useState with onMobileChange listener
// - Mobile cards now properly update when viewport size changes
// - Fixes issue where mobile styling wasn't applying correctly
// - Rollback: Revert this commit to restore previous mobile detection behavior
// ⚠️ VERSION 0.1.154: Fixed search suggestion click behavior - suggestions now properly fill search bar and perform search
// - Fixed blur handler interfering with suggestion clicks by adding click tracking flag
// - Added suggestionsContainerRef to properly detect clicks inside suggestions dropdown
// - Updated handleSuggestionClick to set flag and prevent blur from clearing query
// - Added onPointerDown handlers to all suggestion buttons to prevent input blur
// - Fixed issue where clicking "Slow Horses" would reset search bar to just "S"
// - Rollback: Revert this commit to restore previous suggestion click behavior
// ⚠️ VERSION 0.1.153: Improved weekly digest error messages for better debugging
// - Separated error messages for missing config vs inactive config
// - Clear instructions in error messages directing users to Admin panel
// - Helps diagnose whether config needs to be created or just activated
// - Rollback: Revert this commit to restore previous error messages
// ⚠️ VERSION 0.1.152: Fixed weekly digest email content not appearing in emails
// - Fixed loadDigestConfig() to use nullish coalescing (??) instead of logical OR (||)
// - Fixed buildEmailTemplate() to preserve empty strings and use saved content correctly
// - Fixed buildPlainTextTemplate() to preserve empty strings and use saved content correctly
// - Root cause: || operator treated empty strings as falsy, causing fallback to defaults
// - Now uses ?? which only falls back when value is null/undefined, preserving user-entered content
// - Rollback: Revert this commit to restore previous digest template behavior
// ⚠️ VERSION 0.1.151: Mobile search redesign and suggestion relevance improvements
// - Phase A: Simplified mobile search bar - inline clear button, improved spacing
// - Phase B: Mobile-friendly filter sheet with Apply/Reset buttons
// - Phase C: Tidied search suggestions - hide Popular on mobile, improved spacing
// - Phase D: Simplified search result card actions on mobile (primary + More menu)
// - Phase E: Fixed tab switching to preserve search, pull-to-refresh behavior
// - Enhanced suggestion relevance: multi-endpoint fetching, improved substring matching
// - Fixed "bat" → "batman" relevance by boosting word-starting substring matches
// - Rollback: Revert this commit to restore previous mobile search behavior
// ⚠️ VERSION 0.1.150: Fixed Apple login redirect loop and email login username prompt
// - Created appleLogin() helper similar to googleLogin() with redirect loop prevention
// - Apple login now uses popup on iOS/Safari and redirect guards to prevent loops
// - Fixed username prompt not showing after email login - ensures usernamePrompted is set
// - Apple login now has same safeguards as Google login (environment checks, guards, error handling)
// - Rollback: Revert this commit to restore previous Apple login behavior
// ⚠️ VERSION 0.1.149: Removed all diagnostic, triage, and troubleshooting tools
// - Disabled flickerDiagnostics (no logging, no event tracking, no exports)
// - Disabled i18nDiagnostics (no auto-download, no JSON file generation)
// - Removed all diagnostic calls from components and hooks
// - Removed debugGate diagnostic imports and calls
// - Removed coldStartRecorder and compactGateDiagnostics from main.tsx
// - All diagnostic systems are now no-ops (disabled but code remains for rollback)
// - This prevents any automatic JSON file downloads or diagnostic overhead
// - Rollback: Revert this commit to restore diagnostic functionality
// ⚠️ VERSION 0.1.148: Fixed production flicker caused by Service Worker aggressive activation loop
// - Fixed sw.js: Made clients.claim() and skipWaiting() conditional to prevent aggressive takeover
// - Fixed sw-register.ts: Removed automatic reg.update() on activation to prevent update loop
// - Fixed sw-register.ts: Added controller change handling and update debouncing (5s)
// - Fixed main.tsx: Guarded releaseFirstPaintGate() to run only once (prevents gate toggling)
// - Fixed main.tsx: Moved SW registration before React render to prevent mid-render takeover
// - Fixed main.tsx: Removed React.StrictMode in production to prevent extra render cycles
// - Fixed sw.js: Changed navigate mode to network-first for HTML (prevents stale content)
// - Fixed useServiceWorker.ts: Removed duplicate auto-registration (SW registered in main.tsx)
// - All fixes address the continuous page flicker in production until hard refresh
// - Rollback: Revert this commit to restore previous behavior
// ⚠️ VERSION 0.1.147: Runtime subsystem kill switch harness for binary isolation
// - Added runtime/switches.ts with isOff() helper for kill switch checking
// - Added runtime/overlay.ts for dev-only visual switch state display
// - Added runtime/firestoreWrapper.ts helper for Firestore listener wrapping
// - Wired kill switches: Service Worker (isw:off), Firebase Auth (iauth:off), Firestore (ifire:off)
// - Wired kill switches: API client (iapiclient:off), FCM (imsg:off), Feature flags (ircfg:off), Analytics (ianalytics:off)
// - Added docs/isolation/README.md with usage instructions and test order
// - Purpose: Binary isolation to identify which subsystem causes UI flicker
// - Usage: Set localStorage keys (e.g., 'isw:off'='1') to disable subsystems at runtime
// ⚠️ VERSION 0.1.146: Fix runaway translation updates with hard no-op guards + one-time settle window
// - Added content hash comparison (hashDict) to prevent commits when content is identical
// - Added one-time settle window (1000ms) to ignore redundant startup updates
// - Added hard guard in emitChange() to check store state before queuing
// - Added boot collector guard to prevent redundant boot emissions
// - Added hash guard in queueUpdate() to catch object recreation with same content
// - Added DEV probe to track commits/min (expected: single digits when idle)
// - Normalized getTranslations() to return direct reference (never synthesizes new objects)
// - Expected: renders per subscription <~2.2 (down from 2.70), commits/min in single digits
// ⚠️ VERSION 0.1.145: i18n: silence residual notifiers (guards/throttles/coalescing), add caller leaderboard, confirm drop in diagnostics
// - Added rapid-notify detector in translationBus.ts (warns when repeated calls occur within 5ms while containment is ON)
// - Added caller tracking and leaderboard dumper (__dumpI18nNotifyLeaderboard) to identify top noisy callers
// - Added equality guard in LanguageManager.emitChange() to drop repeats of the exact same payload
// - Updated i18n-batching.md with leaderboard instructions and pass criteria (<200 bursts, <50 maxEventsIn50ms)
// ⚠️ VERSION 0.1.144: i18n: bind real notify() to rAF batcher via runtime flag; normalize batched payloads; diagnostics prove mode
// - Made translationBus the SINGLE SOURCE OF TRUTH (removed duplicate subscribers from LanguageManager)
// - LanguageManager.emitChange() now ONLY calls translationBus.notify() - no legacy path
// - useTranslations now ONLY subscribes to translationBus - no legacy subscription
// - notify() checks containment flag on EVERY call to honor runtime toggles
// - Added dev logs: [i18n] notify mode=raf|off to prove actual path
// - Diagnostics now use actual mode from translationBus.mode()
// - SSR-safe: localStorage checks, rAF fallback
// ⚠️ VERSION 0.1.143: i18n rAF-batched update containment w/ runtime flags + diagnostics
// - Added i18n/featureFlags.ts for runtime toggles (localStorage-based)
// - Added i18n/rafBatcher.ts for requestAnimationFrame batching
// - Added i18n/translationBus.ts for centralized translation notifications
// - Updated useTranslations to handle batched payloads (array normalization)
// - Enhanced diagnostics to track containment metrics (bursts, maxEventsIn50ms)
// - Runtime toggle: localStorage.setItem('i18n:containment', 'on'|'off')
// - Diagnostics auto-run: localStorage.setItem('i18n:diagnostics:autoRun', 'true')
// - All changes behind flags, default behavior unchanged, reversible in one commit
// ⚠️ VERSION 0.1.142: Added unified I18N diagnostics system
// - Created i18nDiagnostics.ts with structured JSON report generation
// - Tracks: Strict Mode effects, provider identity, subscriber metrics, batching, key violations
// - Saves report to localStorage and downloads as JSON file
// - Enable via ?i18n-diagnostics=true or localStorage.setItem('i18n-diagnostics', 'enabled')
// ⚠️ VERSION 0.1.141: Fixed useTranslations subscription cascade causing flicker
// - Added prevTranslationsRef to track previous translations value
// - Only call setTranslations() when translations actually change (prevent unnecessary re-renders)
// - This fixes the 3600 subscription->render pairs from 160 subscriptions (22.5 renders per subscription)
// - Root cause: subscription callback was always calling setState even when value didn't change
// ⚠️ VERSION 0.1.140: Added root cause analysis function to flicker diagnostics
// - Added analyzeRootCause() method to flickerDiagnostics
// - Answers 3 key questions: mount vs render, subscription cascades, rapid sequences
// - Provides automated analysis with recommendations
// ⚠️ VERSION 0.1.139: Enhanced flicker diagnostics with mount/unmount and render tracking
// - Added logMount() and logUnmount() methods to flickerDiagnostics
// - Enhanced useTranslations to track every render, mount, unmount, and effect lifecycle
// - Added unique mountId to track individual hook instances across mount/unmount cycles
// - Increased MAX_LOGS from 200 to 500 to capture more diagnostic data
// - This will help determine root cause: are components mounting/unmounting or just re-rendering?
// ⚠️ VERSION 0.1.138: Fixed React hooks violation, backend API, and TMDB proxy issues
// - Fixed React hooks violation in App.tsx: moved loadingTimeout hooks before early returns
// - Fixed backend 500 error: changed take: 0 to take: pageSize in posts.js
// - Fixed TMDB proxy 404 errors: changed to use /api/tmdb-proxy redirect instead of direct function path
// - Added HMR configuration for Netlify dev proxy (port 8888)
// - Fixed backend CORS to include localhost:8000 for direct Vite dev server
// ⚠️ VERSION 0.1.137: Comprehensive flicker fixes - all 14 problems addressed
// - Fixed useCustomLists: only log/update when value actually changes, use ref to track previous value
// - Fixed CustomListManager: only sync counts if changed, added 100ms debounce to prevent cascade
// - Fixed AuthManager: reduced triple notification to single notification after operations complete
// - Fixed useAuth: removed subscription logging, fixed stale closure with ref tracking
// - Fixed useReturningShows: only update version when returning shows actually change
// - Fixed SnarkDisplay: only log when values actually change, use refs to track previous values
// - Fixed useUsername: removed subscription logging (only logs when loadUsername() starts)
// - Fixed useLibrary: removed render logging (only logs in subscription callback when changed)
// - Fixed CommunityPanel: memoized to prevent unnecessary re-renders from parent
// - All hooks now use refs to track previous values for accurate logging
// - All state changes now only trigger when values actually change
export const APP_VERSION = "0.1.173";
