/**
 * Process: Home Layout Guardrails
 * Purpose: Immovable Home Layout Contract - Exact 6 Section Order
 * Data Source: DOM structure validation
 * Update Path: Runs after DOM ready
 * Dependencies: None
 */

(function() {
  'use strict';
  
  console.log('🏠 Home Layout Guardrails loaded');
  
  // Immovable Home Layout Contract - Exact 6 Section Order
  const REQUIRED_HOME_SECTIONS = [
    'quote-bar',
    'group-1-your-shows',
    'group-2-community', 
    'group-3-curated',
    'group-4-trending',
    'group-5-recommended'
  ];

  function validateHomeLayout() {
    const homeContainer = document.getElementById('home-container');
    if (!homeContainer) {
      console.warn('⚠️ Home container not found - guardrails disabled');
      return;
    }

    const sections = Array.from(homeContainer.children);
    const sectionIds = sections.map(s => s.id).filter(Boolean);
    
    console.log('🔍 Current home sections:', sectionIds);
    
    // Check if all required sections exist
    const missingSections = REQUIRED_HOME_SECTIONS.filter(id => !sectionIds.includes(id));
    if (missingSections.length > 0) {
      console.error('❌ Missing required home sections:', missingSections);
      return;
    }
    
    // Check if sections are in correct order
    const correctOrder = REQUIRED_HOME_SECTIONS.every((id, index) => {
      const currentIndex = sectionIds.indexOf(id);
      return currentIndex === index;
    });
    
    if (!correctOrder) {
      console.warn('⚠️ Home sections not in correct order');
      console.log('Expected:', REQUIRED_HOME_SECTIONS);
      console.log('Actual:', sectionIds);
    } else {
      console.log('✅ Home layout validation passed');
    }
  }

  // Run validation after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateHomeLayout);
  } else {
    validateHomeLayout();
  }
})();
