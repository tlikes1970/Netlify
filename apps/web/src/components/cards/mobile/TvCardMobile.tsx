import React from 'react';
import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { OptimizedImage } from '../../OptimizedImage';
import { getShowStatusInfo } from '../../../utils/showStatus';
import { CompactOverflowMenu } from '../../../features/compact/CompactOverflowMenu';
import StarRating from '../StarRating';
import { ProviderBadges } from '../ProviderBadge';
import { DragHandle } from '../DragHandle';
import MyListToggle from '../../MyListToggle';
import { Library } from '../../../lib/storage';
import { getItemSynopsis } from '../../../lib/itemSynopsis';
import { POSTER_PLACEHOLDER } from '../../../lib/posterPlaceholder';

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
  const [enrichedItem, setEnrichedItem] = React.useState(item);
  const synopsis = getItemSynopsis(enrichedItem);
  const { title, year, posterUrl, showStatus } = enrichedItem;
  
  // Subscribe to library changes to update rating/notes
  React.useEffect(() => {
    const updateFromLibrary = () => {
      const latestEntry = Library.getEntry(item.id, item.mediaType);
      if (latestEntry) {
        setEnrichedItem({
          ...item,
          synopsis: latestEntry.synopsis,
          userRating: latestEntry.userRating,
          userNotes: latestEntry.userNotes,
          tags: latestEntry.tags,
        });
      } else {
        setEnrichedItem(item);
      }
    };

    updateFromLibrary();
    const unsubscribe = Library.subscribe(updateFromLibrary);
    return () => { unsubscribe(); };
  }, [item.id, item.mediaType]);
  
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
      actions.onRatingChange(enrichedItem, rating);
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

  // Convert tabKey to currentListContext for MyListToggle (matches desktop TabCard behavior)
  const getCurrentListContext = (tabKey: 'watching' | 'watched' | 'want'): 'watching' | 'wishlist' | 'watched' | undefined => {
    switch (tabKey) {
      case 'watching': return 'watching';
      case 'want': return 'wishlist';
      case 'watched': return 'watched';
      default: return undefined;
    }
  };

  return (
    <SwipeableCard
      item={enrichedItem}
      actions={actions}
      context={getContextFromTabKey(tabKey)}
    >
      <div 
        className="card-mobile" 
        style={{ position: 'relative', overflow: 'visible' }}
        data-item-index={index}
      >
        {/* Drag Handle - Mobile (always visible, dimmed; full opacity on touch-hold) */}
        {onDragStart && (
          <DragHandle
            itemId={String(enrichedItem.id)}
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
            itemTitle={enrichedItem.title}
            onTouchDragMove={(_e, _idx) => {
              // Touch drag move is handled by global listener in DragHandle
              // This callback is called to notify parent about potential drop target
            }}
          />
        )}
        
        {/* Poster Column */}
        <div className="poster-col" style={{ position: 'relative' }}>
          <OptimizedImage
            src={posterUrl || ''}
            alt={`${title} poster`}
            context="poster"
            fallbackSrc={POSTER_PLACEHOLDER}
            className="poster-image"
            loading="lazy"
          />
          {/* My List + button */}
          <MyListToggle 
            item={enrichedItem} 
            currentListContext={getCurrentListContext(tabKey)}
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
            {enrichedItem.networks && enrichedItem.networks.length > 0 && (
              <ProviderBadges providers={enrichedItem.networks} maxVisible={2} mediaType="tv" />
            )}
          </header>

          {/* Synopsis */}
          {synopsis && (
            <div className="synopsis">{synopsis}</div>
          )}

          <div className="mobile-actions-row" style={{ marginTop: '12px' }}>
            <StarRating
              value={enrichedItem.userRating || 0}
              onChange={handleRatingChange}
              size="sm"
            />
          </div>
          
          <div className="mobile-overflow-position">
            <CompactOverflowMenu 
              item={enrichedItem as any} 
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
