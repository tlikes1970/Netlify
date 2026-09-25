import React from 'react';
import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { OptimizedImage } from '../../OptimizedImage';
import { DragHandle } from '../DragHandle';
import MyListToggle from '../../MyListToggle';
import { CardMobileInfoSection } from './CardMobileInfoSection';
import {
  useMobileCardEnrichedItem,
  getMobileTabContext,
  getMobileListContext,
  formatMobileMetaLine,
  formatMovieCompactMeta,
} from './cardMobileShared';
import { getItemSynopsis } from '../../../lib/itemSynopsis';
import { POSTER_PLACEHOLDER } from '../../../lib/posterPlaceholder';

export interface MovieCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'want';
  index?: number;
  onDragStart?: (e: React.DragEvent | React.TouchEvent, index: number) => void;
  onDragEnd?: () => void;
  onKeyboardReorder?: (direction: 'up' | 'down') => void;
  isDragging?: boolean;
}

export function MovieCardMobile({
  item,
  actions,
  tabKey = 'watching',
  index = 0,
  onDragStart,
  onDragEnd,
  onKeyboardReorder,
  isDragging,
}: MovieCardMobileProps) {
  const enrichedItem = useMobileCardEnrichedItem(item);
  const { title, posterUrl } = enrichedItem;

  const synopsis = getItemSynopsis(enrichedItem);
  const fillLine = synopsis ? null : formatMovieCompactMeta(enrichedItem);

  return (
    <SwipeableCard
      item={enrichedItem}
      actions={actions}
      context={getMobileTabContext(tabKey)}
    >
      <div
        className="card-mobile"
        style={{ position: 'relative', overflow: 'visible' }}
        data-item-index={index}
      >
        {onDragStart && (
          <DragHandle
            itemId={String(enrichedItem.id)}
            index={index}
            onDragStart={(e, idx) => {
              onDragStart(e as React.DragEvent | React.TouchEvent, idx);
            }}
            onDragEnd={onDragEnd}
            onKeyboardReorder={onKeyboardReorder}
            isDragging={isDragging}
            itemTitle={enrichedItem.title}
            onTouchDragMove={(_e, _idx) => {}}
          />
        )}

        <div className="poster-col" style={{ position: 'relative' }}>
          <OptimizedImage
            src={posterUrl || ''}
            alt={`${title} poster`}
            context="poster"
            fallbackSrc={POSTER_PLACEHOLDER}
            className="poster-image"
            loading="lazy"
          />
          <MyListToggle
            item={enrichedItem}
            currentListContext={getMobileListContext(tabKey)}
          />
        </div>

        <CardMobileInfoSection
          item={enrichedItem}
          tabKey={tabKey}
          actions={actions}
          metaLine={formatMobileMetaLine(enrichedItem, 'movie')}
          fillLine={fillLine}
          providerMediaType="movie"
        />
      </div>
    </SwipeableCard>
  );
}
