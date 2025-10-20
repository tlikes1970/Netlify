// Cards V2 Configuration
(function() {
  'use strict';
  
  // Context-specific action configurations
  const V2_ACTION_CONFIGS = {
    'watching-home': [
      { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' },
      { id: 'watched', label: 'Watched', action: 'watched' },
      { id: 'not-interested', label: 'Not Interested', action: 'not-interested' },
      { id: 'delete', label: 'Delete', action: 'delete' }
    ],
    'watching-tab': [
      { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' },
      { id: 'watched', label: 'Watched', action: 'watched' },
      { id: 'not-interested', label: 'Not Interested', action: 'not-interested' },
      { id: 'set-progress', label: 'Set Episode Progress', action: 'set-progress' },
      { id: 'review', label: 'Review/Notes', action: 'review' },
      { id: 'tag', label: 'Add Tag', action: 'tag' },
      { id: 'trailer', label: 'Trailer / Extras', action: 'trailer', isPro: true },
      { id: 'remind', label: 'Remind Me (Configurable)', action: 'remind', isPro: true }
    ],
    'wishlist-tab': [
      { id: 'watching', label: 'Currently Watching', action: 'watching' },
      { id: 'watched', label: 'Watched', action: 'watched' },
      { id: 'not-interested', label: 'Not Interested', action: 'not-interested' },
      { id: 'set-progress', label: 'Set Episode Progress', action: 'set-progress' },
      { id: 'review', label: 'Review/Notes', action: 'review' },
      { id: 'tag', label: 'Add Tag', action: 'tag' },
      { id: 'trailer', label: 'Trailer / Extras', action: 'trailer', isPro: true }
    ],
    'watched-tab': [
      { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' },
      { id: 'watching', label: 'Currently Watching', action: 'watching' },
      { id: 'not-interested', label: 'Not Interested', action: 'not-interested' },
      { id: 'review', label: 'Review/Notes', action: 'review' },
      { id: 'tag', label: 'Add Tag', action: 'tag' },
      { id: 'trailer', label: 'Trailer / Extras', action: 'trailer', isPro: true }
    ],
    'curated-home': [
      { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' }
    ],
    'next-up-home': [], // No buttons for Next Up
    'search': [
      { id: 'wishlist', label: 'Want to Watch', action: 'wishlist' },
      { id: 'watching', label: 'Currently Watching', action: 'watching' },
      { id: 'watched', label: 'Watched', action: 'watched' },
      { id: 'not-interested', label: 'Not Interested', action: 'not-interested' },
      { id: 'review', label: 'Review/Notes', action: 'review' },
      { id: 'tag', label: 'Add Tag', action: 'tag' }
    ]
  };

  // Pro actions for tab contexts
  const V2_PRO_ACTIONS = {
    'watching-tab': [
      { id: 'trailer', label: 'Trailer / Extras', action: 'trailer' },
      { id: 'remind', label: 'Remind Me (Configurable)', action: 'remind' }
    ],
    'wishlist-tab': [
      { id: 'trailer', label: 'Trailer / Extras', action: 'trailer' }
    ],
    'watched-tab': [
      { id: 'trailer', label: 'Trailer / Extras', action: 'trailer' }
    ]
  };

  // Status badge types
  const V2_BADGE_TYPES = {
    'NEW': 'new',
    'TRENDING': 'trending', 
    'RETURNING': 'returning',
    'ENDED': 'ended',
    'CANCELLED': 'cancelled'
  };

  // Expose globally
  window.V2_ACTION_CONFIGS = V2_ACTION_CONFIGS;
  window.V2_PRO_ACTIONS = V2_PRO_ACTIONS;
  window.V2_BADGE_TYPES = V2_BADGE_TYPES;
  
  console.log('✅ Cards V2 config loaded');
})();

