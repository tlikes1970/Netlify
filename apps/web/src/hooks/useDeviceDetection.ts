import { useState, useEffect } from 'react';

// Detect if device supports touch
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Detect if screen is mobile-sized
export const isMobileScreen = () => {
  return window.innerWidth <= 768; // Mobile breakpoint
};

// Detect if device is desktop (no touch OR large screen)
export const isDesktop = () => {
  return !isTouchDevice() || !isMobileScreen();
};

// Hook to track if device is desktop
export function useIsDesktop() {
  const [isDesktopDevice, setIsDesktopDevice] = useState(isDesktop());

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopDevice(isDesktop());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktopDevice;
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
  const [isMobile, setIsMobile] = useState(isMobileScreen());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileScreen());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
