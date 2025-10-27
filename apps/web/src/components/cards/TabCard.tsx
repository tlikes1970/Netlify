import React, { useState } from 'react';
import type { CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import { useSettings } from '../../lib/settings';
import { Library } from '../../lib/storage';
import { getShowStatusInfo } from '../../utils/showStatus';
import StarRating from './StarRating';
import MyListToggle from '../MyListToggle';
import { useIsDesktop } from '../../hooks/useDeviceDetection';
import SwipeableCard from '../SwipeableCard';
import { OptimizedImage } from '../OptimizedImage';
import { CompactPrimaryAction } from '../../features/compact/CompactPrimaryAction';
import { CompactOverflowMenu } from '../../features/compact/CompactOverflowMenu';
import { isCompactMobileV1, isActionsSplit } from '../../lib/mobileFlags';
import { isMobileNow } from '../../lib/isMobile';
import { dlog } from '../../lib/log';
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
  dlog('🔔 TabCard render:', { title: item.title, mediaType: item.mediaType, hasOnNotificationToggle: !!actions?.onNotificationToggle });
  const { title, year, posterUrl, voteAverage, userRating, synopsis, mediaType } = item;
  const rating = typeof voteAverage === 'number' ? Math.round(voteAverage * 10) / 10 : undefined;
  const translations = useTranslations();
  const settings = useSettings();
  const { ready, isDesktop } = useIsDesktop(); // Device detection for conditional swipe
  
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
      dlog(`🔍 TabCard ${title} received:`, {
        showStatus: item.showStatus,
        lastAirDate: item.lastAirDate,
        hasShowStatus: item.showStatus !== undefined
      });
      
      // Add show status badge if available
      const statusInfo = getShowStatusInfo(item.showStatus);
      if (statusInfo) {
        badges.push(statusInfo.badge);
        dlog(`✅ TabCard ${title} adding badge:`, statusInfo.badge);
      } else {
        dlog(`❌ TabCard ${title} no badge - showStatus:`, item.showStatus);
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
          dlog('⏰ TabCard simple reminder button clicked for:', item.title);
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
                  dlog('⏰ TabCard simple reminder button clicked for:', item.title);
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
                  dlog('⏰ TabCard simple reminder button clicked for:', item.title);
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
                  dlog('⏰ TabCard simple reminder button clicked for:', item.title);
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
  const isMobileCompact = isCompactMobileV1();
  const actionsSplit = isActionsSplit();
  const isMobile = isMobileNow();
  
  // Convert tabType to tabKey for mobile components
  const getTabKey = (tabType: string): 'watching' | 'watched' | 'want' => {
    switch (tabType) {
      case 'watching': return 'watching';
      case 'watched': return 'watched';
      case 'want': return 'want';
      default: return 'watching';
    }
  };

  // Guard: wait for viewport detection to avoid hydration mismatch
  if (!ready) {
    // Render a neutral skeleton that works on both mobile and desktop
    return (
      <article 
        className="tab-card" 
        data-card="skeleton"
        style={{ 
          display: 'flex', 
          gap: '16px', 
          padding: '16px', 
          borderRadius: '16px', 
          backgroundColor: 'var(--card)', 
          border: '1px solid var(--line)',
          minHeight: '180px'
        }}
      >
        <div style={{ 
          width: '160px', 
          height: '240px', 
          backgroundColor: 'var(--muted)', 
          borderRadius: '8px',
          flexShrink: 0 
        }} />
        <div style={{ flex: 1 }} />
      </article>
    );
  }

  // TEMPORARY: Force mobile components on mobile viewport (bypass flags for testing)
  if (!isDesktop && isMobile) {
    dlog('📱 Mobile viewport detected, using mobile components:', { 
      mediaType, 
      title: item.title,
      isMobileCompact, 
      isActionsSplit: actionsSplit 
    });
    if (mediaType === 'tv') {
      return <TvCardMobile item={item} actions={actions} tabKey={getTabKey(tabType)} />;
    } else if (mediaType === 'movie') {
      return <MovieCardMobile item={item} actions={actions} tabKey={getTabKey(tabType)} />;
    }
  }
  
  // Use new mobile components when mobile flags are enabled (original logic)
  if (isMobileCompact && actionsSplit && isMobile) {
    if (mediaType === 'tv') {
      return <TvCardMobile item={item} actions={actions} tabKey={getTabKey(tabType)} />;
    } else if (mediaType === 'movie') {
      return <MovieCardMobile item={item} actions={actions} tabKey={getTabKey(tabType)} />;
    }
  }

  // Card content (shared between mobile and desktop)
  const cardContent = (
      <article 
        className={`card-desktop tab-card group relative ${
          isBeingDragged ? 'opacity-75 scale-95 rotate-1 z-50' : ''
        } ${isDropTarget ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''}`}
        data-testid="tab-card" 
        data-card-type="tab"
        aria-label={title}
        style={{
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
      {/* Poster Column */}
      <div 
        className="poster-col"
        role="img" 
        aria-label={title}
        onClick={(e) => {
          // Don't open TMDB if clicking on a button inside the poster
          if ((e.target as HTMLElement).closest('button')) {
            return;
          }
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
            style={{ color: 'var(--muted)', minHeight: '240px' }}
          >
            {translations.noPoster}
          </div>
        )}
        
        {/* My List + button */}
        <MyListToggle item={item} />
      </div>

      {/* Info Column */}
      <div className="info-col relative">

        <header>
          <h3>{title}</h3>
          <span className="meta">
            {year || 'TBA'} • {mediaType === 'tv' ? 'TV Show' : 'Movie'}
          </span>
          
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
        </header>

        {/* Rating Row */}
        {(tabType === 'watching' || tabType === 'watched') && (
          <div className="rating-row">
            <StarRating
              value={userRating || 0}
              onChange={handleRatingChange}
              size="sm"
            />
            {rating && (
              <span className="rating-score">({rating}/10)</span>
            )}
          </div>
        )}

        {/* Synopsis */}
        {synopsis && (
          <p className="synopsis">
            {synopsis}
          </p>
        )}

        {/* Actions Row */}
        <div className="actions-row">
          {/* Tab-specific primary actions */}
          {getTabSpecificActions()}

            
            {/* Episode tracking (conditional) */}
            {mediaType === 'tv' && (
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
            )}
        </div>

        {/* Pro Strip */}
        {!isCondensed && (
          <div className="pro-strip">
            <span className="pro-label">PRO:</span>
            <button
              onClick={() => actions?.onBloopersOpen?.(item)}
              disabled={!settings.pro.isPro || !settings.pro.features.bloopersAccess}
              title={settings.pro.isPro && settings.pro.features.bloopersAccess ? "View bloopers and outtakes" : "Pro feature - upgrade to unlock"}
              className={buttonClass}
              style={{
                backgroundColor: settings.pro.isPro && settings.pro.features.bloopersAccess ? 'var(--pro)' : 'var(--btn)',
                color: settings.pro.isPro && settings.pro.features.bloopersAccess ? '#000' : 'var(--muted)',
                borderColor: 'var(--pro)',
                border: '1px solid',
                opacity: settings.pro.isPro && settings.pro.features.bloopersAccess ? 1 : 0.65
              }}
            >
              Bloopers
            </button>
            <button
              onClick={() => actions?.onExtrasOpen?.(item)}
              disabled={!settings.pro.isPro || !settings.pro.features.extrasAccess}
              title={settings.pro.isPro && settings.pro.features.extrasAccess ? "View behind-the-scenes content" : "Pro feature - upgrade to unlock"}
              className={buttonClass}
              style={{
                backgroundColor: settings.pro.isPro && settings.pro.features.extrasAccess ? 'var(--pro)' : 'var(--btn)',
                color: settings.pro.isPro && settings.pro.features.extrasAccess ? '#000' : 'var(--muted)',
                borderColor: 'var(--pro)',
                border: '1px solid',
                opacity: settings.pro.isPro && settings.pro.features.extrasAccess ? 1 : 0.65
              }}
            >
              Extras
            </button>
            <button
              onClick={() => actions?.onNotificationToggle?.(item)}
              disabled={!settings.pro.isPro}
              title={settings.pro.isPro ? "Advanced notifications with custom timing" : "Pro feature - upgrade to unlock"}
              className={buttonClass}
              style={{
                backgroundColor: settings.pro.isPro ? 'var(--pro)' : 'var(--btn)',
                color: settings.pro.isPro ? '#000' : 'var(--muted)',
                borderColor: 'var(--pro)',
                border: '1px solid',
                opacity: settings.pro.isPro ? 1 : 0.65
              }}
            >
              Advanced Notifications
            </button>
          </div>
        )}

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
  );

  // Mobile: wrap with SwipeableCard (swipe functionality)
  // Desktop: no wrapper at all (just the card + More menu)
  if (isDesktop && ready) {
    return cardContent;
  }

  return (
    <SwipeableCard
      item={item}
      actions={actions}
      context={getSwipeContext()}
      className={isCondensed ? "mb-3" : "mb-5"}
    >
      {cardContent}
    </SwipeableCard>
  );
}
