export type AutocompleteSuggestion = {
  title: string;
  subtitle?: string;
  type: 'movie' | 'tv' | 'person';
  id: number;
};

async function fetchTMDB(path: string, params: Record<string, any>, signal?: AbortSignal) {
  const qs = new URLSearchParams({ path, ...params });
  const url = `/api/tmdb-proxy?${qs.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export async function fetchAutocomplete(
  query: string,
  signal?: AbortSignal
): Promise<AutocompleteSuggestion[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  try {
    // Fetch from TMDB multi search with limit to 5 results
    const json = await fetchTMDB('search/multi', {
      query: query.trim(),
      page: 1,
      include_adult: false,
      language: 'en-US',
      region: 'US',
    }, signal);

    const results = Array.isArray(json.results) ? json.results.slice(0, 5) : [];

    return results.map((r: any) => {
      const mediaType = r.media_type || (r.first_air_date ? 'tv' : r.release_date ? 'movie' : 'person');
      
      let title = '';
      let subtitle = '';
      
      if (mediaType === 'person') {
        title = r.name || '';
        subtitle = r.known_for?.map((kf: any) => kf.title || kf.name).filter(Boolean).join(', ') || '';
      } else {
        title = mediaType === 'movie' ? r.title : r.name;
        const date = mediaType === 'movie' ? r.release_date : r.first_air_date;
        const year = date ? String(date).slice(0, 4) : '';
        subtitle = `${mediaType === 'tv' ? 'TV Show' : 'Movie'}${year ? ` • ${year}` : ''}`;
      }
      
      return {
        title: title.trim() || 'Untitled',
        subtitle: subtitle.trim(),
        type: mediaType,
        id: r.id,
      };
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.warn('Autocomplete fetch failed:', error);
    return [];
  }
}

