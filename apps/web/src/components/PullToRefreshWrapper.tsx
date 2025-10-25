import React from 'react';
import { usePullToRefresh, UsePullToRefreshProps } from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';

export interface PullToRefreshWrapperProps extends UsePullToRefreshProps {
  children: React.ReactNode;
  className?: string;
  indicatorClassName?: string;
  compact?: boolean;
}

export default function PullToRefreshWrapper({
  children,
  className = '',
  indicatorClassName = '',
  compact: _compact = false,
  ...pullToRefreshProps
}: PullToRefreshWrapperProps) {
  const {
    state,
    containerRef,
    refreshIndicatorStyles,
    containerStyles,
    isEnabled
  } = usePullToRefresh(pullToRefreshProps);

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        state={state}
        styles={refreshIndicatorStyles}
        className={indicatorClassName}
      />

      {/* Main Content Container */}
      <div
        ref={containerRef}
        className={`relative ${className}`}
        style={containerStyles}
      >
        {children}
      </div>
    </div>
  );
}
