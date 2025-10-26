import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { MediaItem } from '../components/cards/card.types';
import { useSafeResizeObserver } from './useSafeResizeObserver';

// Enhanced cache management
interface CacheConfig {
  maxItems: number;
  preloadThreshold: number;
  cleanupInterval: number;
}

interface VirtualScrollConfig {
  itemHeight: number;
  overscan: number;
  containerHeight: number;
}

interface InfiniteScrollConfig {
  pageSize: number;
  threshold: number;
  maxPages: number;
}

// Combined performance hook
export function usePerformanceOptimization<T extends MediaItem>(
  items: T[],
  config: {
    cache?: Partial<CacheConfig>;
    virtual?: Partial<VirtualScrollConfig>;
    infinite?: Partial<InfiniteScrollConfig>;
    onLoadMore?: () => Promise<T[]>;
    enableVirtual?: boolean;
    enableInfinite?: boolean;
    enableCache?: boolean;
  } = {}
) {
  const {
    cache: cacheConfig = {},
    virtual: virtualConfig = {},
    infinite: infiniteConfig = {},
    onLoadMore,
    enableVirtual = false,
    enableInfinite = false,
    enableCache = true
  } = config;

  // Default configurations
  const cacheDefaults: CacheConfig = {
    maxItems: 1000,
    preloadThreshold: 50,
    cleanupInterval: 30000 // 30 seconds
  };

  const virtualDefaults: VirtualScrollConfig = {
    itemHeight: 200, // Approximate card height
    overscan: 5,
    containerHeight: 600
  };

  const infiniteDefaults: InfiniteScrollConfig = {
    pageSize: 20,
    threshold: 200,
    maxPages: 50
  };

  const finalCacheConfig = { ...cacheDefaults, ...cacheConfig };
  const finalVirtualConfig = { ...virtualDefaults, ...virtualConfig };
  const finalInfiniteConfig = { ...infiniteDefaults, ...infiniteConfig };

  // State management
  const [allItems, setAllItems] = useState<T[]>(items);
  // const [currentPage, setCurrentPage] = useState(1); // Unused
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(finalVirtualConfig.containerHeight);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Map<string, T>>(new Map());
  const lastCleanupRef = useRef<number>(0);

  // Cache management
  const cacheKey = useCallback((item: T) => `${item.mediaType}:${item.id}`, []);
  
  const addToCache = useCallback((items: T[]) => {
    if (!enableCache) return;
    
    const cache = cacheRef.current;
    items.forEach(item => {
      cache.set(cacheKey(item), item);
    });

    // Cleanup old items if cache is too large
    if (cache.size > finalCacheConfig.maxItems) {
      const entries = Array.from(cache.entries());
      const toRemove = entries.slice(0, cache.size - finalCacheConfig.maxItems);
      toRemove.forEach(([key]) => cache.delete(key));
    }
  }, [enableCache, finalCacheConfig.maxItems, cacheKey]);

  const getFromCache = useCallback((key: string) => {
    return enableCache ? cacheRef.current.get(key) : undefined;
  }, [enableCache]);

  // Virtual scrolling calculations
  const virtualScrollData = useMemo(() => {
    if (!enableVirtual) {
      return {
        visibleItems: allItems,
        totalHeight: allItems.length * finalVirtualConfig.itemHeight,
        offsetY: 0
      };
    }

    const startIndex = Math.floor(scrollTop / finalVirtualConfig.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / finalVirtualConfig.itemHeight) + finalVirtualConfig.overscan,
      allItems.length
    );
    
    const visibleStartIndex = Math.max(0, startIndex - finalVirtualConfig.overscan);
    const visibleItems = allItems.slice(visibleStartIndex, endIndex);
    const offsetY = visibleStartIndex * finalVirtualConfig.itemHeight;
    const totalHeight = allItems.length * finalVirtualConfig.itemHeight;

    return {
      visibleItems,
      totalHeight,
      offsetY,
      startIndex: visibleStartIndex
    };
  }, [allItems, scrollTop, containerHeight, enableVirtual, finalVirtualConfig]);

  // Infinite scroll logic
  const loadMoreItems = useCallback(async () => {
    if (!enableInfinite || isLoading || !hasMore || !onLoadMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await onLoadMore();
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setAllItems(prev => {
          const combined = [...prev, ...newItems];
          addToCache(newItems);
          return combined;
        });
        // setCurrentPage(prev => prev + 1); // Unused
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setIsLoading(false);
    }
  }, [enableInfinite, isLoading, hasMore, onLoadMore, addToCache]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!enableInfinite || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreItems();
        }
      },
      {
        rootMargin: `${finalInfiniteConfig.threshold}px`
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [enableInfinite, hasMore, isLoading, loadMoreItems, finalInfiniteConfig.threshold]);

  // Scroll handling for virtual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!enableVirtual) return;
    
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, [enableVirtual]);

  // Container resize handling with safe ResizeObserver
  useSafeResizeObserver(
    containerRef,
    useCallback((entry) => {
      setContainerHeight(entry.contentRect.height);
    }, []),
    { enabled: enableVirtual }
  );

  // Cache cleanup
  useEffect(() => {
    if (!enableCache) return;

    const cleanup = () => {
      const now = Date.now();
      if (now - lastCleanupRef.current > finalCacheConfig.cleanupInterval) {
        // Remove items not in current view
        const currentKeys = new Set(allItems.map(cacheKey));
        const cache = cacheRef.current;
        
        for (const [key] of cache.entries()) {
          if (!currentKeys.has(key)) {
            cache.delete(key);
          }
        }
        
        lastCleanupRef.current = now;
      }
    };

    const interval = setInterval(cleanup, finalCacheConfig.cleanupInterval);
    return () => clearInterval(interval);
  }, [enableCache, allItems, finalCacheConfig.cleanupInterval, cacheKey]);

  // Preload images for visible items
  useEffect(() => {
    if (!enableCache) return;

    const visibleItems = virtualScrollData.visibleItems.slice(0, finalCacheConfig.preloadThreshold);
    const imageUrls = visibleItems
      .map(item => item.posterUrl)
      .filter((url): url is string => Boolean(url));

    // Preload images
    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [virtualScrollData.visibleItems, enableCache, finalCacheConfig.preloadThreshold]);

  return {
    // Data
    items: virtualScrollData.visibleItems,
    allItems,
    isLoading,
    hasMore,
    error,
    
    // Virtual scroll data
    totalHeight: virtualScrollData.totalHeight,
    offsetY: virtualScrollData.offsetY,
    startIndex: virtualScrollData.startIndex || 0,
    
    // Refs
    containerRef,
    sentinelRef,
    
    // Handlers
    handleScroll,
    loadMoreItems,
    
    // Cache info
    cacheSize: cacheRef.current.size,
    getFromCache
  };
}

// Enhanced service worker integration
export function useEnhancedOfflineCache() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState<'idle' | 'caching' | 'ready'>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const preloadCriticalData = useCallback(async (items: MediaItem[]) => {
    if (!('serviceWorker' in navigator)) return;

    try {
      setCacheStatus('caching');
      
      // Preload images
      const imageUrls = items
        .map(item => item.posterUrl)
        .filter((url): url is string => Boolean(url))
        .slice(0, 50); // Limit to first 50

      if (imageUrls.length > 0) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: 'CACHE_IMAGES',
          data: { urls: imageUrls }
        });
      }

      setCacheStatus('ready');
    } catch (error) {
      console.warn('Failed to preload data:', error);
      setCacheStatus('idle');
    }
  }, []);

  return {
    isOnline,
    cacheStatus,
    preloadCriticalData
  };
}
