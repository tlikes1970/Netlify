// Single source of truth for the app version.
// Bump using semantic versioning: major.minor.tweak
// ⚠️ VERSION 0.1.132: Added "set username" link when user has skipped or deleted username
// - Show "Click here to set a username" link in SnarkDisplay when authenticated but no username
// - Link opens settings page where user can set their username
// - Only shows for authenticated users who have skipped or deleted their username
export const APP_VERSION = "0.1.132";
