import React from 'react';
import type { CardContext, CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import SwipeableCard from '../SwipeableCard';
import MyListToggle from '../MyListToggle';
import { OptimizedImage } from '../OptimizedImage';
import { CompactPrimaryAction } from '../../features/compact/CompactPrimaryAction';
import { CompactOverflowMenu } from '../../features/compact/CompactOverflowMenu';
import { EpisodeProgressDisplay } from '../EpisodeProgressDisplay';

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
      <article className="curated-card v2 group select-none" data-testid="cardv2" aria-label={title} style={{ width: 'var(--poster-w, 160px)' }}>
      <div 
        className="relative border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', borderRadius: 'var(--radius, 12px)' }}
      >
        {/* Poster (2:3) */}
        <div 
          className="poster-wrap relative aspect-[2/3] cursor-pointer" 
          role="img" 
          aria-label={title}
          style={{ backgroundColor: 'var(--muted)' }}
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

          {/* My List + */}
          {showMyListBtn && (
            <MyListToggle item={item} />
          )}
        </div>

        {/* Meta */}
        <div className="p-1">
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
          
          {/* Episode progress indicator for TV shows - only show on tab contexts, not home/search */}
          {item.mediaType === 'tv' && (context === 'tab-watching' || context === 'tab-want' || context === 'tab-watched' || context === 'tab-not') && (
            <div className="mb-1">
              <EpisodeProgressDisplay 
                showId={typeof item.id === 'string' ? parseInt(item.id) : item.id}
                compact={true}
              />
            </div>
          )}
          
          <div 
            className="mt-0 flex items-center justify-between"
            style={{ fontSize: 'var(--font-sm, 11px)', color: 'var(--muted)' }}
          >
            <span>{year || 'TBA'}</span>
            {showRating && <span aria-label="rating">{rating || '—'}</span>}
          </div>
        </div>

        {/* Actions per context */}
        <CardActions context={context} item={item} actions={actions} />
        
        {/* Compact Actions - only visible when gate and flag are enabled */}
        <div className="compact-actions-container" style={{ padding: 'var(--space-1, 4px)' }}>
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
  
  const btn = (
    label: string,
    onClick?: () => void,
    testId?: string,
    isLoading = false,
    isSquare = false
  ) => {
    const buttonKey = `${testId}-${item.id}`;
    const isPressed = pressedButtons.has(buttonKey);
    const isLoadingState = loadingButtons.has(buttonKey) || isLoading;

    const handleClick = async () => {
      if (!onClick || isLoadingState) return;

      setPressedButtons(prev => new Set(prev).add(buttonKey));
      if (testId === 'act-watched' || testId === 'act-want') {
        setLoadingButtons(prev => new Set(prev).add(buttonKey));
      }
      try {
        await onClick();
      } finally {
        setTimeout(() => {
          setPressedButtons(prev => {
            const s = new Set(prev);
            s.delete(buttonKey);
            return s;
          });
          setLoadingButtons(prev => {
            const s = new Set(prev);
            s.delete(buttonKey);
            return s;
          });
        }, 150);
      }
    };

    const base =
      'inline-flex items-center justify-center rounded-xl border ' +
      'bg-[var(--btn)] text-[var(--text)] border-[var(--line)] ' +
      'shadow-sm transition-[transform,box-shadow,background-color] duration-150 ease-out ' +
      'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-inner ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
      'focus-visible:ring-[var(--accent)] disabled:opacity-60 disabled:cursor-not-allowed';

    const variant = isSquare
      ? 'w-[68px] h-[40px] sm:w-[72px] sm:h-[44px] p-1.5 text-[10px] leading-[1.05] text-center'
      : 'w-full h-9 px-3 text-[length:var(--font-sm,12px)] leading-tight font-medium tracking-tight';

    const state = isPressed ? 'translate-y-0.5 shadow-inner' : '';

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${base} ${variant} ${state}`}
        style={{
          backgroundColor: isPressed ? 'var(--btn-pressed, var(--btn))' : 'var(--btn)',
        }}
        data-testid={testId}
        disabled={isPressed || isLoadingState}
        aria-busy={isLoadingState || undefined}
      >
        {isLoadingState ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            {!isSquare && <span className="text-[length:var(--font-sm,11px)]">Working…</span>}
          </span>
        ) : (
          <span className="block px-0.5 text-center leading-[1.05] [text-wrap:balance] break-words">
            {label}
          </span>
        )}
      </button>
    );
  };

  // Map the context to a set of buttons, min 1, max 4 as per spec
  if (context === 'tab-watching') {
    return (
      <div
        className="actions grid grid-cols-2 justify-items-center gap-1.5 p-2"
        style={{ ['--btn-pressed' as any]: 'var(--accent-weak, var(--accent))' }}
        data-testid="cardv2-actions"
      >
        {btn(translations.wantToWatchAction, () => actions?.onWant?.(item), 'act-want', false, true)}
        {btn(translations.watchedAction, () => actions?.onWatched?.(item), 'act-watched', false, true)}
        {btn(translations.notInterestedAction, () => actions?.onNotInterested?.(item), 'act-not', false, true)}
        {btn(translations.deleteAction, () => actions?.onDelete?.(item), 'act-delete', false, true)}
      </div>
    );
  }

  if (context === 'tab-foryou' || context === 'search' || context === 'home') {
    return (
      <div className="actions grid grid-cols-2 gap-1 p-1" data-testid="cardv2-actions">
        {btn(translations.wantToWatchAction, () => actions?.onWant?.(item), 'act-want')}
        {btn(translations.watchedAction, () => actions?.onWatched?.(item), 'act-watched')}
      </div>
    );
  }

  if (context === 'holiday') {
    return (
        <div className="actions grid grid-cols-2 gap-1 p-1" data-testid="cardv2-actions">
        {btn(translations.watchedAction, () => actions?.onWatched?.(item), 'act-watched')}
        {btn(translations.removeAction, () => actions?.onDelete?.(item), 'act-delete')}
      </div>
    );
  }

  return <div className="p-2" />; // default no-op
}
