// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
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
export const APP_VERSION = "0.1.141";
