import type { MediaItem, CardActionHandlers } from '../card.types';
import { CardBaseMobile } from './CardBaseMobile';
import { getSwipeConfig } from '../../../lib/swipeMaps';

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
  const { title, year, posterUrl, synopsis, userRating, voteAverage } = item;
  
  
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

  // Get providers for "where to watch"
  const getProviders = (): Array<{ name: string; url: string }> => {
    const providers: Array<{ name: string; url: string }> = [];
    
    // Add production companies if available
    if (item.productionCompanies && item.productionCompanies.length > 0) {
      item.productionCompanies.forEach(company => {
        providers.push({ name: company, url: '#' });
      });
    }
    
    // Add networks if available
    if (item.networks && item.networks.length > 0) {
      item.networks.forEach(network => {
        providers.push({ name: network, url: '#' });
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
      testId={`movie-card-mobile-${item.id}`}
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
