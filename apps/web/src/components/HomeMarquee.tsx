import { useLayoutEffect, useState, useRef } from 'react';

interface HomeMarqueeProps {
  messages: string[];
  autoRotate?: boolean;
  speedPxPerSecond?: number;
}

/** One full right-to-left pass per message, preserving the historical 70px/s speed. */
export default function HomeMarquee({ messages, autoRotate = true, speedPxPerSecond = 70 }: HomeMarqueeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const index = currentIndex < messages.length ? currentIndex : 0;
  const message = messages[index];

  useLayoutEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;
    const measure = () => {
      const width = container.clientWidth;
      const textWidth = track.scrollWidth;
      track.style.setProperty('--ticker-start', `${width}px`);
      track.style.setProperty('--ticker-end', `${-textWidth}px`);
      track.style.setProperty('--ticker-duration', `${(width + textWidth) / Math.max(1, speedPxPerSecond)}s`);
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(track);
    return () => observer.disconnect();
  }, [message, speedPxPerSecond]);

  if (!messages.length) return null;
  return (
    <div className="px-4 flicklet-marquee-outer">
      <div ref={containerRef} className="flicklet-marquee-container">
        <div ref={trackRef} key={`${index}:${message}`} className={`flicklet-marquee-track${autoRotate ? ' flicklet-marquee-track--moving' : ''}`}
          style={{ fontSize: '0.875rem', animationIterationCount: messages.length === 1 ? 'infinite' : 1 }}
          onAnimationEnd={() => { if (autoRotate) setCurrentIndex((index + 1) % messages.length); }}>
          {message}
        </div>
      </div>
    </div>
  );
}
