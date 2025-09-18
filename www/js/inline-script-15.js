
    (function(){
      console.log('🔧 Curated rows setting handler starting...');
      
      let input = null;
      let debounceTimer;
      
      // Function to find and setup the input
      function setupInput() {
        // If already set up, don't do it again
        if (input && input.dataset.setupComplete) {
          console.log('🔧 Input already set up, skipping');
          return true;
        }
        
        input = document.querySelector('#settingCuratedRows, [name="curatedRows"]');
        console.log('🔧 Input found:', !!input, input);
        if (!input) {
          console.warn('🔧 Curated rows input not found, will retry...');
          return false;
        }
        
        // Track if this is initial setup to avoid showing notification
        let isInitialSetup = true;
        let hasUserInteracted = false;
        let isSettingValue = false; // Flag to prevent notifications when setting value programmatically
        let lastNotifiedValue = null; // Track last value we showed notification for
        
        // Function to safely set value without triggering notifications
        function setValueSafely(value) {
          console.log('🔧 setValueSafely called with:', value, 'isSettingValue will be set to true');
          isSettingValue = true;
          input.value = value;
          console.log('🔧 Set value safely to:', value, 'isSettingValue:', isSettingValue);
          // Apply the setting but without notification
          applySetting();
          isSettingValue = false;
          console.log('🔧 setValueSafely completed, isSettingValue reset to false');
        }
        
        // Load saved value
        const stored = localStorage.getItem('flicklet:curated:rows');
        console.log('🔧 Stored value:', stored);
        if (stored) {
          // Set value without triggering notifications
          setValueSafely(stored);
        } else {
          // Set default value without triggering notifications
          setValueSafely('3');
        }
        
        // Function to apply the setting
        function applySetting() {
          console.log('🔧 applySetting called with value:', input.value, 'isInitialSetup:', isInitialSetup, 'hasUserInteracted:', hasUserInteracted, 'isSettingValue:', isSettingValue);
          const n = Math.max(1, Math.min(10, Number(input.value)||3));
          console.log('🔧 Setting curated rows to:', n);
          localStorage.setItem('flicklet:curated:rows', String(n));
          document.dispatchEvent(new CustomEvent('curated:rerender'));
          console.log('🔧 Dispatched curated:rerender event');
          
          // Only show notification if user has actually interacted with the input, we're not setting the value programmatically, and the value has changed
          if (hasUserInteracted && !isSettingValue && lastNotifiedValue !== n && window.showNotification) {
            console.log('🔧 Showing notification for user interaction - value changed from', lastNotifiedValue, 'to', n);
            window.showNotification(`✅ Showing ${n} TV/Movie list${n>1?'s':''}`, 'success');
            lastNotifiedValue = n; // Remember this value so we don't notify again
          } else {
            console.log('🔧 Notification blocked - hasUserInteracted:', hasUserInteracted, 'isSettingValue:', isSettingValue, 'value changed:', lastNotifiedValue !== n, 'showNotification available:', !!window.showNotification);
          }
          
          // Visual feedback on the input
          input.style.borderColor = '#10b981';
          input.style.backgroundColor = '#f0fdf4';
          
          // Update status indicator
          const status = document.getElementById('curatedRowsStatus');
          if (status) {
            status.textContent = '✅ Saved';
            status.style.color = '#10b981';
            setTimeout(() => {
              status.textContent = 'Auto-saves';
              status.style.color = '';
            }, 2000);
          }
          
          setTimeout(() => {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
          }, 1000);
        }
        
        // Debounced function for input events
        function debouncedApply() {
          console.log('🔧 debouncedApply called');
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(applySetting, 300);
        }
        
        // Track user interaction to enable notifications
        input.addEventListener('input', () => {
          hasUserInteracted = true;
          lastNotifiedValue = null; // Reset so we can notify for new changes
          console.log('🔧 User interacted with input - notifications enabled, reset lastNotifiedValue');
          debouncedApply();
        });
        input.addEventListener('change', () => {
          hasUserInteracted = true;
          console.log('🔧 User changed input - notifications enabled');
          applySetting();
        });
        input.addEventListener('blur', () => {
          hasUserInteracted = true;
          console.log('🔧 User blurred input - notifications enabled');
          applySetting();
        });
        
        // Mark setup as complete after a short delay to avoid initial notification
        setTimeout(() => {
          isInitialSetup = false;
          console.log('🔧 Initial setup complete - notifications enabled');
        }, 1000);
        
        // Function to refresh value when settings tab is opened
        function refreshValue() {
          console.log('🔧 refreshValue called - resetting hasUserInteracted to false');
          hasUserInteracted = false; // Reset user interaction flag for refresh operations
          
          const currentStored = localStorage.getItem('flicklet:curated:rows');
          if (currentStored && currentStored !== input.value) {
            console.log('🔧 Refreshing value from storage:', currentStored);
            // Use setValueSafely to avoid notifications during refresh
            setValueSafely(currentStored);
          } else {
            console.log('🔧 No refresh needed - value already correct:', input.value);
          }
        }
        
        // Expose refresh function globally so it can be called when settings tab opens
        window.refreshCuratedRowsSetting = refreshValue;
        
        // Test if input is responsive
        input.addEventListener('click', () => console.log('🔧 Input clicked'));
        input.addEventListener('focus', () => console.log('🔧 Input focused'));
        
        console.log('🔧 Event listeners attached to input');
        
        // Mark as set up to prevent duplicate setup
        input.dataset.setupComplete = 'true';
        
        // Test the input
        setTimeout(() => {
          if (input.offsetParent === null) {
            console.log('🔧 Input is hidden - user needs to go to Settings > Layout tab to see it');
          } else {
            console.log('🔧 Input is visible and ready');
          }
        }, 1000);
        
        return true;
      }
      
      // Try to setup immediately
      if (!setupInput()) {
        // If not found, retry every 500ms for up to 10 seconds
        let retries = 0;
        const retryInterval = setInterval(() => {
          retries++;
          console.log('🔧 Retrying to find input, attempt:', retries);
          if (setupInput() || retries >= 20) {
            clearInterval(retryInterval);
            if (retries >= 20) {
              console.warn('🔧 Failed to find input after 20 attempts');
            }
          }
        }, 500);
      }
      
      // Also listen for when the Layout tab becomes active
      document.addEventListener('DOMContentLoaded', () => {
        // Listen for tab changes to re-setup the input if needed
        const layoutSection = document.querySelector('#layout');
        if (layoutSection) {
          // Use MutationObserver to detect when the section becomes active
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const isActive = layoutSection.classList.contains('active');
                if (isActive && !input) {
                  console.log('🔧 Layout section became active, re-setting up input');
                  setupInput();
                }
              }
            });
          });
          
          observer.observe(layoutSection, { attributes: true, attributeFilter: ['class'] });
        }
        
        // Also listen for the settings tabs initialization
        const checkForTabs = setInterval(() => {
          if (document.querySelector('.settings-tabs button[data-target="#layout"]')) {
            console.log('🔧 Settings tabs found, setting up layout tab listener');
            clearInterval(checkForTabs);
            
            const layoutTab = document.querySelector('.settings-tabs button[data-target="#layout"]');
            if (layoutTab) {
              layoutTab.addEventListener('click', () => {
                console.log('🔧 Layout tab clicked, ensuring input is set up');
                setTimeout(() => {
                  if (!input) {
                    console.log('🔧 Input not found, setting up...');
                    setupInput();
                  } else {
                    console.log('🔧 Input already exists, checking visibility...');
                    console.log('🔧 Input visible?', input.offsetParent !== null);
                    console.log('🔧 Input parent visible?', input.parentElement?.offsetParent !== null);
                    console.log('🔧 Input parent classes:', input.parentElement?.className);
                    console.log('🔧 Input parent parent classes:', input.parentElement?.parentElement?.className);
                    
                    // Refresh the value to ensure it shows the correct stored value
                    if (typeof window.refreshCuratedRowsSetting === 'function') {
                      console.log('🔧 Refreshing curated rows setting on Layout tab click');
                      window.refreshCuratedRowsSetting();
                    }
                  }
                }, 100);
              });
            }
          }
        }, 500);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkForTabs), 10000);
      });
      
    })();
    