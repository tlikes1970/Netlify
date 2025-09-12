/**
 * TMDB Image Utilities
 * Provides consistent poster URL handling across the application
 */

/**
 * Get a properly formatted TMDB poster URL
 * @param {Object|string} itemOrPath - Item object with poster data or direct path string
 * @param {string} size - TMDB image size (default: 'w342')
 * @returns {string} - Complete poster URL or placeholder
 */
function getPosterUrl(itemOrPath, size = 'w342') {
  // Extract path from item object or use direct string
  const path = typeof itemOrPath === 'string' 
    ? itemOrPath 
    : (itemOrPath?.poster_src || itemOrPath?.poster_path || '');
  
  // Return placeholder if no path
  if (!path) return '/assets/img/poster-placeholder.png';
  
  // Return as-is if already a complete URL
  if (/^https?:\/\//i.test(path)) return path;
  
  // Build TMDB URL, removing leading slashes
  return `https://image.tmdb.org/t/p/${size}/${path.replace(/^\/+/, '')}`;
}

/**
 * Get a poster URL with lazy loading attributes
 * @param {Object|string} itemOrPath - Item object with poster data or direct path string
 * @param {string} size - TMDB image size (default: 'w200')
 * @returns {Object} - Object with src and data-src for lazy loading
 */
function getLazyPosterUrl(itemOrPath, size = 'w200') {
  const src = getPosterUrl(itemOrPath, size);
  return {
    src: src,
    'data-src': src
  };
}

/**
 * Validate that a poster URL is properly formatted
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
function isValidPosterUrl(url) {
  return url && (url.startsWith('http') || url.startsWith('/assets'));
}

/**
 * Get placeholder image URL
 * @returns {string} - Placeholder image URL
 */
function getPlaceholderUrl() {
  return '/assets/img/poster-placeholder.png';
}

// Make functions available globally
window.getPosterUrl = getPosterUrl;
window.getLazyPosterUrl = getLazyPosterUrl;
window.isValidPosterUrl = isValidPosterUrl;
window.getPlaceholderUrl = getPlaceholderUrl;
