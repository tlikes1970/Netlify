import { useLanguage } from "../../../lib/language";
import { CardPosterGlow } from "../CardPosterGlow";
import React from 'react';
import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { TitlePoster } from '../TitlePoster';
import { DragHandle } from '../DragHandle';
import { CardMobileInfoSection } from './CardMobileInfoSection';
import {
  useMobileCardEnrichedItem,
  getMobileTabContext,
  formatMobileMetaLine,
  formatMovieCompactMeta,
} from './cardMobileShared';
import { getItemSynopsis } from '../../../lib/itemSynopsis';


export interface MovieCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'want';
  customListContext?: boolean;
  posterGlow?: boolean;
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
  customListContext = false,
  posterGlow = false,
  index = 0,
  onDragStart,
  onDragEnd,
  onKeyboardReorder,
  isDragging,
}: MovieCardMobileProps) {
  useLanguage();
  const enrichedItem = useMobileCardEnrichedItem(item);


  const synopsis = getItemSynopsis(enrichedItem);
  const fillLine = synopsis ? null : formatMovieCompactMeta(enrichedItem);

  const content = (
      <article
        className="card-mobile"
        style={{ position: 'relative', overflow: 'visible' }}
        data-item-index={index}
      >
        {posterGlow && <CardPosterGlow posterUrl={enrichedItem.posterUrl} />}
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
          <TitlePoster item={enrichedItem} className="poster-image" />

        </div>

        <CardMobileInfoSection
          item={enrichedItem}
          tabKey={tabKey}
          customListContext={customListContext}
          actions={actions}
          metaLine={formatMobileMetaLine(enrichedItem, 'movie')}
          fillLine={fillLine}
          providerMediaType="movie"
        />
      </article>

  );
  return customListContext ? content : <SwipeableCard item={enrichedItem} actions={actions} context={getMobileTabContext(tabKey)}>{content}</SwipeableCard>;
}
