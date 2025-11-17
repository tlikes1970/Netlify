import { ExtrasVideo, ProviderResult, ExtrasProvider } from "./types";
import { PROVIDER_CONFIG, BLOOPERS_KEYWORDS, EXTRAS_KEYWORDS } from "./config";

/**
 * Process: Extras Provider
 * Purpose: Fetches and manages bloopers/extras metadata from allowed sources
 * Data Source: TMDB videos API, YouTube search API
 * Update Path: Manual admin review, nightly reverification
 * Dependencies: Settings pro flags, YouTube API, TMDB API
 */

class ExtrasProviderImpl implements ExtrasProvider {
  // private cache = new Map<number, ExtrasCache>(); // TODO: Implement caching

  /**
   * Check if API keys are configured
   */
  private checkApiKeys(): { tmdb: boolean; youtube: boolean } {
    const tmdbKey = PROVIDER_CONFIG.tmdb.apiKey;
    const youtubeKey = PROVIDER_CONFIG.youtube.apiKey;

    const tmdbValid = tmdbKey && tmdbKey.trim().length > 0;
    const youtubeValid = youtubeKey && youtubeKey.trim().length > 0;

    if (import.meta.env.DEV) {
      if (!tmdbValid) {
        console.warn(
          "⚠️ VITE_TMDB_KEY is missing or empty. TMDB API calls will fail."
        );
      }
      if (!youtubeValid) {
        console.warn(
          "⚠️ VITE_YOUTUBE_API_KEY is missing or empty. YouTube API calls will fail."
        );
      }
    }

    return { tmdb: tmdbValid, youtube: youtubeValid };
  }

  async fetchBloopers(
    showId: number,
    showTitle: string,
    _mediaType: "movie" | "tv" = "tv"
  ): Promise<ProviderResult> {
    // Note: Bloopers functionality is deprecated in favor of Goofs
    // This method is kept for backward compatibility
    // For now, return empty result - bloopers should use Goofs feature instead
    return {
      videos: [],
      hasMore: false,
      kind: "no-content",
    };
  }

