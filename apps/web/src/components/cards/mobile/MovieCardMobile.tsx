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
  tabKey?: 'watching' | 'watched' | 'want';
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

  // Determine primary action based on tab
  const getPrimaryAction = () => {
    switch (tabKey) {
      case 'watching':
        return {
          label: 'Watched',
          onClick: () => actions?.onWatched?.(item)
        };
      case 'watched':
        return {
          label: 'Want to Watch',
          onClick: () => actions?.onWant?.(item)
        };
      case 'want':
        return {
          label: 'Want to Watch',
          onClick: () => actions?.onWant?.(item)
        };
      default:
        return {
          label: 'Watched',
          onClick: () => actions?.onWatched?.(item)
        };
    }
  };

  const primaryAction = getPrimaryAction();

  // Convert tabKey to SwipeableCard context
  const getContextFromTabKey = (tabKey: 'watching' | 'watched' | 'want') => {
    switch (tabKey) {
      case 'watching': return 'tab-watching';
      case 'watched': return 'tab-watched';
      case 'want': return 'tab-want';
      default: return 'tab-watching';
    }
  };

  // Truncate synopsis to 2 lines
  const truncateSynopsis = (text: string) => {
    if (!text) return '';
    const words = text.split(' ');
    const maxLength = 100; // rough estimate for 2 lines
    if (text.length <= maxLength) return text;
    return words.slice(0, Math.floor(words.length * 0.7)).join(' ') + '...';
  };

  return (
    <SwipeableCard
      item={item}
      actions={actions}
      context={getContextFromTabKey(tabKey)}
    >
      <div className="card-mobile">
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
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
              {getChips()}
            </div>
          </header>

          <div className="mobile-actions-row">
            <button className="primary-action" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </button>
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
