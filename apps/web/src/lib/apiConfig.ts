// NOTE: API_BASE lets mobile builds hit the production backend instead of localhost/capacitor://localhost.
// When VITE_API_BASE_URL is set (e.g., in .env.mobile), API calls will use that base URL.
// When empty (dev mode), relative URLs work with netlify dev proxy.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim() || '';

export { API_BASE };




