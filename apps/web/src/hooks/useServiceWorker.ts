import { useState, useEffect, useCallback } from 'react';
import { isOff } from '../runtime/switches';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

// Service Worker management hook
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    registration: null,
    error: null
  });

  // Register service worker
  const register = useCallback(async () => {
    // Kill switch: Service Worker disabled
    if (isOff('isw')) {
      console.info('[SW] Disabled via kill switch (isw:off)');
      return;
    }
    
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Service Worker not supported' }));
      return;
    }

    try {
      console.log('[SW] Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service worker registered:', registration);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
        error: null
      }));

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('[SW] Update found, installing...');
        
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available, reloading...');
              window.location.reload();
            }
          });
        }
      });

    } catch (error) {
      console.error('[SW] Registration failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
    }
  }, [state.isSupported]);

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.unregister();
      console.log('[SW] Service worker unregistered');
      
      setState(prev => ({
        ...prev,
        isRegistered: false,
        registration: null
      }));
    } catch (error) {
      console.error('[SW] Unregistration failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unregistration failed'
      }));
    }
  }, [state.registration]);

  // Pre-cache images
  const preCacheImages = useCallback(async (urls: string[]) => {
    if (!state.registration?.active) return;

    try {
      state.registration.active.postMessage({
        type: 'CACHE_IMAGES',
        data: { urls }
      });
      console.log('[SW] Pre-caching images:', urls.length);
    } catch (error) {
      console.error('[SW] Pre-cache failed:', error);
    }
  }, [state.registration]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!state.registration?.active) return;

    try {
      state.registration.active.postMessage({
        type: 'CLEAR_CACHE'
      });
      console.log('[SW] Cache cleared');
    } catch (error) {
      console.error('[SW] Clear cache failed:', error);
    }
  }, [state.registration]);

  // Get cache size
  const getCacheSize = useCallback(async (): Promise<number> => {
    if (!state.registration?.active) return 0;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size);
      };

      state.registration!.active!.postMessage({
        type: 'GET_CACHE_SIZE'
      }, [messageChannel.port2]);
    });
  }, [state.registration]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      console.log('[SW] Back online');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.log('[SW] Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-register on mount (disabled in dev)
  useEffect(() => {
    // Kill switch: Service Worker disabled
    if (isOff('isw')) return;
    
    // Don't register in dev mode
    if (import.meta.env.DEV) return;
    
    if (state.isSupported && !state.isRegistered && !state.error) {
      register();
    }
  }, [state.isSupported, state.isRegistered, state.error, register]);

  return {
    ...state,
    register,
    unregister,
    preCacheImages,
    clearCache,
    getCacheSize
  };
}

// Image pre-caching hook
export function useImagePreCache() {
  const { preCacheImages, isRegistered } = useServiceWorker();

  const preCachePosters = useCallback(async (items: Array<{ posterUrl?: string }>) => {
    if (!isRegistered) return;

    const urls = items
      .map(item => item.posterUrl)
      .filter((url): url is string => Boolean(url))
      .slice(0, 20); // Limit to first 20 images

    if (urls.length > 0) {
      await preCacheImages(urls);
    }
  }, [preCacheImages, isRegistered]);

  return { preCachePosters };
}
