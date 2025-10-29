/* eslint-disable no-restricted-globals */
const CACHE_NAME = "app-assets-v2";
const SW_VERSION = "v4";

self.addEventListener("install", (e) => {
  console.log("[SW] Installing " + SW_VERSION + " - clearing old caches");
  e.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      console.log("[SW] Activating " + SW_VERSION + " - clearing old caches");
      const keep = new Set([CACHE_NAME]);
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => (keep.has(k) ? null : caches.delete(k)))
      );
      await self.clients.claim();
    })()
  );
});

// ⚠️ BULLETPROOF: Auth request detector - catches all auth-related URLs
const isAuthRequest = (url) =>
  url.includes("/__/auth/") ||
  url.includes("code=") ||
  url.includes("state=") ||
  url.includes("oauth") ||
  url.includes("redirect");

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ⚠️ BULLETPROOF: Check full URL string for auth patterns (not just search params)
  // This catches code= and state= anywhere in the URL
  const fullUrl = req.url;

  if (isAuthRequest(fullUrl)) {
    console.log("[SW] Auth URL detected - network only (no-store):", fullUrl);
    // ⚠️ KILL-SWITCH: Use cache: 'no-store' for auth URLs to prevent any caching
    e.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  if (req.mode === "navigate") return; // do NOT intercept page loads

  // Network only for API calls and auth-related files
  if (
    url.pathname.includes("/api/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("auth")
  ) {
    console.log("[SW] API/Auth path - network only:", url.pathname);
    e.respondWith(fetch(req));
    return;
  }

  if (
    !/\.(?:js|css|ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot|json)$/.test(
      url.pathname
    )
  )
    return;

  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const net = await fetch(req);
        if (net && net.ok) cache.put(req, net.clone());
        return net;
      } catch {
        return new Response("", { status: 503 });
      }
    })()
  );
});
