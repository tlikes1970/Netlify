/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'app-assets-v1';

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
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
  if (req.mode === 'navigate') return; // do NOT intercept page loads

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
