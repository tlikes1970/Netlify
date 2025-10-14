import { useEffect } from 'react';

// Image preloading utility
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });
  
  return Promise.all(promises);
}

// Hook to preload images for a list of items
export function useImagePreload(items: Array<{ posterUrl?: string }>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const urls = items
      .map(item => item.posterUrl)
      .filter((url): url is string => Boolean(url))
      .slice(0, 10); // Limit to first 10 images to avoid overwhelming

    if (urls.length > 0) {
      preloadImages(urls)
        .then(() => {
          console.log(`[Preload] Successfully preloaded ${urls.length} images`);
        })
        .catch((error) => {
          console.warn('[Preload] Failed to preload some images:', error);
        });
    }
  }, [items, enabled]);
}

// Hook to preload images for visible items in a rail
export function useRailImagePreload(items: Array<{ posterUrl?: string }>) {
  useEffect(() => {
    if (items.length === 0) return;

    // Preload first 5 images immediately (likely visible)
    const immediateUrls = items
      .slice(0, 5)
      .map(item => item.posterUrl)
      .filter((url): url is string => Boolean(url));

    if (immediateUrls.length > 0) {
      preloadImages(immediateUrls)
        .then(() => {
          console.log(`[Rail Preload] Preloaded ${immediateUrls.length} immediate images`);
        })
        .catch((error) => {
          console.warn('[Rail Preload] Failed to preload immediate images:', error);
        });
    }

    // Preload remaining images after a delay
    const remainingUrls = items
      .slice(5, 15) // Next 10 images
      .map(item => item.posterUrl)
      .filter((url): url is string => Boolean(url));

    if (remainingUrls.length > 0) {
      const timeoutId = setTimeout(() => {
        preloadImages(remainingUrls)
          .then(() => {
            console.log(`[Rail Preload] Preloaded ${remainingUrls.length} remaining images`);
          })
          .catch((error) => {
            console.warn('[Rail Preload] Failed to preload remaining images:', error);
          });
      }, 1000); // 1 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [items]);
}
