/**
 * Process: Curated Rows Setting
 * Purpose: Handle curated rows count setting
 * Data Source: User interactions
 * Update Path: Runs on user interaction
 * Dependencies: None
 */

(function(){
  console.log('🔧 Curated rows setting handler starting...');
  
  let input = null;
  let debounceTimer;
  
  // Function to find and setup the input
  function setupInput() {
    // If already set up, don't do it again
    if (input && input.dataset.setupComplete) {
      console.log('🔧 Curated rows input already set up, skipping');
      return true;
    }
    
    input = document.querySelector('input[name="curatedRowsCount"]');
    if (!input) {
      console.log('🔧 Curated rows input not found, will retry...');
      return false;
    }
    
    console.log('🔧 Curated rows input found, setting up...');
    
    // Load current value
    const currentValue = localStorage.getItem('curatedRowsCount') || '3';
    input.value = currentValue;
    
    // Set up change handler with debouncing
    const debouncedApply = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        applySetting();
      }, 300);
    };
    
    input.addEventListener('input', debouncedApply);
    input.addEventListener('change', () => {
      clearTimeout(debounceTimer);
      applySetting();
    });
    
    // Mark as set up
    input.dataset.setupComplete = 'true';
    return true;
  }
  
  // Function to apply the setting
  function applySetting() {
    if (!input) return;
    
    const value = parseInt(input.value) || 3;
    console.log('🔧 Applying curated rows setting:', value);
    
    // Save to localStorage
    localStorage.setItem('curatedRowsCount', value.toString());
    
    // Dispatch change event
    document.dispatchEvent(new CustomEvent('settingsChanged', {
      detail: { key: 'curatedRowsCount', value: value }
    }));
  }
  
  // Try to set up immediately
  if (!setupInput()) {
    // If not found, try again after a delay
    setTimeout(() => {
      if (!setupInput()) {
        console.warn('🔧 Curated rows input not found after retry');
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
