/**
 * Demo Settings for MediaCard Pro Actions - v28.80
 * This file demonstrates how to configure Pro actions
 */

// Example settings structure for MediaCard system
window.appSettings = window.appSettings || {};

// Set user Pro status (change to true to see Pro features)
window.appSettings.user = {
  isPro: false  // Set to true to enable Pro features
};

// Configure actions for each context
window.appSettings.ui = {
  actions: {
    watching: [
      { 
        id: 'move-to-wishlist', 
        label: 'Want to Watch', 
        icon: '📥', 
        primary: true, 
        pro: false, 
        handler: 'move-to-wishlist' 
      },
      { 
        id: 'move-to-not', 
        label: 'Not Interested', 
        icon: '🚫', 
        primary: true, 
        pro: false, 
        handler: 'move-to-not' 
      },
      { 
        id: 'details', 
        label: 'Details', 
        icon: '🔎', 
        primary: false, 
        pro: false, 
        handler: 'details' 
      },
      { 
        id: 'export', 
        label: 'Export', 
        icon: '⬇️', 
        primary: false, 
        pro: true, 
        handler: 'export' 
      },
      { 
        id: 'share', 
        label: 'Share', 
        icon: '📤', 
        primary: false, 
        pro: true, 
        handler: 'share' 
      }
    ],
    
    wishlist: [
      { 
        id: 'move-to-watching', 
        label: 'Move to Watching', 
        icon: '▶️', 
        primary: true, 
        pro: false, 
        handler: 'move-to-watching' 
      },
      { 
        id: 'move-to-not', 
        label: 'Not Interested', 
        icon: '🚫', 
        primary: true, 
        pro: false, 
        handler: 'move-to-not' 
      },
      { 
        id: 'details', 
        label: 'Details', 
        icon: '🔎', 
        primary: false, 
        pro: false, 
        handler: 'details' 
      },
      { 
        id: 'recommend', 
        label: 'Recommend', 
        icon: '💬', 
        primary: false, 
        pro: true, 
        handler: 'recommend' 
      }
    ],
    
    watched: [
      { 
        id: 'undo-to-wishlist', 
        label: 'Back to Want', 
        icon: '↩️', 
        primary: true, 
        pro: false, 
        handler: 'undo-to-wishlist' 
      },
      { 
        id: 'move-to-not', 
        label: 'Not Interested', 
        icon: '🚫', 
        primary: true, 
        pro: false, 
        handler: 'move-to-not' 
      },
      { 
        id: 'details', 
        label: 'Details', 
        icon: '🔎', 
        primary: false, 
        pro: false, 
        handler: 'details' 
      },
      { 
        id: 'export', 
        label: 'Export', 
        icon: '⬇️', 
        primary: false, 
        pro: true, 
        handler: 'export' 
      }
    ],
    
    discover: [
      { 
        id: 'add-to-wishlist', 
        label: 'Add to Want', 
        icon: '➕', 
        primary: true, 
        pro: false, 
        handler: 'add-to-wishlist' 
      },
      { 
        id: 'move-to-not', 
        label: 'Not Interested', 
        icon: '🚫', 
        primary: true, 
        pro: false, 
        handler: 'move-to-not' 
      },
      { 
        id: 'details', 
        label: 'Details', 
        icon: '🔎', 
        primary: false, 
        pro: false, 
        handler: 'details' 
      },
      { 
        id: 'share', 
        label: 'Share', 
        icon: '📤', 
        primary: false, 
        pro: true, 
        handler: 'share' 
      },
      { 
        id: 'recommend', 
        label: 'Recommend', 
        icon: '💬', 
        primary: false, 
        pro: true, 
        handler: 'recommend' 
      }
    ],
    
    home: [
      { 
        id: 'details', 
        label: 'Details', 
        icon: '🔎', 
        primary: true, 
        pro: false, 
        handler: 'details' 
      }
    ]
  }
};

// Demo function to toggle Pro status
window.toggleProStatus = function() {
  window.appSettings.user.isPro = !window.appSettings.user.isPro;
  console.log('Pro status:', window.appSettings.user.isPro ? 'ENABLED' : 'DISABLED');
  
  // Trigger a re-render of cards if they exist
  if (window.loadListContent) {
    const currentTab = document.querySelector('.tab.active')?.id?.replace('Tab', '');
    if (currentTab && ['watching', 'wishlist', 'watched', 'discover'].includes(currentTab)) {
      window.loadListContent(currentTab);
    }
  }
};

// Demo function to show upsell modal
window.showUpsellModal = function(item) {
  console.log('UPSELL MODAL:', {
    message: 'Upgrade to Pro to unlock this feature!',
    item: item?.title || 'Unknown Item',
    features: ['Export', 'Share', 'Recommend', 'Advanced Analytics']
  });
  
  // In a real app, this would open your Pro upgrade modal
  alert(`Upgrade to Pro to unlock ${item?.title || 'this feature'}!\n\nPro features include:\n• Export data\n• Share recommendations\n• Advanced analytics\n• Priority support`);
};

// Listen for upsell events
window.addEventListener('app:upsell:open', (event) => {
  console.log('Upsell event received:', event.detail);
  window.showUpsellModal(event.detail.item);
});

console.log('🎬 MediaCard Demo Settings Loaded');
console.log('💡 Use toggleProStatus() to switch between Pro/Free views');
console.log('🔒 Pro actions will show upsell modal when clicked by non-Pro users');
