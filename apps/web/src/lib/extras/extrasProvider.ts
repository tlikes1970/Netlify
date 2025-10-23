import { ExtrasVideo, ProviderResult, ExtrasProvider } from './types';
import { PROVIDER_CONFIG, BLOOPERS_KEYWORDS, EXTRAS_KEYWORDS } from './config';

/**
 * Process: Extras Provider
 * Purpose: Fetches and manages bloopers/extras metadata from allowed sources
 * Data Source: TMDB videos API, YouTube search API
 * Update Path: Manual admin review, nightly reverification
 * Dependencies: Settings pro flags, YouTube API, TMDB API
 */

class ExtrasProviderImpl implements ExtrasProvider {
  // private cache = new Map<number, ExtrasCache>(); // TODO: Implement caching

  async fetchBloopers(showId: number, showTitle: string): Promise<ProviderResult> {
    const videos: ExtrasVideo[] = [];
    
    // Fetch from TMDB first
    const tmdbVideos = await this.fetchTMDBVideos(showId, 'bloopers');
    videos.push(...tmdbVideos);

    // Then YouTube search
    const ytVideos = await this.searchYouTube(showTitle, BLOOPERS_KEYWORDS, 'bloopers');
    videos.push(...ytVideos);

    // If no content found, try fallback hierarchy
    if (videos.length === 0) {
      const fallbackVideos = await this.getFallbackBloopers(showId, showTitle);
      videos.push(...fallbackVideos);
    }

    return { videos, hasMore: false };
  }

  async fetchExtras(showId: number, showTitle: string): Promise<ProviderResult> {
    const videos: ExtrasVideo[] = [];
    
    // Fetch from TMDB first
    const tmdbVideos = await this.fetchTMDBVideos(showId, 'extras');
    videos.push(...tmdbVideos);

    // Then YouTube search
    const ytVideos = await this.searchYouTube(showTitle, EXTRAS_KEYWORDS, 'extras');
    videos.push(...ytVideos);

    // If no content found, try fallback hierarchy
    if (videos.length === 0) {
      const fallbackVideos = await this.getFallbackExtras(showId, showTitle);
      videos.push(...fallbackVideos);
    }

    return { videos, hasMore: false };
  }

  canEmbedVideo(video: ExtrasVideo): boolean {
    // Check if channel is allowlisted and video allows embedding
    return PROVIDER_CONFIG.youtube.allowlistChannels.includes(video.channelName as any) && 
           video.canEmbed;
  }

  async verifyVideo(_videoId: string): Promise<boolean> {
    // Stub for video verification
    return true;
  }

  private async fetchTMDBVideos(showId: number, category: 'bloopers' | 'extras'): Promise<ExtrasVideo[]> {
    try {
      const response = await fetch(
        `${PROVIDER_CONFIG.tmdb.baseUrl}/tv/${showId}/videos?api_key=${PROVIDER_CONFIG.tmdb.apiKey}`
      );
      const data = await response.json();
      
      return data.results
        .filter((video: any) => this.isRelevantVideo(video, category))
        .map((video: any) => this.mapTMDBVideo(video, showId, category));
    } catch (error) {
      console.error('TMDB videos fetch error:', error);
      return [];
    }
  }

  private async searchYouTube(query: string, keywords: string[], category: 'bloopers' | 'extras'): Promise<ExtrasVideo[]> {
    try {
      const searchQuery = `${query} ${keywords.join(' OR ')}`;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=${PROVIDER_CONFIG.youtube.maxResults}&key=${PROVIDER_CONFIG.youtube.apiKey}`
      );
      const data = await response.json();
      
      return data.items
        .filter((item: any) => this.isAllowlistedChannel(item.snippet.channelTitle))
        .map((item: any) => this.mapYouTubeVideo(item, category));
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  private isRelevantVideo(video: any, category: 'bloopers' | 'extras'): boolean {
    const title = video.name.toLowerCase();
    const keywords = category === 'bloopers' ? BLOOPERS_KEYWORDS : EXTRAS_KEYWORDS;
    return keywords.some(keyword => title.includes(keyword));
  }

  private isAllowlistedChannel(channelTitle: string): boolean {
    return PROVIDER_CONFIG.youtube.allowlistChannels.some(channel => 
      channelTitle.toLowerCase().includes(channel.toLowerCase())
    );
  }

  private mapTMDBVideo(video: any, showId: number, category: 'bloopers' | 'extras'): ExtrasVideo {
    return {
      id: `tmdb_${video.id}`,
      title: video.name,
      description: video.overview || '',
      thumbnail: `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`,
      duration: '',
      publishedAt: video.published_at || new Date().toISOString(),
      provider: 'youtube',
      channelName: 'TMDB Official',
      channelId: 'tmdb',
      embedUrl: `https://www.youtube.com/embed/${video.key}`,
      watchUrl: `https://www.youtube.com/watch?v=${video.key}`,
      canEmbed: true,
      category,
      showId,
      showTitle: '',
      status: 'pending',
      lastVerified: new Date().toISOString(),
    };
  }

