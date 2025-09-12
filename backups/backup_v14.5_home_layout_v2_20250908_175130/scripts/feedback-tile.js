/* ========== feedback-tile.js ==========
   Feedback Tile Row - Last row on Home page
   Invites user feedback with a clean, accessible card
*/

(function(){
  'use strict';

  // Check if feature is enabled
  console.log('💬 Feedback Tile feature flag check:', window.FLAGS?.homeRowFeedback);
  if (!window.FLAGS?.homeRowFeedback) {
    console.log('💬 Feedback Tile disabled by feature flag');
    return;
  }

  const section = document.getElementById('feedback-row');
  if (!section) {
    console.warn('💬 Feedback Tile row not found');
    return;
  }

  console.log('💬 Initializing Feedback Tile...');
  console.log('💬 DOM ready state:', document.readyState);

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    console.log('💬 DOM still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', renderFeedbackRow);
  } else {
    console.log('💬 DOM already ready, calling renderFeedbackRow immediately');
    renderFeedbackRow();
  }

  /**
   * Process: Feedback Tile Binding
   * Purpose: Binds click and keyboard events to the feedback card
   * Data Source: DOM elements (feedback-card, feedback-cta button)
   * Update Path: Modify event handlers if feedback flow changes
   * Dependencies: openFeedback, openFeedbackOrComingSoon functions
   */
  function bindFeedbackTile() {
    const row = document.getElementById('feedback-row');
    if (!row) return;
    const card = row.querySelector('.feedback-card');
    const btn = row.querySelector('.feedback-cta');

    if (!card) {
      console.warn('💬 Feedback card not found');
      return;
    }

    const open = () => {
      console.log('💬 Opening feedback...');
      if (typeof openFeedback === 'function') {
        openFeedback();                 // preferred existing modal/page
      } else if (typeof openFeedbackOrComingSoon === 'function') {
        openFeedbackOrComingSoon('feedback');
      } else if (typeof window.openModal === 'function') {
        // Fallback to generic modal
        window.openModal(
          'Feedback',
          '<p>Thanks for your interest in providing feedback!</p><p><em>Feedback functionality coming soon. Please check back later.</em></p>',
          'feedback-modal'
        );
      } else {
        console.error('[Feedback] No feedback handler found.');
        alert('Feedback functionality is not available at this time.');
      }
    };

    // Card click handler
    card.addEventListener('click', open);
    
    // Card keyboard handler
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { 
        e.preventDefault(); 
        open(); 
      }
    });
    
    // Button click handler (stops propagation to avoid double-trigger)
    if (btn) {
      btn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        open(); 
      });
    }

    console.log('💬 Feedback Tile event handlers bound');
  }

  /**
   * Process: Feedback Row Rendering
   * Purpose: Renders the feedback tile and binds event handlers
   * Data Source: Feature flag, DOM elements
   * Update Path: Modify if feedback tile structure changes
   * Dependencies: bindFeedbackTile function
   */
  function renderFeedbackRow() {
    if (!window.FLAGS?.homeRowFeedback) return; // feature flag gate
    
    const section = document.getElementById('feedback-row');
    if (!section) return;

    console.log('💬 Rendering Feedback Tile...');
    bindFeedbackTile();
    console.log('✅ Feedback Tile rendered successfully');
  }

  // Expose render function globally for manual triggering
  window.renderFeedbackRow = renderFeedbackRow;

})();
