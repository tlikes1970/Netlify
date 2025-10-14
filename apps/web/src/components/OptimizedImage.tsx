import React from 'react';
import { getOptimalImageSize } from '../hooks/useImageOptimization';

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
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  context = 'poster',
  fallbackSrc,
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  // Get optimized image URL
  const optimizedSrc = src ? getOptimalImageSize(src, context) : fallbackSrc || '';
  
  return (
    <div className={`relative ${className}`}>
      <img
        src={optimizedSrc}
        alt={alt}
        className="h-full w-full object-cover"
        loading={loading}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  );
}
