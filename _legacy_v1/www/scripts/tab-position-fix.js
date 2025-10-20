/**
 * Process: Tab Position Fix
 * Purpose: Ensure tab container stays between search bar and home content
 * Data Source: DOM structure analysis showing tabs appearing at bottom
 * Update Path: Modify this script if tab positioning needs adjustment
 * Dependencies: .top-search element, .tab-container element, #homeSection
 */

(function () {
  'use strict';

  console.log('🔧 Tab Position Fix loaded');

  function ensureTabPosition() {
    const searchBar = document.querySelector('.top-search');
    const tabContainer = document.querySelector('.tab-container');
    const homeSection = document.getElementById('homeSection');

    if (!searchBar || !tabContainer || !homeSection) {
      console.log('⚠️ Required elements not found, retrying...');
      setTimeout(ensureTabPosition, 100);
      return;
    }

    // Check if tab container is in the correct position
    const searchRect = searchBar.getBoundingClientRect();
    const tabRect = tabContainer.getBoundingClientRect();
    const homeRect = homeSection.getBoundingClientRect();

    // If tabs are below home content, move them to correct position
    if (tabRect.top > homeRect.top) {
      console.log('🔧 Moving tab container to correct position...');

      // Move tab container to be after search bar
      searchBar.insertAdjacentElement('afterend', tabContainer);

      console.log('✅ Tab container repositioned');
    } else {
      console.log('✅ Tab container is in correct position');
    }
  }

  // Run immediately
  ensureTabPosition();

  // Also run after a delay to catch any dynamic content changes
  setTimeout(ensureTabPosition, 1000);

  // Run when home content is loaded
  document.addEventListener('DOMContentLoaded', ensureTabPosition);

  // Run when window loads
  window.addEventListener('load', ensureTabPosition);
})();
