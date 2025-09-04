// sw.js - Service Worker for StreamTracker PWA
const CACHE_NAME = 'streamtracker-v1.0.1';
const STATIC_CACHE_NAME = 'streamtracker-static-v1.0.1';
const DYNAMIC_CACHE_NAME = 'streamtracker-dynamic-v1.0.1';

// Files to cache immediately (critical for offline functionality)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Files to cache on first visit (less critical)
const DYNAMIC_FILES = [
  '/icons/apple-touch-icon.png',
  '/icons/favicon.ico'
];

// Install event - cache critical files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('streamtracker-')) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests and extension requests
  if (url.origin !== location.origin && !url.pathname.includes('/.netlify/functions/')) {
    return;
  }
  
  // Skip POST requests and other non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Network first for API calls (always get fresh data)
    if (url.pathname.includes('/.netlify/functions/')) {
      return await networkFirst(request);
    }
    
    // Strategy 2: Cache first for static assets (fast loading)
    if (url.pathname.includes('/icons/') || 
        url.pathname.endsWith('.png') || 
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg')) {
      return await cacheFirst(request);
    }
    
    // Strategy 3: Stale while revalidate for main app (fast + fresh)
    return await staleWhileRevalidate(request);
    
  } catch (error) {
    console.error('Service Worker: Fetch error:', error);
    
    // Fallback for main app requests
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return await cache.match('/index.html') || await cache.match('/');
    }
    
    // For other requests, just let them fail
    throw error;
  }
}

// Network first strategy (for API calls)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful API responses (but don't block on cache failures)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone()).catch(() => {
        // Ignore cache errors for API responses
      });
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache as fallback for API calls
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Serving API from cache (offline)');
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache first strategy (for static assets)
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch asset:', request.url);
    throw error;
  }
}

// Stale while revalidate strategy (for main app)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh version in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignore network errors in background
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // No cached version, wait for network
  return await fetchPromise;
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    updateCache();
  }
});

// Force cache update
async function updateCache() {
  const cache = await caches.open(STATIC_CACHE_NAME);
  await cache.addAll(STATIC_FILES);
  console.log('Service Worker: Cache updated');
}

// Periodic cleanup (every hour when active)
setInterval(() => {
  cleanupCache();
}, 60 * 60 * 1000);

async function cleanupCache() {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const requests = await cache.keys();
  
  // Remove old API responses (older than 1 hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  for (const request of requests) {
    const response = await cache.match(request);
    const dateHeader = response.headers.get('date');
    
    if (dateHeader) {
      const responseDate = new Date(dateHeader).getTime();
      if (responseDate < oneHourAgo) {
        await cache.delete(request);
      }
    }
  }
}