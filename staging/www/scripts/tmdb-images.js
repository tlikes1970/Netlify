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

/**
 * Generate responsive srcset for TMDB poster images
 * @param {string} path - TMDB poster path (with leading slash)
 * @returns {string} - Complete srcset string with multiple sizes
 */
function tmdbSrcset(path) {
  if (!path) return '';
  
  const base = 'https://image.tmdb.org/t/p';
  const cleanPath = path || ''; // keep the leading '/'
  
  const joinTMDB = (size, p) => `${base}/w${size}${p}`;
  
  // pick responsive sources
  const s200 = joinTMDB(200, cleanPath);
  const s300 = joinTMDB(300, cleanPath);
  const s342 = joinTMDB(342, cleanPath);
  const s500 = joinTMDB(500, cleanPath);
  
  return `${s200} 200w, ${s300} 300w, ${s342} 342w, ${s500} 500w`;
}

/**
 * Create a responsive TMDB poster image element with proper error handling
 * @param {string} poster_path - TMDB poster path (with leading slash)
 * @param {string} title - Alt text for the image
 * @returns {HTMLImageElement} - Configured img element
 */
function createResponsivePosterImg(poster_path, title = '') {
  if (!poster_path) {
    const img = document.createElement('img');
    img.alt = title || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = '/assets/img/poster-placeholder.png';
    return img;
  }
  
  const base = 'https://image.tmdb.org/t/p';
  const path = poster_path || ''; // keep the leading '/'
  
  const joinTMDB = (size, p) => `${base}/w${size}${p}`;
  
  // pick responsive sources
  const s200 = joinTMDB(200, path);
  const s300 = joinTMDB(300, path);
  const s500 = joinTMDB(500, path);
  
  const img = document.createElement('img');
  img.alt = title || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  
  // set responsive attrs first
  img.setAttribute('srcset', `${s200} 200w, ${s300} 300w, ${s500} 500w`);
  img.setAttribute('sizes', '(max-width: 480px) 148px, 200px');
  
  // give a real fallback src so it paints even if srcset parsing fails
  img.src = s300;
  
  // graceful fallback if *network* fails
  img.onerror = () => {
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = '/assets/img/poster-placeholder.png';
  };
  
  return img;
}

// Make functions available globally
window.getPosterUrl = getPosterUrl;
window.getLazyPosterUrl = getLazyPosterUrl;
window.isValidPosterUrl = isValidPosterUrl;
window.getPlaceholderUrl = getPlaceholderUrl;
window.tmdbSrcset = tmdbSrcset;
window.createResponsivePosterImg = createResponsivePosterImg;
