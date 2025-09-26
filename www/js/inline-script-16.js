(function () {
  console.log('🔧 Currently watching limit setting handler starting...');

  let input = null;
  let debounceTimer;

  // Function to find and setup the input
  function setupInput() {
    // If already set up, don't do it again
    if (input && input.dataset.setupComplete) {
      console.log('🔧 Currently watching limit input already set up, skipping');
      return true;
    }

    input = document.querySelector(
      '#settingCurrentlyWatchingLimit, [name="currentlyWatchingLimit"]',
    );
    console.log('🔧 Currently watching limit input found:', !!input, input);
    if (!input) {
      console.warn('🔧 Currently watching limit input not found, will retry...');
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
    const stored = localStorage.getItem('flicklet:currentlyWatching:limit');
    console.log('🔧 Stored currently watching limit value:', stored);
    if (stored) {
      // Set value without triggering notifications
      setValueSafely(stored);
    } else {
      // Set default value without triggering notifications
      setValueSafely('12');
    }

    // Function to apply the setting
    function applySetting() {
      console.log(
        '🔧 applyCurrentlyWatchingSetting called with value:',
        input.value,
        'isInitialSetup:',
        isInitialSetup,
        'hasUserInteracted:',
        hasUserInteracted,
        'isSettingValue:',
        isSettingValue,
      );
      const n = Math.max(5, Math.min(20, Number(input.value) || 12));
      console.log('🔧 Setting currently watching limit to:', n);
      localStorage.setItem('flicklet:currentlyWatching:limit', String(n));

      // Trigger currently watching preview update
      if (typeof window.renderCurrentlyWatchingPreview === 'function') {
        window.renderCurrentlyWatchingPreview();
      }
      document.dispatchEvent(new CustomEvent('currentlyWatching:rerender'));
      console.log('🔧 Dispatched currentlyWatching:rerender event');

      // Only show notification if user has actually interacted with the input, we're not setting the value programmatically, and the value has changed
      if (
        hasUserInteracted &&
        !isSettingValue &&
        lastNotifiedValue !== n &&
        window.showNotification
      ) {
        console.log(
          '🔧 Showing notification for user interaction - value changed from',
          lastNotifiedValue,
          'to',
          n,
        );
        window.showNotification(`✅ Showing ${n} currently watching shows`, 'success');
        lastNotifiedValue = n; // Remember this value so we don't notify again
      } else {
        console.log(
          '🔧 Notification blocked - hasUserInteracted:',
          hasUserInteracted,
          'isSettingValue:',
          isSettingValue,
          'value changed:',
          lastNotifiedValue !== n,
          'showNotification available:',
          !!window.showNotification,
        );
      }

      // Visual feedback on the input
      input.style.borderColor = '#10b981';
      input.style.backgroundColor = '#f0fdf4';

      // Update status indicator
      const status = document.getElementById('currentlyWatchingLimitStatus');
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
      console.log('🔧 debouncedApply called for currently watching limit');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('🔧 Debounced apply executing for currently watching limit');
        applySetting();
      }, 500);
    }

    // Event listeners
    input.addEventListener('input', () => {
      console.log('🔧 Currently watching limit input event fired');
      hasUserInteracted = true;
      isInitialSetup = false;
      debouncedApply();
    });

    input.addEventListener('change', () => {
      console.log('🔧 Currently watching limit change event fired');
      hasUserInteracted = true;
      isInitialSetup = false;
      applySetting();
    });

    // Mark as set up
    input.dataset.setupComplete = 'true';
    console.log('🔧 Currently watching limit input setup complete');
    return true;
  }

  // Try to setup immediately
  if (!setupInput()) {
    // If not ready, retry every 100ms for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 100;
    const interval = setInterval(() => {
      attempts++;
      console.log('🔧 Currently watching limit setup attempt', attempts);
      if (setupInput() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.error(
            '🔧 Failed to setup currently watching limit input after',
            maxAttempts,
            'attempts',
          );
        }
      }
    }, 100);
  }

  // Expose refresh function for external use
  window.refreshCurrentlyWatchingLimitSetting = function () {
    console.log('🔧 Refreshing currently watching limit setting...');
    if (input) {
      const stored = localStorage.getItem('flicklet:currentlyWatching:limit');
      if (stored) {
        input.value = stored;
      }
    }
  };
})();
