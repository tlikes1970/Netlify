export type MediaType = 'movie' | 'tv' | 'person';

export interface MediaItem {
  id: string | number;
  mediaType: MediaType;
  title: string;         // movie title or TV name
  year?: string;         // release year
  posterUrl?: string;    // 2:3 image url; can be undefined
  voteAverage?: number;  // 0..10 (TMDB rating)
  userRating?: number;   // 0..5 (user's personal rating)
  runtimeMins?: number;  // optional
  synopsis?: string;     // plot overview from TMDB
  nextAirDate?: string | null; // ISO date for TV next episode (watching only)
  userNotes?: string;    // user's personal notes/review
  tags?: string[];       // user-defined tags
}

export type CardContext =
  | 'home'
  | 'tab-watching'      // Your Shows
  | 'tab-foryou'        // For You / Discovery
  | 'search'
  | 'holiday';

export interface CardActionHandlers {
  onWant?: (item: MediaItem) => void;
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
}
