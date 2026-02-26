import { TMDB_PROXY_BASE } from '../lib/apiConfig';

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
