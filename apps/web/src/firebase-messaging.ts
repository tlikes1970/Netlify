/**
 * Process: Firebase Cloud Messaging
 * Purpose: Initialize FCM, get token, handle foreground/background messages
 * Data Source: Firebase Cloud Messaging, Firestore users collection
 * Update Path: Stores FCM token in user document, shows toast notifications
 * Dependencies: firebase/messaging, firebaseBootstrap, db
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db, auth } from './lib/firebaseBootstrap';
import { doc, setDoc } from 'firebase/firestore';

// Get VAPID key from environment or use default
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';

let messaging: ReturnType<typeof getMessaging> | null = null;

/**
 * Initialize Firebase Messaging
 */
export async function initializeMessaging() {
  // Kill switch: FCM/messaging disabled
  const { isOff } = await import('./runtime/switches');
  if (isOff('imsg')) {
    console.info('[FCM] Disabled via kill switch (imsg:off)');
    return null;
  }
  
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('[FCM] Notifications not supported');
    return null;
  }

  try {
    const firebaseBootstrap = await import('./lib/firebaseBootstrap');
    const app = firebaseBootstrap.default;
    
    if (!app) {
      throw new Error('Firebase app not initialized');
    }
    
    // Register service worker for background messages
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM] Messaging service worker registered:', registration.scope);
      } catch (error) {
        console.warn('[FCM] Failed to register messaging service worker:', error);
      }
    }
    
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('[FCM] Failed to initialize:', error);
    return null;
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function getFCMToken(): Promise<string | null> {
  // Kill switch: FCM/messaging disabled
  const { isOff } = await import('./runtime/switches');
  if (isOff('imsg')) {
    console.info('[FCM] Disabled via kill switch (imsg:off)');
    return null;
  }
  
  if (!messaging) {
    const initialized = await initializeMessaging();
    if (!initialized) return null;
  }

  if (!VAPID_KEY) {
    console.warn('[FCM] VAPID_KEY not configured');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied');
      return null;
    }

    // Get token
    const token = await getToken(messaging!, { vapidKey: VAPID_KEY });
    
    if (token) {
      // Store token in user document
      const user = auth.currentUser;
      if (user) {
        await setDoc(
          doc(db, 'users', user.uid),
          { fcmToken: token },
          { merge: true }
        );
        console.log('[FCM] Token stored in user document');
      }
      return token;
    } else {
      console.log('[FCM] No token available');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
}

/**
 * Set up foreground message handler (shows toast)
 */
export function setupForegroundMessageHandler(onNotification: (payload: any) => void) {
  // Kill switch: FCM/messaging disabled
  import('./runtime/switches').then(({ isOff }) => {
    if (isOff('imsg')) {
      console.info('[FCM] Disabled via kill switch (imsg:off)');
      return;
    }
    
    if (!messaging) {
      initializeMessaging().then((m) => {
        if (m) {
          onMessage(m, (payload) => {
            console.log('[FCM] Foreground message received:', payload);
            onNotification(payload);
          });
        }
      });
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      onNotification(payload);
    });
  });
}

/**
 * Set up background message handler (for service worker)
 * This should be called from sw.js or a separate service worker file
 */
export function setupBackgroundMessageHandler() {
  // This is typically handled in the service worker
  // Import this in sw.js if needed
  if (typeof self !== 'undefined' && 'importScripts' in self) {
    (self as any).onBackgroundMessage = (payload: any) => {
      console.log('[FCM] Background message received:', payload);
      
      const notificationTitle = payload.notification?.title || 'New notification';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: payload.data || {},
      };

      return (self as any).registration.showNotification(notificationTitle, notificationOptions);
    };
  }
}

