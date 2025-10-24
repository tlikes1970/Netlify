import React, { useState, useRef, useEffect } from 'react';
import type { MediaItem, CardActionHandlers } from '../card.types';
import { OptimizedImage } from '../../OptimizedImage';
import { SwipeRowOverlay } from './SwipeRowOverlay';
import '../../../styles/cards-mobile.css'; // make sure CSS actually loads

/**
 * Process: Mobile Card Base
 * Purpose: Unified mobile card skeleton with overlay swipe functionality
 * Data Source: MediaItem props and swipe configuration
 * Update Path: Props passed from parent components
 * Dependencies: SwipeRowOverlay, OptimizedImage, cards-mobile.css
 */

export interface CardBaseMobileProps {
  posterUrl?: string;
  title: string;
  meta: string;
  summary?: string;
  chips: React.ReactNode;
  actions: React.ReactNode;
  swipeConfig: {
    leftAction?: { label: string; action: () => void };
    rightAction?: { label: string; action: () => void };
  };
  testId?: string;
  item: MediaItem;
  onDelete?: () => void;
  draggable?: boolean;
  providers?: Array<{ name: string; url: string }>;
}

export function CardBaseMobile({
  posterUrl,
  title,
  meta,
  summary,
  chips,
  actions,
  swipeConfig,
  testId,
  item,
  onDelete,
  draggable = false,
  providers = []
}: CardBaseMobileProps) {
  const [swipeEnabled, setSwipeEnabled] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);


  // Enable swipe after hydration to avoid SSR mismatch
  useEffect(() => {
    setSwipeEnabled(true);
  }, []);

  // ResizeObserver guardrail: keep overlay sized to the card without affecting layout
  useEffect(() => {
    const el = cardRef.current;
    const overlay = el?.querySelector(".swipe-row");
    if (!el || !overlay) return;
    
    const sync = () => {
      overlay.style.width = `${el.clientWidth}px`;
      overlay.style.height = `${el.clientHeight}px`;
    };
    
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();
    return () => ro.disconnect();
  }, []);

  return (
    <div 
      ref={cardRef}
      className="card-mobile"
      data-testid={testId}
    >
      {/* Swipe Target - wraps real content */}
      <div className="swipe-target" ref={targetRef}>
        {/* Poster Column */}
        <div className="poster-column">
          {posterUrl ? (
            <OptimizedImage
              src={posterUrl}
              alt={title}
              context="poster"
              className="h-full w-full"
              className="poster"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted bg-card-bg">
              No Poster
            </div>
          )}
        </div>

        {/* Content Lane */}
        <div className="content">
        {/* Title */}
        <div className="card-title">
          {title}
        </div>

        {/* Meta */}
        <div className="card-meta">
          {meta}
        </div>

        {/* Summary */}
        <div className="card-summary">
          {summary}
        </div>

        {/* Chips */}
        <div className="chips">
          {chips}
        </div>

        {/* Actions Row */}
        <div className="actions">
          <div className="providers">
            {providers.slice(0, 3).map((provider, index) => (
              <span key={index} className="provider-chip">
                {provider.name}
              </span>
            ))}
            {providers.length > 3 && (
              <span className="provider-chip">+{providers.length - 3}</span>
            )}
          </div>
          
          {draggable && (
            <button
              className="btn-drag"
              aria-roledescription="sortable handle"
              data-drag-handle
            >
              ⋮⋮
            </button>
          )}
          
          {onDelete && (
            <button
              className="btn-delete"
              onClick={onDelete}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Swipe Overlay - Always Present */}
      <div 
        className="swipe-row" 
        aria-hidden={!swipeEnabled}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 5,
          margin: 0,
          padding: 0,
          border: 'none',
          boxSizing: 'border-box',
          background: 'transparent'
        }}
      >
        {swipeEnabled && (
          <SwipeRowOverlay
            swipeConfig={swipeConfig}
            targetRef={targetRef}
          />
        )}
      </div>
    </div>
  );
}
