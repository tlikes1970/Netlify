/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'app-assets-v2';

self.addEventListener('install', e => {
  console.log('[SW] Installing v2 - clearing old caches');
  e.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    console.log('[SW] Activating v2 - clearing old caches');
    const keep = new Set([CACHE_NAME]);
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (keep.has(k) ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  
  // NETWORK ONLY: Never cache auth URLs or redirect handlers
  const isAuthURL = url.pathname.includes('/__/auth/') || 
                    url.search.includes('code=') || 
                    url.search.includes('state=') || 
                    url.search.includes('oauth') || 
                    url.search.includes('redirect');
  
  if (isAuthURL) {
    console.log('[SW] Auth URL detected - network only (no-store):', url.pathname + url.search);
    // ⚠️ KILL-SWITCH: Use cache: 'no-store' for auth URLs to prevent any caching
    e.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }
  
  // ⚠️ KILL-SWITCH: Check response headers - if Location header contains code= or state=, never cache
  // This is a belt-and-suspenders check for redirects we might miss
  if (req.mode === 'navigate' && (url.search.includes('code=') || url.search.includes('state='))) {
    console.log('[SW] Navigate request with auth params - no-store:', url.pathname + url.search);
    e.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }
  
  if (req.mode === 'navigate') return; // do NOT intercept page loads

  // Network only for API calls and auth-related files
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('/auth/') || 
      url.pathname.includes('auth')) {
    console.log('[SW] API/Auth path - network only:', url.pathname);
    e.respondWith(fetch(req));
    return;
  }
  
  if (!/\.(?:js|css|ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot|json)$/.test(url.pathname)) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (net && net.ok) cache.put(req, net.clone());
      return net;
    } catch {
      return new Response('', { status: 503 });
    }
  })());
});
