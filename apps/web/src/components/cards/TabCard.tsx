import React, { useState } from 'react';
import type { CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import { useSettings } from '../../lib/settings';
import { Library } from '../../lib/storage';
import StarRating from './StarRating';
import MyListToggle from '../MyListToggle';
import SwipeableCard from '../SwipeableCard';
import { OptimizedImage } from '../OptimizedImage';
import { CompactPrimaryAction } from '../../features/compact/CompactPrimaryAction';
import { CompactOverflowMenu } from '../../features/compact/CompactOverflowMenu';
import { SwipeRow } from '../../features/compact/SwipeRow';
import { EpisodeProgressDisplay } from '../EpisodeProgressDisplay';

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
  console.log('🔔 TabCard render:', { title: item.title, mediaType: item.mediaType, hasOnNotificationToggle: !!actions?.onNotificationToggle });
  const { title, year, posterUrl, voteAverage, userRating, synopsis, mediaType } = item;
  const rating = typeof voteAverage === 'number' ? Math.round(voteAverage * 10) / 10 : undefined;
  const translations = useTranslations();
  const settings = useSettings();
  
  // Mobile ellipsis state
  const [showAllActions, setShowAllActions] = useState(false);

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

  // Get mobile-specific actions (only primary actions)
  const getMobileActions = () => {
    switch (tabType) {
      case 'watching':
        return [
          { key: 'want', label: isCondensed ? 'Want' : translations.wantToWatchAction, action: () => actions?.onWant?.(item) },
          { key: 'watched', label: isCondensed ? 'Watched' : translations.watchedAction, action: () => actions?.onWatched?.(item) }
        ];
      case 'want':
        return [
          { key: 'watching', label: isCondensed ? 'Watching' : translations.currentlyWatchingAction, action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }},
          { key: 'watched', label: isCondensed ? 'Watched' : translations.watchedAction, action: () => actions?.onWatched?.(item) }
        ];
      case 'watched':
        return [
          { key: 'want', label: isCondensed ? 'Want' : translations.wantToWatchAction, action: () => actions?.onWant?.(item) },
          { key: 'watching', label: isCondensed ? 'Watching' : translations.currentlyWatchingAction, action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }}
        ];
      case 'discovery':
        return [
          { key: 'want', label: isCondensed ? 'Want' : translations.wantToWatchAction, action: () => actions?.onWant?.(item) },
          { key: 'watching', label: isCondensed ? 'Watching' : translations.currentlyWatchingAction, action: () => actions?.onWant?.(item) }
        ];
      default:
        return [];
    }
  };

  // Get all actions for desktop/expanded view
  const getAllActions = (): Array<{ key: string; label: string; action: () => void; disabled?: boolean }> => {
    const mobileActions = getMobileActions();
    const additionalActions: Array<{ key: string; label: string; action: () => void; disabled?: boolean }> = [];
    
    // Add notification toggle for TV shows
    if (mediaType === 'tv') {
      additionalActions.push({
        key: 'notifications',
        label: '🔔 Notifications',
        action: () => {
          console.log('🔔 TabCard notification button clicked for:', item.title);
          actions?.onNotificationToggle?.(item);
        }
      });
    }
    
    // Add notes edit if not condensed
    if (!isCondensed) {
      additionalActions.push({
        key: 'notes',
        label: '📝 Notes & Tags',
        action: () => actions?.onNotesEdit?.(item)
      });
    }
    
    // Add episode tracking for TV shows if not condensed
    if (mediaType === 'tv' && !isCondensed) {
      additionalActions.push({
        key: 'episodes',
        label: 'Episode Progress',
        action: () => actions?.onEpisodeTracking?.(item),
        disabled: !settings.layout.episodeTracking
      });
    }
    
    return [...mobileActions, ...additionalActions];
  };

  // Render mobile actions with ellipsis overflow
  const renderMobileActions = () => {
    const allActions = getAllActions();
    const mobileActions = getMobileActions();
    const hasMoreActions = allActions.length > mobileActions.length;
    
    return (
      <div className="flex flex-wrap gap-1">
        {/* Primary mobile actions */}
        {mobileActions.map((action) => (
          <button
            key={action.key}
            onClick={action.action}
            className={buttonClass}
            style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
          >
            {action.label}
          </button>
        ))}
        
        {/* Ellipsis button for additional actions */}
        {hasMoreActions && (
          <button
            onClick={() => setShowAllActions(!showAllActions)}
            className={buttonClass}
            style={{ backgroundColor: 'var(--btn)', color: 'var(--muted)', borderColor: 'var(--line)', border: '1px solid' }}
            title="More actions"
          >
            ⋯
          </button>
        )}
        
        {/* Additional actions dropdown */}
        {showAllActions && hasMoreActions && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-2">
            <div className="flex flex-wrap gap-1">
              {allActions.slice(mobileActions.length).map((action) => (
                <button
                  key={action.key}
                  onClick={() => {
                    action.action();
                    setShowAllActions(false);
                  }}
                  disabled={action.disabled || false}
                  className={buttonClass}
                  style={{ 
                    backgroundColor: 'var(--btn)', 
                    color: (action.disabled || false) ? 'var(--muted)' : 'var(--text)', 
                    borderColor: 'var(--line)', 
                    border: '1px solid',
                    opacity: (action.disabled || false) ? 0.6 : 1
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTabSpecificActions = () => {
    
    switch (tabType) {
      case 'watching':
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Want' : translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Watched' : translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Not' : translations.notInterestedAction}
            </button>
            {!isCondensed && (
              <button
                onClick={() => actions?.onNotesEdit?.(item)}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
              >
                📝 Notes & Tags
              </button>
            )}
            {/* Notification toggle for TV shows */}
            {mediaType === 'tv' && (
              <button
                onClick={() => {
                  console.log('🔔 TabCard notification button clicked for:', item.title);
                  actions?.onNotificationToggle?.(item);
                }}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                title="Toggle episode notifications"
              >
                🔔 Notifications
              </button>
            )}
          </>
        );
      case 'want':
        return (
          <>
            <button
              onClick={() => {
                // Move to watching list
                if (item.id && item.mediaType) {
                  Library.move(item.id, item.mediaType, 'watching');
                }
              }}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Watching' : translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Watched' : translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Not' : translations.notInterestedAction}
            </button>
            {!isCondensed && (
              <button
                onClick={() => actions?.onNotesEdit?.(item)}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
              >
                📝 Notes & Tags
              </button>
            )}
            {/* Notification toggle for TV shows */}
            {mediaType === 'tv' && (
              <button
                onClick={() => {
                  console.log('🔔 TabCard notification button clicked for:', item.title);
                  actions?.onNotificationToggle?.(item);
                }}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                title="Toggle episode notifications"
              >
                🔔 Notifications
              </button>
            )}
          </>
        );
      case 'watched':
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Want' : translations.wantToWatchAction}
            </button>
            <button
              onClick={() => {
                // Move to watching list
                if (item.id && item.mediaType) {
                  Library.move(item.id, item.mediaType, 'watching');
                }
              }}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Watching' : translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Not' : translations.notInterestedAction}
            </button>
            {!isCondensed && (
              <button
                onClick={() => actions?.onNotesEdit?.(item)}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
              >
                📝 Notes & Tags
              </button>
            )}
            {/* Notification toggle for TV shows */}
            {mediaType === 'tv' && (
              <button
                onClick={() => {
                  console.log('🔔 TabCard notification button clicked for:', item.title);
                  actions?.onNotificationToggle?.(item);
                }}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                title="Toggle episode notifications"
              >
                🔔 Notifications
              </button>
            )}
          </>
        );
      case 'discovery':
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Want' : translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWant?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Watching' : translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Watched' : translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className={buttonClass}
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {isCondensed ? 'Not' : translations.notInterestedAction}
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

  const isCondensed = settings.layout.condensedView;

  // Define buttonClass at component level so it can be used throughout
  const buttonClass = isCondensed 
    ? "px-1.5 py-1 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
    : "px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md";

  return (
    <SwipeRow trailingActions={
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2, 8px)' }}>
        {getMobileActions().map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            className="swipe-action-button"
            style={{
              padding: 'var(--space-2, 8px)',
              borderRadius: 'var(--radius, 12px)',
              fontSize: 'var(--font-sm, 13px)',
              backgroundColor: 'var(--bg, #ffffff)',
              color: 'var(--accent, #007AFF)',
              border: '1px solid var(--bg, #ffffff)',
              cursor: 'pointer',
              fontWeight: '500',
              minWidth: '80px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover, #0056CC)';
              e.currentTarget.style.color = 'var(--bg, #ffffff)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg, #ffffff)';
              e.currentTarget.style.color = 'var(--accent, #007AFF)';
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    }>
      <SwipeableCard
        item={item}
        actions={actions}
        context={getSwipeContext()}
        className={isCondensed ? "mb-4" : "mb-8"}
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
          minHeight: isCondensed ? '120px' : '200px',
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
      {/* Poster (smaller in condensed view) */}
      <div 
        className={`poster flex-shrink-0 bg-muted relative cursor-pointer ${
          isCondensed ? 'aspect-[2/3]' : 'aspect-[2/3]'
        }`}
        role="img" 
        aria-label={title}
        style={{ 
          width: isCondensed ? 'var(--poster-w, 80px)' : 'var(--poster-w, 160px)',
          height: isCondensed ? 'var(--poster-h, 120px)' : 'var(--poster-h, 240px)',
          borderRadius: 'var(--radius, 16px) 0 0 var(--radius, 16px)'
        }}
        onClick={() => {
          if (item.id && item.mediaType) {
            const tmdbUrl = `https://www.themoviedb.org/${item.mediaType}/${item.id}`;
            window.open(tmdbUrl, '_blank', 'noopener,noreferrer');
          }
        }}
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
      <div className={`content flex-1 flex flex-col relative ${
        isCondensed ? 'p-2' : 'p-4'
      }`}>
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
          <h3 className={`title font-bold ${
            isCondensed ? 'text-sm' : 'text-base'
          }`} style={{ color: 'var(--text)' }}>
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

        {/* Where to Watch - hidden in condensed view */}
        {!isCondensed && (
          <div className="where text-xs mb-2" style={{ color: 'var(--accent)' }}>
            {getWhereToWatch()}
          </div>
        )}

        {/* Badges - hidden in condensed view */}
        {!isCondensed && (
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
        )}

        {/* Rating - compact in condensed view */}
        <div className={`rating flex items-center gap-1 ${
          isCondensed ? 'mb-1' : 'mb-2'
        }`}>
          <span className={isCondensed ? 'text-sm' : 'text-xl'} style={{ color: 'var(--accent)' }}>★</span>
          <span className={isCondensed ? 'text-xs' : 'text-sm'} style={{ color: 'var(--muted)' }}>
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

        {/* Overview - hidden in condensed view */}
        {!isCondensed && synopsis && (
          <div 
            className="overview text-sm mb-3 max-h-16 overflow-hidden"
            style={{ color: 'var(--muted)' }}
          >
            {synopsis}
          </div>
        )}

        {/* Actions */}
        <div className="actions mt-auto relative">
          {/* Mobile Actions (with ellipsis) */}
          <div className="md:hidden">
            <div 
              className={`mobile-actions flex flex-wrap gap-1 rounded-lg border border-dashed ${
                isCondensed ? 'p-1 mb-2' : 'p-2 mb-3'
              }`}
              style={{ borderColor: 'var(--line)' }}
            >
              {renderMobileActions()}
            </div>
          </div>
          
          {/* Compact Actions - only visible when gate and flag are enabled */}
          <div className="compact-actions-container">
            <CompactPrimaryAction 
              item={item as any} 
              context="tab" 
            />
            <CompactOverflowMenu 
              item={item as any} 
              context="tab" 
            />
          </div>
          
          {/* Desktop Actions (full actions) */}
          <div className="hidden md:block">
            {/* Free Actions */}
          <div 
            className={`free-actions flex flex-wrap gap-2 rounded-lg border border-dashed ${
              isCondensed ? 'p-1 mb-2' : 'p-2 mb-3'
            }`}
            style={{ borderColor: 'var(--line)' }}
          >
            {/* Tab-specific primary actions */}
            {getTabSpecificActions()}
            
            
            {/* Episode tracking (conditional) */}
            {mediaType === 'tv' && !isCondensed && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => actions?.onEpisodeTracking?.(item)}
                  className={buttonClass}
                  style={{ 
                    backgroundColor: 'var(--btn)', 
                    color: settings.layout.episodeTracking ? 'var(--text)' : 'var(--muted)', 
                    borderColor: 'var(--line)', 
                    border: '1px solid',
                    opacity: settings.layout.episodeTracking ? 1 : 0.6
                  }}
                  disabled={!settings.layout.episodeTracking}
                  title={settings.layout.episodeTracking ? "Track episode progress" : "Enable episode tracking in settings"}
                >
                  Episode Progress
                </button>
                
                {/* Episode progress indicator */}
                {settings.layout.episodeTracking && (
                  <EpisodeProgressDisplay 
                    showId={typeof item.id === 'string' ? parseInt(item.id) : item.id}
                    compact={true}
                  />
                )}
              </div>
            )}
            </div>

            {/* Pro Actions - hidden in condensed view */}
          {!isCondensed && (
            <div 
              className="pro-actions flex flex-wrap gap-2 p-2 rounded-lg border border-dashed"
              style={{ 
                borderColor: 'var(--pro)', 
                backgroundColor: 'rgba(240, 185, 11, 0.1)',
                opacity: 0.7
              }}
            >
            <span className="text-xs font-medium" style={{ color: 'var(--pro)', marginRight: 'var(--space-2, 8px)' }}>
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
          )}
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
    </SwipeRow>
  );
}
