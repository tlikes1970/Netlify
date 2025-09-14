/* ========== theaters-near-me.js ==========
   What's in theaters near me - shows current theatrical releases
   Priority: TMDB API for current movies, geolocation for user location
   Always shows content (never hidden)
*/

(function(){
  'use strict';

  // Check if feature is enabled
  if (!window.FLAGS?.homeRowSpotlight) {
    console.log('🎬 Theaters Near Me disabled by feature flag');
    return;
  }

  console.log('🎬 Initializing Theaters Near Me...');

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheaters);
  } else {
    initTheaters();
  }

  async function initTheaters() {
    try {
      // Create the theaters section at the bottom of home page
      createTheatersSection();
      
      const movies = await fetchCurrentTheatricalReleases();
      renderTheaters(movies);
      console.log('✅ Theaters Near Me initialized');
    } catch (error) {
      console.error('❌ Theaters Near Me initialization failed:', error);
      // Show fallback content
      renderTheaters(getFallbackContent());
    }
  }

  function createTheatersSection() {
    // Check if section already exists
    if (document.getElementById('theaters-section')) {
      return;
    }

    // Find the home section
    const homeSection = document.getElementById('homeSection');
    if (!homeSection) {
      console.warn('🎬 Home section not found');
      return;
    }

    // Create the theaters section
    const theatersSection = document.createElement('section');
    theatersSection.id = 'theaters-section';
    theatersSection.className = 'home-section';
    theatersSection.innerHTML = `
      <h2 class="section-title">What's in Theaters Near Me</h2>
      <div class="section-description" style="font-size: 14px; color: var(--text-secondary, #666); margin-bottom: 16px; text-align: center;">
        Current theatrical releases and showtimes
      </div>
      
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

    // Insert before the feedback section (which gets added dynamically)
    homeSection.appendChild(theatersSection);
  }

  /**
   * Process: Current Theatrical Releases
   * Purpose: Fetches movies currently in theaters from TMDB API
   * Data Source: TMDB API now_playing endpoint
   * Update Path: Modify API endpoint or add additional sources
   * Dependencies: TMDB API key, fetchTMDBData function
   */
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

  /**
   * Process: Theaters Content Rendering
   * Purpose: Renders the theaters content in the spotlight layout
   * Data Source: Array of movie objects from TMDB
   * Update Path: Modify HTML structure or styling classes
   * Dependencies: spotlight-row DOM element, escapeHtml utility function
   */
  function renderTheaters(movies) {
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

    // Add event listeners
    setupEventListeners();
  }

  function setupEventListeners() {
    // Refresh theaters button
    const refreshBtn = document.getElementById('refreshTheatersBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.textContent = '🔄 Loading...';
        try {
          const movies = await fetchCurrentTheatricalReleases();
          renderTheaters(movies);
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

    // Get user location on load
    updateUserLocation();
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


  function getFallbackContent() {
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

  console.log('🎬 Theaters Near Me script loaded');
})();
