// Service Worker for Image Caching and Notifications
// This service worker caches optimized images for offline viewing and handles background notifications

const CACHE_NAME = 'flicklet-images-v2';
const IMAGE_CACHE_NAME = 'flicklet-image-cache-v2';

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
  
  // Don't cache navigation requests (important for auth redirects)
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request));
    return;
  }
  
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
  
  // Handle static asset requests (with cache-busting for JS files)
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

// Handle static asset requests with stale-while-revalidate strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving static asset from cache:', request.url);
      
      // Revalidate in background for JS files (ensure auth logic is fresh)
      if (request.url.endsWith('.js')) {
        fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
            console.log('[SW] Updated JS cache:', request.url);
          }
        }).catch(() => {
          // Ignore background fetch errors
        });
      }
      
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
      
    case 'SCHEDULE_NOTIFICATION':
      event.waitUntil(scheduleNotification(data));
      break;
      
    case 'CANCEL_NOTIFICATION':
      event.waitUntil(cancelNotification(data.id));
      break;
  }
});

// Notification event listeners
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push data:', data);
    
    const options = {
      body: data.body || 'New episode available!',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-144.png',
      tag: data.tag || 'episode-notification',
      data: data.data || {},
      actions: data.actions || [
        {
          action: 'watch',
          title: 'Watch Now',
          icon: '/icons/icon-144.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Flicklet', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'watch') {
    // Open the app to the specific show
    event.waitUntil(
      clients.openWindow('/?show=' + event.notification.data.showId)
    );
  } else if (event.action === 'dismiss') {
    // Just dismiss the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for checking upcoming episodes
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'check-episodes') {
    event.waitUntil(checkUpcomingEpisodes());
  }
});

// Schedule a notification
async function scheduleNotification(data) {
  try {
    console.log('[SW] Scheduling notification:', data);
    
    // Store notification data for later use
    const notifications = await getStoredNotifications();
    notifications.push({
      id: data.id,
      title: data.title,
      body: data.body,
      timestamp: data.timestamp,
      showId: data.showId
    });
    await storeNotifications(notifications);
    
    console.log('[SW] Notification scheduled successfully');
  } catch (error) {
    console.error('[SW] Failed to schedule notification:', error);
  }
}

// Cancel a notification
async function cancelNotification(id) {
  try {
    console.log('[SW] Canceling notification:', id);
    
    const notifications = await getStoredNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    await storeNotifications(filtered);
    
    console.log('[SW] Notification canceled successfully');
  } catch (error) {
    console.error('[SW] Failed to cancel notification:', error);
  }
}

// Check for upcoming episodes (background sync)
async function checkUpcomingEpisodes() {
  try {
    console.log('[SW] Checking upcoming episodes...');
    
    // This would typically fetch from your API
    // For now, we'll just log that we're checking
    console.log('[SW] Episode check complete');
  } catch (error) {
    console.error('[SW] Episode check failed:', error);
  }
}

// Store notifications in IndexedDB
async function storeNotifications(notifications) {
  // Simple localStorage fallback for now
  // In a real implementation, you'd use IndexedDB
  try {
    const data = JSON.stringify(notifications);
    // Note: Service workers can't access localStorage directly
    // This would need to be implemented with IndexedDB
    console.log('[SW] Stored notifications:', notifications.length);
  } catch (error) {
    console.error('[SW] Failed to store notifications:', error);
  }
}

// Get stored notifications from IndexedDB
async function getStoredNotifications() {
  // Simple fallback for now
  // In a real implementation, you'd use IndexedDB
  try {
    return [];
  } catch (error) {
    console.error('[SW] Failed to get stored notifications:', error);
    return [];
  }
}

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
