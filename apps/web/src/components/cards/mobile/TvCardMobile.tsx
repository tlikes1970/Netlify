import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { OptimizedImage } from '../../OptimizedImage';
import { getShowStatusInfo } from '../../../utils/showStatus';

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
 * Process: TV Mobile Card
 * Purpose: TV-specific mobile card wrapper using CardBaseMobile
 * Data Source: MediaItem with TV-specific metadata
 * Update Path: Props passed from parent components
 * Dependencies: CardBaseMobile, getShowStatusInfo
 */

export interface TvCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'wishlist';
}

export function TvCardMobile({ item, actions, tabKey = 'watching' }: TvCardMobileProps) {
  const { title, year, posterUrl, synopsis, showStatus } = item;
  
  
  // Get TV-specific meta information
  const getMetaText = () => {
    const yearText = year || 'TBA';
    return `${yearText} • TV Show`;
  };

  // Get TV-specific chips/badges
  const getChips = () => {
    const chips = [];
    
    // Add TV SERIES badge
    chips.push(
      <span
        key="tv-series"
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
        TV SERIES
      </span>
    );
    
    // Add show status badge if available
    const statusInfo = getShowStatusInfo(showStatus);
    if (statusInfo) {
      chips.push(
        <span
          key="status"
          className="badge"
          style={{
            fontSize: 'var(--font-xs, 10px)',
            fontWeight: '600',
            color: statusInfo.color,
            backgroundColor: statusInfo.backgroundColor,
            border: `1px solid ${statusInfo.backgroundColor}`,
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '2px 6px'
          }}
        >
          {statusInfo.badge}
        </span>
      );
    }
    
    return chips;
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
      <div className="card-mobile">
        <div className="swipe-target">
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
      </div>
    </SwipeableCard>
  );
}
