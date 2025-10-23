export const ALLOWLISTED_CHANNELS = [
  'Netflix', 'Warner Bros. Pictures', 'Universal Pictures', 'Sony Pictures Entertainment',
  'Paramount Pictures', 'HBO', 'A24', 'Disney Plus', 'FX Networks', 'Prime Video'
] as const;

export const BLOOPERS_KEYWORDS = [
  'bloopers','gag reel','outtakes','funny moments'
];

export const EXTRAS_KEYWORDS = [
  'featurette','behind the scenes','making of','interview','deleted scene'
];

export const PROVIDER_CONFIG = {
  youtube: {
    apiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',
    maxResults: 10,
    allowlistChannels: ALLOWLISTED_CHANNELS,
  },
  tmdb: {
    apiKey: import.meta.env.VITE_TMDB_KEY || '',
    baseUrl: 'https://api.themoviedb.org/3',
  }
} as const;
