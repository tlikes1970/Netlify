/**
 * Process: Core Search Anchors
 * Purpose: Define canonical entries for major franchises/series to ensure consistent top results
 * Data Source: TMDB data and common search patterns
 * Update Path: Add more franchises, update TMDB IDs if data changes
 * Dependencies: TMDB API
 */

export const CORE_ANCHORS: Record<string, { tmdbId: number; title: string; year: number; mediaType?: 'movie' | 'tv' }> = {
  'matrix': { tmdbId: 603, title: 'The Matrix', year: 1999 },
  'alien': { tmdbId: 348, title: 'Alien', year: 1979 },
  'aliens': { tmdbId: 679, title: 'Aliens', year: 1986 },
  'halloween': { tmdbId: 948, title: 'Halloween', year: 1978 },
  'scream': { tmdbId: 4232, title: 'Scream', year: 1996 },
  'dune': { tmdbId: 438631, title: 'Dune', year: 2021 },
  'dune 1984': { tmdbId: 841, title: 'Dune', year: 1984 },
  'it': { tmdbId: 346364, title: 'It', year: 2017 },
  'blade runner': { tmdbId: 78, title: 'Blade Runner', year: 1982 },
  'blade runner 2049': { tmdbId: 335984, title: 'Blade Runner 2049', year: 2017 },
  'terminator': { tmdbId: 218, title: 'The Terminator', year: 1984 },
  'terminator 2': { tmdbId: 280, title: 'Terminator 2: Judgment Day', year: 1991 },
  'the lord of the rings': { tmdbId: 120, title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001 },
  'lotr': { tmdbId: 120, title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001 },
  'game of thrones': { tmdbId: 1399, title: 'Game of Thrones', year: 2011, mediaType: 'tv' },
  'got': { tmdbId: 1399, title: 'Game of Thrones', year: 2011, mediaType: 'tv' },
  'harry potter': { tmdbId: 671, title: 'Harry Potter and the Philosopher\'s Stone', year: 2001 },
  'star wars': { tmdbId: 11, title: 'Star Wars', year: 1977 },
  'star trek': { tmdbId: 253, title: 'Star Trek', year: 2009 },
  'john wick': { tmdbId: 245891, title: 'John Wick', year: 2014 },
  'gladiator': { tmdbId: 98, title: 'Gladiator', year: 2000 },
  'memento': { tmdbId: 77, title: 'Memento', year: 2000 },
  'amelie': { tmdbId: 194, title: 'Amélie', year: 2001 },
  'parasite': { tmdbId: 496243, title: 'Parasite', year: 2019 },
  'arrival': { tmdbId: 329865, title: 'Arrival', year: 2016 },
  'ex machina': { tmdbId: 264660, title: 'Ex Machina', year: 2014 },
};

/**
 * Find an anchor by normalized query
 */
export function findAnchor(query: string): { tmdbId?: number; title?: string; year?: number; mediaType?: 'movie' | 'tv' } | null {
  const lowerQuery = query.toLowerCase().trim();
  
  // Exact match
  if (CORE_ANCHORS[lowerQuery]) {
    return CORE_ANCHORS[lowerQuery];
  }
  
  // Check for key contains query
  for (const [key, value] of Object.entries(CORE_ANCHORS)) {
    if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
      return value;
    }
  }
  
  return null;
}

