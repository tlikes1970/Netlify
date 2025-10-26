import { useRef, useState, useCallback } from 'react';

type UseImageFallbackOpts = {
  maxRetries?: number;          // default 1
  placeholderSrc?: string;      // optional
};

export function useImageFallback(src: string, opts: UseImageFallbackOpts = {}) {
  const { maxRetries = 1, placeholderSrc } = opts;
  const [currentSrc, setCurrentSrc] = useState(src);
  const retriesRef = useRef(0);
  const failedRef = useRef(false);

  const onError = useCallback(() => {
    if (failedRef.current) return; // already at placeholder
    if (retriesRef.current < maxRetries) {
      retriesRef.current += 1;
      // Bust cache with a tiny query param
      const bust = src.includes('?') ? `${src}&r=${Date.now()}` : `${src}?r=${Date.now()}`;
      setCurrentSrc(bust);
      return;
    }
    if (placeholderSrc) {
      failedRef.current = true;
      setCurrentSrc(placeholderSrc);
    }
  }, [maxRetries, placeholderSrc, src]);

  return { currentSrc, onError };
}



