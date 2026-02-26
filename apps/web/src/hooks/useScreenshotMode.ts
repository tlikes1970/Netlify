/**
 * Hook to detect screenshot mode from URL query parameter
 * 
 * Returns true if URL contains ?screenshotMode (value doesn't matter)
 * Used to hide non-essential UI elements for app store screenshots
 * 
 * ⚠️ TEMPORARY: This is a temporary feature for screenshot generation.
 * Should be removed after screenshots are captured.
 */

import { useMemo } from 'react';

export function useScreenshotMode(): boolean {
  return useMemo(() => {
    // Safe for SSR - guard against window being undefined
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      // Returns true if screenshotMode param exists (value doesn't matter)
      return urlParams.has('screenshotMode');
    } catch {
      // If URLSearchParams fails, return false
      return false;
    }
  }, []); // Empty deps - only check on mount, URL changes will trigger re-render via navigation
}








