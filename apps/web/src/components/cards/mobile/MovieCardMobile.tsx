import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { OptimizedImage } from '../../OptimizedImage';
import { CompactOverflowMenu } from '../../../features/compact/CompactOverflowMenu';

// neutral 112x168 poster placeholder (SVG data URI)
const POSTER_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="112" height="168" viewBox="0 0 112 168">
    <defs>
      <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
        <stop stop-color="#1f2937" offset="0"/>
        <stop stop-color="#111827" offset="1"/>
      </linearGradient>
    </defs>
    <rect width="112" height="168" fill="url(#g)"/>
    <rect x="8" y="8" width="96" height="152" rx="8" ry="8" fill="none" stroke="#374151" stroke-width="2"/>
    <g fill="#4B5563">
      <circle cx="56" cy="62" r="22"/>
      <rect x="28" y="96" width="56" height="12" rx="6"/>
      <rect x="36" y="116" width="40" height="10" rx="5"/>
    </g>
  </svg>
`);

/**
 * Process: Movie Mobile Card
 * Purpose: Movie-specific mobile card wrapper using CardBaseMobile
 * Data Source: MediaItem with Movie-specific metadata
 * Update Path: Props passed from parent components
 * Dependencies: CardBaseMobile
 */

export interface MovieCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'wishlist';
}

export function MovieCardMobile({ item, actions, tabKey = 'watching' }: MovieCardMobileProps) {
  const { title, year, posterUrl, synopsis } = item;
  
  
  // Get Movie-specific meta information
  const getMetaText = () => {
    const yearText = year || 'TBA';
    return `${yearText} • Movie`;
  };

  // Get Movie-specific chips/badges
  const getChips = () => {
    return [
      <span
        key="movie"
        className="badge"
        style={{
          fontSize: 'var(--font-xs, 10px)',
          fontWeight: '600',
          color: 'var(--muted)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-sm, 4px)',
          padding: '2px 6px'
        }}
      >
        MOVIE
      </span>
    ];
  };

  // Note: Removed unused functions (getProviders, handleRate, handleOverflowClick)
  // These were part of the CardBaseMobile implementation

  // Convert tabKey to SwipeableCard context
  const getContextFromTabKey = (tabKey: 'watching' | 'watched' | 'wishlist') => {
    switch (tabKey) {
      case 'watching': return 'tab-watching';
      case 'watched': return 'tab-watched';
      case 'wishlist': return 'tab-want';
      default: return 'tab-watching';
    }
  };

  return (
    <SwipeableCard
      item={item}
      actions={actions}
      context={getContextFromTabKey(tabKey)}
    >
      <div className="card-mobile" style={{ display: 'flex', gap: '8px' }}>
        {/* Drag Handle */}
        <div className="drag-handle" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'grab', 
          padding: '0 4px',
          color: 'var(--muted)'
        }}>
          <div style={{ 
            width: '3px', 
            height: '40px', 
            background: 'var(--line)',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '2px 0'
          }}>
            <div style={{ width: '100%', height: '2px', background: 'currentColor', borderRadius: '1px' }}></div>
            <div style={{ width: '100%', height: '2px', background: 'currentColor', borderRadius: '1px' }}></div>
            <div style={{ width: '100%', height: '2px', background: 'currentColor', borderRadius: '1px' }}></div>
          </div>
        </div>
        
        <div className="swipe-target" style={{ flex: 1 }}>
          <div className="poster-section">
            <div className="poster-wrapper">
              <OptimizedImage
                src={posterUrl || ''}
                alt={`${title} poster`}
                context="poster"
                fallbackSrc={POSTER_PLACEHOLDER}
                className="poster-image"
                style={{
                  width: '112px',
                  height: '168px',
                  borderRadius: 'var(--radius-md, 8px)'
                }}
                loading="lazy"
              />
            </div>
          </div>
          
          <div className="content-section">
            <div className="header">
              <h3 className="title" style={{ fontSize: 'var(--font-lg, 16px)', fontWeight: '600', color: 'var(--text)' }}>
                {title}
              </h3>
              <div className="meta" style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--muted)' }}>
                {getMetaText()}
              </div>
            </div>
            
            <div className="chips" style={{ display: 'flex', gap: 'var(--space-xs, 4px)', flexWrap: 'wrap' }}>
              {getChips()}
            </div>
            
            {synopsis && (
              <div className="summary" style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--muted)', lineHeight: '1.4' }}>
                {synopsis}
              </div>
            )}
          </div>
        </div>
        
        {/* Overflow Menu */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CompactOverflowMenu 
            item={item as any} 
            context="tab" 
          />
        </div>
      </div>
    </SwipeableCard>
  );
}
