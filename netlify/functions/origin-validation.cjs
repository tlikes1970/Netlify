/**
 * Process: Origin Validation Helper
 * Purpose: Validates request origins for Netlify functions to prevent unauthorized access
 * Data Source: HTTP request headers (Origin, Referer, Host, User-Agent)
 * Update Path: Add new allowed origins to ALLOWED_ORIGINS array
 * Dependencies: Used by tmdb-proxy, goofs-fetch, and other Netlify functions
 */

const ALLOWED_ORIGINS = [
  // Production origins
  "https://flicklet.netlify.app",
  "https://flicklet-71dff.web.app",
  "https://flicklet-71dff.firebaseapp.com",

  // Dev/emulator origins
  "https://localhost",
  "http://localhost:8888",
  "http://127.0.0.1:8888",
  "http://10.0.2.2:8888",

  // Additional dev origins
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:8000",
];

function normalizeOrigin(origin) {
  if (!origin || typeof origin !== "string") return null;

  let normalized = origin.toLowerCase().trim();

  normalized = normalized.replace(/^https?:\/\/www\./, (match) => {
    return match.startsWith("https") ? "https://" : "http://";
  });

  return normalized;
}

function extractOriginFromReferer(referer) {
  if (!referer || typeof referer !== "string") return null;

  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function isCapacitorOrigin(originOrReferer) {
  if (!originOrReferer || typeof originOrReferer !== "string") return false;
  return originOrReferer.trim().startsWith("capacitor://");
}

function isNetlifyPreview(origin) {
  if (!origin) return false;
  return origin.includes(".netlify.app") || origin.includes(".netlify.com");
}

function isLocalDevHost(host) {
  if (!host || typeof host !== "string") return false;

  const normalizedHost = host.toLowerCase().trim();

  return (
    normalizedHost === "localhost:8888" ||
    normalizedHost === "127.0.0.1:8888" ||
    normalizedHost === "localhost:3000" ||
    normalizedHost === "localhost:4173" ||
    normalizedHost === "localhost:8000"
  );
}

function validateOrigin(event) {
  const headers = event.headers || {};
  const origin = headers.origin || headers.Origin || null;
  const referer = headers.referer || headers.Referer || null;
  const host = headers.host || headers.Host || null;
  const userAgent = headers["user-agent"] || headers["User-Agent"] || null;

  if (isCapacitorOrigin(origin) || isCapacitorOrigin(referer)) {
    return {
      allowed: true,
      origin: origin || null,
      referer: referer || null,
      host: host || null,
    };
  }

  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;

  let candidateOrigin = normalizedOrigin;
  if (!candidateOrigin && referer) {
    const refererOrigin = extractOriginFromReferer(referer);
    candidateOrigin = refererOrigin ? normalizeOrigin(refererOrigin) : null;
  }

  if (!candidateOrigin) {
    const isMobileApp =
      userAgent &&
      ((userAgent.includes("Android") && userAgent.includes("wv")) ||
        userAgent.includes("Capacitor") ||
        (referer && referer.includes("capacitor://")));

    const isLocalDev = isLocalDevHost(host);

    if (isMobileApp || isLocalDev) {
      return {
        allowed: true,
        origin: null,
        referer: referer || null,
        host: host || null,
        userAgent: userAgent ? userAgent.substring(0, 100) : null,
      };
    }

    return {
      allowed: false,
      error: "Missing Origin header",
      origin: origin || null,
      referer: referer || null,
      host: host || null,
      userAgent: userAgent ? userAgent.substring(0, 100) : null,
    };
  }

  const normalizedAllowed = ALLOWED_ORIGINS.map(normalizeOrigin);
  const isExplicitlyAllowed = normalizedAllowed.includes(candidateOrigin);
  const isPreviewAllowed = isNetlifyPreview(candidateOrigin);

  const allowed = isExplicitlyAllowed || isPreviewAllowed;

  if (!allowed) {
    return {
      allowed: false,
      error: "Origin not in allowed list",
      origin: candidateOrigin,
      referer: referer || null,
      host: host || null,
      userAgent: userAgent ? userAgent.substring(0, 100) : null,
    };
  }

  return {
    allowed: true,
    origin: candidateOrigin,
    referer: referer || null,
    host: host || null,
  };
}

module.exports = {
  validateOrigin,
  ALLOWED_ORIGINS,
  normalizeOrigin,
};