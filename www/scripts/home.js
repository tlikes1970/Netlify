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
    
    // Initialize the currently watching preview if it exists
    const cwPreview = document.getElementById('currentlyWatchingPreview');
    if (cwPreview) {
      console.log('📚 Found currently watching preview, making visible');
      cwPreview.style.display = 'block';
      
      // Trigger the currently watching preview rendering
      if (typeof window.renderCurrentlyWatchingPreview === 'function') {
        console.log('📚 Triggering currently watching preview render');
        window.renderCurrentlyWatchingPreview();
      }
    } else {
      console.warn('📚 Currently watching preview not found');
    }
    
    // Initialize the next up row if it exists
    const nextUpRow = document.getElementById('next-up-row');
    if (nextUpRow) {
      console.log('📚 Found next up row, making visible');
      nextUpRow.style.display = 'block';
      
      // Trigger the next up row rendering
      if (typeof window.renderNextUpRow === 'function') {
        console.log('📚 Triggering next up this week render');
        window.renderNextUpRow();
      }
    } else {
      console.warn('📚 Next up row not found');
    }
  }

  // Mount Community section
  function mountCommunity() {
    console.log('👥 Mounting Community section');
    const container = document.getElementById('community-section');
    if (!container) {
      console.warn('👥 Community section container not found, skipping');
      return;
    }

    // The HTML structure is already in place, just ensure visibility
    container.style.display = 'block';
    
    // Initialize the spotlight row if it exists
    const spotlightRow = document.getElementById('spotlight-row');
    if (spotlightRow) {
      spotlightRow.style.display = 'block';
    }
    
    // Initialize game functionality
    initializeCommunityGames();
  }

  // Mount Curated section
  function mountCurated() {
    console.log('🎯 Mounting Curated section');
    const container = document.getElementById('curated-section');
    if (!container) {
      console.warn('🎯 Curated section container not found, skipping');
      return;
    }

    // The HTML structure is already in place, just ensure visibility
    container.style.display = 'block';
    
    // Initialize the curated sections if they exist
    const curatedSections = document.getElementById('curatedSections');
    if (curatedSections) {
      curatedSections.style.display = 'block';
      
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
    const container = document.getElementById('personalized-section');
    if (!container) {
      console.warn('🎨 Personalized section container not found, skipping');
      return;
    }
    
    // Convert the existing HTML structure to match what the script expects
    if (container && !container.querySelector('.section__body')) {
      console.log('🎨 Converting personalized section structure...');
      const sectionContent = container.querySelector('.section-content');
      if (sectionContent) {
        sectionContent.className = 'section__body';
        sectionContent.id = 'section-personalized-body';
      }
      
      // Update the container to match expected structure
      container.className = 'section';
      container.id = 'section-personalized';
      
      const header = container.querySelector('.section-header');
      if (header) {
        header.className = 'section__header';
      }
    }

    // The HTML structure is already in place, just ensure visibility
    container.style.display = 'block';
    
    // Initialize personalized section with actual content
    // Use setTimeout to ensure personalized scripts are loaded
    setTimeout(() => {
      if (window.mountPersonalizedSection) {
        console.log('🎨 Initializing personalized section with content');
        window.mountPersonalizedSection(container);
      } else {
        console.log('🎨 Personalized system not available, showing placeholder');
        // Fallback placeholder if personalized system not available
        const content = document.getElementById('personalized-content');
        if (content) {
          content.innerHTML = '<p>Personalized recommendations coming soon...</p>';
        }
      }
    }, 100);
  }

  // Mount Theaters section
  function mountTheaters() {
    console.log('🎬 Mounting Theaters section');
    const container = document.getElementById('theaters-section');
    if (!container) {
      console.warn('🎬 Theaters section container not found, skipping');
      return;
    }

    // The HTML structure is already in place, just ensure visibility
    container.style.display = 'block';
    
    // Initialize theater functionality
    initializeTheaterFunctionality();
  }

  // Initialize theater functionality (copied from theaters-near-me.js)
  function initializeTheaterFunctionality() {
    console.log('🎬 Initializing theater functionality');
    
    const content = document.getElementById('theaters-content');
    if (!content) {
      console.warn('🎬 Theaters content container not found');
      return;
    }
    
    // Add the complete theater content
    content.innerHTML = `
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
      if (movies && Array.isArray(movies)) {
        renderTheaterMovies(movies);
      } else {
        console.warn('🎬 No valid movie data received, using fallback');
        renderTheaterMovies(getFallbackTheaterContent());
      }
    } catch (error) {
      console.error('❌ Failed to load theater data:', error);
      renderTheaterMovies(getFallbackTheaterContent());
    }
  }

  async function fetchCurrentTheatricalReleases() {
    try {
      console.log('🎬 Fetching current theatrical releases...');
      
      // Use existing TMDB config if available
      const apiKey = window.TMDB_CONFIG?.apiKey || window.__TMDB_API_KEY__ || window.TMDB_API_KEY;
      
      if (!apiKey || apiKey === 'your-api-key-here' || apiKey === 'YOUR_TMDB_API_KEY_HERE') {
        console.warn('🎬 No valid TMDB API key found, using fallback data');
        return getFallbackTheaterContent();
      }
      
      // Additional validation for the fallback key
      if (apiKey === 'b7247bb415b50f25b5e35e2566430b96') {
        console.log('🎬 Using fallback TMDB API key, attempting to fetch real data');
      }
      
      const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1&region=US`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🎬 Fetched theatrical releases:', data.results?.length || 0);
      
      if (!data.results || !Array.isArray(data.results)) {
        console.warn('🎬 Invalid data structure received from TMDB API');
        return getFallbackTheaterContent();
      }
      
      return data.results.slice(0, 8); // Get top 8 movies
    } catch (error) {
      console.error('📺 TMDB API error:', error);
      return getFallbackTheaterContent();
    }
  }

  function renderTheaterMovies(movies) {
    try {
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

      // Render movies with error handling for each movie
      theatersList.innerHTML = movies.map(movie => {
        try {
          const title = movie.title || 'Unknown Title';
          const posterPath = movie.poster_path;
          const overview = movie.overview || 'No description available';
          const voteAverage = movie.vote_average;
          const releaseDate = movie.release_date;
          
          const posterUrl = posterPath ? 
            `https://image.tmdb.org/t/p/w200${posterPath}` : 
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K';
          
          const releaseDateFormatted = releaseDate ? 
            new Date(releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
            'TBA';
          
          return `
            <div class="theater-movie">
              <div class="movie-poster">
                <img src="${posterUrl}" 
                     alt="${escapeHtml(title)}" 
                     loading="lazy"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K'">
              </div>
              <div class="movie-info">
                <h4 class="movie-title">${escapeHtml(title)}</h4>
                <p class="movie-overview">${escapeHtml(overview.length > 120 ? overview.substring(0, 120) + '...' : overview)}</p>
                <div class="movie-meta">
                  <span class="movie-rating">⭐ ${voteAverage ? voteAverage.toFixed(1) : 'N/A'}</span>
                  <span class="movie-release">${releaseDateFormatted}</span>
                </div>
              </div>
            </div>
          `;
        } catch (movieError) {
          console.error('🎬 Error rendering movie:', movieError, movie);
          return '<div class="theater-movie error">Error loading movie data</div>';
        }
      }).join('');

      // Update movie count
      if (movieCount) {
        movieCount.textContent = `${movies.length} Movies`;
      }
    } catch (error) {
      console.error('❌ Error rendering theater movies:', error);
      const theatersList = document.getElementById('theatersList');
      if (theatersList) {
        theatersList.innerHTML = '<div class="no-movies"><p>Error loading movies. Please refresh the page.</p></div>';
      }
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

    // Defer geolocation call to idle time to avoid blocking LCP
    const idle = (fn) => ('requestIdleCallback' in window) ? requestIdleCallback(fn, {timeout: 2000}) : setTimeout(fn, 100);
    idle(() => {
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
    });
  }

  function getFallbackTheaterContent() {
    return [
      {
        title: "Dune: Part Two",
        overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
        vote_average: 8.1,
        release_date: "2024-03-01",
        poster_path: "/8x9VvVeJ6x5qZ6Km6Af2wPr1xmp.jpg"
      },
      {
        title: "Oppenheimer",
        overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
        vote_average: 8.2,
        release_date: "2023-07-21",
        poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
      },
      {
        title: "Barbie",
        overview: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.",
        vote_average: 6.9,
        release_date: "2023-07-21",
        poster_path: "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg"
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
    try {
      // Phase 1: Critical sections (immediate) - in correct visual order
      console.log('🏠 Mounting critical sections...');
      safeMountSection('My Library', mountMyLibrary);
      
      // Phase 2: High priority sections (short delay)
      setTimeout(() => {
        try {
          console.log('🏠 Mounting high priority sections...');
          safeMountSection('Community', mountCommunity);
        } catch (error) {
          console.error('❌ Error mounting high priority sections:', error);
        }
      }, 100);
      
      // Phase 3: Medium priority sections
      setTimeout(() => {
        try {
          console.log('🏠 Mounting medium priority sections...');
          safeMountSection('Curated', mountCurated);
          safeMountSection('Personalized', mountPersonalized);
        } catch (error) {
          console.error('❌ Error mounting medium priority sections:', error);
        }
      }, 200);
      
      // Phase 4: Low priority sections
      setTimeout(() => {
        try {
          console.log('🏠 Mounting low priority sections...');
          safeMountSection('Theaters', mountTheaters);
          safeMountSection('Feedback', mountFeedbackLink);
        } catch (error) {
          console.error('❌ Error mounting low priority sections:', error);
        }
      }, 300);
    } catch (error) {
      console.error('❌ Critical error in section mounting sequence:', error);
    }
  }
  
  // Safe section mounting with error handling
  function safeMountSection(sectionName, mountFunction) {
    try {
      if (typeof mountFunction === 'function') {
        mountFunction();
        console.log(`✅ ${sectionName} section mounted successfully`);
      } else {
        console.warn(`⚠️ ${sectionName} mount function is not available`);
      }
    } catch (error) {
      console.error(`❌ Error mounting ${sectionName} section:`, error);
      // Continue with other sections even if one fails
    }
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
