/**
 * Process: Origin Validation Helper
 * Purpose: Validates request origins for Netlify functions to prevent unauthorized access
 * Data Source: HTTP request headers (Origin, Referer)
 * Update Path: Add new allowed origins to ALLOWED_ORIGINS array
 * Dependencies: Used by tmdb-proxy, goofs-fetch, and other Netlify functions
 *
 * What it does:
 * - Validates that requests come from allowed origins (production, staging, dev, Android/Capacitor)
 * - Checks Origin header first, falls back to Referer header if Origin is missing
 * - Returns an object with { allowed: boolean, error?: string, origin?: string, referer?: string }
 *
 * How it decides allowed vs blocked:
 * 1. Checks if origin/referer starts with "capacitor://" (Capacitor/WebView apps) - ALLOWED
 * 2. Checks explicit allow list (production, dev, emulator origins) - ALLOWED if match
 * 3. Checks Netlify preview pattern (*.netlify.app) - ALLOWED if match
 * 4. Otherwise - BLOCKED
 *
 * Current allowed origins:
 * - Capacitor/WebView: any origin starting with "capacitor://" (e.g., capacitor://localhost)
 * - Production: flicklet.netlify.app, flicklet-71dff.web.app, flicklet-71dff.firebaseapp.com
 * - Dev/Emulator: localhost:8888, 127.0.0.1:8888, 10.0.2.2:8888 (Android emulator loopback)
 * - Netlify preview deployments: any *.netlify.app subdomain
 */

/**
 * List of explicitly allowed origins (scheme + host + port)
 * Existing production origins are preserved.
 */
const ALLOWED_ORIGINS = [
  // Production origins
  "https://flicklet.netlify.app",
  "https://flicklet-71dff.web.app",
  "https://flicklet-71dff.firebaseapp.com",

  // Dev/emulator origins
  "http://localhost:8888",
  "http://127.0.0.1:8888",
  "http://10.0.2.2:8888", // Android emulator loopback

  // Additional dev origins (if needed)
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:8000",
];

/**
 * Normalize origin to canonical form (lowercase, remove www, ensure consistent format)
 */
function normalizeOrigin(origin) {
  if (!origin || typeof origin !== "string") return null;

  let normalized = origin.toLowerCase().trim();

  // Remove www prefix for consistency
  normalized = normalized.replace(/^https?:\/\/www\./, (match) => {
    return match.startsWith("https") ? "https://" : "http://";
  });

  return normalized;
}

/**
 * Extract origin from Referer header if Origin header is missing
 */
function extractOriginFromReferer(referer) {
  if (!referer || typeof referer !== "string") return null;

  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/**
 * Check if origin/referer is a Capacitor/WebView origin
 * Capacitor apps use the capacitor:// scheme (e.g., capacitor://localhost)
 */
function isCapacitorOrigin(originOrReferer) {
  if (!originOrReferer || typeof originOrReferer !== "string") return false;
  return originOrReferer.trim().startsWith("capacitor://");
}

/**
 * Check if origin matches Netlify preview deployment pattern
 */
function isNetlifyPreview(origin) {
  if (!origin) return false;
  return origin.includes(".netlify.app") || origin.includes(".netlify.com");
}

/**
 * Validate request origin
 * @param {object} event - Netlify function event object
 * @returns {object} { allowed: boolean, error?: string, origin?: string, referer?: string }
 */
function validateOrigin(event) {
  const headers = event.headers || {};
  const origin = headers.origin || headers.Origin || null;
  const referer = headers.referer || headers.Referer || null;
  const userAgent = headers["user-agent"] || headers["User-Agent"] || null;

  // Check Capacitor/WebView origins first (before normalization)
  // Capacitor apps use capacitor:// scheme (e.g., capacitor://localhost)
  if (isCapacitorOrigin(origin) || isCapacitorOrigin(referer)) {
    return {
      allowed: true,
      origin: origin || null,
      referer: referer || null,
    };
  }

  // Normalize origin
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;

  // If no origin header, try to extract from referer (for mobile/Capacitor cases)
  let candidateOrigin = normalizedOrigin;
  if (!candidateOrigin && referer) {
    const refererOrigin = extractOriginFromReferer(referer);
    candidateOrigin = refererOrigin ? normalizeOrigin(refererOrigin) : null;
  }

  // ⚠️ CRITICAL: Allow requests from mobile apps even without Origin header
  // Android WebView/Capacitor often doesn't send Origin headers, but we can detect
  // mobile apps by User-Agent or by checking if referer contains capacitor://
  if (!candidateOrigin) {
    // Check if User-Agent suggests mobile app (Android WebView, Capacitor, etc.)
    const isMobileApp =
      userAgent &&
      ((userAgent.includes("Android") && userAgent.includes("wv")) || // Android WebView
        userAgent.includes("Capacitor") ||
        (referer && referer.includes("capacitor://")));

    if (isMobileApp) {
      // Allow mobile app requests even without Origin header
      return {
        allowed: true,
        origin: null,
        referer: referer || null,
        userAgent: userAgent ? userAgent.substring(0, 100) : null,
      };
    }

    return {
      allowed: false,
      error: "Missing Origin header",
      origin: origin || null,
      referer: referer || null,
      userAgent: userAgent ? userAgent.substring(0, 100) : null,
    };
  }

  // Normalize allowed origins for comparison
  const normalizedAllowed = ALLOWED_ORIGINS.map(normalizeOrigin);

  // Check explicit allow list
  const isExplicitlyAllowed = normalizedAllowed.includes(candidateOrigin);

  // Check Netlify preview pattern
  const isPreviewAllowed = isNetlifyPreview(candidateOrigin);

  const allowed = isExplicitlyAllowed || isPreviewAllowed;

  if (!allowed) {
    return {
      allowed: false,
      error: "Origin not in allowed list",
      origin: candidateOrigin,
      referer: referer || null,
      userAgent: userAgent ? userAgent.substring(0, 100) : null,
    };
  }

  return {
    allowed: true,
    origin: candidateOrigin,
    referer: referer || null,
  };
}

module.exports = {
  validateOrigin,
  ALLOWED_ORIGINS,
  normalizeOrigin,
};
