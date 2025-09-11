/**
 * Responsive Layout Loader
 * Feature Flag: FLAGS.layout_responsive_v1
 * Purpose: Conditionally load responsive layout CSS
 * Data Source: Feature flag state
 * Update Path: Modify CSS loading logic
 * Dependencies: flags-init.js, responsive-layout.css
 */

(function() {
  'use strict';

  // Wait for flags to be initialized
  function initResponsiveLayout() {
    if (!window.FLAGS || !window.FLAGS.layout_responsive_v1) {
      console.log('📱 Responsive Layout: Feature flag disabled, skipping responsive layout');
      return;
    }

    console.log('📱 Responsive Layout: Loading responsive layout styles');

    // Create and inject the responsive layout CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/responsive-layout.css?v=responsive-v1';
    link.type = 'text/css';
    
    // Add to head
    document.head.appendChild(link);

    // Apply responsive classes to existing elements
    applyResponsiveClasses();

    // Set up resize observer for dynamic adjustments
    setupResizeObserver();

    console.log('📱 Responsive Layout: Responsive layout enabled');
  }

  function applyResponsiveClasses() {
    // Apply responsive classes to existing elements
    const appContainer = document.querySelector('.app-container') || document.querySelector('#app');
    if (appContainer) {
      appContainer.classList.add('app-container');
    }

    const mainContainer = document.querySelector('.main-container') || document.querySelector('main');
    if (mainContainer) {
      mainContainer.classList.add('main-container');
    }

    // Apply section classes
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => {
      section.classList.add('section');
    });

    // Apply row classes
    const rows = document.querySelectorAll('.row, [data-row]');
    rows.forEach(row => {
      const container = row.querySelector('.row-container') || row;
      container.classList.add('row-container');
      
      const cards = row.querySelectorAll('.card, .show-card, .movie-card');
      if (cards.length > 0) {
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'row-cards';
        
        cards.forEach(card => {
          cardsContainer.appendChild(card);
        });
        
        container.appendChild(cardsContainer);
      }
    });
  }

  function setupResizeObserver() {
    if (!window.ResizeObserver) return;

    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target;
        
        // Adjust row scrolling based on container width
        if (element.classList.contains('row-container')) {
          const cards = element.querySelector('.row-cards');
          if (cards) {
            const containerWidth = entry.contentRect.width;
            const cardsWidth = cards.scrollWidth;
            
            if (cardsWidth <= containerWidth) {
              element.style.overflowX = 'hidden';
            } else {
              element.style.overflowX = 'auto';
            }
          }
        }
      });
    });

    // Observe all row containers
    const rowContainers = document.querySelectorAll('.row-container');
    rowContainers.forEach(container => {
      resizeObserver.observe(container);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResponsiveLayout);
  } else {
    initResponsiveLayout();
  }

  // Re-initialize when new content is added (for dynamic rows)
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any new rows were added
        const hasNewRows = Array.from(mutation.addedNodes).some(node => {
          return node.nodeType === 1 && (
            node.classList.contains('row') || 
            node.querySelector('.row') ||
            node.hasAttribute('data-row')
          );
        });

        if (hasNewRows) {
          setTimeout(applyResponsiveClasses, 100);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();




