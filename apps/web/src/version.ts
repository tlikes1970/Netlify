// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
// ⚠️ VERSION 0.1.133: Fixed screen flicker caused by redundant Library reload loop
// - Removed unnecessary second Library reload in Firebase sync (was causing flicker every few seconds)
// - Single reload and event dispatch is sufficient - no need for delayed second reload
export const APP_VERSION = "0.1.133";
