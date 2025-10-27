import { useState, useEffect } from 'react';
import { isMobileNow, onMobileChange } from '../lib/isMobile';

// Detect if device supports touch
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Detect if screen is mobile-sized
export const isMobileScreen = isMobileNow;

// Detect if device is desktop (no touch OR large screen)
export const isDesktop = () => {
  return !isTouchDevice() || !isMobileScreen();
};

// Hook to track if device is desktop (hydration-safe with ready flag)
export function useIsDesktop(bp = 1024) {
  const [ready, setReady] = useState(false);
  const [isDesktopDevice, setIsDesktopDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= bp;
  });

  useEffect(() => {
    setReady(true); // mark after mount to avoid SSR mismatch
    const handleResize = () => {
      setIsDesktopDevice(window.innerWidth >= bp);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bp]);

  return { ready, isDesktop: isDesktopDevice };
}

// Hook to track if device supports touch
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(isTouchDevice());

  useEffect(() => {
    const handleResize = () => {
      setIsTouch(isTouchDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isTouch;
}

// Hook to track if screen is mobile-sized
export function useIsMobileScreen() {
  const [isMobile, setIsMobile] = useState(isMobileNow());

  useEffect(() => {
    return onMobileChange(setIsMobile);
  }, []);

  return isMobile;
}
