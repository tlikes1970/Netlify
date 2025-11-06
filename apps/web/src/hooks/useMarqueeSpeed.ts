/**
 * Process: Marquee Speed Hook
 * Purpose: Calculate marquee animation duration based on content width
 * Data Source: ResizeObserver measurements
 * Update Path: Adjust base duration or scaling formula
 * Dependencies: ResizeObserver API
 */

import { useEffect, useRef, useState } from 'react';

interface MarqueeSpeedConfig {
  baseDuration?: number; // Base duration in seconds (default: 14s)
  viewportWidth?: number; // Viewport width for scaling (default: current viewport)
}

export function useMarqueeSpeed(
  contentRef: React.RefObject<HTMLElement>,
  config: MarqueeSpeedConfig = {}
): {
  distance: number;
  duration: number;
  viewportWidth: number;
} {
  const [distance, setDistance] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );
  const baseDuration = config.baseDuration ?? 14; // 25% faster than 30s
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const updateDimensions = () => {
      if (!contentRef.current) return;
      
      // Measure content width - get the first child span's width
      // The track contains two identical spans for seamless looping
      // We need to measure one span's width, not the total track width
      const firstSpan = contentRef.current.querySelector('span:first-child') as HTMLElement;
      const contentWidth = firstSpan ? firstSpan.scrollWidth : contentRef.current.scrollWidth / 2;
      const currentViewport = config.viewportWidth ?? window.innerWidth;
      
      setDistance(contentWidth);
      setViewportWidth(currentViewport);
      
      // Set CSS custom properties on the element
      contentRef.current.style.setProperty('--marquee-distance', `${contentWidth}px`);
      contentRef.current.style.setProperty('--viewport-width', `${currentViewport}px`);
      
      // Calculate duration: baseDuration * (distance / viewportWidth)
      // This scales linearly with content width
      const calculatedDuration = baseDuration * (contentWidth / currentViewport);
      contentRef.current.style.setProperty('--marquee-duration', `${Math.max(10, calculatedDuration)}s`);
    };

    // Initial measurement
    updateDimensions();

    // Set up ResizeObserver for content changes
    observerRef.current = new ResizeObserver(() => {
      updateDimensions();
    });
    observerRef.current.observe(contentRef.current);

    // Listen to window resize for viewport changes
    const handleResize = () => {
      updateDimensions();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [contentRef, baseDuration, config.viewportWidth]);

  const duration = distance > 0 && viewportWidth > 0
    ? baseDuration * (distance / viewportWidth)
    : baseDuration;

  return {
    distance,
    duration: Math.max(10, duration), // Minimum 10s
    viewportWidth,
  };
}


