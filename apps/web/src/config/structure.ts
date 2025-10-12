export type RailSpec = { id: string; title: string; group: 'your-shows'|'community'|'for-you'|'in-theaters'|'feedback'; gatedFlag?: string };
export type TabSpec  = { id: 'watching'|'want'|'watched'|'discovery'; title: string; gatedFlag?: string };

export const HOME_RAILS: RailSpec[] = [
  // Your Shows
  { id: 'currently-watching', title: 'Currently Watching', group: 'your-shows' },
  { id: 'up-next',            title: 'Up Next',            group: 'your-shows' },

  // Community (always visible)
  { id: 'community',          title: 'Community',          group: 'community' },

  // For You (genre sub-rails)
  { id: 'for-you-drama',      title: 'Drama',              group: 'for-you' },
  { id: 'for-you-comedy',     title: 'Comedy',             group: 'for-you' },
  { id: 'for-you-horror',     title: 'Horror',             group: 'for-you' },

  // In Theaters
  { id: 'in-theaters',        title: 'In Theaters Near You', group: 'in-theaters' },

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
  | { id: 'in-theaters'; source: 'tmdb' }
  | { id: 'community'|'feedback'; source: 'static' };

export const BINDINGS: RailItemsBinding[] = [
  { id: 'currently-watching', source: 'saved' },
  { id: 'up-next',            source: 'saved' },
  { id: 'community',          source: 'static' },
  { id: 'for-you-drama',      source: 'tmdb' },
  { id: 'for-you-comedy',     source: 'tmdb' },
  { id: 'for-you-horror',     source: 'tmdb' },
  { id: 'in-theaters',        source: 'tmdb' },
  { id: 'feedback',           source: 'static' }
];
