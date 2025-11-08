// Service Worker for background notifications
// This runs even when the app is closed

const CACHE_NAME = 'flicklet-notifications-v1';
const NOTIFICATION_CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Background sync for checking upcoming episodes
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-upcoming-episodes') {
    console.log('[SW] Background sync: checking upcoming episodes');
    event.waitUntil(checkUpcomingEpisodes());
  }
});

// Periodic background check
setInterval(checkUpcomingEpisodes, NOTIFICATION_CHECK_INTERVAL);

async function checkUpcomingEpisodes() {
  try {
    console.log('[SW] Checking for upcoming episodes...');
    
    // Get user's watchlist from IndexedDB or make API call
    const watchlist = await getUserWatchlist();
    
    if (!watchlist || watchlist.length === 0) {
      console.log('[SW] No shows in watchlist');
      return;
    }

    // Check each show for upcoming episodes
    for (const show of watchlist) {
      await checkShowForUpcomingEpisodes(show);
    }
  } catch (error) {
    console.error('[SW] Error checking upcoming episodes:', error);
  }
}

async function getUserWatchlist() {
  try {
    // Try to get from IndexedDB first
    const db = await openDB();
    const transaction = db.transaction(['watchlist'], 'readonly');
    const store = transaction.objectStore('watchlist');
    const watchlist = await store.getAll();
    
    if (watchlist.length > 0) {
      return watchlist;
    }

    // Fallback: make API call to get watchlist
    const response = await fetch('/.netlify/functions/get-watchlist');
    if (response.ok) {
      return await response.json();
    }
    
    return [];
  } catch (error) {
    console.error('[SW] Error getting watchlist:', error);
    return [];
  }
}

async function checkShowForUpcomingEpisodes(show) {
  try {
    // Get upcoming episodes for this show from TMDB
    const response = await fetch(`/.netlify/functions/get-upcoming-episodes?showId=${show.id}`);
    
    if (!response.ok) {
      console.log(`[SW] Failed to get episodes for ${show.name}`);
      return;
    }

    const episodes = await response.json();
    const now = new Date();
    
    // Check each episode
    for (const episode of episodes) {
      const airDate = new Date(episode.air_date);
      const timeUntilAir = airDate.getTime() - now.getTime();
      
      // Check if we should send a notification
      const shouldNotify = await shouldSendNotification(show, episode, timeUntilAir);
      
      if (shouldNotify) {
        await sendBackgroundNotification(show, episode);
      }
    }
  } catch (error) {
    console.error(`[SW] Error checking episodes for ${show.name}:`, error);
  }
}

async function shouldSendNotification(show, episode, timeUntilAir) {
  try {
    // Get notification settings
    const settings = await getNotificationSettings();
    
    if (!settings.globalEnabled) {
      return false;
    }

    const showSettings = settings.showOverrides[show.id] || { enabled: true };
    if (!showSettings.enabled) {
      return false;
    }

    // Calculate notification time based on user's settings
    let notificationTimeMs;
    
    if (settings.proTierTiming) {
      // Pro user - precise timing
      notificationTimeMs = settings.proTierTiming * 60 * 60 * 1000; // Convert hours to ms
    } else {
      // Free user - vague timing
      if (settings.freeTierTiming === '24-hours-before') {
        notificationTimeMs = 24 * 60 * 60 * 1000;
      } else if (settings.freeTierTiming === '7-days-before') {
        notificationTimeMs = 7 * 24 * 60 * 60 * 1000;
      } else {
        return false;
      }
    }

    // Check if we're within the notification window
    const isWithinNotificationWindow = timeUntilAir <= notificationTimeMs && timeUntilAir > 0;
    
    // Check if we've already sent a notification for this episode
    const alreadyNotified = await hasNotificationBeenSent(show.id, episode.season_number, episode.episode_number);
    
    return isWithinNotificationWindow && !alreadyNotified;
  } catch (error) {
    console.error('[SW] Error checking notification criteria:', error);
    return false;
  }
}

async function sendBackgroundNotification(show, episode) {
  try {
    console.log(`[SW] Sending notification for ${show.name} S${episode.season_number}E${episode.episode_number}`);
    
    // Send push notification
    await self.registration.showNotification(
      `${show.name} - New Episode!`,
      {
        body: `S${episode.season_number}E${episode.episode_number}: ${episode.name}`,
        icon: show.poster_url || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `episode-${show.id}-${episode.season_number}-${episode.episode_number}`,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Show',
            icon: '/icons/icon-192.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      }
    );

    // Mark as notified
    await markNotificationAsSent(show.id, episode.season_number, episode.episode_number);
    
    // Log the notification
    await logNotification(show, episode);
    
  } catch (error) {
    console.error('[SW] Error sending background notification:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app and navigate to the show
    event.waitUntil(
      clients.openWindow(`/?show=${event.notification.tag.split('-')[1]}`)
    );
  }
});

// IndexedDB helpers
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FlickletNotifications', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('watchlist')) {
        db.createObjectStore('watchlist', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

async function getNotificationSettings() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const result = await store.get('notification-settings');
    return result ? result.value : null;
  } catch (error) {
    console.error('[SW] Error getting notification settings:', error);
    return null;
  }
}

async function hasNotificationBeenSent(showId, seasonNumber, episodeNumber) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const key = `${showId}-${seasonNumber}-${episodeNumber}`;
    const result = await store.get(key);
    return !!result;
  } catch (error) {
    console.error('[SW] Error checking notification status:', error);
    return false;
  }
}

async function markNotificationAsSent(showId, seasonNumber, episodeNumber) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    const key = `${showId}-${seasonNumber}-${episodeNumber}`;
    await store.put({ id: key, sentAt: new Date().toISOString() });
  } catch (error) {
    console.error('[SW] Error marking notification as sent:', error);
  }
}

async function logNotification(show, episode) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      showId: show.id,
      showName: show.name,
      episodeTitle: episode.name,
      seasonNumber: episode.season_number,
      episodeNumber: episode.episode_number,
      airDate: episode.air_date,
      notificationTime: new Date().toISOString(),
      method: 'push',
      status: 'sent'
    };
    
    await store.put(logEntry);
  } catch (error) {
    console.error('[SW] Error logging notification:', error);
  }
}

console.log('[SW] Service Worker loaded successfully');



































