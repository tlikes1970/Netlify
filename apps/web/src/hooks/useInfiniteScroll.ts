import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface InfiniteScrollOptions<T> {
  items: T[];
  pageSize?: number;
  threshold?: number;
  enabled?: boolean;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
}

export interface InfiniteScrollState<T> {
  visibleItems: T[];
  currentPage: number;
  isLoading: boolean;
  hasMore: boolean;
  totalItems: number;
}

export function useInfiniteScroll<T>({
  items,
  pageSize = 20,
  threshold = 200,
  enabled = true,
  onLoadMore,
  hasMore: externalHasMore,
  loading: externalLoading = false
}: InfiniteScrollOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Calculate visible items based on current page
  const visibleItems = useMemo(() => {
    const endIndex = currentPage * pageSize;
    return items.slice(0, endIndex);
  }, [items, currentPage, pageSize]);

  // Determine if there are more items to load
  const hasMore = useMemo(() => {
    if (externalHasMore !== undefined) return externalHasMore;
    return visibleItems.length < items.length;
  }, [externalHasMore, visibleItems.length, items.length]);

  // Determine loading state
  const isLoading = externalLoading || isLoadingMore;

  // Load more items
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoadingMore(true);
    
    try {
      if (onLoadMore) {
        await onLoadMore();
      } else {
        // Default behavior: just increase page
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, hasMore, onLoadMore]);

  // Set up intersection observer
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const sentinel = sentinelRef.current;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, isLoading, threshold, loadMore]);

  // Reset when items change (e.g., new search)
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Manual load more function
  const loadMoreManually = useCallback(() => {
    loadMore();
  }, [loadMore]);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setIsLoadingMore(false);
  }, []);

  return {
    state: {
      visibleItems,
      currentPage,
      isLoading,
      hasMore,
      totalItems: items.length
    },
    refs: {
      containerRef,
      sentinelRef
    },
    actions: {
      loadMore: loadMoreManually,
      resetPagination
    }
  };
}

// Hook specifically for API-based infinite scroll
export function useInfiniteScrollAPI<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>,
  pageSize: number = 20,
  threshold: number = 200
) {
  const [allItems, setAllItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(currentPage, pageSize);
      
      if (currentPage === 1) {
        setAllItems(result.items);
      } else {
        setAllItems(prev => [...prev, ...result.items]);
      }
      
      setHasMore(result.hasMore);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, currentPage, pageSize, isLoading, hasMore]);

  const reset = useCallback(() => {
    setAllItems([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
  }, []);

  const infiniteScroll = useInfiniteScroll({
    items: allItems,
    pageSize,
    threshold,
    onLoadMore: loadMore,
    hasMore,
    loading: isLoading
  });

  return {
    ...infiniteScroll,
    error,
    reset
  };
}
