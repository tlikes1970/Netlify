import React from 'react';
import { useIsDesktop } from '../../hooks/useDeviceDetection';

export interface ProviderBadgeProps {
  provider: string;
  className?: string;
  mediaType?: 'movie' | 'tv';
}

/**
 * Process: Provider Badge
 * Purpose: Display streaming provider badges with responsive behavior (icon+label on wide, icon-only on mobile)
 * Data Source: MediaItem.networks array
 * Update Path: Pass provider name from MediaItem.networks
 * Dependencies: useIsDesktop hook for responsive behavior
 */

/**
 * Get short label for provider (abbreviated version for mobile)
 */
function getShortLabel(provider: string): string {
  // Common provider abbreviations
  const abbreviations: Record<string, string> = {
    'Netflix': 'NFX',
    'HBO': 'HBO',
    'Disney Plus': 'D+',
    'Disney+': 'D+',
    'Prime Video': 'Prime',
    'Hulu': 'Hulu',
    'Paramount Plus': 'Par+',
    'Paramount+': 'Par+',
    'Apple TV+': 'ATV+',
    'Apple TV Plus': 'ATV+',
    'Peacock': 'Peacock',
    'Max': 'Max',
    'Showtime': 'SHO',
    'Starz': 'Starz',
    'FX Networks': 'FX',
    'FX': 'FX',
    'AMC': 'AMC',
    'BBC': 'BBC',
    'CBS': 'CBS',
    'NBC': 'NBC',
    'ABC': 'ABC',
  };

  // Try exact match first
  if (abbreviations[provider]) {
    return abbreviations[provider];
  }

  // Try case-insensitive match
  const lowerProvider = provider.toLowerCase();
  for (const [key, value] of Object.entries(abbreviations)) {
    if (key.toLowerCase() === lowerProvider) {
      return value;
    }
  }

  // Fallback: take first 3-4 characters
  return provider.length > 4 ? provider.substring(0, 4) : provider;
}

/**
 * ProviderBadge - Responsive streaming provider badge
 * - Wide screens: Shows provider name text
 * - Small/mobile: Shows abbreviated text with tooltip
 * - Uses design tokens for colors and typography
 * - Accessible with aria-label
 */
export function ProviderBadge({ provider, className = '', mediaType = 'tv' }: ProviderBadgeProps) {
  const { ready, isDesktop } = useIsDesktop();
  
  // Wait for viewport detection to avoid hydration mismatch
  if (!ready) {
    return (
      <span
        className={`provider-badge ${className}`}
        aria-label={`Available on ${provider}`}
        title={provider}
      >
        {getShortLabel(provider)}
      </span>
    );
  }

  // Always show full label on both desktop and mobile (no abbreviations)
  // Format provider name for display (match search results style: "On Netflix" for TV, provider name for movies)
  const displayText = mediaType === 'tv' ? `On ${provider}` : provider;

  return (
    <span
      className={`provider-badge ${className}`}
      aria-label={`Available on ${provider}`}
      title={provider}
    >
      {displayText}
    </span>
  );
}

/**
 * ProviderBadges - Container for multiple provider badges
 */
export interface ProviderBadgesProps {
  providers: string[];
  className?: string;
  maxVisible?: number;
  mediaType?: 'movie' | 'tv';
}

export function ProviderBadges({ providers, className = '', maxVisible = 3, mediaType = 'tv' }: ProviderBadgesProps) {
  // Debug: Log when providers are missing
  if (!providers || providers.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[ProviderBadges] No providers provided', { providers });
    }
    return null;
  }

  // Filter out any invalid provider entries
  const validProviders = providers.filter(p => p && typeof p === 'string' && p.trim().length > 0);
  
  if (validProviders.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[ProviderBadges] No valid providers after filtering', { providers });
    }
    return null;
  }

  const visibleProviders = validProviders.slice(0, maxVisible);
  const remainingCount = validProviders.length - maxVisible;

  return (
    <div className={`provider-badges-container ${className}`} role="list" aria-label="Streaming providers">
      {visibleProviders.map((provider, index) => (
        <ProviderBadge
          key={`${provider}-${index}`}
          provider={provider}
          className="provider-badge-item"
          mediaType={mediaType}
        />
      ))}
      {remainingCount > 0 && (
        <span
          className="provider-badge-more"
          aria-label={`${remainingCount} more providers`}
          title={`${remainingCount} more: ${providers.slice(maxVisible).join(', ')}`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
