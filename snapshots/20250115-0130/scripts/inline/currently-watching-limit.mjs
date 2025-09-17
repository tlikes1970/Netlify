/**
 * Process: Currently Watching Limit Setting
 * Purpose: Handle currently watching limit setting
 * Data Source: User interactions
 * Update Path: Runs on user interaction
 * Dependencies: None
 */

(function(){
  console.log('🔧 Currently watching limit setting handler starting...');
  
  let input = null;
  let debounceTimer;
  let isInitialSetup = true;
  
  // Function to find and setup the input
  function setupInput() {
    // If already set up, don't do it again
    if (input && input.dataset.setupComplete) {
      console.log('🔧 Currently watching limit input already set up, skipping');
      return true;
    }
    
    input = document.querySelector('input[name="currentlyWatchingLimit"]');
    if (!input) {
      console.log('🔧 Currently watching limit input not found, will retry...');
      return false;
    }
    
    console.log('🔧 Currently watching limit input found, setting up...');
    
    // Load current value
    const currentValue = localStorage.getItem('currentlyWatchingLimit') || '5';
    input.value = currentValue;
    
    // Set up change handler with debouncing
    const debouncedApply = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applySetting();
      }, 300);
    };
    
    input.addEventListener('input', () => {
      isInitialSetup = false;
      debouncedApply();
    });
    
    input.addEventListener('change', () => {
      isInitialSetup = false;
      applySetting();
    });
    
    // Mark as set up
    input.dataset.setupComplete = 'true';
    return true;
  }
  
  // Function to apply the setting
  function applySetting() {
    if (!input) return;
    
    const value = parseInt(input.value) || 5;
    console.log('🔧 Applying currently watching limit setting:', value);
    
    // Save to localStorage
    localStorage.setItem('currentlyWatchingLimit', value.toString());
    
    // Dispatch change event
    document.dispatchEvent(new CustomEvent('settingsChanged', {
      detail: { key: 'currentlyWatchingLimit', value: value }
    }));
  }
  
  // Try to set up immediately
  if (!setupInput()) {
    // If not found, try again after a delay
    setTimeout(() => {
      if (!setupInput()) {
        console.warn('🔧 Currently watching limit input not found after retry');
      }
    }, 1000);
  }
  
  // Also try on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!input || !input.dataset.setupComplete) {
        setupInput();
      }
    }, 1000);
  });
  
})();
