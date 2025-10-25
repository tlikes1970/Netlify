import type { MediaItem, CardActionHandlers } from '../card.types';
import { CardBaseMobile } from './CardBaseMobile';
import { getShowStatusInfo } from '../../../utils/showStatus';
import { getSwipeConfig } from '../../../lib/swipeMaps';

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
  const { title, year, posterUrl, synopsis, showStatus, userRating, voteAverage } = item;
  
  
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

  // Get providers for "where to watch"
  const getProviders = (): Array<{ name: string; url: string }> => {
    const providers: Array<{ name: string; url: string }> = [];
    
    // Add networks if available
    if (item.networks && item.networks.length > 0) {
      item.networks.forEach(network => {
        providers.push({ name: network, url: '#' });
      });
    }
    
    // Add production companies if available
    if (item.productionCompanies && item.productionCompanies.length > 0) {
      item.productionCompanies.forEach(company => {
        providers.push({ name: company, url: '#' });
      });
    }
    
    return providers;
  };

  // Handle rating changes
  const handleRate = (_itemId: string, value: number) => {
    // Update the item's user rating
    if (actions?.onRatingChange) {
      actions.onRatingChange(item, value);
    }
  };

  // Handle overflow menu click
  const handleOverflowClick = (_itemId: string) => {
    // Open overflow menu for this item
    if (actions?.onOpen) {
      actions.onOpen(item);
    }
  };

  return (
    <CardBaseMobile
      posterUrl={posterUrl}
      title={title}
      meta={getMetaText()}
      summary={synopsis}
      chips={
        <div style={{ display: 'flex', gap: 'var(--space-xs, 4px)', flexWrap: 'wrap' }}>
          {getChips()}
        </div>
      }
      actions={null}
      swipeConfig={getSwipeConfig(tabKey, item)}
      testId={`tv-card-mobile-${item.id}`}
      item={item}
      actionHandlers={actions}
      onDelete={() => actions?.onDelete?.(item)}
      draggable={tabKey === 'watching' || tabKey === 'wishlist'}
      providers={getProviders()}
      userRating={userRating}
      avgRating={voteAverage ? voteAverage / 2 : undefined} // Convert 10-point scale to 5-point
      onRate={handleRate}
      onOverflowClick={handleOverflowClick}
      tabKey={tabKey}
    />
  );
}
