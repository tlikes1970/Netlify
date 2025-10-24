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
      {/* Swipe Background - sits under content, hidden until dragging */}
      <div className="swipe-bg" aria-hidden="true">
        <div className="reveal left"></div>
        <div className="reveal right"></div>
      </div>

      {/* Swipe Target - wraps real content */}
      <div className="swipe-target" ref={targetRef}>
        {/* Poster */}
        {posterUrl ? (
          <OptimizedImage
            src={posterUrl}
            alt={title}
            context="poster"
            className="poster"
            loading="lazy"
          />
        ) : (
          <div className="poster flex items-center justify-center text-xs text-muted bg-card-bg">
            No Poster
          </div>
        )}

        {/* Content */}
        <div className="content">
          {/* Topline */}
          <div className="topline">
            <div className="title">
              {title}
            </div>
            <button className="btn-overflow" aria-label="More">
              ⋯
            </button>
          </div>

          {/* Subline */}
          <div className="subline">
            {meta}
          </div>

          {/* Chips */}
          <div className="chips">
            {chips}
          </div>

          {/* Summary */}
          {summary && (
            <div className="summary">
              {summary}
            </div>
          )}

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
                data-drag-handle
                aria-roledescription="sortable handle"
              >
                ⋮⋮
              </button>
            )}
            
            {onDelete && (
              <button
                className="btn-delete"
                type="button"
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
        <div className="gesture-plane"></div>
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
