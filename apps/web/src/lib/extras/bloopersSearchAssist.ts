/**
 * Search Assist Fetcher for Bloopers
 * Provides curated, quality-filtered search results for bloopers and outtakes
 */

import { BloopersSearchResult } from './types';
import { EXTRAS_COPY } from '../copy/extras';

// Provider allowlist - official studio/network channels
const ALLOWLISTED_CHANNELS = [
  'Marvel Entertainment',
  'DC Comics',
  'Warner Bros. Pictures',
  'Sony Pictures Entertainment',
  'Universal Pictures',
  'Paramount Pictures',
  '20th Century Studios',
  'Disney',
  'Netflix',
  'HBO',
  'AMC Networks',
  'FX Networks',
  'Showtime',
  'Starz',
  'Apple TV',
  'Amazon Prime Video'
];

// Keywords for bloopers/outtakes content
const BLOOPERS_KEYWORDS = [
  'bloopers',
  'gag reel',
  'outtakes',
  'behind the scenes',
  'making of',
  'deleted scenes',
  'blooper reel',
  'funny moments',
  'mistakes',
  'goofs'
];

// Quality heuristics
const QUALITY_THRESHOLDS = {
  MIN_VIEWS: 1000,
  MAX_DURATION_MINUTES: 30,
  MIN_DURATION_SECONDS: 30,
  MAX_RESULTS: 5
};

export interface SearchAssistOptions {
  showTitle: string;
  showId: number;
  maxResults?: number;
  includeNonEmbeddable?: boolean;
}

export class BloopersSearchAssist {
  /**
   * Search for curated bloopers content
   */
  static async searchBloopers(options: SearchAssistOptions): Promise<BloopersSearchResult[]> {
    const { showTitle, maxResults = QUALITY_THRESHOLDS.MAX_RESULTS } = options;
    
    try {
      // Build search query with show title and bloopers keywords
      const searchQuery = this.buildSearchQuery(showTitle);
      
      // Fetch results from YouTube (primary source)
      const youtubeResults = await this.searchYouTube(searchQuery, maxResults);
      
      // Apply quality filters and ranking
      const filteredResults = this.filterAndRankResults(youtubeResults, showTitle);
      
      // Limit results
      return filteredResults.slice(0, maxResults);
      
    } catch (error) {
      console.warn('Bloopers search assist failed:', error);
      return [];
    }
  }

  /**
   * Build search query with show title and bloopers keywords
   */
  private static buildSearchQuery(showTitle: string): string {
    const keywords = BLOOPERS_KEYWORDS.slice(0, 3); // Use top 3 keywords
    return `${showTitle} ${keywords.join(' OR ')}`;
  }

  /**
   * Search YouTube for bloopers content
   * Note: This is a stub implementation - replace with actual YouTube API integration
   */
  private static async searchYouTube(query: string, _maxResults: number): Promise<BloopersSearchResult[]> {
    // TODO: Replace with actual YouTube Data API v3 integration
    // For now, return mock data for development/testing
    
    console.log(`[STUB] Searching YouTube for: "${query}"`);
    
    // Mock results for development
    return [
      {
        title: `${query} - Bloopers and Outtakes`,
        channel: 'Official Channel',
        url: 'https://youtube.com/watch?v=mock1',
        thumbUrl: '/placeholder-thumb.jpg',
        verified: true,
        embeddable: true,
        provider: 'youtube',
        reason: 'allowlisted',
        publishedAt: '2024-01-15T00:00:00Z',
        duration: '5:30',
        viewCount: 50000
      },
      {
        title: `${query} - Gag Reel Compilation`,
        channel: 'Verified Creator',
        url: 'https://youtube.com/watch?v=mock2',
        thumbUrl: '/placeholder-thumb.jpg',
        verified: true,
        embeddable: false,
        provider: 'youtube',
        reason: 'verified',
        publishedAt: '2024-01-10T00:00:00Z',
        duration: '8:15',
        viewCount: 25000
      }
    ];
  }

