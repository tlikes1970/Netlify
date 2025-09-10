/**
 * Container Alignment Fix
 * Feature Flag: FLAGS.layout_container_fix
 * Purpose: Apply shared container pattern and remove spacers
 * Data Source: Feature flag state and DOM structure
 * Update Path: Modify container application logic
 * Dependencies: flags-init.js, container-alignment.css
 */

(function() {
  'use strict';

  // Wait for flags to be initialized
  function initContainerAlignment() {
    if (!window.FLAGS || !window.FLAGS.layout_container_fix) {
      console.log('📐 Container Alignment: Feature flag disabled, skipping container alignment');
      return;
    }

    console.log('📐 Container Alignment: Applying shared container pattern');

    // Load the container alignment CSS
    loadContainerCSS();

    // Apply container classes to existing elements
    applyContainerClasses();

    // Remove spacer elements
    removeSpacers();

    // Set up mutation observer for dynamically added content
    setupMutationObserver();

    console.log('📐 Container Alignment: Container alignment enabled');
  }

  function loadContainerCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/container-alignment.css?v=container-fix';
    link.type = 'text/css';
    document.head.appendChild(link);
  }

  function applyContainerClasses() {
    // Apply container to header
    const header = document.querySelector('.header');
    if (header) {
      const container = document.createElement('div');
      container.className = 'container';
      
      // Move header content into container
      const headerContent = Array.from(header.children);
      headerContent.forEach(child => {
        if (!child.classList.contains('container')) {
          container.appendChild(child);
        }
      });
      
      header.appendChild(container);
    }

    // Apply container to tab container
    const tabContainer = document.querySelector('.tab-container');
    if (tabContainer) {
      const container = document.createElement('div');
      container.className = 'container';
      
      // Move tab buttons into container
      const tabButtons = Array.from(tabContainer.children);
      tabButtons.forEach(button => {
        container.appendChild(button);
      });
      
      tabContainer.appendChild(container);
    }

    // Apply container to search
    const topSearch = document.querySelector('.top-search');
    if (topSearch) {
      const searchHelp = topSearch.querySelector('.search-help');
      if (searchHelp) {
        const container = document.createElement('div');
        container.className = 'container';
        
        // Move search help content into container
        const searchContent = Array.from(searchHelp.children);
        searchContent.forEach(child => {
          container.appendChild(child);
        });
        
        searchHelp.appendChild(container);
      }

      const tagFilters = topSearch.querySelector('.tag-filters');
      if (tagFilters) {
        const container = document.createElement('div');
        container.className = 'container';
        
        // Move tag filters content into container
        const filterContent = Array.from(tagFilters.children);
        filterContent.forEach(child => {
          container.appendChild(child);
        });
        
        tagFilters.appendChild(container);
      }
    }

    // Apply container to all sections
    const sections = document.querySelectorAll('.tab-section, .home-section, #spotlight-row');
    sections.forEach(section => {
      if (!section.querySelector('.container')) {
        const container = document.createElement('div');
        container.className = 'container';
        
        // Move section content into container
        const sectionContent = Array.from(section.children);
        sectionContent.forEach(child => {
          container.appendChild(child);
        });
        
        section.appendChild(container);
      }
    });
  }

  function removeSpacers() {
    // Look for spacer elements between tab rail and first section
    const tabContainer = document.querySelector('.tab-container');
    const firstSection = document.querySelector('.tab-section, .home-section');
    
    if (tabContainer && firstSection) {
      // Check for elements between tab container and first section
      let element = tabContainer.nextElementSibling;
      while (element && element !== firstSection) {
        // Check if this looks like a spacer (empty div, specific classes, etc.)
        if (element.tagName === 'DIV' && 
            (element.children.length === 0 || 
             element.classList.contains('spacer') ||
             element.style.height ||
             element.style.margin)) {
          console.log('📐 Container Alignment: Removing spacer element:', element);
          element.remove();
        }
        element = element.nextElementSibling;
      }
    }

    // Remove any empty sections or divs that might be spacers
    const emptySections = document.querySelectorAll('div:empty, section:empty');
    emptySections.forEach(section => {
      if (section.offsetHeight > 0) { // Only remove if it has height (spacer)
        console.log('📐 Container Alignment: Removing empty spacer:', section);
        section.remove();
      }
    });
  }

  function setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any new sections were added
          const hasNewSections = Array.from(mutation.addedNodes).some(node => {
            return node.nodeType === 1 && (
              node.classList.contains('tab-section') || 
              node.classList.contains('home-section') ||
              node.id === 'spotlight-row'
            );
          });

          if (hasNewSections) {
            setTimeout(() => {
              applyContainerClasses();
              removeSpacers();
            }, 100);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContainerAlignment);
  } else {
    initContainerAlignment();
  }

})();

