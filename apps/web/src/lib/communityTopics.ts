/**
 * Process: Community Topics Configuration
 * Purpose: Define curated list of topics for posts
 * Data Source: Configuration constants
 * Update Path: Modify TOPICS array to add/remove topics
 * Dependencies: Used by NewPostModal, CommunityPanel for topic selection
 */

export interface Topic {
  slug: string;
  name: string;
  description?: string;
}

/**
 * Curated list of topics available for posts
 * These are the primary topics users can select from
 */
export const TOPICS: Topic[] = [
  { slug: 'tv-shows', name: 'TV Shows', description: 'Discussion about TV series' },
  { slug: 'movies', name: 'Movies', description: 'Movie discussions and reviews' },
  { slug: 'horror', name: 'Horror', description: 'Horror genre content' },
  { slug: 'sci-fi', name: 'Sci-Fi', description: 'Science fiction discussions' },
  { slug: 'comedy', name: 'Comedy', description: 'Comedy shows and movies' },
  { slug: 'drama', name: 'Drama', description: 'Drama series and films' },
  { slug: 'gaming', name: 'Gaming', description: 'Video game discussions' },
  { slug: 'off-topic', name: 'Off-Topic', description: 'General discussions' },
];

/**
 * Get topic by slug
 */
export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find(t => t.slug === slug);
}

/**
 * Check if a slug is a valid topic
 */
export function isValidTopic(slug: string): boolean {
  return TOPICS.some(t => t.slug === slug);
}

/**
 * Extract topics from tagSlugs array
 * Returns only slugs that match valid topics
 */
export function extractTopicsFromTags(tagSlugs: string[]): string[] {
  return tagSlugs.filter(slug => isValidTopic(slug));
}

