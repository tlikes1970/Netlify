import { get } from './tmdb';
import { getMetadataLanguage } from './language';
import { mapTMDBToMediaItem } from '../search/api';
import type { MediaItem } from '../components/cards/card.types';

/** Provider order only: Recommendations first, Similar fills up to eight titles. */
export async function getRelatedTitles(id: number | string, mediaType: 'movie' | 'tv', language = getMetadataLanguage()): Promise<MediaItem[]> {
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error('Invalid title identity');
  const items: MediaItem[] = [];
  const seen = new Set<string>([`${mediaType}:${id}`]);
  let failed = false;
  for (const source of ['recommendations', 'similar']) {
    if (items.length >= 8) break;
    try {
      const data = await get(`/${mediaType}/${id}/${source}`, { language });
      if (!Array.isArray(data.results)) throw new Error('Invalid related-title response');
      for (const raw of data.results) {
        if (!raw || typeof raw !== 'object') continue;
        const kind = raw.media_type || mediaType;
        const hasTitle = [raw.title, raw.name, raw.original_title, raw.original_name].some(value => typeof value === 'string' && value.trim());
        if ((kind !== 'movie' && kind !== 'tv') || !Number.isSafeInteger(raw.id) || raw.id <= 0 || !hasTitle) continue;
        const key = `${kind}:${raw.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(mapTMDBToMediaItem({ ...raw, media_type: kind }));
        if (items.length === 8) break;
      }
    } catch { failed = true; }
  }
  if (!items.length && failed) throw new Error('Related titles unavailable');
  return items;
}
