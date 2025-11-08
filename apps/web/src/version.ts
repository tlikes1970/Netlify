// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
// ⚠️ VERSION 0.1.135: Added flicker diagnostics system to identify root cause
// - Created flickerDiagnostics.ts to track re-renders, state changes, and events
// - Added diagnostics to CommunityPanel to track renders and state changes
// - Added diagnostics to useLibrary to track subscription triggers
// - Enable with ?diagnostics=flicker URL param or localStorage flag
// - Use flickerDiagnostics.printReport() in console to view analysis
export const APP_VERSION = "0.1.135";
