// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
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
export const APP_VERSION = "0.1.146";
