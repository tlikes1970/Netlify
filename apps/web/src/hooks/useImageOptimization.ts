// TMDB Image Size Constants
export const TMDB_IMAGE_SIZES = {
  // Poster sizes (2:3 aspect ratio)
  POSTER: {
    SMALL: 'w92',    // 92px wide
    MEDIUM: 'w154',  // 154px wide  
    LARGE: 'w185',   // 185px wide
    XLARGE: 'w342',  // 342px wide (current default)
    XXLARGE: 'w500', // 500px wide
    ORIGINAL: 'original'
  },
  // Backdrop sizes (16:9 aspect ratio)
  BACKDROP: {
    SMALL: 'w300',
    MEDIUM: 'w780',
    LARGE: 'w1280',
    ORIGINAL: 'original'
  }
} as const;

// Device-based image size selection
export function getOptimalImageSize(
  baseUrl: string,
  context: 'poster' | 'backdrop' = 'poster',
  devicePixelRatio: number = window.devicePixelRatio || 1
): string {
  if (!baseUrl) return '';
  
  // If it's already a TMDB URL, extract the path properly
  let path = '';
  if (baseUrl.includes('image.tmdb.org')) {
    // Extract path from full TMDB URL
    const urlParts = baseUrl.split('/');
    path = urlParts[urlParts.length - 1];
  } else {
    // If it's just a path, use it directly
    path = baseUrl.startsWith('/') ? baseUrl.substring(1) : baseUrl;
  }
  
  if (!path) return baseUrl;
  
  // Determine optimal size based on context and device
  let optimalSize: string;
  
  if (context === 'poster') {
    // For posters, prioritize quality over file size on high-DPI screens
    // Use responsive card width based on screen size
    const isMobile = window.innerWidth <= 768;
    const cardWidth = isMobile ? 120 : 154; // Responsive card width
    const requiredWidth = cardWidth * devicePixelRatio;
    
    // Use larger sizes for high-DPI screens to maintain quality
    if (devicePixelRatio >= 2) {
      // High-DPI screens (iPhone, Retina displays) - use larger images
      if (requiredWidth <= 185) optimalSize = TMDB_IMAGE_SIZES.POSTER.LARGE;
      else if (requiredWidth <= 342) optimalSize = TMDB_IMAGE_SIZES.POSTER.XLARGE;
      else if (requiredWidth <= 500) optimalSize = TMDB_IMAGE_SIZES.POSTER.XXLARGE;
      else optimalSize = TMDB_IMAGE_SIZES.POSTER.ORIGINAL;
    } else {
      // Standard DPI screens - use smaller images for performance
      if (requiredWidth <= 92) optimalSize = TMDB_IMAGE_SIZES.POSTER.SMALL;
      else if (requiredWidth <= 154) optimalSize = TMDB_IMAGE_SIZES.POSTER.MEDIUM;
      else if (requiredWidth <= 185) optimalSize = TMDB_IMAGE_SIZES.POSTER.LARGE;
      else optimalSize = TMDB_IMAGE_SIZES.POSTER.XLARGE;
    }
  } else {
    // For backdrops, use medium size for most cases
    optimalSize = TMDB_IMAGE_SIZES.BACKDROP.MEDIUM;
  }
  
  // Construct optimized URL with proper path handling
  return `https://image.tmdb.org/t/p/${optimalSize}/${path}`;
}


// Image optimization utilities
export const ImageUtils = {
  // Generate responsive image srcset
  generateSrcSet: (baseUrl: string, context: 'poster' | 'backdrop' = 'poster') => {
    if (!baseUrl) return '';
    
    const urlParts = baseUrl.split('/');
    const path = urlParts[urlParts.length - 1];
    
    if (!path) return baseUrl;
    
    const sizes = context === 'poster' 
      ? Object.values(TMDB_IMAGE_SIZES.POSTER)
      : Object.values(TMDB_IMAGE_SIZES.BACKDROP);
    
    return sizes
      .map(size => `https://image.tmdb.org/t/p/${size}${path} ${size.replace('w', '')}w`)
      .join(', ');
  },
  
  // Get WebP version if supported
  getWebPUrl: (baseUrl: string, size: string = 'w342') => {
    if (!baseUrl) return '';
    
    const urlParts = baseUrl.split('/');
    const path = urlParts[urlParts.length - 1];
    
    if (!path) return baseUrl;
    
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },
  
  // Check if WebP is supported
  supportsWebP: (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },
  
  // Lazy loading intersection observer
  createLazyObserver: (callback: (entries: IntersectionObserverEntry[]) => void) => {
    return new IntersectionObserver(callback, {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.1
    });
  }
};