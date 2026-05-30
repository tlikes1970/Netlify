export type RailSpec = { id: string; title: string; group: 'your-shows'|'for-you'|'feedback'; gatedFlag?: string };
export type TabSpec  = { id: 'watching'|'want'|'watched'|'discovery'; title: string; gatedFlag?: string };

export const HOME_RAILS: RailSpec[] = [
  // Your Shows
  { id: 'currently-watching', title: 'Currently Watching', group: 'your-shows' },
  { id: 'up-next',            title: 'Up Next',            group: 'your-shows' },

  // For You (genre sub-rails)
  { id: 'for-you-drama',      title: 'Drama',              group: 'for-you' },
  { id: 'for-you-comedy',     title: 'Comedy',             group: 'for-you' },
  { id: 'for-you-horror',     title: 'Horror',             group: 'for-you' },

  // Feedback
  { id: 'feedback',           title: 'Feedback',           group: 'feedback' }
];

export const TABS: TabSpec[] = [
  { id: 'watching', title: 'Currently Watching' },
  { id: 'want',     title: 'Want to Watch' },
  { id: 'watched',  title: 'Watched' },
  { id: 'discovery',title: 'Discovery' }
];

export type RailItemsBinding =
  | { id: 'currently-watching'|'up-next'; source: 'saved' }                 // from user lists
  | { id: 'for-you-drama'|'for-you-comedy'|'for-you-horror'; source: 'tmdb' }
  | { id: 'feedback'; source: 'static' };

export const BINDINGS: RailItemsBinding[] = [
  { id: 'currently-watching', source: 'saved' },
  { id: 'up-next',            source: 'saved' },
  { id: 'for-you-drama',      source: 'tmdb' },
  { id: 'for-you-comedy',     source: 'tmdb' },
  { id: 'for-you-horror',     source: 'tmdb' },
  { id: 'feedback',           source: 'static' }
];
