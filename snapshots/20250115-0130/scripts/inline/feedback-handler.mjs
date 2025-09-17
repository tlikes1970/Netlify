/**
 * Process: Feedback Handler
 * Purpose: Handle feedback link opening
 * Data Source: User interactions
 * Update Path: Runs on user interaction
 * Dependencies: None
 */

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
        
        // Wait for About tab to load, then scroll to feedback
        setTimeout(() => {
          const feedbackSection = document.querySelector('#about .settings-subsection:last-child');
          if (feedbackSection) {
            feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        console.warn('💬 About tab not found');
      }
    }, 100);
  } else {
    // Fallback: try to find and click settings tab directly
    const settingsTab = document.querySelector('.settings-tabs button[data-target="#settings"]');
    if (settingsTab) {
      settingsTab.click();
      
      setTimeout(() => {
        const aboutTab = document.querySelector('.settings-tabs button[data-target="#about"]');
        if (aboutTab) {
          aboutTab.click();
          
          setTimeout(() => {
            const feedbackSection = document.querySelector('#about .settings-subsection:last-child');
            if (feedbackSection) {
              feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      }, 100);
    } else {
      console.warn('💬 Settings tab not found');
      alert('Please go to Settings → About to share your feedback');
    }
  }
}

// Export globally
window.openSettingsToFeedback = openSettingsToFeedback;
