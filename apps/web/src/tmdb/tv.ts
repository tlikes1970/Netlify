export async function fetchNextAirDate(tvId: number): Promise<string | null> {
  const url = `/.netlify/functions/tmdb-proxy?path=tv/${tvId}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  // TMDB often returns next_episode_to_air for ongoing shows
  const next = json?.next_episode_to_air?.air_date || null;
  return next || null;
}
