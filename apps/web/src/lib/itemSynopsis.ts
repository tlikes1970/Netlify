import type { MediaItem } from '@/components/cards/card.types';

export type ItemWithOverview = MediaItem & { overview?: string };

/** Resolve display/storage synopsis from synopsis or legacy overview field. */
export function getItemSynopsis(item: ItemWithOverview): string | undefined {
  const synopsis = item.synopsis?.trim();
  if (synopsis) return synopsis;

  const overview = item.overview?.trim();
  if (overview) return overview;

  return undefined;
}

export function itemNeedsSynopsisBackfill(item: ItemWithOverview): boolean {
  return item.mediaType !== 'person' && !getItemSynopsis(item);
}
