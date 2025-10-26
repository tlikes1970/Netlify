import { getOptimalImageSize } from '../hooks/useImageOptimization';
import { useImageFallback } from '../lib/useImageFallback';

// Optimized Image Component
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  context?: 'poster' | 'backdrop';
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  context = 'poster',
  fallbackSrc,
  loading = 'lazy',
  onLoad,
  onError,
  style
}: OptimizedImageProps) {
  // Get optimized image URL
  const optimizedSrc = src ? getOptimalImageSize(src, context) : fallbackSrc || '';
  
  // Use fallback hook for retry logic
  const { currentSrc, onError: handleError } = useImageFallback(optimizedSrc, { 
    maxRetries: 1, 
    placeholderSrc: fallbackSrc 
  });

  // Generate WebP version of the URL (only for external URLs, not local placeholders)
  const getWebPUrl = (url: string) => {
    if (!url) return '';
    
    // Don't convert local placeholder files to WebP
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return '';
    }
    
    // Only convert external URLs (like TMDB) to WebP
    return url.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, '.webp$2');
  };

  const webPSrc = getWebPUrl(currentSrc);
  
  // Combined error handler
  const handleImageError = () => {
    handleError();
    onError?.();
  };
  
  return (
    <div className={`relative ${className}`} style={style}>
      <picture>
        {/* WebP source for supported browsers */}
        {webPSrc && webPSrc !== currentSrc && (
          <source type="image/webp" srcSet={webPSrc} />
        )}
        {/* Fallback img element */}
        <img
          src={currentSrc}
          alt={alt}
          className="h-full w-full object-cover"
          loading={loading}
          decoding="async"
          onLoad={onLoad}
          onError={handleImageError}
        />
      </picture>
    </div>
  );
}
