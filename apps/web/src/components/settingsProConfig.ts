/**
 * Process: Pro Features Configuration
 * Purpose: Single source of truth for Pro feature tiles and support messaging
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
 * Features included with full access (trial or paid Pro)
 */
export const PRO_FEATURES_AVAILABLE: ProFeature[] = [
  {
    id: 'full-access-trial',
    title: '21-Day Full Access Trial',
    description:
      'Every signed-in account gets the complete app for 21 days — library editing, Goofs, Extras, watch reminders, and more.',
    icon: '🎁',
    comingSoon: false,
  },
  {
    id: 'bloopers-extras',
    title: 'Bloopers & Behind-the-Scenes',
    description:
      'Bloopers, extras, and behind-the-scenes content on movie and TV cards during your trial or with Pro.',
    icon: '🎬',
    comingSoon: false,
  },
  {
    id: 'watch-reminders',
    title: 'Watch Reminders',
    description:
      'Episode alerts on your device with per-show timing — in-app and push reminders, no email digests.',
    icon: '🔔',
    comingSoon: false,
  },
  {
    id: 'episode-tracking-condensed',
    title: 'Episode Tracking in Condensed View',
    description: 'Track episode progress even when using condensed view mode.',
    icon: '📺',
    comingSoon: false,
  },
  {
    id: 'continued-access',
    title: 'Continued Full Access',
    description:
      'After trial, a one-time purchase keeps editing, reminders, and extras working — your library never held hostage.',
    icon: '💎',
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
    description: 'Additional theme packs and customization options.',
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

