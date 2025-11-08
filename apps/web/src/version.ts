// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
// ⚠️ VERSION 0.1.134: Fixed CommunityPanel flicker caused by repeated fetch attempts
// - Added refs to prevent multiple simultaneous fetches and retry loops
// - Skip fetch in production when API URL is localhost (backend not available)
// - Mark as fetched even on error to prevent infinite retry loop
// - Only fetch once on mount, allow refetch only when new post is created
export const APP_VERSION = "0.1.134";
