/**
 * Centralized copy for Shows Like This and Extras features
 * Used across UI components, tooltips, empty states, and Help documentation
 */

export const EXTRAS_COPY = {
  // Tab labels (legacy BloopersModal paths)
  tabs: {
    bloopers: 'Extras',
    extras: 'Extras',
  },

  // Button labels
  buttons: {
    watchOnProvider: (provider: string) => `Watch on ${provider}`,
    checkExtras: 'Check Extras',
    learnMore: 'Learn more',
    reportItem: 'Report this item',
  },

  // Empty states
  emptyStates: {
    bloopers: {
      title: 'No Extras available yet',
      description: 'Additional videos for this title are not available yet.',
      cta: 'Check Extras',
      secondaryCta: 'Learn more',
    },
    extras: {
      title: 'No extras available',
      description: 'Additional content for this title is not available yet.',
      cta: 'Check back later',
    },
  },

  // Search assist section
  searchAssist: {
    title: 'Extras from around the web',
    disclaimer: 'Videos play on their host site. Availability may change.',
    providerPills: {
      youtube: 'YouTube',
      vimeo: 'Vimeo',
      official: 'Official',
      archive: 'Archive',
    },
  },

  // Tooltips
  tooltips: {
    bloopersDisabled: 'Extras require Full Access (trial or unlock)',
    extrasDisabled: 'Extras require Full Access (trial or unlock)',
    searchAssist: 'Curated selection of verified extras from official channels',
  },

  // Help article references
  help: {
    bloopersArticle: '/help/full-access-extras',
    learnMoreText: 'Learn more about how Flicklet curates Shows Like This and Extras',
  },

  // Analytics event names (internal identifiers)
  analytics: {
    bloopersModalOpen: 'bloopers_modal_open',
    bloopersPlayInApp: 'bloopers_play_inapp',
    bloopersClickOut: 'bloopers_click_out',
    bloopersEmpty: 'bloopers_empty',
    helpOpen: 'help_open',
  },

  // Quality indicators
  quality: {
    verifiedChannel: 'Verified channel',
    allowlistedChannel: 'Official channel',
    nonEmbeddable: 'Link-out only',
    highQuality: 'High quality',
  },

  // Admin panel
  admin: {
    searchAssistPreview: 'Search Assist Preview',
    approveItem: 'Approve',
    holdItem: 'Hold',
    reason: 'Reason',
    candidates: 'Candidate items',
  },
} as const;

export type ExtrasCopy = typeof EXTRAS_COPY;
