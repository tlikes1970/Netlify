import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { OptimizedImage } from '../../OptimizedImage';
import { getShowStatusInfo } from '../../../utils/showStatus';
import { CompactOverflowMenu } from '../../../features/compact/CompactOverflowMenu';
import StarRating from '../StarRating';
import { ProviderBadges } from '../ProviderBadge';
import { DragHandle } from '../DragHandle';

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
  tabKey?: 'watching' | 'watched' | 'want';
  index?: number;
  onDragStart?: (e: React.DragEvent | React.TouchEvent, index: number) => void;
  onDragEnd?: () => void;
  onKeyboardReorder?: (direction: "up" | "down") => void;
  isDragging?: boolean;
}

export function TvCardMobile({ item, actions, tabKey = 'watching', index = 0, onDragStart, onDragEnd, onKeyboardReorder, isDragging }: TvCardMobileProps) {
  const { title, year, posterUrl, showStatus, userRating, synopsis } = item;
  
  // Get TV-specific meta information
  const getMetaText = () => {
    const yearText = year || 'TBA';
    return `${yearText} • TV Show`;
  };

  // Get TV-specific chips/badges
  const getChips = () => {
    const chips = [];
    
    // Only add show status badge if available (removed "TV SERIES" since meta already says "TV Show")
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

  const handleRatingChange = (rating: number) => {
    if (actions?.onRatingChange) {
      actions.onRatingChange(item, rating);
    }
  };

  // Convert tabKey to SwipeableCard context
  const getContextFromTabKey = (tabKey: 'watching' | 'watched' | 'want') => {
    switch (tabKey) {
      case 'watching': return 'tab-watching';
      case 'watched': return 'tab-watched';
      case 'want': return 'tab-want';
      default: return 'tab-watching';
    }
  };

  return (
    <SwipeableCard
      item={item}
      actions={actions}
      context={getContextFromTabKey(tabKey)}
    >
      <div 
        className="card-mobile" 
        style={{ position: 'relative', overflow: 'visible', zIndex: 'auto' }}
        data-item-index={index}
      >
        {/* Drag Handle - Mobile (always visible, dimmed; full opacity on touch-hold) */}
        {onDragStart && (
          <DragHandle
            itemId={String(item.id)}
            index={index}
            onDragStart={(e, idx) => {
              if ('touches' in e) {
                // Touch event - notify parent
                onDragStart(e as any, idx);
              } else {
                onDragStart(e as any, idx);
              }
            }}
            onDragEnd={onDragEnd}
            onKeyboardReorder={onKeyboardReorder}
            isDragging={isDragging}
            itemTitle={item.title}
            onTouchDragMove={(_e, _idx) => {
              // Touch drag move is handled by global listener in DragHandle
              // This callback is called to notify parent about potential drop target
            }}
          />
        )}
        
        {/* Poster Column */}
        <div className="poster-col">
          <OptimizedImage
            src={posterUrl || ''}
            alt={`${title} poster`}
            context="poster"
            fallbackSrc={POSTER_PLACEHOLDER}
            className="poster-image"
            loading="lazy"
          />
        </div>

        {/* Info Column */}
        <div className="info-col">
          <header>
            <h3>{title}</h3>
            <span className="meta">{getMetaText()}</span>
            {getChips().length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                {getChips()}
              </div>
            )}
            {/* Provider badges */}
            {item.networks && item.networks.length > 0 && (
              <ProviderBadges providers={item.networks} maxVisible={2} mediaType="tv" />
            )}
          </header>

          {/* Synopsis */}
          {synopsis && (
            <div className="synopsis">{synopsis}</div>
          )}

          <div className="mobile-actions-row" style={{ marginTop: '12px' }}>
            <StarRating
              value={userRating || 0}
              onChange={handleRatingChange}
              size="sm"
            />
          </div>
          
          <div className="mobile-overflow-position">
            <CompactOverflowMenu 
              item={item as any} 
              context={`tab-${tabKey}`}
              actions={actions}
              showText={false}
            />
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
}
