import React from 'react';
import type { CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import StarRating from './StarRating';
import MyListToggle from '../MyListToggle';

export type TabCardProps = {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabType?: 'watching' | 'want' | 'watched' | 'discovery';
};

/**
 * TabCard — horizontal card layout for tab pages
 * - Poster on left (160px wide, 2:3 aspect ratio)
 * - Content on right with title, meta, overview, actions
 * - Matches the design mockups exactly
 */
export default function TabCard({ item, actions, tabType = 'watching' }: TabCardProps) {
  const { title, year, posterUrl, voteAverage, userRating, synopsis, mediaType } = item;
  const rating = typeof voteAverage === 'number' ? Math.round(voteAverage * 10) / 10 : undefined;
  const translations = useTranslations();

  console.log(`🔍 TabCard rendering:`, { title, tabType, posterUrl: !!posterUrl });

  const handleRatingChange = (rating: number) => {
    if (actions?.onRatingChange) {
      actions.onRatingChange(item, rating);
    }
  };

  const getMetaText = () => {
    const yearText = year || 'TBA';
    if (mediaType === 'tv') {
      return `${yearText} • TV Show`;
    } else {
      return `${yearText} • Movie`;
    }
  };

  const getWhereToWatch = () => {
    // TODO: Integrate with streaming service data
    return 'Where to Watch: Netflix';
  };

  const getBadges = () => {
    const badges = [];
    if (mediaType === 'tv') {
      badges.push('TV SERIES');
    } else {
      badges.push('MOVIE');
    }
    return badges;
  };

  const getTabSpecificActions = () => {
    switch (tabType) {
      case 'watching':
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.notInterestedAction}
            </button>
          </>
        );
      case 'want':
        return (
          <>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.notInterestedAction}
            </button>
          </>
        );
      case 'watched':
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.notInterestedAction}
            </button>
          </>
        );
      case 'discovery':
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.notInterestedAction}
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <article 
      className="tab-card group relative flex bg-card border border-line rounded-2xl overflow-hidden shadow-lg mb-8" 
      data-testid="tab-card" 
      aria-label={title}
    >
      {/* Poster (160px wide, 2:3 aspect ratio) */}
      <div 
        className="poster flex-shrink-0 w-40 aspect-[2/3] bg-muted rounded-l-2xl relative" 
        role="img" 
        aria-label={title}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div 
            className="flex h-full w-full items-center justify-center text-xs"
            style={{ color: 'var(--muted)' }}
          >
            {translations.noPoster}
          </div>
        )}
        
        {/* My List + button */}
        <MyListToggle item={item} />
      </div>

      {/* Content */}
      <div className="content flex-1 p-4 flex flex-col relative">
        {/* Delete button */}
        <button
          onClick={() => actions?.onDelete?.(item)}
          className="absolute top-2 right-2 bg-red-600 text-white border-none px-2 py-1 rounded text-xs cursor-pointer"
          style={{ fontSize: '11px' }}
        >
          {translations.deleteAction}
        </button>

        {/* Title */}
        <h3 className="title font-bold text-base mb-1" style={{ color: 'var(--text)' }}>
          {title}
        </h3>

        {/* Meta */}
        <div className="meta text-xs mb-1" style={{ color: 'var(--muted)' }}>
          {getMetaText()}
        </div>

        {/* Where to Watch */}
        <div className="where text-xs mb-2" style={{ color: 'var(--accent)' }}>
          {getWhereToWatch()}
        </div>

        {/* Badges */}
        <div className="badges flex gap-1.5 flex-wrap mb-2">
          {getBadges().map((badge, index) => (
            <span
              key={index}
              className="badge border border-line rounded px-1.5 py-0.5 text-xs"
              style={{ color: 'var(--muted)', borderColor: 'var(--line)' }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Rating */}
        <div className="rating flex items-center gap-1 mb-2">
          <span className="text-xl" style={{ color: 'var(--accent)' }}>★</span>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {rating ? `${rating}/10` : 'No rating'}
          </span>
        </div>

        {/* User Rating */}
        {(tabType === 'watching' || tabType === 'watched') && (
          <div className="user-rating mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Your Rating:
              </span>
              <StarRating
                value={userRating || 0}
                onChange={handleRatingChange}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Overview */}
        {synopsis && (
          <div 
            className="overview text-sm mb-3 max-h-16 overflow-hidden"
            style={{ color: 'var(--muted)' }}
          >
            {synopsis}
          </div>
        )}

        {/* Actions */}
        <div className="actions mt-auto">
          {/* Free Actions */}
          <div 
            className="free-actions flex flex-wrap gap-2 p-2 rounded-lg border border-dashed mb-3"
            style={{ borderColor: 'var(--line)' }}
          >
            {/* Tab-specific primary actions */}
            {getTabSpecificActions()}
            
            {/* Common actions */}
            <button
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.reviewNotesAction}
            </button>
            <button
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Add Tag
            </button>
            
            {/* Episode tracking (conditional) */}
            {mediaType === 'tv' && (
              <button
                className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
                style={{ 
                  backgroundColor: 'var(--btn)', 
                  color: 'var(--muted)', 
                  borderColor: 'var(--line)', 
                  border: '1px solid',
                  opacity: 0.6
                }}
                disabled
                title="Enable episode tracking in settings"
              >
                Episode Progress
              </button>
            )}
          </div>

          {/* Pro Actions */}
          <div 
            className="pro-actions flex flex-wrap gap-2 p-2 rounded-lg border border-dashed"
            style={{ 
              borderColor: 'var(--pro)', 
              backgroundColor: 'rgba(240, 185, 11, 0.1)',
              opacity: 0.7
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--pro)', marginRight: '8px' }}>
              PRO:
            </span>
            <button
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ 
                backgroundColor: 'var(--btn)', 
                color: 'var(--muted)', 
                borderColor: 'var(--pro)', 
                border: '1px solid',
                opacity: 0.6
              }}
              disabled
              title="Pro feature - upgrade to unlock"
            >
              Bloopers
            </button>
            <button
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ 
                backgroundColor: 'var(--btn)', 
                color: 'var(--muted)', 
                borderColor: 'var(--pro)', 
                border: '1px solid',
                opacity: 0.6
              }}
              disabled
              title="Pro feature - upgrade to unlock"
            >
              Extras
            </button>
            <button
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors"
              style={{ 
                backgroundColor: 'var(--btn)', 
                color: 'var(--muted)', 
                borderColor: 'var(--pro)', 
                border: '1px solid',
                opacity: 0.6
              }}
              disabled
              title="Pro feature - upgrade to unlock"
            >
              Remind Me
            </button>
          </div>
        </div>

        {/* Drag handle */}
        <div 
          className="handle absolute top-1/2 right-0 transform -translate-y-1/2 cursor-grab text-lg"
          style={{ color: 'var(--muted)' }}
        >
          ≡
        </div>
      </div>
    </article>
  );
}
