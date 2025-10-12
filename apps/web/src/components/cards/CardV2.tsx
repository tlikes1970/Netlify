import React from 'react';
import type { CardContext, CardActionHandlers, MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';

export type CardV2Props = {
  item: MediaItem;
  context: CardContext;
  actions?: CardActionHandlers;
  // optional presentation flags
  compact?: boolean;          // smaller text; still 2:3 poster
  showRating?: boolean;       // default true where voteAverage exists
};

/**
 * Cards V2 — unified card for rails, tabs, and search
 * - 2:3 poster with safe fallback
 * - context-specific action bar
 * - optional Holiday + chip top-right (where relevant)
 */
export default function CardV2({ item, context, actions, compact, showRating = true }: CardV2Props) {
  const { title, year, posterUrl, voteAverage } = item;
  const rating = typeof voteAverage === 'number' ? Math.round(voteAverage * 10) / 10 : undefined;
  const translations = useTranslations();

  const showHolidayBtn = context === 'tab-foryou' || context === 'search' || context === 'home' || context === 'holiday';

  return (
    <article className="curated-card v2 group w-[154px] select-none" data-testid="cardv2" aria-label={title}>
      <div 
        className="relative rounded-xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)' }}
      >
        {/* Poster (2:3) */}
        <div 
          className="poster-wrap relative aspect-[2/3]" 
          role="img" 
          aria-label={title}
          style={{ backgroundColor: 'var(--muted)' }}
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

          {/* Holiday + */}
          {showHolidayBtn && actions?.onHolidayAdd && (
            <button
              type="button"
              onClick={() => actions.onHolidayAdd?.(item)}
              className="absolute right-1.5 top-1.5 rounded-full border bg-background/80 px-2 py-0.5 text-[11px] leading-none backdrop-blur transition hover:bg-accent hover:text-accent-foreground"
              style={{ color: 'white' }}
              aria-label="Add to Holiday list"
              data-testid="cardv2-holiday"
            >
              {translations.holidayAddAction}
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="p-2">
          <h3 
            className={["truncate", compact ? "text-[13px]" : "text-sm", "font-medium"].join(' ')} 
            title={title}
            style={{ color: 'var(--text)' }}
          >
            {title}
          </h3>
          <div 
            className="mt-0.5 flex items-center justify-between text-[11px]"
            style={{ color: 'var(--muted)' }}
          >
            <span>{year || ''}</span>
            {showRating && rating ? <span aria-label="rating">{rating}</span> : <span />}
          </div>
        </div>

        {/* Actions per context */}
        <CardActions context={context} item={item} actions={actions} />
      </div>
    </article>
  );
}

function CardActions({ context, item, actions }: { context: CardContext; item: MediaItem; actions?: CardActionHandlers }) {
  const translations = useTranslations();
  
  const btn = (label: string, onClick?: () => void, testId?: string) => (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border px-2 py-1 text-[11px] leading-none transition-colors"
      style={{ 
        backgroundColor: 'var(--btn)', 
        borderColor: 'var(--line)', 
        color: 'var(--text)' 
      }}
      data-testid={testId}
    >
      {label}
    </button>
  );

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