  async fetchExtras(
    showId: number,
    showTitle: string,
    mediaType: "movie" | "tv" = "tv"
  ): Promise<ProviderResult> {
    // Check API keys first
    const apiKeys = this.checkApiKeys();
    if (!apiKeys.tmdb && !apiKeys.youtube) {
      return {
        videos: [],
        hasMore: false,
        kind: "config-error",
        error: "API keys not configured",
        errorDetails: {
          source: "unknown",
          message:
            "TMDB and YouTube API keys are missing. Please configure VITE_TMDB_KEY and VITE_YOUTUBE_API_KEY.",
        },
      };
    }

    const videos: ExtrasVideo[] = [];
    const errors: Array<{
      source: "tmdb" | "youtube" | "unknown";
      message: string;
    }> = [];

    // Fetch from TMDB first (if key available)
    if (apiKeys.tmdb) {
      try {
        if (import.meta.env.DEV) {
          console.log(
            `🔍 Fetching TMDB extras for ${showTitle} (ID: ${showId}, Type: ${mediaType})`
          );
        }
        const tmdbResult = await this.fetchTMDBVideos(
          showId,
          "extras",
          mediaType
        );
        if (tmdbResult.kind === "success") {
          if (import.meta.env.DEV) {
            console.log(`✅ TMDB returned ${tmdbResult.videos.length} videos`);
          }
          videos.push(...tmdbResult.videos);
        } else if (tmdbResult.kind === "api-error" && tmdbResult.errorDetails) {
          if (import.meta.env.DEV) {
            console.error("❌ TMDB API error:", tmdbResult.errorDetails);
          }
          errors.push(tmdbResult.errorDetails);
        } else if (tmdbResult.kind === "no-content") {
          if (import.meta.env.DEV) {
            console.log(
              "ℹ️ TMDB returned no content (no videos found or all filtered out)"
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown TMDB error";
        errors.push({ source: "tmdb", message: errorMessage });
        if (import.meta.env.DEV) {
          console.error("❌ TMDB fetch failed:", error);
        }
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn("⚠️ TMDB API key not available, skipping TMDB fetch");
      }
    }

    // Then YouTube search (if key available)
    if (apiKeys.youtube) {
      try {
        if (import.meta.env.DEV) {
          console.log(`🔍 Searching YouTube for ${showTitle} extras`);
        }
        const ytResult = await this.searchYouTube(
          showTitle,
          EXTRAS_KEYWORDS,
          "extras"
        );
        if (ytResult.kind === "success") {
          if (import.meta.env.DEV) {
            console.log(`✅ YouTube returned ${ytResult.videos.length} videos`);
          }
          videos.push(...ytResult.videos);
        } else if (ytResult.kind === "api-error" && ytResult.errorDetails) {
          if (import.meta.env.DEV) {
            console.error("❌ YouTube API error:", ytResult.errorDetails);
          }
          errors.push(ytResult.errorDetails);
        } else if (ytResult.kind === "no-content") {
          if (import.meta.env.DEV) {
            console.log(
              "ℹ️ YouTube returned no content (no videos found or all filtered out)"
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown YouTube error";
        errors.push({ source: "youtube", message: errorMessage });
        if (import.meta.env.DEV) {
          console.error("❌ YouTube search failed:", error);
        }
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn(
          "⚠️ YouTube API key not available, skipping YouTube search"
        );
      }
    }

    // If we have videos, return success
    if (videos.length > 0) {
      if (import.meta.env.DEV) {
        console.log(`✅ Total: ${videos.length} videos found`);
      }
      return { videos, hasMore: false, kind: "success" };
    }

    // If we have errors but no videos, return api-error
    if (errors.length > 0) {
      if (import.meta.env.DEV) {
        console.error("❌ Final result: API errors occurred:", errors);
      }
      return {
        videos: [],
        hasMore: false,
        kind: "api-error",
        error: "Failed to fetch extras",
        errorDetails: errors[0], // Return first error for simplicity
      };
    }

    // If no content found and no errors, try fallback hierarchy
    try {
      const fallbackVideos = await this.getFallbackExtras(
        showId,
        showTitle,
        mediaType
      );
      if (fallbackVideos.length > 0) {
        return { videos: fallbackVideos, hasMore: false, kind: "success" };
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Fallback extras failed:", error);
      }
    }

    // No content found
    return { videos: [], hasMore: false, kind: "no-content" };
  }

  canEmbedVideo(video: ExtrasVideo): boolean {
    // Check if channel is allowlisted and video allows embedding
    return (
      PROVIDER_CONFIG.youtube.allowlistChannels.includes(
        video.channelName as any
      ) && video.canEmbed
    );
  }

  async verifyVideo(_videoId: string): Promise<boolean> {
    // Stub for video verification
    return true;
  }

  private async fetchTMDBVideos(
    showId: number,
    category: "bloopers" | "extras",
    mediaType: "movie" | "tv" = "tv"
  ): Promise<ProviderResult> {
    try {
      const endpoint =
        mediaType === "movie"
          ? `${PROVIDER_CONFIG.tmdb.baseUrl}/movie/${showId}/videos?api_key=${PROVIDER_CONFIG.tmdb.apiKey}`
          : `${PROVIDER_CONFIG.tmdb.baseUrl}/tv/${showId}/videos?api_key=${PROVIDER_CONFIG.tmdb.apiKey}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          videos: [],
          hasMore: false,
          kind: "api-error",
          error: `TMDB API error: ${response.status}`,
          errorDetails: {
            source: "tmdb",
            message: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
          },
        };
      }

      const data = await response.json();

      if (!data.results || !Array.isArray(data.results)) {
        if (import.meta.env.DEV) {
          console.log("ℹ️ TMDB response has no results array:", data);
        }
        return {
          videos: [],
          hasMore: false,
          kind: "no-content",
        };
      }

      if (import.meta.env.DEV) {
        console.log(`📊 TMDB returned ${data.results.length} total videos`);
        console.log(
          "📋 Video types:",
          data.results.map((v: any) => ({ name: v.name, type: v.type }))
        );
      }

      const filteredVideos = data.results
        .filter((video: any) => this.isRelevantVideo(video, category))
        .map((video: any) => this.mapTMDBVideo(video, showId, category));

      if (import.meta.env.DEV) {
        console.log(
          `🎬 After filtering: ${filteredVideos.length} videos remain`
        );
      }

      return {
        videos: filteredVideos,
        hasMore: false,
        kind: filteredVideos.length > 0 ? "success" : "no-content",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (import.meta.env.DEV) {
        console.error("TMDB videos fetch error:", error);
      }
      return {
        videos: [],
        hasMore: false,
        kind: "api-error",
        error: "TMDB fetch failed",
        errorDetails: {
          source: "tmdb",
          message: errorMessage,
        },
      };
    }
  }

  private async searchYouTube(
    query: string,
    keywords: string[],
    category: "bloopers" | "extras"
  ): Promise<ProviderResult> {
    try {
      const searchQuery = `${query} ${keywords.join(" OR ")}`;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=${PROVIDER_CONFIG.youtube.maxResults}&key=${PROVIDER_CONFIG.youtube.apiKey}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          videos: [],
          hasMore: false,
          kind: "api-error",
          error: `YouTube API error: ${response.status}`,
          errorDetails: {
            source: "youtube",
            message: `HTTP ${response.status}: ${errorData.error?.message || "Unknown error"}`,
          },
        };
      }

      const data = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        return {
          videos: [],
          hasMore: false,
          kind: "no-content",
        };
      }

      const filteredVideos = data.items
        .filter((item: any) => this.isRelevantYouTubeVideo(item, category))
        .map((item: any) => this.mapYouTubeVideo(item, category));

      return {
        videos: filteredVideos,
        hasMore: false,
        kind: filteredVideos.length > 0 ? "success" : "no-content",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (import.meta.env.DEV) {
        console.error("YouTube search error:", error);
      }
      return {
        videos: [],
        hasMore: false,
        kind: "api-error",
        error: "YouTube search failed",
        errorDetails: {
          source: "youtube",
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Centralized filtering logic for TMDB videos
   * Softened to include more official content types
   */
  private isRelevantVideo(
    video: any,
    category: "bloopers" | "extras"
  ): boolean {
    const title = video.name.toLowerCase();
    const type = video.type?.toLowerCase() || "";

    if (category === "extras") {
      // For extras, accept: featurettes, behind the scenes, making of, interviews, deleted scenes, trailers, teasers
      const extrasPatterns = [
        "featurette",
        "behind the scenes",
        "making of",
        "interview",
        "deleted scene",
        "trailer",
        "teaser",
        "promo",
        "promotional",
        "clip",
        "scene",
        "exclusive",
        "cast",
        "director",
        "writer",
        "producer",
        "commentary",
        "blu-ray",
        "dvd",
      ];

      // Check title
      if (extrasPatterns.some((pattern) => title.includes(pattern))) {
        return true;
      }

      // Check TMDB video type field if available
      if (
        type &&
        [
          "featurette",
          "behind_the_scenes",
          "clip",
          "trailer",
          "teaser",
        ].includes(type)
      ) {
        return true;
      }

      return false;
    } else {
      // For bloopers, use existing keywords
      return BLOOPERS_KEYWORDS.some((keyword) => title.includes(keyword));
    }
  }

  /**
   * Centralized filtering logic for YouTube videos
   * Softened to allow more official channels while still filtering spam
   */
  private isRelevantYouTubeVideo(
    item: any,
    category: "bloopers" | "extras"
  ): boolean {
    const channelTitle = item.snippet?.channelTitle || "";
    const videoTitle = item.snippet?.title?.toLowerCase() || "";

    // Always allow allowlisted channels
    if (this.isAllowlistedChannel(channelTitle)) {
      return true;
    }

    // For extras, be more lenient - allow verified/official-looking channels
    if (category === "extras") {
      // Check for official indicators in channel name
      const officialIndicators = [
        "official",
        "official channel",
        "studios",
        "pictures",
        "entertainment",
        "network",
        "tv",
        "films",
        "cinema",
        "movies",
      ];

      const hasOfficialIndicator = officialIndicators.some((indicator) =>
        channelTitle.toLowerCase().includes(indicator)
      );

      // Check video title relevance
      const extrasKeywords = EXTRAS_KEYWORDS;
      const hasRelevantTitle = extrasKeywords.some((keyword) =>
        videoTitle.includes(keyword)
      );

      // Allow if both conditions met (official-looking channel + relevant title)
      if (hasOfficialIndicator && hasRelevantTitle) {
        return true;
      }
    }

    // Filter out obvious spam
    const spamIndicators = [
      "reaction",
      "review",
      "explained",
      "theory",
      "fan edit",
      "ai generated",
      "clickbait",
      "compilation",
      "best of",
      "top 10",
    ];

    if (spamIndicators.some((indicator) => videoTitle.includes(indicator))) {
      return false;
    }

    return false; // Default: filter out if not explicitly allowed
  }

  private isAllowlistedChannel(channelTitle: string): boolean {
    return PROVIDER_CONFIG.youtube.allowlistChannels.some((channel) =>
      channelTitle.toLowerCase().includes(channel.toLowerCase())
    );
  }

  private mapTMDBVideo(
    video: any,
    showId: number,
    category: "bloopers" | "extras"
  ): ExtrasVideo {
    return {
      id: `tmdb_${video.id}`,
      title: video.name,
      description: video.overview || "",
      thumbnail: `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`,
      duration: "",
      publishedAt: video.published_at || new Date().toISOString(),
      provider: "youtube",
      channelName: "TMDB Official",
      channelId: "tmdb",
      embedUrl: `https://www.youtube.com/embed/${video.key}`,
      watchUrl: `https://www.youtube.com/watch?v=${video.key}`,
      canEmbed: true,
      category,
      showId,
      showTitle: "",
      status: "pending",
      lastVerified: new Date().toISOString(),
    };
  }

  private mapYouTubeVideo(
    item: any,
    category: "bloopers" | "extras"
  ): ExtrasVideo {
    return {
      id: `yt_${item.id.videoId}`,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.default.url,
      duration: "",
      publishedAt: item.snippet.publishedAt,
      provider: "youtube",
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      canEmbed: true,
      category,
      showId: 0, // Will be set by caller
      showTitle: "",
      status: "pending",
      lastVerified: new Date().toISOString(),
    };
  }

  // Fallback content hierarchy (deprecated - bloopers now use Goofs)
  private async getFallbackBloopers(
    showId: number,
    showTitle: string,
    mediaType: "movie" | "tv" = "tv"
  ): Promise<ExtrasVideo[]> {
    const videos: ExtrasVideo[] = [];

    try {
      const apiKeys = this.checkApiKeys();

      // Tier 1: Try to get cast members and search for their bloopers
      if (apiKeys.tmdb) {
        const castMembers = await this.getShowCast(showId, mediaType);
        for (const castMember of castMembers.slice(0, 3)) {
          // Limit to top 3 cast members
          const castResult = await this.searchYouTube(
            castMember.name,
            BLOOPERS_KEYWORDS,
            "bloopers"
          );
          if (castResult.kind === "success") {
            videos.push(
              ...castResult.videos.map((video: ExtrasVideo) => ({
                ...video,
                showId,
                showTitle,
              }))
            );
            if (videos.length >= 5) break; // Limit fallback results
          }
        }
      }

      // Tier 2: If still no results, get classic bloopers
      if (videos.length === 0 && apiKeys.youtube) {
        const classicResult = await this.getClassicBloopers();
        if (classicResult.kind === "success") {
          videos.push(
            ...classicResult.videos.map((video: ExtrasVideo) => ({
              ...video,
              showId,
              showTitle,
            }))
          );
        }
      }

      // Tier 3: Generic bloopers as last resort
      if (videos.length === 0 && apiKeys.youtube) {
        const genericResult = await this.getGenericBloopers();
        if (genericResult.kind === "success") {
          videos.push(
            ...genericResult.videos.map((video: ExtrasVideo) => ({
              ...video,
              showId,
              showTitle,
            }))
          );
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching fallback bloopers:", error);
      }
    }

    return videos.slice(0, 10); // Limit to 10 fallback videos
  }

  private async getFallbackExtras(
    showId: number,
    showTitle: string,
    mediaType: "movie" | "tv" = "tv"
  ): Promise<ExtrasVideo[]> {
    const videos: ExtrasVideo[] = [];

    try {
      const apiKeys = this.checkApiKeys();

      // For extras, we can be more lenient with cast-related content
      if (apiKeys.tmdb) {
        const castMembers = await this.getShowCast(showId, mediaType);
        for (const castMember of castMembers.slice(0, 2)) {
          const castResult = await this.searchYouTube(
            castMember.name,
            EXTRAS_KEYWORDS,
            "extras"
          );
          if (castResult.kind === "success") {
            videos.push(
              ...castResult.videos.map((video) => ({
                ...video,
                showId,
                showTitle,
              }))
            );
            if (videos.length >= 5) break;
          }
        }
      }

      // Generic extras content
      if (videos.length === 0 && apiKeys.youtube) {
        const genericResult = await this.getGenericExtras();
        if (genericResult.kind === "success") {
          videos.push(
            ...genericResult.videos.map((video) => ({
              ...video,
              showId,
              showTitle,
            }))
          );
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching fallback extras:", error);
      }
    }

    return videos.slice(0, 8); // Limit to 8 fallback videos
  }

  private async getShowCast(
    showId: number,
    mediaType: "movie" | "tv" = "tv"
  ): Promise<{ name: string }[]> {
    try {
      const endpoint =
        mediaType === "movie"
          ? `${PROVIDER_CONFIG.tmdb.baseUrl}/movie/${showId}/credits?api_key=${PROVIDER_CONFIG.tmdb.apiKey}`
          : `${PROVIDER_CONFIG.tmdb.baseUrl}/tv/${showId}/credits?api_key=${PROVIDER_CONFIG.tmdb.apiKey}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (
        data.cast?.slice(0, 5).map((actor: any) => ({ name: actor.name })) || []
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching cast:", error);
      }
      return [];
    }
  }

  private async getClassicBloopers(): Promise<ProviderResult> {
    // Curated list of classic bloopers videos
    const classicBloopers = [
      "Best TV Bloopers Ever",
      "Classic Comedy Outtakes",
      "Funniest Movie Bloopers",
      "Behind the Scenes Fails",
      "Best Comedy Bloopers",
    ];

    const videos: ExtrasVideo[] = [];
    for (const query of classicBloopers.slice(0, 3)) {
      try {
        const result = await this.searchYouTube(
          query,
          BLOOPERS_KEYWORDS,
          "bloopers"
        );
        if (result.kind === "success") {
          videos.push(...result.videos);
          if (videos.length >= 5) break;
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Error searching for ${query}:`, error);
        }
      }
    }

    return {
      videos,
      hasMore: false,
      kind: videos.length > 0 ? "success" : "no-content",
    };
  }

  private async getGenericBloopers(): Promise<ProviderResult> {
    const genericQueries = [
      "Funniest TV Moments",
      "Best Comedy Bloopers",
      "Classic Outtakes Collection",
    ];

    const videos: ExtrasVideo[] = [];
    for (const query of genericQueries) {
      try {
        const result = await this.searchYouTube(
          query,
          BLOOPERS_KEYWORDS,
          "bloopers"
        );
        if (result.kind === "success") {
          videos.push(...result.videos);
          if (videos.length >= 3) break;
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Error searching for ${query}:`, error);
        }
      }
    }

    return {
      videos,
      hasMore: false,
      kind: videos.length > 0 ? "success" : "no-content",
    };
  }

  private async getGenericExtras(): Promise<ProviderResult> {
    const genericQueries = [
      "Behind the Scenes",
      "Making of Documentaries",
      "Cast Interviews",
    ];

    const videos: ExtrasVideo[] = [];
    for (const query of genericQueries) {
      try {
        const result = await this.searchYouTube(
          query,
          EXTRAS_KEYWORDS,
          "extras"
        );
        if (result.kind === "success") {
          videos.push(...result.videos);
          if (videos.length >= 3) break;
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Error searching for ${query}:`, error);
        }
      }
    }

    return {
      videos,
      hasMore: false,
      kind: videos.length > 0 ? "success" : "no-content",
    };
  }
}

export const extrasProvider = new ExtrasProviderImpl();
