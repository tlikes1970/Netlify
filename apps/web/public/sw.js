// Service Worker for Image Caching
// This service worker caches optimized images for offline viewing

const CACHE_NAME = 'flicklet-images-v1';
const IMAGE_CACHE_NAME = 'flicklet-image-cache-v1';

// Cache strategies for different types of requests
const CACHE_STRATEGIES = {
  // Cache images with stale-while-revalidate strategy
  images: 'stale-while-revalidate',
  // Cache API responses with network-first strategy
  api: 'network-first',
  // Cache static assets with cache-first strategy
  static: 'cache-first'
};

// Install event - set up caches
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME),
      caches.open(IMAGE_CACHE_NAME)
    ]).then(() => {
      console.log('[SW] Caches opened successfully');
      self.skipWaiting(); // Take control immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim(); // Take control of all clients
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle TMDB image requests
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Handle API requests
  if (url.hostname === 'api.themoviedb.org') {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static asset requests
  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle image requests with stale-while-revalidate strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  try {
    // Try to get from cache first (stale)
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving image from cache:', request.url);
      
      // Update cache in background (revalidate)
      fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
          console.log('[SW] Updated image cache:', request.url);
        }
      }).catch((error) => {
        console.log('[SW] Failed to update image cache:', error);
      });
      
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    console.log('[SW] Fetching image from network:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache the response
      cache.put(request, response.clone());
      console.log('[SW] Cached new image:', request.url);
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Image fetch failed:', error);
    
    // Return a placeholder image if available
    const placeholderResponse = await cache.match('/placeholder-poster.svg');
    if (placeholderResponse) {
      return placeholderResponse;
    }
    
    // Return a simple error response
    return new Response('Image not available', { status: 404 });
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    console.log('[SW] Fetching API from network:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
      console.log('[SW] Cached API response:', request.url);
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] API fetch failed, trying cache:', error);
    
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // Return error response
    return new Response('API not available', { status: 503 });
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving static asset from cache:', request.url);
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    console.log('[SW] Fetching static asset from network:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache the response
      cache.put(request, response.clone());
      console.log('[SW] Cached static asset:', request.url);
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available', { status: 404 });
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_IMAGES':
      event.waitUntil(cacheImages(data.urls));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache());
      break;
      
    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize().then(size => {
        event.ports[0].postMessage({ size });
      }));
      break;
  }
});

// Pre-cache specific images
async function cacheImages(urls) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  console.log('[SW] Pre-caching images:', urls.length);
  
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[SW] Pre-cached image:', url);
      }
    } catch (error) {
      console.log('[SW] Failed to pre-cache image:', url, error);
    }
  });
  
  await Promise.all(promises);
  console.log('[SW] Pre-caching complete');
}

// Clear all caches
async function clearCache() {
  console.log('[SW] Clearing all caches');
  
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  
  console.log('[SW] All caches cleared');
}

// Get cache size information
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}
