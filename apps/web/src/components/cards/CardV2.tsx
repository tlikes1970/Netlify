import React from 'react';
import type { CardContext, CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import SwipeableCard from '../SwipeableCard';
import MyListToggle from '../MyListToggle';
import { OptimizedImage } from '../OptimizedImage';
import { CompactPrimaryAction } from '../../features/compact/CompactPrimaryAction';
import { CompactOverflowMenu } from '../../features/compact/CompactOverflowMenu';

export type CardV2Props = {
  item: MediaItem;
  context: CardContext;
  actions?: CardActionHandlers;
  // optional presentation flags
  compact?: boolean;          // smaller text; still 2:3 poster
  showRating?: boolean;       // default true where voteAverage exists
  disableSwipe?: boolean;     // disable swipe actions for horizontal scrolling contexts
};

/**
 * Cards V2 — unified card for rails, tabs, and search
 * - 2:3 poster with safe fallback
 * - context-specific action bar
 * - optional Holiday + chip top-right (where relevant)
 */
export default function CardV2({ item, context, actions, compact, showRating = true, disableSwipe = false }: CardV2Props) {
  const { title, year, posterUrl, voteAverage } = item;
  const rating = typeof voteAverage === 'number' ? Math.round(voteAverage * 10) / 10 : undefined;
  const translations = useTranslations();

  const showMyListBtn = context === 'tab-foryou' || context === 'search' || context === 'home' || context === 'tab-watching' || context === 'holiday';

  return (
    <SwipeableCard
      item={item}
      actions={actions}
      context={context}
      disableSwipe={disableSwipe}
    >
      <article className="curated-card v2 group select-none" data-testid="cardv2" aria-label={title} style={{ width: 'var(--poster-w, 120px)' }}>
      <div 
        className="relative border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', borderRadius: 'var(--radius, 12px)' }}
      >
        {/* Poster (2:3) */}
        <div 
          className="poster-wrap relative aspect-[2/3]" 
          role="img" 
          aria-label={title}
          style={{ backgroundColor: 'var(--muted)' }}
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

          {/* My List + */}
          {showMyListBtn && (
            <MyListToggle item={item} />
          )}
        </div>

        {/* Meta */}
        <div className="p-2">
          <div className="flex items-center gap-1">
            <h3 
              className={["truncate", compact ? "font-medium" : "text-sm", "font-medium"].join(' ')} 
              style={{ 
                fontSize: compact ? 'var(--font-md, 13px)' : undefined,
                color: 'var(--text)' 
              }}
              title={title}
            >
              {title}
            </h3>
            
            {/* Notes and Tags Indicators */}
            <div className="flex gap-0.5 flex-shrink-0">
              {item.userNotes && item.userNotes.trim() && (
                <span 
                  className="cursor-pointer hover:scale-110 transition-transform"
                  style={{ fontSize: 'var(--font-sm, 10px)' }}
                  title={`Notes: ${item.userNotes.substring(0, 50)}${item.userNotes.length > 50 ? '...' : ''}`}
                  onClick={() => actions?.onNotesEdit?.(item)}
                >
                  📝
                </span>
              )}
              {item.tags && item.tags.length > 0 && (
                <span 
                  className="cursor-pointer hover:scale-110 transition-transform"
                  style={{ fontSize: 'var(--font-sm, 10px)' }}
                  title={`Tags: ${item.tags.join(', ')}`}
                  onClick={() => actions?.onNotesEdit?.(item)}
                >
                  🏷️
                </span>
              )}
            </div>
          </div>
          <div 
            className="mt-0.5 flex items-center justify-between"
            style={{ fontSize: 'var(--font-sm, 11px)', color: 'var(--muted)' }}
          >
            <span>{year || 'TBA'}</span>
            {showRating && <span aria-label="rating">{rating || '—'}</span>}
          </div>
        </div>

        {/* Actions per context */}
        <CardActions context={context} item={item} actions={actions} />
        
        {/* Compact Actions - only visible when gate and flag are enabled */}
        <div className="compact-actions-container" style={{ padding: 'var(--space-2, 8px)' }}>
          <CompactPrimaryAction 
            item={item as any} 
            context={context === 'home' || context === 'tab-foryou' || context === 'search' ? 'home' : 'tab'} 
          />
          <CompactOverflowMenu 
            item={item as any} 
            context={context === 'home' || context === 'tab-foryou' || context === 'search' ? 'home' : 'tab'} 
          />
        </div>
      </div>
    </article>
    </SwipeableCard>
  );
}

function CardActions({ context, item, actions }: { context: CardContext; item: MediaItem; actions?: CardActionHandlers }) {
  const translations = useTranslations();
  const [pressedButtons, setPressedButtons] = React.useState<Set<string>>(new Set());
  const [loadingButtons, setLoadingButtons] = React.useState<Set<string>>(new Set());
  
  const btn = (label: string, onClick?: () => void, testId?: string, isLoading = false) => {
    const buttonKey = `${testId}-${item.id}`;
    const isPressed = pressedButtons.has(buttonKey);
    const isLoadingState = loadingButtons.has(buttonKey) || isLoading;
    
    const handleClick = async () => {
      if (!onClick || isLoadingState) return;
      
      // Add pressed state
      setPressedButtons(prev => new Set(prev).add(buttonKey));
      
      // Add loading state for async operations
      if (testId === 'act-watched' || testId === 'act-want') {
        setLoadingButtons(prev => new Set(prev).add(buttonKey));
      }
      
      try {
        // Call the action
        await onClick();
      } finally {
        // Remove pressed state after animation
        setTimeout(() => {
          setPressedButtons(prev => {
            const newSet = new Set(prev);
            newSet.delete(buttonKey);
            return newSet;
          });
          setLoadingButtons(prev => {
            const newSet = new Set(prev);
            newSet.delete(buttonKey);
            return newSet;
          });
        }, 200);
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`rounded-lg border px-2 py-1 leading-none transition-all duration-150 ease-out ${
          isPressed ? 'scale-95 active:shadow-inner' : 'hover:scale-105 hover:shadow-md'
        } ${isLoadingState ? 'cursor-wait' : 'cursor-pointer'}`}
        style={{ 
          backgroundColor: isPressed ? 'var(--accent)' : 'var(--btn)', 
          borderColor: 'var(--line)', 
          color: 'var(--text)',
          fontSize: 'var(--font-sm, 11px)'
        }}
        data-testid={testId}
        disabled={isPressed || isLoadingState}
      >
        {isLoadingState ? (
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
            <span style={{ fontSize: 'var(--font-sm, 10px)' }}>...</span>
          </div>
        ) : (
          label
        )}
      </button>
    );
  };

  // Map the context to a set of buttons, min 1, max 4 as per spec
  if (context === 'tab-watching') {
    return (
      <div className="actions grid grid-cols-2 gap-1 p-2" data-testid="cardv2-actions">
        {btn(translations.wantToWatchAction, () => actions?.onWant?.(item), 'act-want')}
        {btn(translations.watchedAction, () => actions?.onWatched?.(item), 'act-watched')}
        {btn(translations.notInterestedAction, () => actions?.onNotInterested?.(item), 'act-not')}
        {btn(translations.deleteAction, () => actions?.onDelete?.(item), 'act-delete')}
      </div>
    );
  }

  if (context === 'tab-foryou' || context === 'search' || context === 'home') {
    return (
      <div className="actions grid grid-cols-1 gap-1 p-2" data-testid="cardv2-actions">
        {btn(translations.wantToWatchAction, () => actions?.onWant?.(item), 'act-want')}
      </div>
    );
  }

  if (context === 'holiday') {
    return (
      <div className="actions grid grid-cols-2 gap-1 p-2" data-testid="cardv2-actions">
        {btn(translations.watchedAction, () => actions?.onWatched?.(item), 'act-watched')}
        {btn(translations.removeAction, () => actions?.onDelete?.(item), 'act-delete')}
      </div>
    );
  }

  return <div className="p-2" />; // default no-op
}
