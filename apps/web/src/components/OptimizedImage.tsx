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
  fetchpriority?: 'high' | 'low' | 'auto';
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
  fetchpriority = 'low',
  onLoad,
  onError,
  style
}: OptimizedImageProps) {
  // Get optimized image URL
  const optimizedSrc = src ? getOptimalImageSize(src, context) : fallbackSrc || '';
  
  // Use fallback hook for retry logic - start with placeholder if src is empty
  const initial = optimizedSrc || fallbackSrc || '';
  const { currentSrc, onError: handleError } = useImageFallback(initial, { 
    maxRetries: 1, 
    placeholderSrc: fallbackSrc 
  });

  // Combined error handler
  const handleImageError = () => {
    handleError();
    onError?.();
  };
  
  return (
    <div className={`relative ${className}`} style={style}>
      <img
        src={currentSrc}
        alt={alt}
        className="h-full w-full object-cover"
        loading={loading}
        decoding="async"
        fetchpriority={fetchpriority}
        onLoad={onLoad}
        onError={handleImageError}
      />
    </div>
  );
}
