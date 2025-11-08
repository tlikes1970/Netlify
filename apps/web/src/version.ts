// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
// ⚠️ VERSION 0.1.136: Fixed flicker cascade - comprehensive fixes for all re-render issues
// - Added skipEmit parameter to reloadFromStorage() to allow batching
// - Created notifyUpdate() method to batch emit() and library:updated event together using requestAnimationFrame
// - Removed redundant library:updated listener from HomeUpNextRail (useLibrary already subscribes)
// - Fixed useLibrary hook to prevent unnecessary setState when items unchanged (uses ref comparison)
// - Fixed useLibrary effect to avoid duplicate setItems on mount
// - Optimized useForYouContent to only update when library size actually changes
// - Fixed username flicker: moved isLoading flag to shared state manager, added debouncing to auth subscription
// - AuthManager notifies listeners multiple times (immediate, after doc, on error) - debouncing prevents multiple loadUsername() calls
// - React 18+ auto-batches all state updates, preventing cascading re-renders
export const APP_VERSION = "0.1.136";
