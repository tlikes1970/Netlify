/**
 * Optimized Home Loading System
 * Purpose: Fast, flicker-free home tab loading with proper loading states
 * Data Source: Cached sections, lazy loading, batched DOM operations
 * Update Path: Modify section order or add new sections here
 * Dependencies: Home Layout V2, section mounting functions
 */

(function () {
  'use strict';

  console.log('🚀 Optimized Home Loader loaded');

  // Cache for created sections to avoid recreation
  const sectionCache = new Map();
  const loadingStates = new Map();

  // Section loading order (critical first, then nice-to-have)
  // Using the correct IDs that existing code expects
  const SECTION_LOAD_ORDER = [
    { id: 'currentlyWatchingPreview', priority: 'critical', mountFn: 'mountMyLibrary' },
    { id: 'curatedSections', priority: 'critical', mountFn: 'mountCurated' },
    { id: 'section-personalized', priority: 'high', mountFn: 'mountPersonalized' },
    { id: 'spotlight-row', priority: 'medium', mountFn: 'mountCommunity' },
    { id: 'theaters-section', priority: 'medium', mountFn: 'mountTheaters' },
    { id: 'feedbackSection', priority: 'low', mountFn: 'mountFeedbackBanner' },
  ];

  // Create skeleton content for each section
  function createSkeletonContent(sectionId) {
    const skeletons = {
      currentlyWatchingPreview: `
        <div class="section__body">
          <div class="loading-skeleton skeleton-card"></div>
          <div class="loading-skeleton skeleton-card"></div>
        </div>
      `,
      curatedSections: `
        <div class="section__body">
          <div class="loading-skeleton skeleton-text long"></div>
          <div class="loading-skeleton skeleton-text medium"></div>
          <div class="loading-skeleton skeleton-card"></div>
        </div>
      `,
      'section-personalized': `
        <div class="section__body">
          <div class="loading-skeleton skeleton-text short"></div>
          <div class="loading-skeleton skeleton-card"></div>
        </div>
      `,
      'spotlight-row': `
        <div class="section__body">
          <div class="loading-skeleton skeleton-card"></div>
        </div>
      `,
      'theaters-section': `
        <div class="section__body">
          <div class="loading-skeleton skeleton-text medium"></div>
          <div class="loading-skeleton skeleton-card"></div>
        </div>
      `,
      feedbackSection: `
        <div class="section__body">
          <div class="loading-skeleton skeleton-text long"></div>
        </div>
      `,
    };

    return (
      skeletons[sectionId] ||
      '<div class="section__body"><div class="loading-skeleton skeleton-card"></div></div>'
    );
  }

  // Create section element with skeleton
  function createSectionWithSkeleton(sectionId, title, subtitle) {
    const section = document.createElement('section');
    section.id = sectionId; // Use the exact ID expected by existing code
    section.className = 'section';

    section.innerHTML = `
      <div class="section__header">
        <h3 class="section__title">${title}</h3>
        <p class="section__subtitle">${subtitle}</p>
      </div>
      ${createSkeletonContent(sectionId)}
    `;

    // Add loading state
    section.classList.add('section-loading');
    loadingStates.set(sectionId, 'loading');

    return section;
  }

  // Mount section with proper error handling
  async function mountSection(sectionId, mountFn) {
    try {
      console.log(`🏠 Mounting ${sectionId}...`);

      // Get section element
      let section = document.getElementById(sectionId);
      if (!section) {
        console.warn(`⚠️ Section ${sectionId} not found, skipping`);
        return;
      }

      // Call the mount function
      if (typeof window[mountFn] === 'function') {
        await window[mountFn]();
        console.log(`✅ ${sectionId} mounted successfully`);
      } else {
        console.warn(`⚠️ Mount function ${mountFn} not available`);
      }

      // Remove loading state
      section.classList.remove('section-loading');
      loadingStates.set(sectionId, 'loaded');
    } catch (error) {
      console.error(`❌ Failed to mount ${sectionId}:`, error);
      loadingStates.set(sectionId, 'error');
    }
  }

  // Batch DOM operations for better performance
  function batchDOMOperations(operations) {
    // Use requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      operations.forEach((operation) => {
        try {
          operation();
        } catch (error) {
          console.error('❌ DOM operation failed:', error);
        }
      });
    });
  }

  // Optimized home loading with proper sequencing
  async function loadHomeOptimized() {
    console.log('🏠 Starting optimized home loading...');

    // Start performance monitoring
    if (window.PerformanceMonitor) {
      window.PerformanceMonitor.startHomeLoad();
    }

    const homeContainer = document.getElementById('homeSection');
    if (!homeContainer) {
      console.error('❌ Home container not found');
      return;
    }

    // Phase 1: Create skeleton placeholders for sections that don't exist yet
    const skeletonPlaceholders = [];

    SECTION_LOAD_ORDER.forEach(({ id, title, subtitle }) => {
      // Only create skeleton if section doesn't exist
      if (!document.getElementById(id)) {
        const skeleton = createSectionWithSkeleton(id, title, subtitle);
        skeletonPlaceholders.push(skeleton);
      }
    });

    // Add skeleton placeholders to DOM
    if (skeletonPlaceholders.length > 0) {
      batchDOMOperations([
        () => {
          skeletonPlaceholders.forEach((skeleton) => {
            homeContainer.appendChild(skeleton);
          });
        },
      ]);
    }

    // Phase 2: Load sections in priority order with proper delays
    const criticalSections = SECTION_LOAD_ORDER.filter((s) => s.priority === 'critical');
    const highPrioritySections = SECTION_LOAD_ORDER.filter((s) => s.priority === 'high');
    const mediumPrioritySections = SECTION_LOAD_ORDER.filter((s) => s.priority === 'medium');
    const lowPrioritySections = SECTION_LOAD_ORDER.filter((s) => s.priority === 'low');

    // Load critical sections immediately
    for (const section of criticalSections) {
      await mountSection(section.id, section.mountFn);
    }

    // Load high priority sections after a short delay
    setTimeout(async () => {
      for (const section of highPrioritySections) {
        await mountSection(section.id, section.mountFn);
      }
    }, 100);

    // Load medium priority sections
    setTimeout(async () => {
      for (const section of mediumPrioritySections) {
        await mountSection(section.id, section.mountFn);
      }
    }, 200);

    // Load low priority sections last
    setTimeout(async () => {
      for (const section of lowPrioritySections) {
        await mountSection(section.id, section.mountFn);
      }

      // End performance monitoring
      if (window.PerformanceMonitor) {
        window.PerformanceMonitor.endHomeLoad();
      }
    }, 300);

    console.log('✅ Optimized home loading completed');
  }

  // Check if section is already loaded
  function isSectionLoaded(sectionId) {
    return loadingStates.get(sectionId) === 'loaded';
  }

  // Get loading status
  function getLoadingStatus() {
    const status = {};
    SECTION_LOAD_ORDER.forEach(({ id }) => {
      status[id] = loadingStates.get(id) || 'pending';
    });
    return status;
  }

  // Expose optimized loading function
  window.loadHomeOptimized = loadHomeOptimized;
  window.isSectionLoaded = isSectionLoaded;
  window.getLoadingStatus = getLoadingStatus;

  console.log('✅ Optimized Home Loader ready');
})();
