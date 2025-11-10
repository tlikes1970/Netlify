/* eslint-disable no-restricted-globals */
// ⚠️ FIXED: Conditional skip-waiting and clients-claim to prevent aggressive takeover
// Only claim clients if no existing controller (prevents mid-render takeover)
self.addEventListener('install', (event) => {
  // Only skip waiting if no controller exists (first install)
  // This prevents aggressive activation during updates
  if (!self.registration.active && !self.registration.waiting) {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Only claim clients if no controller exists (prevents takeover of loaded pages)
      // This prevents the flicker loop caused by immediate client claiming
      // Check if we're the first SW (no existing controller)
      if (!navigator.serviceWorker.controller) {
        await self.clients.claim();
      }
    })()
  );
});

const CACHE_NAME = "app-assets-v2";
const SW_VERSION = "v4";

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      console.log("[SW] Activating " + SW_VERSION + " - clearing old caches");
      const keep = new Set([CACHE_NAME]);
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => (keep.has(k) ? null : caches.delete(k)))
      );
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

  // Cache-first for /posts/* routes
  if (url.pathname.startsWith("/posts/")) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) {
          // Return cached version and update in background
          fetch(req).then((response) => {
            if (response.ok) cache.put(req, response.clone());
          }).catch(() => {});
          return cached;
        }
        const response = await fetch(req);
        if (response.ok) cache.put(req, response.clone());
        return response;
      })
    );
    return;
  }

  // Stale-while-revalidate for API calls
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then((response) => {
          if (response.ok) cache.put(req, response.clone());
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  if (req.mode === "navigate") {
    // ⚠️ FIXED: Network-first for HTML to prevent serving stale content during updates
    // This prevents flicker caused by serving cached HTML that conflicts with new HTML
    e.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(req);
          if (networkResponse.ok) {
            // Cache the fresh response for offline use
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
        } catch (error) {
          // Network failed, try cache as fallback
          const cached = await caches.match(req);
          if (cached) return cached;
          
          // Last resort: offline page
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;
        }
        return new Response("Offline", { status: 503 });
      })()
    );
    return;
  }

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
