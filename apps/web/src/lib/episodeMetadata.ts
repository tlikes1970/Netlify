import { metadataText } from "./metadataText";

export interface EpisodeTextPayload { name?: string; overview?: string; episodes?: Array<{ episode_number: number; name?: string; overview?: string }>; }
export function needsEpisodeFallback(data: EpisodeTextPayload): boolean {
  return !data.name?.trim() || (data.episodes || []).some(ep => !ep.name?.trim());
}
export function mergeEpisodeText<T extends EpisodeTextPayload>(data: T, existing?: EpisodeTextPayload, english?: EpisodeTextPayload): T {
  return {
    ...data,
    name: metadataText(data.name, existing?.name, english?.name),
    overview: metadataText(data.overview, existing?.overview, english?.overview),
    ...(data.episodes ? { episodes: data.episodes.map(ep => {
      const previous = existing?.episodes?.find(item => item.episode_number === ep.episode_number);
      const fallback = english?.episodes?.find(item => item.episode_number === ep.episode_number);
      return { ...ep, name: metadataText(ep.name, previous?.name, fallback?.name), overview: metadataText(ep.overview, previous?.overview, fallback?.overview) };
    }) } : {}),
  };
}
