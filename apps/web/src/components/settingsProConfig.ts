/**
 * Process: Full Access features configuration
 * Purpose: Single source of truth for Full Access feature tiles and support messaging
 * Data Source: Static configuration
 * Update Path: Modify this file to add/remove/update feature listings
 * Dependencies: ProSection, UpgradeToProCTA
 */

import { FULL_ACCESS_TRIAL_INTRO } from '../lib/copy/access';

export interface ProFeature {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or icon identifier
}

/**
 * Features included with Full Access (trial or one-time unlock)
 */
export const PRO_FEATURES_AVAILABLE: ProFeature[] = [
  {
    id: 'full-access-trial',
    title: '21-Day Full Access Trial',
    description: `${FULL_ACCESS_TRIAL_INTRO} Library editing, Shows Like This, Extras, watch reminders, and more.`,
    icon: '🎁',
  },
  {
    id: 'shows-like-this',
    title: 'Shows Like This',
    description:
      'Insights and easter eggs on movie and TV cards during your trial or with Full Access.',
    icon: '🎭',
  },
  {
    id: 'extras',
    title: 'Extras',
    description:
      'Additional behind-the-scenes and related videos on movie and TV cards during your trial or with Full Access.',
    icon: '🎬',
  },
  {
    id: 'watch-reminders',
    title: 'Watch Reminders',
    description:
      'Episode alerts on your device with per-show timing — in-app and push reminders.',
    icon: '🔔',
  },
  {
    id: 'episode-tracking',
    title: 'Episode Tracking',
    description: 'Track episode progress across your shows and movies.',
    icon: '📺',
  },
  {
    id: 'continued-access',
    title: 'Continued Full Access',
    description:
      'After trial, a one-time unlock keeps editing, reminders, Shows Like This, and Extras available. Helps support hosting, licensing, and maintenance.',
    icon: '💎',
  },
];

/** Reserved for future tiles; keep empty until features ship. */
export const PRO_FEATURES_COMING_SOON: ProFeature[] = [];

export function getAllProFeatures(): ProFeature[] {
  return [...PRO_FEATURES_AVAILABLE, ...PRO_FEATURES_COMING_SOON];
}

export function getProFeaturesByStatus(comingSoon: boolean): ProFeature[] {
  return comingSoon ? PRO_FEATURES_COMING_SOON : PRO_FEATURES_AVAILABLE;
}
