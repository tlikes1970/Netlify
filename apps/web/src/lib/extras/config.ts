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
} as const;

export const SPANISH_VIDEO_TERMS: Readonly<Record<string, string>> = {
  'Best TV Bloopers Ever': 'Las mejores tomas falsas de televisión', 'Classic Comedy Outtakes': 'Tomas falsas de comedias clásicas', 'Funniest Movie Bloopers': 'Las tomas falsas de cine más divertidas', 'Behind the Scenes Fails': 'Errores detrás de cámaras', 'Best Comedy Bloopers': 'Las mejores tomas falsas de comedia', 'Funniest TV Moments': 'Los momentos más divertidos de televisión', 'Classic Outtakes Collection': 'Recopilación de tomas falsas clásicas', 'Behind the Scenes': 'Detrás de cámaras', 'Making of Documentaries': 'Documentales sobre el rodaje', 'Cast Interviews': 'Entrevistas con el reparto',
  'bloopers': 'tomas falsas', 'gag reel': 'tomas falsas', 'outtakes': 'escenas descartadas', 'funny moments': 'momentos divertidos',
  'featurette': 'reportaje', 'behind the scenes': 'detrás de cámaras', 'making of': 'cómo se hizo', 'interview': 'entrevista', 'deleted scene': 'escena eliminada',
};
export function videoQueryTerms(keywords: readonly string[], language: string): string[] {
  return language === 'es' ? keywords.map(term => SPANISH_VIDEO_TERMS[term] || term) : [...keywords];
}
