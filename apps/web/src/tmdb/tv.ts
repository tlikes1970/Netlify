import { TMDB_PROXY_BASE } from '../lib/apiConfig';
import type { Episode } from '../lib/tmdb';

export async function fetchNextAirDate(tvId: number): Promise<string | null> {
  const TMDB_PROXY_URL = TMDB_PROXY_BASE;
  const url = `${TMDB_PROXY_URL}?path=tv/${tvId}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  
  console.log(`🔍 TMDB Response for ${tvId}:`, {
    next_episode_to_air: json?.next_episode_to_air,
    status: json?.status,
    last_air_date: json?.last_air_date
  });
  
  // TMDB often returns next_episode_to_air for ongoing shows
  const next = json?.next_episode_to_air?.air_date || null;
  return next || null;
}

export async function fetchShowStatus(tvId: number): Promise<{status: string, lastAirDate: string | null} | null> {
  const TMDB_PROXY_URL = TMDB_PROXY_BASE;
  const url = `${TMDB_PROXY_URL}?path=tv/${tvId}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  
  return {
    status: json?.status || 'Unknown',
    lastAirDate: json?.last_air_date || null
  };
}

export async function fetchCurrentEpisodeInfo(tvId: number): Promise<{season: number, episode: number} | null> {
  const TMDB_PROXY_URL = TMDB_PROXY_BASE;
  const url = `${TMDB_PROXY_URL}?path=tv/${tvId}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  
  const nextEpisode = json?.next_episode_to_air;
  if (nextEpisode) {
    return {
      season: nextEpisode.season_number,
      episode: nextEpisode.episode_number
    };
  }
  
  return null;
}

export async function fetchRelevantSeasonEpisodes(tvId: number): Promise<Episode[]> {
  const showResponse = await fetch(`${TMDB_PROXY_BASE}?path=tv/${tvId}&language=en-US`);
  if (!showResponse.ok) throw new Error(`Unable to load TV schedule (${showResponse.status})`);
  const show = await showResponse.json();
  const futureSeason = (show?.seasons || [])
    .filter((season: any) => season.season_number > 0 && season.air_date)
    .filter((season: any) => {
      const start = new Date(`${season.air_date}T00:00:00`);
      return !Number.isNaN(start.getTime()) && start.getTime() >= new Date().setHours(0, 0, 0, 0);
    })
    .sort((left: any, right: any) => left.air_date.localeCompare(right.air_date))[0];
  const seasonNumber =
    show?.next_episode_to_air?.season_number ??
    futureSeason?.season_number ??
    show?.last_episode_to_air?.season_number ??
    show?.number_of_seasons;
  if (!Number.isInteger(seasonNumber) || seasonNumber < 1) return [];
  const seasonResponse = await fetch(
    `${TMDB_PROXY_BASE}?path=tv/${tvId}/season/${seasonNumber}&language=en-US`,
  );
  if (!seasonResponse.ok) throw new Error(`Unable to load season schedule (${seasonResponse.status})`);
  const season = await seasonResponse.json();
  return (season.episodes || []).map((episode: any) => ({
    id: episode.id,
    name: episode.name || "",
    episode_number: episode.episode_number,
    season_number: episode.season_number ?? seasonNumber,
    air_date: episode.air_date || "",
    overview: episode.overview || "",
    still_path: episode.still_path,
    vote_average: episode.vote_average,
  }));
}
