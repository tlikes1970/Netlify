export type MediaType = 'movie' | 'tv' | 'person';

export interface MediaItem {
  id: string | number;
  mediaType: MediaType;
  title: string;         // movie title or TV name
  year?: string;         // release year
  releaseDate?: string;  // ISO date string (release_date or first_air_date) for precise recency calculation
  posterUrl?: string;    // 2:3 image url; can be undefined
  voteAverage?: number;  // 0..10 (TMDB rating)
  voteCount?: number;    // Number of votes (TMDB vote_count)
  userRating?: number;   // 0..5 (user's personal rating)
  runtimeMins?: number;  // optional
  synopsis?: string;     // plot overview from TMDB
  nextAirDate?: string | null; // ISO date for TV next episode (watching only)
  showStatus?: 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned'; // TV show status
  lastAirDate?: string;  // ISO date for TV last episode
  userNotes?: string;    // user's personal notes/review
  tags?: string[];       // user-defined tags
  networks?: string[];   // TV networks or streaming services
  productionCompanies?: string[]; // Movie production companies
}

export type CardContext =
  | 'home'
  | 'tab-watching'      // Your Shows / Currently Watching
  | 'tab-want'          // Want to Watch / Wishlist
  | 'tab-watched'       // Watched
  | 'tab-not'           // Not Interested
  | 'tab-foryou'        // For You / Discovery
  | 'search'
  | 'holiday';

export interface CardActionHandlers {
  onWant?: (item: MediaItem) => void;
  onWatching?: (item: MediaItem) => void;     // add to currently watching list
  onWatched?: (item: MediaItem) => void;
  onNotInterested?: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;
  onOpen?: (item: MediaItem) => void;        // open details
  onHolidayAdd?: (item: MediaItem) => void;   // open list picker
  onRatingChange?: (item: MediaItem, rating: number) => void; // user rating change
  onNotesEdit?: (item: MediaItem) => void;    // open notes editor
  onTagsEdit?: (item: MediaItem) => void;     // open tags editor
  onEpisodeTracking?: (item: MediaItem) => void; // open episode tracking modal
  onNotificationToggle?: (item: MediaItem) => void; // toggle notifications for show
  onSimpleReminder?: (item: MediaItem) => void; // set simple reminder for show
  onBloopersOpen?: (item: MediaItem) => void; // open bloopers modal (deprecated - use onGoofsOpen)
  onGoofsOpen?: (item: MediaItem) => void; // open goofs modal
  onExtrasOpen?: (item: MediaItem) => void; // open extras modal
}
