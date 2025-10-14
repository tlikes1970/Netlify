import { useState, useEffect } from 'react';
import { getOptimalImageSize } from './useImageOptimization';

// Progressive image loading hook
export function useProgressiveImage(
  src: string,
  context: 'poster' | 'backdrop' = 'poster',
  fallbackSrc?: string
) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!src) {
      setImageSrc(fallbackSrc || '');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    setIsLoaded(false);
    
    // Start with a small, fast-loading version
    const smallSrc = getOptimalImageSize(src, context, 1);
    setImageSrc(smallSrc);
    
    // Preload the optimal quality version
    const optimalSrc = getOptimalImageSize(src, context);
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(optimalSrc);
      setIsLoaded(true);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      }
    };
    
    img.src = optimalSrc;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, context, fallbackSrc]);
  
  return {
    src: imageSrc,
    isLoading,
    hasError,
    isLoaded
  };
}
