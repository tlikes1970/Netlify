/**

 * Process: Full Access features configuration

 * Purpose: Single source of truth for Full Access feature tiles and support messaging

 * Data Source: Static configuration

 * Update Path: Modify this file to add/remove/update feature listings

 * Dependencies: ProSection, UpgradeToProCTA

 */

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
    id: "shows-like-this",

    title: "Shows Like This",

    description:
      "Insights and easter eggs on movie and TV cards during your trial or with Full Access.",

    icon: "🎭",
  },

  {
    id: "extras",

    title: "Extras",

    description:
      "Additional behind-the-scenes and related videos on movie and TV cards during your trial or with Full Access.",

    icon: "🎬",
  },

  {
    id: "watch-reminders",

    title: "Episode Reminders",

    description:
      "Android alerts around 8:00 AM on the day a new episode airs.",

    icon: "🔔",
  },

  {
    id: "unlimited-custom-lists",
    title: "Unlimited Custom Lists",
    description: "Organize titles into as many personal lists as you need.",
    icon: "📋",
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
