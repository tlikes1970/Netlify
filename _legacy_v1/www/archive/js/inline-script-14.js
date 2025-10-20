(function () {
  console.log('🔧 Episode tracking toggle handler starting...');

  let toggle = null;

  // Function to find and setup the toggle
  function setupToggle() {
    if (toggle && toggle.dataset.setupComplete) {
      console.log('🔧 Episode tracking toggle already set up, skipping');
      return true;
    }

    toggle = document.querySelector('#enableEpisodeTracking');
    console.log('🔧 Episode tracking toggle found:', !!toggle, toggle);
    if (!toggle) {
      console.warn('🔧 Episode tracking toggle not found, will retry...');
      return false;
    }

    // Load saved value
    const stored = localStorage.getItem('flicklet:episodeTracking:enabled');
    console.log('🔧 Stored episode tracking value:', stored);
    if (stored !== null) {
      toggle.checked = stored === 'true';
    } else {
      // Default to false (disabled)
      toggle.checked = false;
    }

    // Apply the setting
    applyEpisodeTrackingSetting();

    // Add event listener
    toggle.addEventListener('change', () => {
      console.log('🔧 Episode tracking toggle changed:', toggle.checked);
      applyEpisodeTrackingSetting();
    });

    // Mark as set up
    toggle.dataset.setupComplete = 'true';

    return true;
  }

  // Function to apply the setting
  function applyEpisodeTrackingSetting() {
    const enabled = toggle.checked;
    console.log('🔧 Setting episode tracking to:', enabled);
    localStorage.setItem('flicklet:episodeTracking:enabled', String(enabled));

    // Update UI visibility based on setting
    // Add a small delay to ensure cards are rendered first
    setTimeout(() => {
      updateEpisodeTrackingUI(enabled);
    }, 100);
  }

  // Function to update UI based on episode tracking setting
  function updateEpisodeTrackingUI(enabled) {
    console.log('🔧 updateEpisodeTrackingUI called with enabled:', enabled);

    // Show/hide episode tracking buttons on TV series cards
    const episodeButtons = document.querySelectorAll('[data-action="track-episodes"]');
    console.log('🔧 Found episode buttons:', episodeButtons.length);
    episodeButtons.forEach((btn, index) => {
      console.log(
        `🔧 Button ${index}:`,
        btn.textContent,
        'setting display to:',
        enabled ? 'inline-block' : 'none',
      );
      btn.style.display = enabled ? 'inline-block' : 'none';
    });

    // Update any existing progress hints
    const progressHints = document.querySelectorAll('.episode-progress-hint');
    progressHints.forEach((hint) => {
      hint.style.display = enabled ? 'inline' : 'none';
    });

    // Note: UI update handled by episode tracking system initialization
  }

  // Try to setup immediately
  if (!setupToggle()) {
    // If not found, retry every 500ms for up to 10 seconds
    let retries = 0;
    const retryInterval = setInterval(() => {
      retries++;
      console.log('🔧 Retrying to find episode tracking toggle, attempt:', retries);
      if (setupToggle() || retries >= 20) {
        clearInterval(retryInterval);
        if (retries >= 20) {
          console.warn('🔧 Failed to find episode tracking toggle after 20 attempts');
        }
      }
    }, 500);
  }

  // Expose function to update UI
  window.updateEpisodeTrackingUI = updateEpisodeTrackingUI;

  // Update UI on page load to show existing buttons
  setTimeout(() => {
    const enabled = localStorage.getItem('flicklet:episodeTracking:enabled') === 'true';
    console.log('🔧 Page load - updating episode tracking UI, enabled:', enabled);
    updateEpisodeTrackingUI(enabled);
  }, 1000);
})();
