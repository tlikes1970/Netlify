// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
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
export const APP_VERSION = "0.1.138";
