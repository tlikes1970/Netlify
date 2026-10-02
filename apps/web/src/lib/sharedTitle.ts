import type { MediaItem } from '../components/cards/card.types';
import { get } from './tmdb';
import { mapTMDBToMediaItem } from '../search/api';
export type SharedTitleRequest = { id: number; mediaType: 'movie' | 'tv' } | { error: 'invalid' | 'legacy' };
export function parseSharedTitle(query: string): SharedTitleRequest {
  const params = new URLSearchParams(query); const raw = params.get('tmdbId'); const type = params.get('mediaType');
  if (!raw || !/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw))) return { error: 'invalid' };
  if (!type) return { error: 'legacy' };
  if (type !== 'movie' && type !== 'tv') return { error: 'invalid' };
  return { id: Number(raw), mediaType: type };
}
export async function resolveSharedTitle(request: SharedTitleRequest): Promise<MediaItem> {
  if ('error' in request) throw new Error(request.error);
  const data = await get(`/${request.mediaType}/${request.id}`);
  if (data.id !== request.id || !(data.title || data.name)) throw new Error('unavailable');
  return mapTMDBToMediaItem({ ...data, media_type: request.mediaType });
}
