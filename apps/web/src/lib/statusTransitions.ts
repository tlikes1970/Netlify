import { WATCH_STATUS_LABELS } from './watchStatus';
import type { MediaItem } from '@/components/cards/card.types';
import type { ListName } from '@/state/library.types';
import { getGlobalToastCallback } from './toastBridge';
import { Library } from './storage';
import { getTVShowDetails } from './tmdb';
import { readStoredEpisodeProgress, writeStoredEpisodeProgress } from '@/utils/episodeProgress';

export type PrimaryStatus = 'watching' | 'wishlist' | 'watched';

export const PRIMARY_STATUS_LABELS: Record<PrimaryStatus, string> = {
  watching: WATCH_STATUS_LABELS.watching,
  wishlist: WATCH_STATUS_LABELS.wishlist,
  watched: WATCH_STATUS_LABELS.watched,
};

async function completeCurrentAvailableSeason(item: MediaItem): Promise<void> {
  if (item.mediaType !== 'tv') return;
  const showId = Number(item.id);
  if (!Number.isFinite(showId)) return;
  try {
    const details = await getTVShowDetails(showId);
    const today = new Date().toISOString().slice(0, 10);
    const available = details.seasons
      .filter((season) => season.season_number > 0)
      .map((season) => ({
        season,
        aired: season.episodes.filter((episode) => !episode.air_date || episode.air_date <= today),
      }))
      .filter(({ aired }) => aired.length > 0)
      .sort((a, b) => b.season.season_number - a.season.season_number)[0];
    if (!available) return;

    const stored = readStoredEpisodeProgress(showId);
    const episodes = { ...stored.episodes };
    available.aired.forEach((episode) => {
      episodes[`S${available.season.season_number}E${episode.episode_number}`] = true;
    });
    writeStoredEpisodeProgress(showId, {
      ...stored,
      episodes,
      totalEpisodes: details.number_of_episodes,
      seasons: details.seasons
        .filter((season) => season.season_number > 0)
        .map((season) => ({
          seasonNumber: season.season_number,
          episodeNumbers: season.episodes.map((episode) => episode.episode_number),
        })),
    });
    const { syncEpisodeProgressToFirebase } = await import('./episodeProgressSync');
    void syncEpisodeProgressToFirebase(showId);
  } catch (error) {
    console.warn('Could not complete the current available season', error);
  }
}

export function setPrimaryStatus(
  item: MediaItem,
  target: PrimaryStatus,
  options: { feedback?: boolean } = {},
): void {
  const previous = Library.getCurrentList(item.id, item.mediaType);
  const previousProgress = item.mediaType === 'tv'
    ? localStorage.getItem(`episode-progress-${Number(item.id)}`)
    : null;

  if (Library.has(item.id, item.mediaType)) Library.move(item.id, item.mediaType, target);
  else Library.upsert(item, target);

  if (target === 'watched') void completeCurrentAvailableSeason(item);

  if (options.feedback) {
    getGlobalToastCallback()?.(
      `Moved “${item.title}” to ${PRIMARY_STATUS_LABELS[target]}.`,
      'success',
      {
        label: 'Undo',
        onClick: () => {
          if (previous) Library.move(item.id, item.mediaType, previous as ListName);
          else Library.remove(item.id, item.mediaType);
          if (item.mediaType === 'tv') {
            const key = `episode-progress-${Number(item.id)}`;
            if (previousProgress === null) localStorage.removeItem(key);
            else localStorage.setItem(key, previousProgress);
            window.dispatchEvent(new CustomEvent('episode-progress:updated', { detail: { showId: Number(item.id) } }));
          }
        },
      },
    );
  }
}
