import { useLanguage } from "../../../lib/language";
import { CardPosterGlow } from "../CardPosterGlow";

import type { MediaItem, CardActionHandlers } from '../card.types';
import SwipeableCard from '../../SwipeableCard';
import { TitlePoster } from '../TitlePoster';
import { getShowStatusInfo } from '../../../utils/showStatus';
import { CardMobileInfoSection, CardMobileChipsRow } from './CardMobileInfoSection';
import {
  useMobileCardEnrichedItem,
  getMobileTabContext,
  formatMobileMetaLine,
} from './cardMobileShared';


export interface TvCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'want';
  customListContext?: boolean;
  posterGlow?: boolean;
  index?: number;
  isDragging?: boolean;
}

export function TvCardMobile({
  item,
  actions,
  tabKey = 'watching',
  customListContext = false,
  posterGlow = false,
  index = 0,
  isDragging,
}: TvCardMobileProps) {
  useLanguage();
  const enrichedItem = useMobileCardEnrichedItem(item);
  const { showStatus } = enrichedItem;

  const statusInfo = getShowStatusInfo(showStatus);
  const chips = statusInfo ? (
    <CardMobileChipsRow>
      <span
        className="badge card-mobile-status-badge"
        style={{
          color: statusInfo.color,
          backgroundColor: statusInfo.backgroundColor,
          borderColor: statusInfo.backgroundColor,
        }}
      >
        {statusInfo.badge}
      </span>
    </CardMobileChipsRow>
  ) : null;

  const content = (
      <article
        className="card-mobile"
        style={{ position: 'relative', overflow: 'visible' }}
        data-item-index={index}
      >
        {posterGlow && <CardPosterGlow posterUrl={enrichedItem.posterUrl} />}

        <div className="poster-col" style={{ position: 'relative' }}>
          <TitlePoster item={enrichedItem} className="poster-image" />

        </div>

        <CardMobileInfoSection
          item={enrichedItem}
          tabKey={tabKey}
          customListContext={customListContext}
          actions={actions}
          metaLine={formatMobileMetaLine(enrichedItem, 'tv')}
          chips={chips}
          providerMediaType="tv"
        />
      </article>

  );
  return customListContext ? content : <SwipeableCard item={enrichedItem} actions={actions} context={getMobileTabContext(tabKey)} disableSwipe={isDragging}>{content}</SwipeableCard>;
}
