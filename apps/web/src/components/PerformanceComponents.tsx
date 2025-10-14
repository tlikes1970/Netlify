import React, { forwardRef } from 'react';

interface VirtualScrollContainerProps {
  children: React.ReactNode;
  totalHeight: number;
  offsetY: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const VirtualScrollContainer = forwardRef<HTMLDivElement, VirtualScrollContainerProps>(
  ({ children, totalHeight, offsetY, onScroll, className = '', style = {} }, ref) => {
    return (
      <div
        ref={ref}
        className={`overflow-auto ${className}`}
        style={{
          height: '100%',
          ...style
        }}
        onScroll={onScroll}
      >
        <div
          style={{
            height: totalHeight,
            position: 'relative'
          }}
        >
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

VirtualScrollContainer.displayName = 'VirtualScrollContainer';

// Loading states component
interface LoadingStatesProps {
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  compact?: boolean;
}

export function LoadingStates({ isLoading, hasMore, error, compact = false }: LoadingStatesProps) {
  if (error) {
    return (
      <div className={`text-center py-${compact ? '4' : '8'}`}>
        <div className="text-red-500 text-sm">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-${compact ? '4' : '8'}`}>
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading more...
        </div>
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div className={`text-center py-${compact ? '4' : '8'}`}>
        <div className="text-muted-foreground text-sm">
          ✨ That's all! You've seen everything.
        </div>
      </div>
    );
  }

  return null;
}

// Infinite scroll sentinel
interface InfiniteScrollSentinelProps {
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function InfiniteScrollSentinel({ sentinelRef }: InfiniteScrollSentinelProps) {
  return (
    <div
      ref={sentinelRef}
      className="h-1 w-full"
      aria-hidden="true"
    />
  );
}

// Performance metrics component (for debugging)
interface PerformanceMetricsProps {
  cacheSize: number;
  visibleItems: number;
  totalItems: number;
  isOnline: boolean;
  cacheStatus: 'idle' | 'caching' | 'ready';
}

export function PerformanceMetrics({
  cacheSize,
  visibleItems,
  totalItems,
  isOnline,
  cacheStatus
}: PerformanceMetricsProps) {
  // Only show in development mode
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return (
      <div className="fixed bottom-20 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded-lg z-50">
        <div>📊 Performance Metrics</div>
        <div>Cache: {cacheSize} items</div>
        <div>Visible: {visibleItems}/{totalItems}</div>
        <div>Status: {isOnline ? '🟢 Online' : '🔴 Offline'}</div>
        <div>Cache: {cacheStatus}</div>
      </div>
    );
  }
  
  return null;
}