  private mapYouTubeVideo(item: any, category: 'bloopers' | 'extras'): ExtrasVideo {
    return {
      id: `yt_${item.id.videoId}`,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      duration: '',
      publishedAt: item.snippet.publishedAt,
      provider: 'youtube',
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      canEmbed: true,
      category,
      showId: 0, // Will be set by caller
      showTitle: '',
      status: 'pending',
      lastVerified: new Date().toISOString(),
    };
  }

  // Fallback content hierarchy
  private async getFallbackBloopers(showId: number, showTitle: string): Promise<ExtrasVideo[]> {
    const videos: ExtrasVideo[] = [];

    try {
      // Tier 1: Try to get cast members and search for their bloopers
      const castMembers = await this.getShowCast(showId);
      for (const castMember of castMembers.slice(0, 3)) { // Limit to top 3 cast members
        const castVideos = await this.searchYouTube(castMember.name, BLOOPERS_KEYWORDS, 'bloopers');
        videos.push(...castVideos.map(video => ({ ...video, showId, showTitle })));
        if (videos.length >= 5) break; // Limit fallback results
      }

      // Tier 2: If still no results, get classic bloopers
      if (videos.length === 0) {
        const classicVideos = await this.getClassicBloopers();
        videos.push(...classicVideos.map(video => ({ ...video, showId, showTitle })));
      }

      // Tier 3: Generic bloopers as last resort
      if (videos.length === 0) {
        const genericVideos = await this.getGenericBloopers();
        videos.push(...genericVideos.map(video => ({ ...video, showId, showTitle })));
      }
    } catch (error) {
      console.error('Error fetching fallback bloopers:', error);
    }

    return videos.slice(0, 10); // Limit to 10 fallback videos
  }

  private async getFallbackExtras(showId: number, showTitle: string): Promise<ExtrasVideo[]> {
    const videos: ExtrasVideo[] = [];

    try {
      // For extras, we can be more lenient with cast-related content
      const castMembers = await this.getShowCast(showId);
      for (const castMember of castMembers.slice(0, 2)) {
        const castVideos = await this.searchYouTube(castMember.name, EXTRAS_KEYWORDS, 'extras');
        videos.push(...castVideos.map(video => ({ ...video, showId, showTitle })));
        if (videos.length >= 5) break;
      }

      // Generic extras content
      if (videos.length === 0) {
        const genericVideos = await this.getGenericExtras();
        videos.push(...genericVideos.map(video => ({ ...video, showId, showTitle })));
      }
    } catch (error) {
      console.error('Error fetching fallback extras:', error);
    }

    return videos.slice(0, 8); // Limit to 8 fallback videos
  }

  private async getShowCast(showId: number): Promise<{ name: string }[]> {
    try {
      const response = await fetch(
        `${PROVIDER_CONFIG.tmdb.baseUrl}/tv/${showId}/credits?api_key=${PROVIDER_CONFIG.tmdb.apiKey}`
      );
      const data = await response.json();
      return data.cast?.slice(0, 5).map((actor: any) => ({ name: actor.name })) || [];
    } catch (error) {
      console.error('Error fetching cast:', error);
      return [];
    }
  }

  private async getClassicBloopers(): Promise<ExtrasVideo[]> {
    // Curated list of classic bloopers videos
    const classicBloopers = [
      'Best TV Bloopers Ever',
      'Classic Comedy Outtakes',
      'Funniest Movie Bloopers',
      'Behind the Scenes Fails',
      'Best Comedy Bloopers'
    ];

    const videos: ExtrasVideo[] = [];
    for (const query of classicBloopers.slice(0, 3)) {
      try {
        const results = await this.searchYouTube(query, BLOOPERS_KEYWORDS, 'bloopers');
        videos.push(...results);
        if (videos.length >= 5) break;
      } catch (error) {
        console.error(`Error searching for ${query}:`, error);
      }
    }
    return videos;
  }

  private async getGenericBloopers(): Promise<ExtrasVideo[]> {
    const genericQueries = [
      'Funniest TV Moments',
      'Best Comedy Bloopers',
      'Classic Outtakes Collection'
    ];

    const videos: ExtrasVideo[] = [];
    for (const query of genericQueries) {
      try {
        const results = await this.searchYouTube(query, BLOOPERS_KEYWORDS, 'bloopers');
        videos.push(...results);
        if (videos.length >= 3) break;
      } catch (error) {
        console.error(`Error searching for ${query}:`, error);
      }
    }
    return videos;
  }

  private async getGenericExtras(): Promise<ExtrasVideo[]> {
    const genericQueries = [
      'Behind the Scenes',
      'Making of Documentaries',
      'Cast Interviews'
    ];

    const videos: ExtrasVideo[] = [];
    for (const query of genericQueries) {
      try {
        const results = await this.searchYouTube(query, EXTRAS_KEYWORDS, 'extras');
        videos.push(...results);
        if (videos.length >= 3) break;
      } catch (error) {
        console.error(`Error searching for ${query}:`, error);
      }
    }
    return videos;
  }
}

export const extrasProvider = new ExtrasProviderImpl();
