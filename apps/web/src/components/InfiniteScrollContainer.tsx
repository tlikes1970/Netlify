import React from 'react';
import { InfiniteScrollState } from '../hooks/useInfiniteScroll';

export interface InfiniteScrollContainerProps<T> {
  state: InfiniteScrollState<T>;
  sentinelRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  error?: string | null;
}

export default function InfiniteScrollContainer<T>({
  state,
  sentinelRef,
  children,
  className = '',
  loadingComponent,
  endComponent,
  errorComponent,
  error
}: InfiniteScrollContainerProps<T>) {
  const { isLoading, hasMore, totalItems, visibleItems } = state;

  // Default loading component
  const defaultLoadingComponent = (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          Loading more items...
        </span>
      </div>
    </div>
  );

  // Default end component
  const defaultEndComponent = (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
          That's all!
        </div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          {totalItems} {totalItems === 1 ? 'item' : 'items'} total
        </div>
      </div>
    </div>
  );

  // Default error component
  const defaultErrorComponent = error ? (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="text-sm font-medium mb-1 text-red-600">
          Failed to load items
        </div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          {error}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative ${className}`}>
      {/* Main Content */}
      {children}

      {/* Loading Sentinel - invisible trigger for intersection observer */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading State */}
      {isLoading && hasMore && (
        <div className="mt-4">
          {loadingComponent || defaultLoadingComponent}
        </div>
      )}

      {/* End State */}
      {!hasMore && !isLoading && visibleItems.length > 0 && (
        <div className="mt-4">
          {endComponent || defaultEndComponent}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4">
          {errorComponent || defaultErrorComponent}
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactInfiniteScrollContainer<T>({
  state,
  sentinelRef,
  children,
  className = '',
  loadingComponent,
  endComponent,
  errorComponent,
  error
}: InfiniteScrollContainerProps<T>) {
  const { isLoading, hasMore, totalItems, visibleItems } = state;

  // Compact loading component
  const compactLoadingComponent = (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          Loading...
        </span>
      </div>
    </div>
  );

  // Compact end component
  const compactEndComponent = (
    <div className="flex items-center justify-center py-4">
      <div className="text-xs" style={{ color: 'var(--muted)' }}>
        {totalItems} items total
      </div>
    </div>
  );

  // Compact error component
  const compactErrorComponent = error ? (
    <div className="flex items-center justify-center py-4">
      <div className="text-xs text-red-600">
        Failed to load: {error}
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative ${className}`}>
      {/* Main Content */}
      {children}

      {/* Loading Sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading State */}
      {isLoading && hasMore && (
        <div className="mt-2">
          {loadingComponent || compactLoadingComponent}
        </div>
      )}

      {/* End State */}
      {!hasMore && !isLoading && visibleItems.length > 0 && (
        <div className="mt-2">
          {endComponent || compactEndComponent}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-2">
          {errorComponent || compactErrorComponent}
        </div>
      )}
    </div>
  );
}