  /**
   * Filter and rank results based on quality heuristics
   */
  private static filterAndRankResults(
    results: BloopersSearchResult[], 
    showTitle: string
  ): BloopersSearchResult[] {
    return results
      .filter(result => this.passesQualityChecks(result, showTitle))
      .sort((a, b) => this.rankResult(a, b));
  }

  /**
   * Check if result passes quality filters
   */
  private static passesQualityChecks(result: BloopersSearchResult, showTitle: string): boolean {
    // Check title relevance
    if (!this.isTitleRelevant(result.title, showTitle)) {
      return false;
    }

    // Check view count threshold
    if (result.viewCount && result.viewCount < QUALITY_THRESHOLDS.MIN_VIEWS) {
      return false;
    }

    // Check duration limits
    if (result.duration && !this.isDurationValid(result.duration)) {
      return false;
    }

    // Check for spammy indicators
    if (this.hasSpammyIndicators(result.title)) {
      return false;
    }

    return true;
  }

  /**
   * Check if title is relevant to the show
   */
  private static isTitleRelevant(title: string, showTitle: string): boolean {
    const titleLower = title.toLowerCase();
    const showLower = showTitle.toLowerCase();
    
    // Must contain show title or significant portion
    const showWords = showLower.split(' ').filter(word => word.length > 2);
    const hasShowWords = showWords.some(word => titleLower.includes(word));
    
    // Must contain bloopers keywords
    const hasBloopersKeywords = BLOOPERS_KEYWORDS.some(keyword => 
      titleLower.includes(keyword.toLowerCase())
    );
    
    return hasShowWords && hasBloopersKeywords;
  }

  /**
   * Check if duration is within valid range
   */
  private static isDurationValid(duration: string): boolean {
    // Parse duration (format: "5:30" or "1:23:45")
    const parts = duration.split(':').map(Number);
    let totalSeconds = 0;
    
    if (parts.length === 2) {
      // MM:SS format
      totalSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS format
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return totalSeconds >= QUALITY_THRESHOLDS.MIN_DURATION_SECONDS && 
           totalSeconds <= QUALITY_THRESHOLDS.MAX_DURATION_MINUTES * 60;
  }

  /**
   * Check for spammy indicators in title
   */
  private static hasSpammyIndicators(title: string): boolean {
    const spammyPatterns = [
      /compilation/i,
      /best of/i,
      /top 10/i,
      /reaction/i,
      /review/i,
      /explained/i,
      /theory/i,
      /fan edit/i,
      /ai generated/i,
      /clickbait/i
    ];
    
    return spammyPatterns.some(pattern => pattern.test(title));
  }

  /**
   * Rank results by quality and relevance
   */
  private static rankResult(a: BloopersSearchResult, b: BloopersSearchResult): number {
    // Priority 1: Official/allowlisted channels
    const aOfficial = ALLOWLISTED_CHANNELS.some(channel => 
      a.channel.toLowerCase().includes(channel.toLowerCase())
    );
    const bOfficial = ALLOWLISTED_CHANNELS.some(channel => 
      b.channel.toLowerCase().includes(channel.toLowerCase())
    );
    
    if (aOfficial && !bOfficial) return -1;
    if (!aOfficial && bOfficial) return 1;
    
    // Priority 2: Verified channels
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    
    // Priority 3: Embeddable content
    if (a.embeddable && !b.embeddable) return -1;
    if (!a.embeddable && b.embeddable) return 1;
    
    // Priority 4: View count (higher is better)
    const aViews = a.viewCount || 0;
    const bViews = b.viewCount || 0;
    
    return bViews - aViews;
  }

  /**
   * Check if channel is allowlisted
   */
  static isAllowlistedChannel(channelName: string): boolean {
    return ALLOWLISTED_CHANNELS.some(channel => 
      channelName.toLowerCase().includes(channel.toLowerCase())
    );
  }

  /**
   * Get provider display name
   */
  static getProviderDisplayName(provider: BloopersSearchResult['provider']): string {
    return EXTRAS_COPY.searchAssist.providerPills[provider] || provider;
  }
}
