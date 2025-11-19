/**
 * Process: Pro Features Configuration
 * Purpose: Single source of truth for all Pro features, labels, and upgrade messaging
 * Data Source: Static configuration
 * Update Path: Modify this file to add/remove/update Pro features
 * Dependencies: ProSection, UpgradeToProCTA, any Pro feature listings
 */

export interface ProFeature {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or icon identifier
  comingSoon?: boolean;
}

/**
 * All Pro features available now
 */
export const PRO_FEATURES_AVAILABLE: ProFeature[] = [
  {
    id: 'bloopers-extras',
    title: 'Bloopers & Behind-the-Scenes',
    description: 'Access to bloopers, extras, and behind-the-scenes content on movie and TV show cards',
    icon: '🎬',
    comingSoon: false,
  },
  {
    id: 'advanced-notifications',
    title: 'Advanced Notifications',
    description: 'Customizable episode notifications with multiple methods, custom timing, and per-show settings',
    icon: '🔔',
    comingSoon: false,
  },
];

/**
 * Pro features coming soon
 */
export const PRO_FEATURES_COMING_SOON: ProFeature[] = [
  {
    id: 'premium-themes',
    title: 'Premium Themes',
    description: 'Access to premium theme packs and advanced customization options',
    icon: '🎨',
    comingSoon: true,
  },
];

/**
 * Get all Pro features (available + coming soon)
 */
export function getAllProFeatures(): ProFeature[] {
  return [...PRO_FEATURES_AVAILABLE, ...PRO_FEATURES_COMING_SOON];
}

/**
 * Get Pro features by availability status
 */
export function getProFeaturesByStatus(comingSoon: boolean): ProFeature[] {
  return comingSoon ? PRO_FEATURES_COMING_SOON : PRO_FEATURES_AVAILABLE;
}


