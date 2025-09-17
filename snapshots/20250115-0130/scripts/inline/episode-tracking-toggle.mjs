/**
 * Process: Episode Tracking Toggle
 * Purpose: Handle episode tracking toggle functionality
 * Data Source: User interactions
 * Update Path: Runs on user interaction
 * Dependencies: None
 */

(function(){
  console.log('🔧 Episode tracking toggle handler starting...');
  
  let toggle = null;
  
  // Function to find and setup the toggle
  function setupToggle() {
    if (toggle && toggle.dataset.setupComplete) {
      console.log('🔧 Episode tracking toggle already set up, skipping');
      return true;
    }
    
    toggle = document.querySelector('input[name="episodeTracking"]');
    if (!toggle) {
      console.log('🔧 Episode tracking toggle not found, will retry...');
      return false;
    }
    
    console.log('🔧 Episode tracking toggle found, setting up...');
    
    // Apply current setting
    applyEpisodeTrackingSetting();
    
    // Set up change handler
    toggle.addEventListener('change', () => {
      console.log('🔧 Episode tracking toggle changed:', toggle.checked);
      applyEpisodeTrackingSetting();
    });
    
    // Mark as set up
    toggle.dataset.setupComplete = 'true';
    return true;
  }
  
  // Function to apply the episode tracking setting
  function applyEpisodeTrackingSetting() {
    if (!toggle) return;
    
    const enabled = toggle.checked;
    console.log('🔧 Applying episode tracking setting:', enabled);
    
    // Save to localStorage
    localStorage.setItem('episodeTracking', enabled.toString());
    
    // Update UI elements
    updateEpisodeTrackingUI(enabled);
    
    // Dispatch change event
    document.dispatchEvent(new CustomEvent('settingsChanged', {
      detail: { key: 'episodeTracking', value: enabled }
    }));
  }
  
  // Function to update UI based on setting
  function updateEpisodeTrackingUI(enabled) {
    // Update buttons that should be shown/hidden
    const buttons = document.querySelectorAll('[data-episode-tracking]');
    buttons.forEach((btn, index) => {
      console.log(`🔧 Button ${index}:`, btn.textContent, 'setting display to:', enabled ? 'inline-block' : 'none');
      btn.style.display = enabled ? 'inline-block' : 'none';
    });
    
    // Update any existing progress hints
    const progressHints = document.querySelectorAll('[data-progress-hint]');
    progressHints.forEach(hint => {
      hint.style.display = enabled ? 'inline' : 'none';
    });
    
    // Note: UI update handled by episode tracking system initialization
  }
  
  // Try to set up immediately
  if (!setupToggle()) {
    // If not found, try again after a delay
    setTimeout(() => {
      if (!setupToggle()) {
        console.warn('🔧 Episode tracking toggle not found after retry');
      }
    }, 1000);
  }
  
  // Also try on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!toggle || !toggle.dataset.setupComplete) {
        setupToggle();
      }
    }, 1000);
  });
  
  // Page load - update UI
  setTimeout(() => {
    const enabled = localStorage.getItem('episodeTracking') === 'true';
    console.log('🔧 Page load - updating episode tracking UI, enabled:', enabled);
    updateEpisodeTrackingUI(enabled);
  }, 1000);
  
})();
