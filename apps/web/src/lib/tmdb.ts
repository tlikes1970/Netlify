const BASE = 'https://api.themoviedb.org/3';
const img = (p?: string|null) => (p ? `https://image.tmdb.org/t/p/w342${p}` : '');

type Raw = { id: number; title?: string; name?: string; poster_path?: string|null; media_type?: 'movie'|'tv'|string };
export type CardData = { id: string; kind: 'movie'|'tv'; title: string; poster: string };

const map = (r: Raw): CardData => ({
  id: String(r.id),
  kind: (r.media_type as 'movie'|'tv') || (r.title ? 'movie' : 'tv'),
  title: r.title || r.name || 'Untitled',
  poster: img(r.poster_path)
});

let lastSource: 'proxy' | 'error' = 'proxy';
export function debugTmdbSource() { return lastSource; }

async function get(path: string, params: Record<string,string|number> = {}) {
  const proxyURL = '/.netlify/functions/tmdb-proxy?' + new URLSearchParams({ path, ...params });
  const pr = await fetch(proxyURL);
  if (!pr.ok) {
    const txt = await pr.text().catch(() => '');
    console.error('[TMDB proxy] HTTP', pr.status, proxyURL, txt.slice(0, 200));
    lastSource = 'error';
    throw new Error(`tmdb-proxy ${pr.status}`);
  }
  lastSource = 'proxy';
  return pr.json();
}

export async function trendingForYou() {
  const data = await get('/trending/all/week');
  return (data.results ?? []).filter((r: Raw) => r.poster_path).map(map).slice(0, 24);
}

export async function nowPlayingMovies() {
  const data = await get('/movie/now_playing', { page: 1, region: 'US' });
  return (data.results ?? []).filter((r: Raw) => r.poster_path).map(map).slice(0, 24);
}

const backdrop = (p?: string|null) => (p ? `https://image.tmdb.org/t/p/w1280${p}` : '');

export async function featuredTrendingMovie() {
  const data = await get('/trending/movie/day');
  const r = (data.results ?? []).find((x: any) => x.backdrop_path || x.poster_path) || (data.results ?? [])[0];
  if (!r) return null;
  return {
    id: String(r.id),
    kind: 'movie' as const,
    title: r.title || 'Untitled',
    poster: img(r.poster_path),
    backdrop: backdrop(r.backdrop_path),
    overview: r.overview || ''
  };
}

export async function searchMulti(query: string) {
  if (!query?.trim()) return [];
  const data = await get('/search/multi', { query });
  return (data.results ?? [])
    .filter((r: any) => (r.media_type === 'movie' || r.media_type === 'tv') && (r.poster_path))
    .map((r: any) => ({
      id: String(r.id),
      kind: (r.media_type as 'movie'|'tv'),
      title: r.title || r.name || 'Untitled',
      poster: img(r.poster_path),
      genre_ids: r.genre_ids || []
    }))
    .slice(0, 40);
}
