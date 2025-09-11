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
  console.log('🏠 Home Layout v2 check:', USE_V2);
  console.log('🏠 FLAGS object:', window.FLAGS);
  
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

    // Create currently watching preview directly in homeSection
    const cwPreview = document.createElement('section');
    cwPreview.id = 'currentlyWatchingPreview';
    cwPreview.className = 'home-preview-row cw-row';
    cwPreview.setAttribute('aria-label', 'Currently Watching Preview');
    cwPreview.innerHTML = `
      <div class="preview-row-header">
        <h3 class="preview-row-title">👁️ Currently Watching</h3>
      </div>
      <div class="preview-row-container">
        <div class="preview-row-scroll" id="currentlyWatchingScroll">
          <!-- Cards will be populated by JavaScript -->
        </div>
      </div>
    `;
    
    // Insert at the beginning of homeSection, before tab container
    container.insertBefore(cwPreview, container.firstChild);

    // Create next up row
    const nextUpRow = document.createElement('section');
    nextUpRow.id = 'next-up-row';
    nextUpRow.className = 'home-section';
    nextUpRow.setAttribute('data-feature', 'homeRowNextUp');
    nextUpRow.innerHTML = `
      <h2 class="section-title">Next Up This Week</h2>
      <div class="next-up-scroll row-inner"><!-- tiles injected here --></div>
    `;
    
    // Insert after currently watching preview
    cwPreview.insertAdjacentElement('afterend', nextUpRow);
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
    
    // Insert at end of home section to maintain order
    container.insertAdjacentHTML('beforeend', sectionHTML);

    // Mount existing components into the section body
    const sectionBody = document.getElementById('section-community-body');
    if (sectionBody) {
      // Create spotlight row
      const spotlightRow = document.createElement('section');
      spotlightRow.id = 'spotlight-row';
      spotlightRow.className = 'home-section';
      spotlightRow.setAttribute('data-feature', 'homeRowSpotlight');
      spotlightRow.innerHTML = `
        <h2 class="section-title">Community Spotlight</h2>
        <div class="spotlight-grid">
          <div class="spotlight-video">
            <!-- Video content will be injected here -->
          </div>
          <div class="spotlight-info">
            <h3 class="spotlight-title">Community Spotlight</h3>
            <div class="spotlight-credit"></div>
            <p class="spotlight-desc"></p>
            <div class="spotlight-badges"></div>
            <button id="spotlightSubmitBtn" class="btn btn-primary">Submit Your Video</button>
          </div>
        </div>
      `;
      sectionBody.appendChild(spotlightRow);

      // Create community games container
      const gamesContainer = document.createElement('div');
      gamesContainer.className = 'community-games-container';
      gamesContainer.innerHTML = `
        <div class="community-games-grid">
          <div class="game-box game-trivia">
            <div class="game-header">
              <h4 class="game-title">Daily Trivia</h4>
            </div>
            <div class="game-content">
              <div class="game-stats" id="trivia-stats">
                <div class="stat-item">
                  <span class="stat-value" id="trivia-streak">0</span>
                  <span class="stat-label">Streak</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value" id="trivia-questions">10</span>
                  <span class="stat-label">Questions</span>
                </div>
              </div>
              <button class="game-play-btn" id="trivia-play-btn">Play Now</button>
            </div>
          </div>
          
          <div class="game-box game-flickword">
            <div class="game-header">
              <h4 class="game-title">FlickWord</h4>
            </div>
            <div class="game-content">
              <div class="game-stats" id="flickword-stats">
                <div class="stat-item">
                  <span class="stat-value" id="flickword-streak">0</span>
                  <span class="stat-label">Streak</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value" id="flickword-best">-</span>
                  <span class="stat-label">Best</span>
                </div>
              </div>
              <button class="game-play-btn" id="flickword-play-btn">Play Now</button>
            </div>
          </div>
        </div>
      `;
      sectionBody.appendChild(gamesContainer);
      
      // Initialize game functionality
      initializeCommunityGames();
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
    
    // Insert at end of home section to maintain order
    container.insertAdjacentHTML('beforeend', sectionHTML);

    // Mount existing components into the section body
    const sectionBody = document.getElementById('section-curated-body');
    if (sectionBody) {
      // Create curated sections
      const curatedSections = document.createElement('section');
      curatedSections.id = 'curatedSections';
      curatedSections.className = 'curated-sections';
      curatedSections.setAttribute('aria-label', 'Curated lists');
      curatedSections.innerHTML = `<!-- Populated by curated-rows.js -->`;
      sectionBody.appendChild(curatedSections);
      
      // Initialize curated content after element is created
      setTimeout(() => {
        if (window.renderCuratedHomepage) {
          console.log('🎯 Initializing curated content');
          window.renderCuratedHomepage();
        } else {
          console.warn('🎯 renderCuratedHomepage not available yet');
        }
      }, 100);
    }
  }

  // Mount Personalized section
  function mountPersonalized() {
    console.log('🎨 Mounting Personalized section');
    const container = document.getElementById('homeSection');
    if (!container) {
      console.error('❌ Home section container not found');
      return;
    }

    const sectionHTML = createSection(
      'personalized',
      'home.personalized',
      'home.personalized_sub'
    );
    
    // Insert at end of home section to maintain order
    container.insertAdjacentHTML('beforeend', sectionHTML);
    console.log('🎨 Personalized section inserted at beginning of home section');

    // Mount existing components into the section body
    const sectionBody = document.getElementById('section-personalized-body');
    if (sectionBody) {
      // Initialize personalized section with actual content
      // Use setTimeout to ensure personalized scripts are loaded
      setTimeout(() => {
        if (window.mountPersonalizedSection) {
          console.log('🎨 Initializing personalized section with content');
          // Pass the section element, not the body element
          const sectionElement = document.getElementById('section-personalized');
          if (sectionElement) {
            window.mountPersonalizedSection(sectionElement);
          } else {
            console.error('❌ Section element not found');
          }
        } else {
          console.log('🎨 Personalized system not available, showing placeholder');
          // Fallback placeholder if personalized system not available
          const placeholder = document.createElement('div');
          placeholder.className = 'personalized-placeholder';
          placeholder.innerHTML = '<p>Personalized recommendations coming soon...</p>';
          sectionBody.appendChild(placeholder);
        }
      }, 100);
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
    
    // Insert at end of home section to maintain order
    container.insertAdjacentHTML('beforeend', sectionHTML);

    // Mount full theater functionality into the section body
    const sectionBody = document.getElementById('section-theaters-body');
    if (sectionBody) {
      // Add the complete theater content from V1
      sectionBody.innerHTML = `
        <div class="theaters-container">
          <div class="theaters-header">
            <h3>🎬 Now Playing</h3>
            <button class="btn secondary" id="refreshTheatersBtn">🔄 Refresh</button>
          </div>
          <div class="theaters-list" id="theatersList">
            <div class="loading">Loading movies...</div>
          </div>
        </div>
        
        <div class="theaters-info">
          <div class="theaters-meta">
            <h3>Find Showtimes</h3>
            <p>Click "Find Showtimes" to see showtimes at theaters near you</p>
            <div class="location-info">
              <span id="userLocation">📍 Getting your location...</span>
            </div>
          </div>
          <div class="theaters-cta">
            <button class="btn btn-primary" id="findShowtimesBtn">🎫 Find Showtimes</button>
            <button class="btn secondary" id="refreshLocationBtn">📍 Update Location</button>
          </div>
          <div class="theaters-badges">
            <span class="badge">Now Playing</span>
            <span class="badge" id="movieCount">Loading...</span>
          </div>
        </div>
      `;

      // Initialize theater functionality
      initializeTheaterFunctionality();
    }
  }

  // Initialize theater functionality (copied from theaters-near-me.js)
  function initializeTheaterFunctionality() {
    console.log('🎬 Initializing theater functionality');
    
    // Set up event listeners
    setupTheaterEventListeners();
    
    // Load initial data
    loadTheaterData();
    
    // Get user location
    updateUserLocation();
  }

  function setupTheaterEventListeners() {
    // Refresh theaters button
    const refreshBtn = document.getElementById('refreshTheatersBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.textContent = '🔄 Loading...';
        try {
          await loadTheaterData();
        } catch (error) {
          console.error('Failed to refresh theaters:', error);
        }
      });
    }

    // Find showtimes button
    const showtimesBtn = document.getElementById('findShowtimesBtn');
    if (showtimesBtn) {
      showtimesBtn.addEventListener('click', () => {
        // Open Fandango in new tab
        window.open('https://www.fandango.com/', '_blank');
      });
    }

    // Update location button
    const locationBtn = document.getElementById('refreshLocationBtn');
    if (locationBtn) {
      locationBtn.addEventListener('click', () => {
        updateUserLocation();
      });
    }
  }

  async function loadTheaterData() {
    try {
      console.log('🎬 Loading theater data...');
      
      const movies = await fetchCurrentTheatricalReleases();
      renderTheaterMovies(movies);
    } catch (error) {
      console.error('❌ Failed to load theater data:', error);
      renderTheaterMovies(getFallbackTheaterContent());
    }
  }

  async function fetchCurrentTheatricalReleases() {
    try {
      console.log('🎬 Fetching current theatrical releases...');
      
      // Use existing TMDB config if available
      const apiKey = window.TMDB_CONFIG?.apiKey || window.__TMDB_API_KEY__ || window.TMDB_API_KEY || 'your-api-key-here';
      const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1&region=US`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎬 Fetched theatrical releases:', data.results?.length || 0);
      
      return data.results?.slice(0, 8) || []; // Get top 8 movies
    } catch (error) {
      console.error('📺 TMDB API error:', error);
      return [];
    }
  }

  function renderTheaterMovies(movies) {
    const theatersList = document.getElementById('theatersList');
    const movieCount = document.getElementById('movieCount');
    
    if (!theatersList) {
      console.warn('🎬 Theaters list not found');
      return;
    }

    if (!movies || movies.length === 0) {
      theatersList.innerHTML = '<div class="no-movies"><p>Unable to load current movies. Please try again later.</p></div>';
      if (movieCount) movieCount.textContent = '0 Movies';
      return;
    }

    // Render movies
    theatersList.innerHTML = movies.map(movie => `
      <div class="theater-movie">
        <div class="movie-poster">
          <img src="${movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K'}" 
               alt="${escapeHtml(movie.title)}" 
               loading="lazy"
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K'">
        </div>
        <div class="movie-info">
          <h4 class="movie-title">${escapeHtml(movie.title)}</h4>
          <p class="movie-overview">${escapeHtml(movie.overview?.substring(0, 120) + '...' || 'No description available')}</p>
          <div class="movie-meta">
            <span class="movie-rating">⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
            <span class="movie-release">${new Date(movie.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Update movie count
    if (movieCount) {
      movieCount.textContent = `${movies.length} Movies`;
    }
  }

  function updateUserLocation() {
    const locationEl = document.getElementById('userLocation');
    if (!locationEl) return;

    locationEl.textContent = '📍 Getting your location...';

    if (!navigator.geolocation) {
      locationEl.textContent = '📍 Location not supported';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // You could reverse geocode here to get city name
        locationEl.textContent = `📍 ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      },
      (error) => {
        console.warn('Location error:', error);
        locationEl.textContent = '📍 Location unavailable';
      }
    );
  }

  function getFallbackTheaterContent() {
    return [
      {
        title: "Sample Movie",
        overview: "This is a sample movie description for when the API is unavailable.",
        vote_average: 7.5,
        release_date: new Date().toISOString().split('T')[0],
        poster_path: null
      }
    ];
  }

  // Utility function to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Feedback link is now handled by inline-script-02.js
  // This function is kept for compatibility but does nothing
  function mountFeedbackLink() {
    console.log('💬 Feedback link handled by inline-script-02.js');
  }

  // Initialize Home Layout v2
  function initHomeLayoutV2() {
    console.log('🏠 Initializing Home Layout v2');
    console.log('🏠 Feature flag enabled:', !!window.FLAGS?.home_layout_v2);
    
    // Mount sections with improved sequencing
    console.log('🏠 Mounting sections with improved sequencing');
    mountSectionsWithSequencing();
    setupEventListeners();
    
    console.log('✅ Home Layout v2 initialized');
  }
  
  // Improved section mounting with better sequencing
  function mountSectionsWithSequencing() {
    // Phase 1: Critical sections (immediate) - in correct visual order
    console.log('🏠 Mounting critical sections...');
    mountMyLibrary();
    
    // Phase 2: High priority sections (short delay)
    setTimeout(() => {
      console.log('🏠 Mounting high priority sections...');
      mountCommunity();
    }, 100);
    
    // Phase 3: Medium priority sections
    setTimeout(() => {
      console.log('🏠 Mounting medium priority sections...');
      mountCurated();
      mountPersonalized();
    }, 200);
    
    // Phase 4: Low priority sections
    setTimeout(() => {
      console.log('🏠 Mounting low priority sections...');
      mountTheaters();
      mountFeedbackLink();
    }, 300);
  }
  
  // Fallback section mounting (original method)
  function mountSectionsFallback() {
    console.log('🏠 Mounting My Library...');
    mountMyLibrary();
    console.log('🏠 Mounting Community...');
    mountCommunity();
    console.log('🏠 Mounting Curated...');
    mountCurated();
    console.log('🏠 Mounting Personalized...');
    mountPersonalized();
    console.log('🏠 Mounting Theaters...');
    mountTheaters();
    console.log('🏠 Mounting Feedback Banner...');
    mountFeedbackBanner();
  }
  
  // Setup event listeners (shared between optimized and fallback)
  function setupEventListeners() {
    // Set up feedback banner click handler
    const feedbackBtn = document.getElementById('feedback-banner-btn');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => {
        console.log('💬 Opening feedback modal');
        // TODO: Open feedback modal
        alert('Feedback modal will open here');
      });
    }

    // Set up personalized section update listener
    window.addEventListener('personalized:updated', (event) => {
      console.log('🎨 Personalized section updated:', event.detail);
      const section = document.getElementById('section-personalized');
      if (section && window.mountPersonalizedSection) {
        const sectionBody = section.querySelector('.section__body');
        if (sectionBody) {
          window.mountPersonalizedSection(sectionBody);
        }
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeLayoutV2);
  } else {
    initHomeLayoutV2();
  }

  // Fallback: Ensure personalized section exists even if Home Layout v2 fails
  setTimeout(() => {
    const personalizedSection = document.getElementById('section-personalized');
    if (!personalizedSection) {
      console.log('🏠 Home Layout v2 fallback: Creating personalized section manually');
      const homeSection = document.getElementById('homeSection');
      if (homeSection) {
        const sectionHTML = createSection(
          'personalized',
          'home.personalized',
          'home.personalized_sub'
        );
        homeSection.insertAdjacentHTML('beforeend', sectionHTML);
        
        // Initialize the section
        const sectionElement = document.getElementById('section-personalized');
        if (sectionElement && window.mountPersonalizedSection) {
          setTimeout(() => {
            window.mountPersonalizedSection(sectionElement);
          }, 100);
        }
      }
    }
  }, 1000);

  // Initialize Community Games functionality
  function initializeCommunityGames() {
    console.log('🎮 Initializing Community Games...');
    
    // Update game stats
    updateGameStats();
    
    // Set up trivia button
    const triviaBtn = document.getElementById('trivia-play-btn');
    if (triviaBtn) {
      triviaBtn.addEventListener('click', async () => {
        console.log('🎮 Trivia button clicked');
        try {
          const triviaData = await window.fetchDailyTrivia?.();
          if (triviaData && typeof window.openTriviaModal === 'function') {
            window.openTriviaModal(triviaData);
          } else {
            console.warn('🎮 Trivia functionality not available');
          }
        } catch (error) {
          console.error('🎮 Error opening trivia:', error);
        }
      });
    }
    
    // Set up FlickWord button
    const flickwordBtn = document.getElementById('flickword-play-btn');
    if (flickwordBtn) {
      flickwordBtn.addEventListener('click', async () => {
        console.log('🎮 FlickWord button clicked');
        try {
          const flickwordData = await window.fetchFlickWord?.();
          if (flickwordData && typeof window.openFlickWordModal === 'function') {
            window.openFlickWordModal(flickwordData);
          } else {
            console.warn('🎮 FlickWord functionality not available');
          }
        } catch (error) {
          console.error('🎮 Error opening FlickWord:', error);
        }
      });
    }
  }
  
  // Update game statistics display
  function updateGameStats() {
    // Update trivia stats
    const triviaStreak = document.getElementById('trivia-streak');
    const triviaQuestions = document.getElementById('trivia-questions');
    
    if (triviaStreak) {
      const streak = Number(localStorage.getItem('flicklet:trivia:v1:streak') || 0);
      triviaStreak.textContent = streak;
    }
    
    if (triviaQuestions) {
      const isPro = window.FLAGS?.proEnabled || false;
      triviaQuestions.textContent = isPro ? '50' : '10';
    }
    
    // Update FlickWord stats (placeholder for now)
    const flickwordStreak = document.getElementById('flickword-streak');
    const flickwordBest = document.getElementById('flickword-best');
    
    if (flickwordStreak) {
      const streak = Number(localStorage.getItem('flicklet:flickword:streak') || 0);
      flickwordStreak.textContent = streak;
    }
    
    if (flickwordBest) {
      const best = localStorage.getItem('flicklet:flickword:best') || '-';
      flickwordBest.textContent = best;
    }
  }

  // Expose globally for debugging
  window.initHomeLayoutV2 = initHomeLayoutV2;
  window.initializeCommunityGames = initializeCommunityGames;
  window.updateGameStats = updateGameStats;

})();
