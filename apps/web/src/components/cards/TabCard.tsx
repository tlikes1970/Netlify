import React, { useState } from 'react';
import type { CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import { useSettings } from '../../lib/settings';
import { Library } from '../../lib/storage';
import { getShowStatusInfo } from '../../utils/showStatus';
import StarRating from './StarRating';
import MyListToggle from '../MyListToggle';
import SwipeableCard from '../SwipeableCard';
import { OptimizedImage } from '../OptimizedImage';
import { CompactPrimaryAction } from '../../features/compact/CompactPrimaryAction';
import { CompactOverflowMenu } from '../../features/compact/CompactOverflowMenu';
import { EpisodeProgressDisplay } from '../EpisodeProgressDisplay';
import { fetchNetworkInfo } from '../../search/api';
import { TvCardMobile } from './mobile/TvCardMobile';
import { MovieCardMobile } from './mobile/MovieCardMobile';

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
  
  // Network information state
  const [networkInfo, setNetworkInfo] = useState<{ networks?: string[]; productionCompanies?: string[] }>({});
  
  // Fetch network information when component mounts
  React.useEffect(() => {
    if (mediaType === 'movie' || mediaType === 'tv') {
      fetchNetworkInfo(Number(item.id), mediaType).then(setNetworkInfo);
    }
  }, [item.id, mediaType]);

  const handleRatingChange = (rating: number) => {
    if (actions?.onRatingChange) {
      actions.onRatingChange(item, rating);
    }
  };

  // Smart truncation for mobile descriptions based on title length
  const truncateAtSentence = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    
    // Find last complete sentence before maxLength
    const truncated = text.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > maxLength * 0.7) {
      return text.substring(0, lastSentence + 1);
    }
    
    // Fallback: truncate at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    return text.substring(0, lastSpace) + '...';
  };

  // Get description length based on title length (mobile only)
  const getMobileDescriptionLength = () => {
    const titleLength = title.length;
    
    if (titleLength <= 20) {
      return 60; // Short titles: more description space
    } else if (titleLength <= 40) {
      return 45;  // Medium titles: medium description space
    } else {
      return 35;  // Long titles: less description space
    }
  };


  const getWhereToWatch = () => {
    if (mediaType === 'tv' && networkInfo.networks && networkInfo.networks.length > 0) {
      return `On ${networkInfo.networks[0]}${networkInfo.networks.length > 1 ? ` (+${networkInfo.networks.length - 1} more)` : ''}`;
    } else if (mediaType === 'movie' && networkInfo.productionCompanies && networkInfo.productionCompanies.length > 0) {
      return `From ${networkInfo.productionCompanies[0]}${networkInfo.productionCompanies.length > 1 ? ` (+${networkInfo.productionCompanies.length - 1} more)` : ''}`;
    }
    // Don't show placeholder text - only show when we have real data
    return null;
  };

  const getBadges = () => {
    const badges = [];
    if (mediaType === 'tv') {
      badges.push('TV SERIES');
      
      // Debug: Log what TabCard receives
      console.log(`🔍 TabCard ${title} received:`, {
        showStatus: item.showStatus,
        lastAirDate: item.lastAirDate,
        hasShowStatus: item.showStatus !== undefined
      });
      
      // Add show status badge if available
      const statusInfo = getShowStatusInfo(item.showStatus);
      if (statusInfo) {
        badges.push(statusInfo.badge);
        console.log(`✅ TabCard ${title} adding badge:`, statusInfo.badge);
      } else {
        console.log(`❌ TabCard ${title} no badge - showStatus:`, item.showStatus);
      }
    } else {
      badges.push('MOVIE');
    }
    return badges;
  };

  // Get all actions for desktop/expanded view
  const getAllActions = (): Array<{ key: string; label: string; action: () => void; disabled?: boolean }> => {
    const primaryActions: Array<{ key: string; label: string; action: () => void; disabled?: boolean }> = [];
    const additionalActions: Array<{ key: string; label: string; action: () => void; disabled?: boolean }> = [];
    
    // Add primary actions based on tab type
    switch (tabType) {
      case 'watching':
        primaryActions.push(
          { key: 'want', label: isCondensed ? 'Want' : translations.wantToWatchAction, action: () => actions?.onWant?.(item) },
          { key: 'watched', label: isCondensed ? 'Watched' : translations.watchedAction, action: () => actions?.onWatched?.(item) }
        );
        break;
      case 'want':
        primaryActions.push(
          { key: 'watching', label: isCondensed ? 'Watching' : translations.currentlyWatchingAction, action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }},
          { key: 'watched', label: isCondensed ? 'Watched' : translations.watchedAction, action: () => actions?.onWatched?.(item) }
        );
        break;
      case 'watched':
        primaryActions.push(
          { key: 'want', label: isCondensed ? 'Want' : translations.wantToWatchAction, action: () => actions?.onWant?.(item) },
          { key: 'watching', label: isCondensed ? 'Watching' : translations.currentlyWatchingAction, action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }}
        );
        break;
      case 'discovery':
        primaryActions.push(
          { key: 'want', label: isCondensed ? 'Want' : translations.wantToWatchAction, action: () => actions?.onWant?.(item) },
          { key: 'watching', label: isCondensed ? 'Watching' : translations.currentlyWatchingAction, action: () => actions?.onWant?.(item) }
        );
        break;
    }
    
    // Add simple reminder for TV shows
    if (mediaType === 'tv') {
      additionalActions.push({
        key: 'simple-reminder',
        label: '⏰ Remind Me',
        action: () => {
          console.log('⏰ TabCard simple reminder button clicked for:', item.title);
          actions?.onSimpleReminder?.(item);
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
    
    return [...primaryActions, ...additionalActions];
  };

  // Render mobile actions with ellipsis overflow
  const renderMobileActions = () => {
    const allActions = getAllActions();
    const primaryActions = allActions.slice(0, 2); // First 2 actions are primary
    const hasMoreActions = allActions.length > 2;
    
    return (
      <div className="flex flex-wrap gap-1">
        {/* Primary mobile actions */}
        {primaryActions.map((action) => (
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
              {allActions.slice(primaryActions.length).map((action) => (
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
            {/* Simple reminder for TV shows (Free feature) */}
            {mediaType === 'tv' && (
              <button
                onClick={() => {
                  console.log('⏰ TabCard simple reminder button clicked for:', item.title);
                  actions?.onSimpleReminder?.(item);
                }}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                title="Set simple reminder (24 hours before)"
              >
                ⏰ Remind Me
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
            {/* Simple reminder for TV shows (Free feature) */}
            {mediaType === 'tv' && (
              <button
                onClick={() => {
                  console.log('⏰ TabCard simple reminder button clicked for:', item.title);
                  actions?.onSimpleReminder?.(item);
                }}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                title="Set simple reminder (24 hours before)"
              >
                ⏰ Remind Me
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
            {/* Simple reminder for TV shows (Free feature) */}
            {mediaType === 'tv' && (
              <button
                onClick={() => {
                  console.log('⏰ TabCard simple reminder button clicked for:', item.title);
                  actions?.onSimpleReminder?.(item);
                }}
                className={buttonClass}
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                title="Set simple reminder (24 hours before)"
              >
                ⏰ Remind Me
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

  // Mobile detection for new mobile cards
  const isMobileCompact = document.documentElement.getAttribute('data-compact-mobile-v1') === 'true';
  const isActionsSplit = document.documentElement.getAttribute('data-actions-split') === 'true';
  const isMobile = window.innerWidth < 768;
  
  // Convert tabType to tabKey for mobile components
  const getTabKey = (tabType: string): 'watching' | 'watched' | 'wishlist' => {
    switch (tabType) {
      case 'watching': return 'watching';
      case 'watched': return 'watched';
      case 'want': return 'wishlist';
      default: return 'watching';
    }
  };

  // TEMPORARY: Force mobile components on mobile viewport (bypass flags for testing)
  if (isMobile) {
    console.log('📱 Mobile viewport detected, using mobile components:', { 
      mediaType, 
      title: item.title,
      isMobileCompact, 
      isActionsSplit 
    });
    if (mediaType === 'tv') {
      return <TvCardMobile item={item} actions={actions} tabKey={getTabKey(tabType)} />;
    } else if (mediaType === 'movie') {
      return <MovieCardMobile item={item} actions={actions} tabKey={getTabKey(tabType)} />;
    }
  }
  
  // Use new mobile components when mobile flags are enabled (original logic)
  if (isMobileCompact && isActionsSplit && isMobile) {
    if (mediaType === 'tv') {
      return <TvCardMobile item={item} actions={actions} tabKey={getTabKey(tabType)} />;
    } else if (mediaType === 'movie') {
      return <MovieCardMobile item={item} actions={actions} tabKey={getTabKey(tabType)} />;
    }
  }

  return (
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
        isCondensed ? 'px-2 py-1 pb-2' : 'px-4 pt-2 pb-4'
      }`}>
        {/* Delete button */}
        <button
          onClick={() => actions?.onDelete?.(item)}
          className="absolute top-1 right-1 bg-red-600 text-white border-none px-1 py-0.5 rounded text-xs cursor-pointer"
          style={{ fontSize: '10px' }}
        >
          {translations.deleteAction}
        </button>

        {/* Title with Year */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`title font-bold ${
            isCondensed ? 'text-sm' : 'text-base'
          }`} style={{ color: 'var(--text)' }}>
            {title}{year ? ` • ${year}` : ''}
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

        {/* Where to Watch - only show when we have real data */}
        {!isCondensed && getWhereToWatch() && (
          <div className="where text-xs mb-2" style={{ color: 'var(--accent)' }}>
            {getWhereToWatch()}{rating ? ` • ${rating}/10` : ''}
          </div>
        )}

        {/* Badges - hidden in condensed view */}
        {!isCondensed && (
          <div className="badges flex gap-1.5 flex-wrap mb-2">
            {getBadges().map((badge, index) => {
              const statusInfo = getShowStatusInfo(item.showStatus);
              const isStatusBadge = statusInfo && badge === statusInfo.badge;
              
              return (
                <span
                  key={index}
                  className="badge border border-line rounded px-1.5 py-0.5 text-xs font-medium"
                  style={{ 
                    color: isStatusBadge ? statusInfo.color : 'var(--muted)', 
                    borderColor: isStatusBadge ? statusInfo.backgroundColor : 'var(--line)',
                    backgroundColor: isStatusBadge ? statusInfo.backgroundColor : 'transparent'
                  }}
                >
                  {badge}
                </span>
              );
            })}
          </div>
        )}

        {/* Rating - only show in condensed view or when no streaming info */}
        {isCondensed && (
          <div className="rating flex items-center gap-1 mb-1">
            <span className="text-sm" style={{ color: 'var(--accent)' }}>★</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {rating ? `${rating}/10` : 'No rating'}
            </span>
          </div>
        )}
        
        {/* Rating fallback for non-condensed when no streaming info */}
        {!isCondensed && !getWhereToWatch() && (
          <div className="rating flex items-center gap-1 mb-2">
            <span className="text-xl" style={{ color: 'var(--accent)' }}>★</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {rating ? `${rating}/10` : 'No rating'}
            </span>
          </div>
        )}

        {/* User Rating */}
        {(tabType === 'watching' || tabType === 'watched') && (
          <div className="user-rating mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Rate:
              </span>
              <StarRating
                value={userRating || 0}
                onChange={handleRatingChange}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Overview - desktop only */}
        {!isCondensed && synopsis && (
          <div 
            className="overview text-sm mb-3 max-h-16 overflow-hidden"
            style={{ color: 'var(--muted)' }}
          >
            {synopsis}
          </div>
        )}

        {/* Mobile Description - only visible in condensed view */}
        {isCondensed && synopsis && (
          <div 
            className="overview text-xs mb-2"
            style={{ color: 'var(--muted)' }}
          >
            {truncateAtSentence(synopsis, getMobileDescriptionLength())}
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
              onClick={() => {
                console.log('🎬 TabCard bloopers button clicked for:', item.title);
                console.log('🎬 Pro settings check:', { 
                  isPro: settings.pro.isPro, 
                  bloopersAccess: settings.pro.features.bloopersAccess,
                  buttonEnabled: settings.pro.isPro && settings.pro.features.bloopersAccess
                });
                actions?.onBloopersOpen?.(item);
              }}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--btn)', 
                color: 'var(--muted)', 
                borderColor: 'var(--pro)', 
                border: '1px solid',
                opacity: settings.pro.isPro && settings.pro.features.bloopersAccess ? 1 : 0.6
              }}
              disabled={!settings.pro.isPro || !settings.pro.features.bloopersAccess}
              title={settings.pro.isPro && settings.pro.features.bloopersAccess ? "View bloopers and outtakes" : "Pro feature - upgrade to unlock"}
            >
              Bloopers
            </button>
            <button
              onClick={() => {
                console.log('🎭 TabCard extras button clicked for:', item.title);
                actions?.onExtrasOpen?.(item);
              }}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--btn)', 
                color: 'var(--muted)', 
                borderColor: 'var(--pro)', 
                border: '1px solid',
                opacity: settings.pro.isPro && settings.pro.features.extrasAccess ? 1 : 0.6
              }}
              disabled={!settings.pro.isPro || !settings.pro.features.extrasAccess}
              title={settings.pro.isPro && settings.pro.features.extrasAccess ? "View behind-the-scenes content" : "Pro feature - upgrade to unlock"}
            >
              Extras
            </button>
            <button
              onClick={() => {
                console.log('🔔 TabCard advanced notifications button clicked for:', item.title);
                actions?.onNotificationToggle?.(item);
              }}
              className="px-2.5 py-1.5 rounded text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--btn)', 
                color: 'var(--muted)', 
                borderColor: 'var(--pro)', 
                border: '1px solid',
                opacity: settings.pro.isPro ? 1 : 0.6
              }}
              disabled={!settings.pro.isPro}
              title={settings.pro.isPro ? "Advanced notifications with custom timing" : "Pro feature - upgrade to unlock"}
            >
              Advanced Notifications
            </button>
            </div>
          )}
          </div>
        </div>

        {/* Drag handle */}
        <div 
          className={`handle absolute top-1/4 right-2 transform -translate-y-1/2 cursor-grab text-lg transition-all duration-200 hover:scale-110 ${
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
