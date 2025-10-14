import React from 'react';
import type { CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import StarRating from './StarRating';
import MyListToggle from '../MyListToggle';
import SwipeableCard from '../SwipeableCard';
import { OptimizedImage } from '../OptimizedImage';

export type TabCardProps = {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabType?: 'watching' | 'want' | 'watched' | 'discovery';
  index?: number;
  dragState?: {
    draggedItem: { id: string; index: number } | null;
    draggedOverIndex: number | null;
    isDragging: boolean;
  };
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
};

/**
 * TabCard — horizontal card layout for tab pages
 * - Poster on left (160px wide, 2:3 aspect ratio)
 * - Content on right with title, meta, overview, actions
 * - Matches the design mockups exactly
 */
export default function TabCard({ 
  item, 
  actions, 
  tabType = 'watching',
  index = 0,
  dragState,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop
}: TabCardProps) {
  const { title, year, posterUrl, voteAverage, userRating, synopsis, mediaType } = item;
  const rating = typeof voteAverage === 'number' ? Math.round(voteAverage * 10) / 10 : undefined;
  const translations = useTranslations();

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
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.notInterestedAction}
            </button>
            <button
              onClick={() => actions?.onNotesEdit?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              📝 Notes & Tags
            </button>
          </>
        );
      case 'want':
        return (
          <>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.notInterestedAction}
            </button>
            <button
              onClick={() => actions?.onNotesEdit?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              📝 Notes & Tags
            </button>
          </>
        );
      case 'watched':
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.notInterestedAction}
            </button>
            <button
              onClick={() => actions?.onNotesEdit?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              📝 Notes & Tags
            </button>
          </>
        );
      case 'discovery':
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWant?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
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

  // Determine if this card is being dragged or is a drop target
  const isBeingDragged = dragState?.draggedItem?.id === item.id;
  const isDropTarget = dragState?.draggedOverIndex === index && !isBeingDragged;
  const isDragging = dragState?.isDragging;

  // Map tabType to context for swipe actions
  const getSwipeContext = (): 'tab-watching' | 'tab-want' | 'tab-watched' | 'tab-foryou' | 'search' | 'home' | 'holiday' => {
    switch (tabType) {
      case 'watching': return 'tab-watching';
      case 'want': return 'tab-want';
      case 'watched': return 'tab-watched';
      case 'discovery': return 'tab-foryou';
      default: return 'tab-watching';
    }
  };

  return (
    <SwipeableCard
      item={item}
      actions={actions}
      context={getSwipeContext()}
      className="mb-8"
    >
      <article 
        className={`tab-card group relative flex rounded-2xl overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl ${
          isBeingDragged ? 'opacity-75 scale-95 rotate-1 z-50' : ''
        } ${isDropTarget ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''}`}
        data-testid="tab-card" 
        aria-label={title}
        style={{
          backgroundColor: 'var(--card)',
          borderColor: isDropTarget ? 'var(--accent)' : 'var(--line)',
          border: '1px solid',
          minHeight: '200px',
          transform: isBeingDragged ? 'rotate(2deg)' : 'none',
          transition: 'all 0.2s ease-in-out'
        }}
        draggable={true}
        onDragStart={(e) => onDragStart?.(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver?.(e, index)}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
      {/* Poster (160px wide, 2:3 aspect ratio) */}
      <div 
        className="poster flex-shrink-0 w-40 aspect-[2/3] bg-muted rounded-l-2xl relative" 
        role="img" 
        aria-label={title}
      >
        {posterUrl ? (
          <OptimizedImage
            src={posterUrl}
            alt={title}
            context="poster"
            className="h-full w-full"
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
        <div className="flex items-center gap-2 mb-1">
          <h3 className="title font-bold text-base" style={{ color: 'var(--text)' }}>
            {title}
          </h3>
          
          {/* Notes and Tags Indicators */}
          <div className="flex gap-1">
            {item.userNotes && item.userNotes.trim() && (
              <span 
                className="text-xs cursor-pointer hover:scale-110 transition-transform"
                title={`Notes: ${item.userNotes.substring(0, 100)}${item.userNotes.length > 100 ? '...' : ''}`}
                onClick={() => actions?.onNotesEdit?.(item)}
              >
                📝
              </span>
            )}
            {item.tags && item.tags.length > 0 && (
              <span 
                className="text-xs cursor-pointer hover:scale-110 transition-transform"
                title={`Tags: ${item.tags.join(', ')}`}
                onClick={() => actions?.onNotesEdit?.(item)}
              >
                🏷️
              </span>
            )}
          </div>
        </div>

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
            
            
            {/* Episode tracking (conditional) */}
            {mediaType === 'tv' && (
              <button
                className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
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
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
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
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
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
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
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
          className={`handle absolute top-1/2 right-2 transform -translate-y-1/2 cursor-grab text-lg transition-all duration-200 hover:scale-110 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ 
            color: isDragging ? 'var(--accent)' : 'var(--muted)',
            opacity: isDragging ? 0.8 : 1
          }}
          title="Drag to reorder"
        >
          ⋮⋮
        </div>
      </div>
    </article>
    </SwipeableCard>
  );
}
