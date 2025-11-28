/**
 * WatchingListWithBackdrop - Wrapper component for Currently Watching list with cinematic backdrop
 * 
 * Adds a blurred poster backdrop behind the list content that changes based on hovered card.
 * Desktop-only effect.
 * 
 * Behavior:
 * - On load: defaults to first visible card's poster
 * - On hover/focus: updates to that card's poster
 * - On mouse leave: keeps the last active poster (never goes blank)
 */

import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { useIsDesktop } from '../hooks/useDeviceDetection';

export interface BackdropCallbacks {
  onBackdropActivate: (posterUrl: string) => void;
}

const BackdropContext = createContext<BackdropCallbacks | null>(null);

export function useBackdropCallbacks(): BackdropCallbacks | null {
  return useContext(BackdropContext);
}

interface WatchingListWithBackdropProps {
  children: React.ReactNode;
  firstCardPosterUrl?: string | null; // Poster URL of the first visible card
}

export function WatchingListWithBackdrop({
  children,
  firstCardPosterUrl,
}: WatchingListWithBackdropProps) {
  const isDesktop = useIsDesktop();
  const [activeBackdropPosterUrl, setActiveBackdropPosterUrl] = useState<string | null>(null);
  const [hasSetInitial, setHasSetInitial] = useState(false);

  // Set initial backdrop to first card's poster on load (desktop only)
  useEffect(() => {
    if (isDesktop && !hasSetInitial && firstCardPosterUrl && !activeBackdropPosterUrl) {
      setActiveBackdropPosterUrl(firstCardPosterUrl);
      setHasSetInitial(true);
    }
  }, [isDesktop, firstCardPosterUrl, activeBackdropPosterUrl, hasSetInitial]);

  const handleCardActivate = useCallback(
    (posterUrl: string) => {
      if (isDesktop && posterUrl) {
        setActiveBackdropPosterUrl(posterUrl);
      }
    },
    [isDesktop]
  );

  const backdropCallbacks: BackdropCallbacks = {
    onBackdropActivate: handleCardActivate,
  };

  return (
    <BackdropContext.Provider value={backdropCallbacks}>
      <div 
        className="watching-list-with-backdrop" 
        style={{ 
          position: 'relative', 
          isolation: 'isolate',
          contain: 'layout style paint', // Prevent backdrop from affecting elements outside
        }}
      >
        {/* Backdrop layer - desktop only, scoped to this wrapper */}
        {isDesktop && (
          <div
            className="watching-list-backdrop"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0, /* Below content, but within wrapper's stacking context */
              pointerEvents: 'none',
              opacity: activeBackdropPosterUrl ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            {activeBackdropPosterUrl && (
              <>
                {/* Blurred poster background */}
                <div
                  className="watching-list-backdrop-image"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${activeBackdropPosterUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(40px) saturate(1.2)',
                    transform: 'scale(1.1)', // Slight scale to avoid edge artifacts
                  }}
                />
                {/* Dark overlay for readability - lighter to avoid obscuring content */}
                <div
                  className="watching-list-backdrop-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%)',
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Content layer - sits above backdrop */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </div>
    </BackdropContext.Provider>
  );
}

