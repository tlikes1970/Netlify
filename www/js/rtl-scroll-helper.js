/**
 * RTL-Safe Scroll Helper
 * Provides RTL-aware scrolling functions for horizontal rails
 */

(function() {
  'use strict';
  
  // RTL-safe scroll function
  function scrollRail(rail, px) {
    if (!rail) return;
    
    const dir = document.dir === 'rtl' ? -1 : 1;
    rail.scrollBy({ 
      left: dir * px, 
      behavior: 'smooth' 
    });
  }
  
  // Scroll to start of rail
  function scrollRailToStart(rail) {
    if (!rail) return;
    
    const start = document.dir === 'rtl' ? 'right' : 'left';
    rail.scrollTo({ 
      [start]: 0, 
      behavior: 'smooth' 
    });
  }
  
  // Scroll to end of rail
  function scrollRailToEnd(rail) {
    if (!rail) return;
    
    const end = document.dir === 'rtl' ? 'left' : 'right';
    rail.scrollTo({ 
      [end]: rail.scrollWidth, 
      behavior: 'smooth' 
    });
  }
  
  // Check if rail can scroll in a direction
  function canScrollLeft(rail) {
    if (!rail) return false;
    return document.dir === 'rtl' 
      ? rail.scrollLeft < rail.scrollWidth - rail.clientWidth
      : rail.scrollLeft > 0;
  }
  
  function canScrollRight(rail) {
    if (!rail) return false;
    return document.dir === 'rtl'
      ? rail.scrollLeft > 0
      : rail.scrollLeft < rail.scrollWidth - rail.clientWidth;
  }
  
  // Update scroll indicators based on scroll position
  function updateScrollIndicators(rail) {
    if (!rail) return;
    
    const canLeft = canScrollLeft(rail);
    const canRight = canScrollRight(rail);
    
    rail.classList.toggle('scrollable-left', canLeft);
    rail.classList.toggle('scrollable-right', canRight);
  }
  
  // Initialize scroll indicators for all rails
  function initScrollIndicators() {
    const rails = document.querySelectorAll('.preview-row-scroll, .tabs-rail');
    
    rails.forEach(rail => {
      // Initial state
      updateScrollIndicators(rail);
      
      // Update on scroll
      rail.addEventListener('scroll', () => {
        updateScrollIndicators(rail);
      });
      
      // Update on resize
      window.addEventListener('resize', () => {
        updateScrollIndicators(rail);
      });
    });
  }
  
  // Keyboard navigation for rails
  function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      const rail = e.target.closest('.preview-row-scroll, .tabs-rail');
      if (!rail) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          scrollRail(rail, -200);
          break;
        case 'ArrowRight':
          e.preventDefault();
          scrollRail(rail, 200);
          break;
        case 'Home':
          e.preventDefault();
          scrollRailToStart(rail);
          break;
        case 'End':
          e.preventDefault();
          scrollRailToEnd(rail);
          break;
      }
    });
  }
  
  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    initScrollIndicators();
    initKeyboardNavigation();
  }
  
  // Export functions globally
  window.scrollRail = scrollRail;
  window.scrollRailToStart = scrollRailToStart;
  window.scrollRailToEnd = scrollRailToEnd;
  window.canScrollLeft = canScrollLeft;
  window.canScrollRight = canScrollRight;
  window.updateScrollIndicators = updateScrollIndicators;
  
  // Auto-initialize
  init();
  
})();



