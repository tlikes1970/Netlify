function openSettingsToFeedback() {
  console.log('💬 Opening settings to feedback section');

  // Use the global switchToTab function if available
  if (typeof window.switchToTab === 'function') {
    window.switchToTab('settings');

    // Wait for settings to load, then switch to About tab
    setTimeout(() => {
      const aboutTab = document.querySelector('.settings-tabs button[data-target="#about"]');
      if (aboutTab) {
        aboutTab.click();

        // Scroll to feedback section
        setTimeout(() => {
          const feedbackSection = document.querySelector('#about .settings-subsection:last-child');
          if (feedbackSection) {
            feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }, 200);
  } else {
    // Fallback to direct tab click
    const settingsTab = document.getElementById('settingsTab');
    if (settingsTab) {
      settingsTab.click();

      // Wait for settings to load, then switch to About tab
      setTimeout(() => {
        const aboutTab = document.querySelector('.settings-tabs button[data-target="#about"]');
        if (aboutTab) {
          aboutTab.click();

          // Scroll to feedback section
          setTimeout(() => {
            const feedbackSection = document.querySelector(
              '#about .settings-subsection:last-child',
            );
            if (feedbackSection) {
              feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      }, 200);
    } else {
      console.warn('💬 Settings tab not found');
      alert('Please go to Settings → About to share your feedback');
    }
  }
}
