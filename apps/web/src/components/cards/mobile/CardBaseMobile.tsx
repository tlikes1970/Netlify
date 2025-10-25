import React, { useState, useRef, useEffect } from 'react';
import type { MediaItem, CardActionHandlers } from '../card.types';
import type { SwipeConfig } from '../../../lib/swipeMaps';
import { OptimizedImage } from '../../OptimizedImage';
import { SwipeRowOverlay } from './SwipeRowOverlay';
import { getSwipeLabels } from '../../../lib/swipeMaps';
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
  swipeConfig: SwipeConfig;
  testId?: string;
  item: MediaItem;
  actionHandlers?: CardActionHandlers;
  onDelete?: () => void;
  draggable?: boolean;
  providers?: Array<{ name: string; url: string }>;
  userRating?: number;
  avgRating?: number;
  onRate?: (itemId: string, value: number) => void;
  onOverflowClick?: (itemId: string) => void;
  tabKey: 'watching' | 'watched' | 'wishlist';
}

export function CardBaseMobile({
  posterUrl,
  title,
  meta,
  summary,
  chips,
  swipeConfig,
  testId,
  item,
  onDelete,
  draggable = false,
  providers = [],
  userRating,
  avgRating,
  onRate,
  onOverflowClick,
  tabKey,
  actionHandlers
}: CardBaseMobileProps) {
  const [swipeEnabled, setSwipeEnabled] = useState(false);
  const [localRating, setLocalRating] = useState(userRating || 0);
  const cardRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  // Get swipe labels
  const { leftLabel, rightLabel } = getSwipeLabels(tabKey);


  // Enable swipe after hydration to avoid SSR mismatch
  useEffect(() => {
    setSwipeEnabled(true);
  }, []);

  // Update local rating when userRating prop changes
  useEffect(() => {
    setLocalRating(userRating || 0);
  }, [userRating]);

  // Rating event handlers
  const getValueFromPoint = (e: React.PointerEvent): number => {
    const starsContainer = e.currentTarget as HTMLElement;
    const rect = starsContainer.getBoundingClientRect();
    const x = e.clientX;
    const relativeX = x - rect.left;
    const starWidth = rect.width / 5;
    const starIndex = Math.floor(relativeX / starWidth) + 1;
    return Math.max(1, Math.min(5, starIndex));
  };

  const handleRatingPointer = (e: React.PointerEvent) => {
    if (!(e.buttons & 1)) return; // only while pressed
    e.stopPropagation();
    const v = getValueFromPoint(e);
    setLocalRating(v);
  };

  const handleRatingPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    const v = getValueFromPoint(e);
    setLocalRating(v);
    onRate?.(String(item.id), v);
  };

  const handleRatingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = (e.target as HTMLElement).closest('.star') as HTMLElement | null;
    const v = target ? Number(target.dataset.value) : undefined;
    if (v) { 
      setLocalRating(v); 
      onRate?.(String(item.id), v); 
    }
  };

  const handleStarKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const current = Math.round(localRating || 0);
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { 
      e.preventDefault(); 
      const v = Math.min(5, current + 1); 
      setLocalRating(v); 
      onRate?.(String(item.id), v); 
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { 
      e.preventDefault(); 
      const v = Math.max(1, current - 1); 
      setLocalRating(v); 
      onRate?.(String(item.id), v); 
    }
  };

  // ResizeObserver guardrail: keep overlay sized to the card without affecting layout
  useEffect(() => {
    const el = cardRef.current;
    const overlay = el?.querySelector(".swipe-row");
    if (!el || !overlay) return;
    
    const sync = () => {
      (overlay as HTMLElement).style.width = `${el.clientWidth}px`;
      (overlay as HTMLElement).style.height = `${el.clientHeight}px`;
    };
    
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();
    
    return () => {
      ro.disconnect();
    };
  }, [item.id, swipeEnabled]); // Recreate observer when item changes or swipe state changes

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
        {/* Swipe hint labels */}
        <div className="hint left">{leftLabel}</div>
        <div className="hint right">{rightLabel}</div>
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
            <button 
              className="btn-overflow" 
              aria-label="More" 
              onClick={() => onOverflowClick?.(String(item.id))}
              style={{ marginRight: '4px' }}
            >
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

          {/* Rating row */}
          <div className="rating-row" role="group" aria-label="Rate">
            <span className="rating-label">Rate:</span>
            <div
              className="stars"
              role="radiogroup"
              aria-label="Your rating"
              onPointerDown={handleRatingPointer}
              onPointerMove={handleRatingPointer}
              onPointerUp={handleRatingPointerUp}
              onClick={handleRatingClick}
            >
              {/* Five buttons, 32x32 min tap targets */}
              {[1,2,3,4,5].map(v => (
                <button
                  key={v}
                  type="button"
                  className={v <= Math.round(localRating || 0) ? "star filled" : "star"}
                  role="radio"
                  aria-checked={Math.round(localRating || 0) === v}
                  aria-label={`${v} star${v>1?'s':''}`}
                  data-value={v}
                  onKeyDown={handleStarKey}
                />
              ))}
            </div>
            {typeof avgRating === 'number' && (
              <span className="avg" aria-label={`Average rating ${avgRating.toFixed(1)} out of 5`}>
                {avgRating.toFixed(1)}
              </span>
            )}
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
                <a 
                  key={index} 
                  className="provider-chip"
                  href={provider.url}
                  target="_blank"
                  rel="noopener"
                >
                  {provider.name}
                </a>
              ))}
              {providers.length > 3 && (
                <span className="provider-chip">+{providers.length - 3}</span>
              )}
            </div>
            
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

      {/* Side drag rail */}
      {draggable && (
        <button
          className="drag-rail"
          data-drag-handle
          aria-roledescription="sortable handle"
          aria-label="Reorder"
          onPointerDown={e => e.stopPropagation()}
          onPointerMove={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
        />
      )}

      {/* Swipe Overlay - Always Present */}
      <div 
        className="swipe-row" 
        aria-hidden={!swipeEnabled}
        style={{
          position: 'absolute',
          inset: 0,
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
            item={item}
            actions={actionHandlers}
          />
        )}
      </div>
    </div>
  );
}
