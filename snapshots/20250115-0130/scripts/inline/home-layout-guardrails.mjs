/**
 * Process: Home Layout Guardrails
 * Purpose: Immovable Home Layout Contract - Exact 6 Section Order
 * Data Source: DOM structure validation
 * Update Path: Runs after DOM ready
 * Dependencies: None
 */

// Wait for DOM ready
function initialize() {
  console.log('🏠 Home Layout Guardrails loaded');
  
  // Immovable Home Layout Contract - Exact 6 Section Order
  const REQUIRED_HOME_SECTIONS = [
    'quote-bar',
    'group-1-your-shows',
    'group-2-community', 
    'group-3-for-you',
    'group-4-theaters',
    'group-5-feedback'
  ];
  
  // Runtime Order Assertion
  function assertHomeOrder() {
    const homeRoot = document.getElementById('homeSection');
    if (!homeRoot) {
      console.error('❌ HOME ORDER VIOLATION: homeSection not found');
      return false;
    }
    
    const children = Array.from(homeRoot.children);
    const sectionIds = children.map(child => child.id).filter(id => id);
    
    console.log('🏠 Home sections found:', sectionIds);
    
    // Check if all required sections exist in correct order
    let orderViolation = false;
    REQUIRED_HOME_SECTIONS.forEach((requiredId, index) => {
      const foundIndex = sectionIds.indexOf(requiredId);
      if (foundIndex === -1) {
        console.error(`❌ HOME ORDER VIOLATION: Missing required section "${requiredId}"`);
        orderViolation = true;
      } else if (foundIndex !== index) {
        console.error(`❌ HOME ORDER VIOLATION: Section "${requiredId}" at position ${foundIndex}, expected ${index}`);
        orderViolation = true;
      }
    });
    
    // Check for unexpected sections
    sectionIds.forEach((id, index) => {
      if (!REQUIRED_HOME_SECTIONS.includes(id)) {
        console.error(`❌ HOME ORDER VIOLATION: Unexpected section "${id}" at position ${index}`);
        orderViolation = true;
      }
    });
    
    if (orderViolation) {
      console.error('❌ HOME ORDER VIOLATION: Correcting layout...');
      // Remove unexpected sections
      children.forEach(child => {
        if (child.id && !REQUIRED_HOME_SECTIONS.includes(child.id)) {
          console.warn(`🗑️ Removing unexpected section: ${child.id}`);
          child.remove();
        }
      });
    }
    
    return !orderViolation;
  }
  
  // Clean up any duplicate sections
  function cleanupDuplicates() {
    const homeRoot = document.getElementById('homeSection');
    if (!homeRoot) return;
    
    const seen = new Set();
    const children = Array.from(homeRoot.children);
    
    children.forEach(child => {
      if (child.id) {
        if (seen.has(child.id)) {
          console.warn(`🗑️ Removing duplicate section: ${child.id}`);
          child.remove();
        } else {
          seen.add(child.id);
        }
      }
    });
  }
  
  // Enhanced Quote Bar Management
  function manageQuoteBar() {
    const quoteBar = document.getElementById('quote-bar');
    if (!quoteBar) return;
    
    // Ensure quote bar is visible and properly styled
    if (quoteBar.style.display === 'none') {
      quoteBar.style.display = 'block';
    }
    
    // Add fade-in animation if not already present
    if (!quoteBar.dataset.animated) {
      quoteBar.style.opacity = '0';
      quoteBar.dataset.animated = 'true';
      
      // Fade in after a short delay
      setTimeout(() => {
        if (quoteBar.parentNode) {
          quoteBar.style.transition = 'opacity 0.3s ease';
          quoteBar.style.opacity = '1';
        }
      }, 100);
    }
  }
  
  // Enhanced Game Cards Management
  function manageGameCards() {
    const triviaTile = document.getElementById('triviaTile');
    const flickwordCard = document.getElementById('flickwordCard');
    
    if (triviaTile) {
      // Ensure trivia tile is properly positioned
      if (triviaTile.style.display === 'none') {
        triviaTile.style.display = 'block';
      }
      
      // Add fade-in animation
      if (!triviaTile.dataset.animated) {
        triviaTile.style.opacity = '0';
        triviaTile.dataset.animated = 'true';
        
        setTimeout(() => {
          if (triviaTile.parentNode) {
            triviaTile.style.transition = 'opacity 0.3s ease';
            triviaTile.style.opacity = '1';
          }
        }, 200);
      }
    }
    
    if (flickwordCard) {
      // Ensure flickword card is properly positioned
      if (flickwordCard.style.display === 'none') {
        flickwordCard.style.display = 'block';
      }
      
      // Add fade-in animation
      if (!flickwordCard.dataset.animated) {
        flickwordCard.style.opacity = '0';
        flickwordCard.dataset.animated = 'true';
        
        setTimeout(() => {
          if (flickwordCard.parentNode) {
            flickwordCard.style.transition = 'opacity 0.3s ease';
            flickwordCard.style.opacity = '1';
          }
        }, 300);
      }
    }
  }
  
  // Enhanced Layout Validation
  function validateLayout() {
    console.log('🔍 Running enhanced layout validation...');
    
    // Check home order
    const homeOrderValid = assertHomeOrder();
    
    // Clean up duplicates
    cleanupDuplicates();
    
    // Manage quote bar
    manageQuoteBar();
    
    // Manage game cards
    manageGameCards();
    
    // Log validation results
    if (homeOrderValid) {
      console.log('✅ Home layout validation passed');
    } else {
      console.warn('⚠️ Home layout validation failed - corrections applied');
    }
    
    // Check for game cards
    const gameCards = {
      triviaTile: !!document.getElementById('triviaTile'),
      flickwordCard: !!document.getElementById('flickwordCard')
    };
    
    console.log('🎮 Game cards status:', gameCards);
  }
  
  // Enhanced Theme Management
  function manageTheme() {
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        console.log('🎨 Theme changed to:', theme);
        
        // Apply theme immediately
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update other theme selects on the page
        document.querySelectorAll('select[name="theme"]').forEach(select => {
          if (select !== e.target) {
            select.value = theme;
          }
        });
      });
    }
    
    // Listen for theme changes from other sources
    document.addEventListener('themeChanged', (e) => {
      const theme = e.detail.theme;
      console.log('🎨 Theme changed via event:', theme);
      
      // Update all theme selects
      document.querySelectorAll('select[name="theme"]').forEach(select => {
        select.value = theme;
      });
      
      // Apply theme
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
    
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update all theme selects
    document.querySelectorAll('select[name="theme"]').forEach(select => {
      select.value = savedTheme;
    });
  }
  
  // Enhanced Settings Management
  function manageSettings() {
    // Listen for settings changes
    document.addEventListener('settingsChanged', (e) => {
      const { key, value } = e.detail;
      console.log('⚙️ Setting changed:', key, '=', value);
      
      // Apply setting immediately
      localStorage.setItem(key, value);
      
      // Update UI elements
      const input = document.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = value;
      }
      
      // Apply theme changes
      if (key === 'theme') {
        document.documentElement.setAttribute('data-theme', value);
      }
    });
    
    // Initialize settings from localStorage
    const settings = ['theme', 'language', 'episodeTracking', 'curatedRowsCount', 'currentlyWatchingLimit'];
    settings.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
          input.value = value;
        }
        
        // Apply theme immediately
        if (key === 'theme') {
          document.documentElement.setAttribute('data-theme', value);
        }
      }
    });
  }
  
  // Enhanced Layout Observer
  function setupLayoutObserver() {
    const homeSection = document.getElementById('homeSection');
    if (!homeSection) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          console.log('🔄 Home section children changed, re-validating...');
          
          // Clean up duplicates
          cleanupDuplicates();
          
          // Re-validate layout
          setTimeout(() => {
            validateLayout();
          }, 100);
        }
      });
    });
    
    observer.observe(homeSection, { childList: true, subtree: true });
    
    // Also observe for attribute changes
    const layoutSection = document.getElementById('layoutSection');
    if (layoutSection) {
      const layoutObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            console.log('🔄 Layout section class changed, re-validating...');
            setTimeout(() => {
              validateLayout();
            }, 100);
          }
        });
      });
      
      observer.observe(layoutSection, { attributes: true, attributeFilter: ['class'] });
    }
  }
  
  // Enhanced Initialization
  function initializeEnhanced() {
    console.log('🚀 Enhanced Home Layout Guardrails initializing...');
    
    // Set up observers
    setupLayoutObserver();
    
    // Manage theme
    manageTheme();
    
    // Manage settings
    manageSettings();
    
    // Initial validation
    validateLayout();
    
    // Set up periodic validation (as backup)
    setInterval(() => {
      validateLayout();
    }, 5000);
    
    console.log('✅ Enhanced Home Layout Guardrails initialized');
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhanced);
  } else {
    initializeEnhanced();
  }
  
  // Also run validation when homeSection becomes available
  const checkHomeSection = setInterval(() => {
    const homeSection = document.getElementById('homeSection');
    if (homeSection) {
      console.log('🏠 Home section found, running validation...');
      validateLayout();
      clearInterval(checkHomeSection);
    }
  }, 100);
  
  // Enhanced Layout Observer for homeSection
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        console.log('🔄 Home section children changed, re-validating...');
        
        // Clean up duplicates
        cleanupDuplicates();
        
        // Re-validate layout
        setTimeout(() => {
          validateLayout();
        }, 100);
      }
    });
  });
  
  // Start observing when homeSection is available
  const checkHomeSection2 = setInterval(() => {
    const homeSection = document.getElementById('homeSection');
    if (homeSection) {
      observer.observe(homeSection, { childList: true, subtree: true });
      clearInterval(checkHomeSection2);
    }
  }, 100);
}

// Initialize
initialize();
