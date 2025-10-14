import React from 'react';
import { PullToRefreshState } from '../hooks/usePullToRefresh';

export interface PullToRefreshIndicatorProps {
  state: PullToRefreshState;
  styles: React.CSSProperties;
  className?: string;
}

export default function PullToRefreshIndicator({ 
  state, 
  styles, 
  className = '' 
}: PullToRefreshIndicatorProps) {
  const { isPulling, isRefreshing, canRefresh } = state;

  if (!isPulling && !isRefreshing) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 ${className}`}
      style={{
        ...styles,
        backgroundColor: 'var(--background)',
        borderBottom: '1px solid var(--line)'
      }}
    >
      <div className="flex items-center gap-3">
        {/* Spinner or Arrow */}
        <div className="relative">
          {isRefreshing ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <div 
              className={`w-6 h-6 transition-transform duration-200 ${
                canRefresh ? 'rotate-180' : ''
              }`}
            >
              <svg 
                className="w-full h-full" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--primary)' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                />
              </svg>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {isRefreshing ? (
            'Refreshing...'
          ) : canRefresh ? (
            'Release to refresh'
          ) : (
            'Pull to refresh'
          )}
        </div>
      </div>
    </div>
  );
}

// Alternative compact version for smaller screens
export function CompactPullToRefreshIndicator({ 
  state, 
  styles, 
  className = '' 
}: PullToRefreshIndicatorProps) {
  const { isPulling, isRefreshing, canRefresh } = state;

  if (!isPulling && !isRefreshing) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 ${className}`}
      style={{
        ...styles,
        backgroundColor: 'var(--background)',
        borderBottom: '1px solid var(--line)'
      }}
    >
      <div className="flex items-center gap-2">
        {/* Compact Spinner */}
        <div className="relative">
          {isRefreshing ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <div 
              className={`w-4 h-4 transition-transform duration-200 ${
                canRefresh ? 'rotate-180' : ''
              }`}
            >
              <svg 
                className="w-full h-full" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--primary)' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                />
              </svg>
            </div>
          )}
        </div>

        {/* Compact Text */}
        <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
          {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release' : 'Pull'}
        </div>
      </div>
    </div>
  );
}
