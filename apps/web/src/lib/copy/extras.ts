/**
 * Centralized copy for Extras and Bloopers features
 * Used across UI components, tooltips, empty states, and Help documentation
 */

export const EXTRAS_COPY = {
  // Tab labels
  tabs: {
    bloopers: 'Bloopers',
    extras: 'Extras'
  },

  // Button labels
  buttons: {
    watchOnProvider: (provider: string) => `Watch on ${provider}`,
    checkExtras: 'Check Extras',
    learnMore: 'Learn more',
    reportItem: 'Report this item'
  },

  // Empty states
  emptyStates: {
    bloopers: {
      title: 'No bloopers available yet',
      description: 'Official bloopers and outtakes for this title haven\'t been released yet.',
      cta: 'Check Extras',
      secondaryCta: 'Learn more'
    },
    extras: {
      title: 'No extras available',
      description: 'Additional content for this title isn\'t available yet.',
      cta: 'Check back later'
    }
  },

  // Search assist section
  searchAssist: {
    title: 'Bloopers from around the web',
    disclaimer: 'Videos play on their host site. Availability may change.',
    providerPills: {
      youtube: 'YouTube',
      vimeo: 'Vimeo',
      official: 'Official',
      archive: 'Archive'
    }
  },

  // Tooltips
  tooltips: {
    bloopersDisabled: 'Bloopers access requires Pro subscription',
    extrasDisabled: 'Extras access requires Pro subscription',
    searchAssist: 'Curated selection of verified bloopers from official channels'
  },

  // Help article references
  help: {
    bloopersArticle: '/help/pro-bloopers-and-extras',
    learnMoreText: 'Learn more about how Flicklet curates bloopers and outtakes'
  },

  // Analytics event names
  analytics: {
    bloopersModalOpen: 'bloopers_modal_open',
    bloopersPlayInApp: 'bloopers_play_inapp',
    bloopersClickOut: 'bloopers_click_out',
    bloopersEmpty: 'bloopers_empty',
    helpOpen: 'help_open'
  },

  // Quality indicators
  quality: {
    verifiedChannel: 'Verified channel',
    allowlistedChannel: 'Official channel',
    nonEmbeddable: 'Link-out only',
    highQuality: 'High quality'
  },

  // Admin panel
  admin: {
    searchAssistPreview: 'Search Assist Preview',
    approveItem: 'Approve',
    holdItem: 'Hold',
    reason: 'Reason',
    candidates: 'Candidate items'
  }
} as const;

export type ExtrasCopy = typeof EXTRAS_COPY;
