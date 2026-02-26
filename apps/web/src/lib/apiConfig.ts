// NOTE: API_BASE lets mobile builds hit the production backend instead of localhost/capacitor://localhost.
// When VITE_API_BASE_URL is set (e.g., in .env.mobile), API calls will use that base URL.
// When empty (dev mode), relative URLs work with netlify dev proxy.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim() || '';

// TMDB proxy base URL - can be overridden for mobile builds
// Defaults to relative path for web (works with Netlify redirects)
// Can be set to absolute URL (e.g., https://flicklet.netlify.app/api/tmdb-proxy) for mobile
const TMDB_PROXY_BASE =
  import.meta.env.VITE_TMDB_PROXY_BASE || "/api/tmdb-proxy";

export { API_BASE, TMDB_PROXY_BASE };





