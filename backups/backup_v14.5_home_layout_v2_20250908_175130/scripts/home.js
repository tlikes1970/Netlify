/**
 * Home Layout v2 - Option B Structure
 * 
 * ORDER (LOCKED):
 * 1. Search / Nav
 * 2. My Library (Currently Watching, Next Up)
 * 3. Community (Spotlight video, Games)
 * 4. Curated (Trending/Staff Picks/New This Week)
 * 5. Personalized (Row #1, Row #2 Ghost)
 * 6. In Theaters Near Me
 * 7. Feedback (banner → modal)
 */

(function() {
  'use strict';

  console.log('🏠 Home Layout v2 loaded');
  
  // Feature flag check
  const USE_V2 = !!(window.FLAGS && window.FLAGS.home_layout_v2);
  if (!USE_V2) {
    console.log('🚫 Home Layout v2 disabled by feature flag');
    return;
  }

  // Helper function to create section HTML
  function createSection(id, titleKey, subtitleKey, className = '') {
    return `
      <section class="section ${className}" id="section-${id}">
        <header class="section__header">
          <h3 data-i18n="${titleKey}">${titleKey}</h3>
          <p class="section__subtitle" data-i18n="${subtitleKey}">${subtitleKey}</p>
        </header>
        <div class="section__body" id="section-${id}-body"></div>
      </section>
    `;
  }

  // Mount My Library section
  function mountMyLibrary() {
    console.log('📚 Mounting My Library section');
    const container = document.getElementById('homeSection');
    if (!container) return;

    const sectionHTML = createSection(
      'my-library',
      'home.my_library',
      'home.my_library_sub'
    );
    
    // Insert after search/nav, before any existing content
    const searchSection = document.querySelector('.search-section, .top-search');
    if (searchSection) {
      searchSection.insertAdjacentHTML('afterend', sectionHTML);
    } else {
      container.insertAdjacentHTML('afterbegin', sectionHTML);
    }

    // Mount existing components into the section body
    const sectionBody = document.getElementById('section-my-library-body');
    if (sectionBody) {
      // Move currently watching preview
      const cwPreview = document.getElementById('currentlyWatchingPreview');
      if (cwPreview) {
        sectionBody.appendChild(cwPreview);
      }

      // Move next up row
      const nextUpRow = document.getElementById('next-up-row');
      if (nextUpRow) {
        sectionBody.appendChild(nextUpRow);
      }
    }
  }

  // Mount Community section
  function mountCommunity() {
    console.log('👥 Mounting Community section');
    const container = document.getElementById('homeSection');
    if (!container) return;

    const sectionHTML = createSection(
      'community',
      'home.community',
      'home.community_sub',
      'section--community'
    );
    
    // Insert after My Library
    const myLibrarySection = document.getElementById('section-my-library');
    if (myLibrarySection) {
      myLibrarySection.insertAdjacentHTML('afterend', sectionHTML);
    } else {
      container.insertAdjacentHTML('beforeend', sectionHTML);
    }

    // Mount existing components into the section body
    const sectionBody = document.getElementById('section-community-body');
    if (sectionBody) {
      // Move spotlight row
      const spotlightRow = document.getElementById('spotlight-row');
      if (spotlightRow) {
        sectionBody.appendChild(spotlightRow);
      }

      // Create games placeholder (will be implemented later)
      const gamesPlaceholder = document.createElement('div');
      gamesPlaceholder.className = 'games-placeholder';
      gamesPlaceholder.innerHTML = '<p>Community games coming soon...</p>';
      sectionBody.appendChild(gamesPlaceholder);
    }
  }

  // Mount Curated section
  function mountCurated() {
    console.log('🎯 Mounting Curated section');
    const container = document.getElementById('homeSection');
    if (!container) return;

    const sectionHTML = createSection(
      'curated',
      'home.curated',
      'home.curated_sub'
    );
    
    // Insert after Community
    const communitySection = document.getElementById('section-community');
    if (communitySection) {
      communitySection.insertAdjacentHTML('afterend', sectionHTML);
    } else {
      container.insertAdjacentHTML('beforeend', sectionHTML);
    }

    // Mount existing components into the section body
    const sectionBody = document.getElementById('section-curated-body');
    if (sectionBody) {
      // Move curated sections
      const curatedSections = document.getElementById('curatedSections');
      if (curatedSections) {
        sectionBody.appendChild(curatedSections);
      }
    }
  }

  // Mount Personalized section
  function mountPersonalized() {
    console.log('🎨 Mounting Personalized section');
    const container = document.getElementById('homeSection');
    if (!container) return;

    const sectionHTML = createSection(
      'personalized',
      'home.personalized',
      'home.personalized_sub'
    );
    
    // Insert after Curated
    const curatedSection = document.getElementById('section-curated');
    if (curatedSection) {
      curatedSection.insertAdjacentHTML('afterend', sectionHTML);
    } else {
      container.insertAdjacentHTML('beforeend', sectionHTML);
    }

    // Mount existing components into the section body
    const sectionBody = document.getElementById('section-personalized-body');
    if (sectionBody) {
      // Create placeholder for personalized content
      const placeholder = document.createElement('div');
      placeholder.className = 'personalized-placeholder';
      placeholder.innerHTML = '<p>Personalized recommendations coming soon...</p>';
      sectionBody.appendChild(placeholder);
    }
  }

  // Mount Theaters section
  function mountTheaters() {
    console.log('🎬 Mounting Theaters section');
    const container = document.getElementById('homeSection');
    if (!container) return;

    const sectionHTML = createSection(
      'theaters',
      'home.theaters',
      'home.theaters_sub'
    );
    
    // Insert after Personalized
    const personalizedSection = document.getElementById('section-personalized');
    if (personalizedSection) {
      personalizedSection.insertAdjacentHTML('afterend', sectionHTML);
    } else {
      container.insertAdjacentHTML('beforeend', sectionHTML);
    }

    // Mount existing components into the section body
    const sectionBody = document.getElementById('section-theaters-body');
    if (sectionBody) {
      // Move theaters row
      const theatersRow = document.getElementById('theaters-row');
      if (theatersRow) {
        sectionBody.appendChild(theatersRow);
      }
    }
  }

  // Mount Feedback section
  function mountFeedbackBanner() {
    console.log('💬 Mounting Feedback section');
    const container = document.getElementById('homeSection');
    if (!container) return;

    const sectionHTML = createSection(
      'feedback',
      'home.feedback',
      'home.feedback_sub'
    );
    
    // Insert after Theaters
    const theatersSection = document.getElementById('section-theaters');
    if (theatersSection) {
      theatersSection.insertAdjacentHTML('afterend', sectionHTML);
    } else {
      container.insertAdjacentHTML('beforeend', sectionHTML);
    }

    // Mount feedback banner into the section body
    const sectionBody = document.getElementById('section-feedback-body');
    if (sectionBody) {
      // Initialize feedback banner component
      if (window.feedbackBanner) {
        window.feedbackBanner.init();
      } else {
        // Fallback if component not loaded
        const feedbackBanner = document.createElement('div');
        feedbackBanner.className = 'feedback-banner';
        feedbackBanner.innerHTML = `
          <div class="feedback-banner__content">
            <p data-i18n="feedback.banner_cta">Share your thoughts</p>
            <button class="btn btn-primary" id="feedback-banner-btn">
              <span data-i18n="feedback.modal_title">Send Feedback</span>
            </button>
          </div>
        `;
        sectionBody.appendChild(feedbackBanner);
      }
    }
  }

  // Initialize Home Layout v2
  function initHomeLayoutV2() {
    console.log('🏠 Initializing Home Layout v2');
    
    // Mount sections in Option B order
    mountMyLibrary();
    mountCommunity();
    mountCurated();
    mountPersonalized();
    mountTheaters();
    mountFeedbackBanner();

    // Set up feedback banner click handler
    const feedbackBtn = document.getElementById('feedback-banner-btn');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => {
        console.log('💬 Opening feedback modal');
        // TODO: Open feedback modal
        alert('Feedback modal will open here');
      });
    }

    console.log('✅ Home Layout v2 initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeLayoutV2);
  } else {
    initHomeLayoutV2();
  }

  // Expose globally for debugging
  window.initHomeLayoutV2 = initHomeLayoutV2;

})();
