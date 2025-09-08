/* ========== play-along.js ==========
   Play Along Row - Trivia & FlickWord tiles
   Compact horizontal row with square tiles
   Hides if no content available
*/

(function(){
  'use strict';

  // Check if feature is enabled
  if (!window.FLAGS?.homeRowPlayAlong) {
    console.log('🎮 Play Along disabled by feature flag');
    return;
  }

  const section = document.getElementById('playalong-row');
  if (!section) {
    console.warn('🎮 Play Along row not found');
    return;
  }

  console.log('🎮 Initializing Play Along row...');

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPlayAlongRow);
  } else {
    renderPlayAlongRow();
  }

  /**
   * Process: Play Along Row Rendering
   * Purpose: Renders Trivia and FlickWord tiles if content is available
   * Data Source: fetchDailyTrivia() and fetchFlickWord() functions
   * Update Path: Modify tile content or add new tile types in this function
   * Dependencies: fetchDailyTrivia, fetchFlickWord, openTrivia, openFlickWord, openFeedbackOrComingSoon
   */
  async function renderPlayAlongRow() {
    if (!window.FLAGS?.homeRowPlayAlong) return;

    const section = document.getElementById('playalong-row');
    if (!section) return;

    const inner = section.querySelector('.row-inner');
    if (!inner) return;

    console.log('🎮 Fetching Play Along content...');

    // Fetch content (gracefully handle missing helpers)
    const [trivia, flickword] = await Promise.all([
      (typeof fetchDailyTrivia === 'function' ? fetchDailyTrivia() : Promise.resolve(null)),
      (typeof fetchFlickWord === 'function' ? fetchFlickWord() : Promise.resolve(null)),
    ]);

    inner.innerHTML = '';

        if (trivia) {
          console.log('🎮 Adding Trivia tile');
          const t = document.createElement('div');
          t.className = 'tile tile-trivia';
          t.innerHTML = `<div class="icon" aria-hidden="true">
                           <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                             <circle cx="12" cy="12" r="4" fill="white"/>
                             <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
                             <circle cx="12" cy="8" r="1" fill="currentColor"/>
                           </svg>
                         </div>
                         <div class="label">Daily Trivia</div>`;
          t.addEventListener('click', () => {
            console.log('🎮 Trivia tile clicked');
            if (typeof window.openModal === 'function') {
              window.openModal(
                'Daily Trivia',
                `<p>Test Question: ${trivia.question}</p><p>Options: ${trivia.options.join(', ')}</p><p><em>Coming soon - full trivia functionality!</em></p>`,
                'trivia-modal'
              );
            } else {
              console.warn('🎮 No modal handler available');
            }
          });
          inner.appendChild(t);
        }

        if (flickword) {
          console.log('🎮 Adding FlickWord tile');
          const f = document.createElement('div');
          f.className = 'tile tile-flickword';
          f.innerHTML = `<div class="icon" aria-hidden="true">
                           <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="currentColor" opacity="0.1"/>
                             <rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
                             <path d="M7 21l5-5 5 5" stroke="currentColor" stroke-width="2" fill="none"/>
                             <circle cx="12" cy="10" r="3" fill="currentColor"/>
                             <path d="M8 14l8 0" stroke="currentColor" stroke-width="2"/>
                             <rect x="4" y="5" width="16" height="2" fill="currentColor" opacity="0.3"/>
                             <rect x="4" y="8" width="12" height="1" fill="currentColor" opacity="0.3"/>
                             <rect x="4" y="10" width="14" height="1" fill="currentColor" opacity="0.3"/>
                           </svg>
                         </div>
                         <div class="label">FlickWord</div>`;
          f.addEventListener('click', () => {
            console.log('🎮 FlickWord tile clicked');
            if (typeof window.openModal === 'function') {
              window.openModal(
                'FlickWord',
                `<p>Today's Word: <strong>${flickword.word}</strong></p><p>Hint: ${flickword.hint}</p><p><em>Coming soon - full FlickWord functionality!</em></p>`,
                'flickword-modal'
              );
            } else {
              console.warn('🎮 No modal handler available');
            }
          });
          inner.appendChild(f);
        }

    // Hide if nothing to show
    if (!inner.children.length) {
      console.log('🎮 No content available, hiding Play Along row');
      section.remove();
    } else {
      console.log(`✅ Play Along row rendered with ${inner.children.length} tile(s)`);
    }
  }

  // Placeholder functions for future implementation
  window.fetchDailyTrivia = async function() {
    // TODO: Implement daily trivia fetching
    console.log('🎮 fetchDailyTrivia returning test data');
    return {
      id: 'test-trivia-1',
      question: 'What year was the first Star Wars movie released?',
      options: ['1977', '1978', '1976', '1979'],
      correct: 0
    };
  };

  window.fetchFlickWord = async function() {
    // TODO: Implement FlickWord fetching
    console.log('🎮 fetchFlickWord returning test data');
    return {
      id: 'test-flickword-1',
      word: 'CINEMA',
      hint: 'The art of making motion pictures'
    };
  };

  // Expose render function globally for manual triggering
  window.renderPlayAlongRow = renderPlayAlongRow;

})();
