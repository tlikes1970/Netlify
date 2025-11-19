/**
 * Process: Home Marquee
 * Purpose: Display horizontal scrolling text ticker with rotating messages between tabs and "Your Shows" section on Home page
 * Data Source: HOME_MARQUEE_MESSAGES config file
 * Update Path: Edit apps/web/src/config/homeMarqueeMessages.ts to add/change messages
 * Dependencies: JS-driven animation using requestAnimationFrame (no CSS keyframes)
 */

import { useState, useEffect, useRef } from 'react';

interface HomeMarqueeProps {
  messages: string[];
  autoRotate?: boolean;      // default true
  speedPxPerSecond?: number; // default ~70 px/s
}

export default function HomeMarquee({ 
  messages, 
  autoRotate = true, 
  speedPxPerSecond = 70 
}: HomeMarqueeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Reset index when messages change
  useEffect(() => {
    if (currentIndex >= messages.length) {
      setCurrentIndex(0);
    }
  }, [messages.length, currentIndex]);

  // JS-driven ticker animation using requestAnimationFrame
  // Measures actual pixel widths and animates deterministically
  useEffect(() => {
    if (!autoRotate || messages.length === 0) return;

    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    let frameId: number | null = null;
    let cancelled = false;

    // Wait for next frame to ensure DOM has settled after key change
    const startAnimation = () => {
      // Measure actual widths
      const containerWidth = container.getBoundingClientRect().width;
      const trackWidth = track.getBoundingClientRect().width;

      // Distance from just off-screen right to just off-screen left
      const startX = containerWidth;
      const endX = -trackWidth;
      const distance = startX - endX; // positive value

      // Calculate duration based on speed
      const durationMs = (distance / speedPxPerSecond) * 1000;

      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (cancelled) return;
        if (startTime === null) startTime = timestamp;

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Linear interpolation from startX to endX
        const x = startX + (endX - startX) * progress;
        track.style.transform = `translateX(${x}px)`;

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        } else {
          // One full pass completed; advance to next message
          if (messages.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % messages.length);
          } else {
            // Single message: restart the animation
            startTime = null;
            track.style.transform = `translateX(${startX}px)`;
            frameId = requestAnimationFrame(animate);
          }
        }
      };

      // Initialize position before starting
      track.style.transform = `translateX(${startX}px)`;
      frameId = requestAnimationFrame(animate);
    };

    // Start animation on next frame to ensure layout is complete
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(startAnimation);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [autoRotate, currentIndex, messages.length, speedPxPerSecond]);

  // Don't render if no messages
  if (messages.length === 0) {
    return null;
  }

  const currentMessage = messages[currentIndex];

  return (
    <div className="px-4 flicklet-marquee-outer">
      <div ref={containerRef} className="flicklet-marquee-container">
        <div
          ref={trackRef}
          key={currentIndex}
          className="flicklet-marquee-track"
          style={{ 
            color: "var(--text)", 
            fontSize: "0.875rem"
          }}
        >
          {currentMessage}
        </div>
      </div>
    </div>
  );
}


