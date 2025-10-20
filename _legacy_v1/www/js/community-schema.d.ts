export type CardType =
  | 'TRAILER_SPOTLIGHT'
  | 'TRIVIA'
  | 'POLL_RESULTS'
  | 'STAFF_PICK_REVIEW'
  | 'HOT_TAKE'
  | 'TOP_SHOW'
  | 'COMING_SOON';

export interface CTA {
  label: string;
  action: 'track' | 'vote' | 'open_url' | 'none';
  url?: string;
  ariaLabel?: string;
}

export interface Media {
  kind: 'video' | 'image' | 'none';
  src?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
}

export interface Stats {
  views?: number;
  votesTotal?: number;
  poll?: Array<{ label: string; percent: number }>;
  trackedCountToday?: number;
}

export interface Attribution {
  kind: 'staff' | 'example_user' | 'external_embed';
  displayName: string;
  avatarUrl?: string;
  watermark?: 'Seed' | 'Staff Pick' | 'Example' | null;
}

export interface Card {
  id: string;
  type: CardType;
  title: string;
  subtitle?: string;
  description?: string;
  media: Media;
  stats?: Stats;
  cta?: CTA;
  attribution: Attribution;
  tags?: string[];
  createdAtISO: string;
  expiresAtISO?: string;
  accessibility: { alt?: string; summary?: string };
}

export interface CommunitySeedPayload {
  version: string;
  rotation: Card[];
}
