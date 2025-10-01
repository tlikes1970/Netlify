// Cards V2 Configuration
(function() {
  'use strict';
  
  const V2_ACTIONS = [
    { id:'watched',  label:'Mark watched',  action:'watched' },
    { id:'wishlist', label:'Add to wishlist', action:'wishlist' },
    { id:'remove',   label:'Remove from Watching', action:'remove-watching' },
  ];
  // No 'not-interested'

  // Expose globally
  window.V2_ACTIONS = V2_ACTIONS;
  
  console.log('✅ Cards V2 config loaded');
})();

