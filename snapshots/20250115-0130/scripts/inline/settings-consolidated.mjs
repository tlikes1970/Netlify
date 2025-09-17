/**
 * Process: Settings Consolidated
 * Purpose: Handle all settings inputs in one module to reduce connection overhead
 * Data Source: User interactions
 * Update Path: Runs on user interaction
 * Dependencies: None
 */

(function(){
  console.log('🔧 Settings consolidated handler starting...');
  
  const settings = {
    curatedRowsCount: {
      selector: 'input[name="curatedRowsCount"]',
      defaultValue: '3',
      type: 'number'
    },
    currentlyWatchingLimit: {
      selector: 'input[name="currentlyWatchingLimit"]',
      defaultValue: '5',
      type: 'number'
    },
    episodeTracking: {
      selector: 'input[name="episodeTracking"]',
      defaultValue: 'false',
      type: 'boolean'
    }
  };
  
  const inputs = {};
  const debounceTimers = {};
  
  // Function to setup all inputs
  function setupInputs() {
    let allSetup = true;
    
    Object.keys(settings).forEach(key => {
      if (inputs[key] && inputs[key].dataset.setupComplete) {
        console.log(`🔧 ${key} input already set up, skipping`);
        return;
      }
      
      const input = document.querySelector(settings[key].selector);
      if (!input) {
        console.log(`🔧 ${key} input not found, will retry...`);
        allSetup = false;
        return;
      }
      
      console.log(`🔧 ${key} input found, setting up...`);
      inputs[key] = input;
      
      // Load current value
      const currentValue = localStorage.getItem(key) || settings[key].defaultValue;
      if (settings[key].type === 'boolean') {
        input.checked = currentValue === 'true';
      } else {
        input.value = currentValue;
      }
      
      // Set up change handler with debouncing for number inputs
      if (settings[key].type === 'number') {
        const debouncedApply = () => {
          clearTimeout(debounceTimers[key]);
          debounceTimers[key] = setTimeout(() => {
            applySetting(key);
          }, 300);
        };
        
        input.addEventListener('input', debouncedApply);
        input.addEventListener('change', () => {
          clearTimeout(debounceTimers[key]);
          applySetting(key);
        });
      } else {
        input.addEventListener('change', () => {
          applySetting(key);
        });
      }
      
      // Mark as set up
      input.dataset.setupComplete = 'true';
    });
    
    return allSetup;
  }
  
  // Function to apply a setting
  function applySetting(key) {
    const input = inputs[key];
    if (!input) return;
    
    let value;
    if (settings[key].type === 'boolean') {
      value = input.checked;
    } else {
      value = settings[key].type === 'number' ? parseInt(input.value) || parseInt(settings[key].defaultValue) : input.value;
    }
    
    console.log(`🔧 Applying ${key} setting:`, value);
    
    // Save to localStorage
    localStorage.setItem(key, value.toString());
    
    // Special handling for episode tracking
    if (key === 'episodeTracking') {
      updateEpisodeTrackingUI(value);
    }
    
    // Dispatch change event
    document.dispatchEvent(new CustomEvent('settingsChanged', {
      detail: { key: key, value: value }
    }));
  }
  
  // Function to update episode tracking UI
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
  }
  
  // Try to set up immediately
  if (!setupInputs()) {
    // If not all found, try again after a delay
    setTimeout(() => {
      if (!setupInputs()) {
        console.warn('🔧 Some settings inputs not found after retry');
      }
    }, 1000);
  }
  
  // Also try on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      setupInputs();
      
      // Page load - update episode tracking UI
      const enabled = localStorage.getItem('episodeTracking') === 'true';
      console.log('🔧 Page load - updating episode tracking UI, enabled:', enabled);
      updateEpisodeTrackingUI(enabled);
    }, 1000);
  });
  
})();
