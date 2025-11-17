export interface ExtrasVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  provider: "youtube" | "vimeo" | "archive" | "official";
  channelName: string;
  channelId: string;
  embedUrl: string;
  watchUrl: string;
  canEmbed: boolean;
  category: "bloopers" | "extras";
  showId: number;
  showTitle: string;
  status: "pending" | "approved" | "rejected";
  lastVerified: string;
}

export interface BloopersSearchResult {
  title: string;
  channel: string;
  url: string;
  thumbUrl: string;
  verified: boolean;
  embeddable: boolean;
  provider: "youtube" | "vimeo" | "official" | "archive";
  reason?: string;
  publishedAt?: string;
  duration?: string;
  viewCount?: number;
}

export interface ExtrasCache {
  videos: ExtrasVideo[];
  lastUpdated: string;
  showId: number;
}

export type ProviderResultKind =
  | "success"
  | "config-error"
  | "api-error"
  | "no-content";

export interface ProviderResult {
  videos: ExtrasVideo[];
  hasMore: boolean;
  nextPageToken?: string;
  kind?: ProviderResultKind;
  error?: string;
  errorDetails?: {
    source: "tmdb" | "youtube" | "unknown";
    message: string;
  };
}

export interface ExtrasProvider {
  fetchBloopers(
    showId: number,
    showTitle: string,
    mediaType?: "movie" | "tv"
  ): Promise<ProviderResult>;
  fetchExtras(
    showId: number,
    showTitle: string,
    mediaType?: "movie" | "tv"
  ): Promise<ProviderResult>;
  canEmbedVideo(video: ExtrasVideo): boolean;
  verifyVideo(videoId: string): Promise<boolean>;
}
