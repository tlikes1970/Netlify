import type { ReactNode } from 'react';
import type { MediaItem, CardActionHandlers } from '../card.types';
import StarRating from '../StarRating';
import { ProviderBadges } from '../ProviderBadge';
import { CardMobileTitleRow } from './CardMobileTitleRow';
import { getItemSynopsis } from '../../../lib/itemSynopsis';
import type { ActionItem } from '../../../features/compact/actionsMap';
import { useSettings } from '../../../lib/settings';
import { EpisodeProgressDisplay } from '../../EpisodeProgressDisplay';
import { MetadataIndicators } from '../MetadataIndicators';
import { ContextStatusActions } from './ContextStatusActions';

type CardMobileInfoSectionProps = {
  item: MediaItem;
  tabKey: 'watching' | 'watched' | 'want';
  customListContext?: boolean;
  actions?: CardActionHandlers;
  metaLine: string;
  chips?: ReactNode;
  fillLine?: string | null;
  providerMediaType: 'tv' | 'movie';
};

export function CardMobileInfoSection({
  item,
  tabKey,
  customListContext = false,
  actions,
  metaLine,
  chips,
  fillLine,
  providerMediaType,
}: CardMobileInfoSectionProps) {
  const synopsis = getItemSynopsis(item);
  const settings = useSettings();

  const handleRatingChange = (rating: number) => {
    actions?.onRatingChange?.(item, rating);
  };

  return (
    <div className="info-col">
      <header className="card-mobile-header">
        <CardMobileTitleRow
          title={item.title}
          item={item as ActionItem}
          context={`tab-${tabKey}`}
          actions={actions}
          customListContext={customListContext}
        />
        <span className="meta">{metaLine}</span>
        {chips}
        {item.mediaType === 'tv' && settings.layout.episodeTracking && (
          <EpisodeProgressDisplay showId={Number(item.id)} compact />
        )}
        {item.networks && item.networks.length > 0 && (
          <ProviderBadges
            providers={item.networks}
            maxVisible={2}
            mediaType={providerMediaType}
          />
        )}
      </header>

      <div className="card-mobile-info-body">
        {synopsis ? (
          <div className="synopsis">{synopsis}</div>
        ) : fillLine ? (
          <div className="card-mobile-fill-meta">{fillLine}</div>
        ) : null}

        <div className="mobile-actions-row">
          <StarRating
            value={item.userRating || 0}
            onChange={handleRatingChange}
            size="sm"
            className="compact-user-rating"
          />
        </div>
        <MetadataIndicators item={item} actions={actions} />
        <ContextStatusActions item={item} tabKey={customListContext ? undefined : tabKey} omitCurrentStatus={customListContext} />
      </div>
    </div>
  );
}

export function CardMobileChipsRow({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <div className="card-mobile-chips">{children}</div>;
}
