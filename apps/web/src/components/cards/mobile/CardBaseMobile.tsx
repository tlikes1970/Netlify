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
  const overlayRef = useRef<HTMLDivElement>(null);

  // Debug: Log when component renders
  console.log('🎯 CardBaseMobile rendering:', { title, swipeEnabled });

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
      style={{
        display: 'grid',
        gridTemplateColumns: 'var(--poster-w, 112px) 1fr',
        gap: 'var(--space-sm, 8px)',
        minHeight: 'var(--content-h, 160px)',
        maxHeight: 'var(--content-h, 160px)',
        overflow: 'hidden',
        position: 'relative',
        border: '2px solid #ff0000', // DEBUG: Red border to see mobile cards
        backgroundColor: '#f0f0f0' // DEBUG: Light background to see mobile cards
      }}
    >
      {/* Content Proxy - moves with swipe */}
      <div className="content-proxy" style={{ position: 'relative', zIndex: 1 }}>
      {/* Poster Column */}
      <div 
        className="poster-column"
        style={{
          width: 'var(--poster-w, 112px)',
          minWidth: 'var(--poster-w, 112px)',
          height: 'var(--poster-h, 168px)',
          borderRadius: 'var(--radius-md, 10px)',
          overflow: 'hidden'
        }}
      >
        {posterUrl ? (
          <OptimizedImage
            src={posterUrl}
            alt={title}
            context="poster"
            className="h-full w-full"
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%'
            }}
            loading="lazy"
          />
        ) : (
          <div 
            className="flex h-full w-full items-center justify-center text-xs"
            style={{ 
              color: 'var(--muted)',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            No Poster
          </div>
        )}
      </div>

      {/* Content Lane */}
      <div 
        className="content-lane"
        style={{
          minHeight: 'var(--content-h, 160px)',
          maxHeight: 'var(--content-h, 160px)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          gap: 'var(--space-xs, 4px)'
        }}
      >
        {/* Title */}
        <div 
          className="card-title"
          style={{
            fontSize: 'var(--font-sm, 14px)',
            fontWeight: '600',
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.3'
          }}
        >
          {title}
        </div>

        {/* Meta */}
        <div 
          className="card-meta"
          style={{
            fontSize: 'var(--font-xs, 12px)',
            color: 'var(--muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {meta}
        </div>

        {/* Summary */}
        {summary && (
          <div 
            className="card-summary"
            style={{
              fontSize: 'var(--font-xs, 12px)',
              color: 'var(--muted)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.4'
            }}
          >
            {summary}
          </div>
        )}

        {/* Chips and Actions */}
        <div 
          className="card-footer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-xs, 4px)',
            marginTop: 'auto'
          }}
        >
          {chips}
          {actions}
        </div>

        {/* Actions Row */}
        <div className="actions" style={{ marginTop: 'var(--space-xs, 6px)' }}>
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
          
          <div style={{ display: 'flex', gap: 'var(--space-xs, 6px)', alignItems: 'center' }}>
            {draggable && (
              <button
                className="btn-drag"
                aria-roledescription="sortable handle"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'inline-grid',
                  placeItems: 'center',
                  background: 'var(--surface-1, #f3f4f6)',
                  border: 'none',
                  cursor: 'grab'
                }}
              >
                ⋮⋮
              </button>
            )}
            
            {onDelete && (
              <button
                className="btn-delete"
                onClick={onDelete}
                style={{
                  padding: '6px 10px',
                  borderRadius: '9999px',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      </div> {/* End content-proxy */}

      {/* SSR Placeholder - Always Present */}
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
          boxSizing: 'border-box'
        }}
      >
        {swipeEnabled && (
          <SwipeRowOverlay
            ref={overlayRef}
            swipeConfig={swipeConfig}
            item={item}
          />
        )}
      </div>
    </div>
  );
}
