/* ========== episode-tracking.js ==========
   Episode tracking modal with per-series opt-in and TMDB integration.
   Data sources:
   1) localStorage["flicklet:episodeTracking:enabled"] -> boolean (global toggle)
   2) localStorage["flicklet:episodeTracking:series"] -> { [seriesId]: { trackEpisodes: boolean, watched: { [season]: { [episode]: boolean }}} }
   3) TMDB API for season/episode metadata
*/
(function(){
  'use strict';

  // Configuration
  const TMDB_API_BASE = 'https://api.themoviedb.org/3';
  const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
  const DEBOUNCE_DELAY = 250;
  
  // State
  let debounceTimer = null;
  let currentSeries = null;
  let seasonCache = new Map();
  
  // Initialize
  init();
  
  function init() {
    console.log('📺 Episode tracking system initialized');
    
    // Expose global functions
    window.openEpisodeModal = openEpisodeModal;
    window.setEpisodeWatched = setEpisodeWatched;
    window.getEpisodeProgress = getEpisodeProgress;
    
    // Update UI when settings change
    if (window.updateEpisodeTrackingUI) {
      window.updateEpisodeTrackingUI(isEpisodeTrackingEnabled());
    }
  }

  /**
   * Process: Open Episode Modal
   * Purpose: Open full-screen episode tracking modal for a series
   * Data Source: TMDB API, localStorage episode data
   * Update Path: Modify modal content or data loading in this function
   * Dependencies: window.openModal, TMDB API
   */
  async function openEpisodeModal(seriesId, seriesTitle) {
    console.log('📺 openEpisodeModal called with:', seriesId, seriesTitle);
    console.log('📺 Episode tracking enabled:', isEpisodeTrackingEnabled());
    console.log('📺 window.openModal available:', typeof window.openModal);
    
    if (!isEpisodeTrackingEnabled()) {
      console.warn('📺 Episode tracking is disabled');
      return;
    }
    
    if (typeof window.openModal !== 'function') {
      console.warn('📺 No modal handler available for episode tracking');
      console.log('📺 Available window functions:', Object.keys(window).filter(k => k.includes('modal') || k.includes('Modal')));
      return;
    }
    
    console.log('📺 Opening episode modal for:', seriesId, seriesTitle);
    
    currentSeries = { id: seriesId, title: seriesTitle };
    
    // Create modal HTML
    const modalHtml = `
      <div class="episode-modal-content" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
        <div class="episode-modal-header" style="flex-shrink: 0; padding: 20px; border-bottom: 1px solid var(--border, #ddd);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="margin: 0 0 8px 0; color: var(--text, #333); font-size: 24px;">${escapeHtml(seriesTitle)} — Episodes</h2>
              <div id="episode-progress" class="episode-progress" style="font-size: 14px; color: var(--text-secondary, #666);">
                Loading...
              </div>
            </div>
            <button id="episode-modal-close" class="btn secondary" style="padding: 8px 16px;">✕ Close</button>
          </div>
          <div id="episode-progress-bar" class="episode-progress-bar" style="width: 100%; height: 4px; background: var(--border, #ddd); border-radius: 2px; margin-top: 12px; overflow: hidden;">
            <div class="progress-fill" style="height: 100%; background: var(--primary, #007bff); width: 0%; transition: width 0.3s ease;"></div>
          </div>
        </div>
        
        <div class="episode-modal-body">
          <div id="episode-seasons" class="episode-seasons">
            <div style="text-align: center; padding: 40px; color: var(--text-secondary, #666);">
              Loading series data...
            </div>
          </div>
        </div>
      </div>
    `;
    
    const modal = window.openModal(`${seriesTitle} — Episodes`, modalHtml, 'episode-modal');
    
    if (!modal) {
      console.error('📺 Failed to create episode modal');
      return;
    }
    
    // Add close functionality
    const closeBtn = modal.querySelector('#episode-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
        currentSeries = null;
      });
    }
    
    // Load series data
    await loadSeriesData(seriesId, seriesTitle);
  }

  /**
   * Process: Load Series Data
   * Purpose: Load series and season data from TMDB API
   * Data Source: TMDB API, localStorage cache
   * Update Path: Modify data loading or caching logic in this function
   * Dependencies: TMDB API, localStorage
   */
  async function loadSeriesData(seriesId, seriesTitle) {
    try {
      console.log('📺 Loading series data for:', seriesId);
      
      // Load series basic info
      const seriesData = await fetchTMDBData(`/tv/${seriesId}`);
      if (!seriesData) {
        throw new Error('Failed to load series data');
      }
      
      // Load seasons data
      const seasons = seriesData.seasons || [];
      const seasonsData = [];
      
      for (const season of seasons) {
        if (season.season_number === 0) continue; // Skip specials for now
        
        const seasonData = await loadSeasonData(seriesId, season.season_number);
        if (seasonData) {
          seasonsData.push(seasonData);
        }
      }
      
      // Render the seasons
      renderSeasons(seasonsData, seriesId);
      
      // Update progress
      updateProgress(seriesId);
      
    } catch (error) {
      console.error('📺 Error loading series data:', error);
      const container = document.querySelector('#episode-seasons');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--error, #dc3545);">
            <p>Error loading series data.</p>
            <p style="font-size: 14px; margin-top: 8px;">Please try again later.</p>
          </div>
        `;
      }
    }
  }

  /**
   * Process: Load Season Data
   * Purpose: Load individual season data from TMDB API with caching
   * Data Source: TMDB API, seasonCache
   * Update Path: Modify season data loading or caching in this function
   * Dependencies: TMDB API, seasonCache
   */
  async function loadSeasonData(seriesId, seasonNumber) {
    const cacheKey = `${seriesId}-${seasonNumber}`;
    
    // Check cache first
    if (seasonCache.has(cacheKey)) {
      return seasonCache.get(cacheKey);
    }
    
    try {
      const seasonData = await fetchTMDBData(`/tv/${seriesId}/season/${seasonNumber}`);
      if (seasonData) {
        seasonCache.set(cacheKey, seasonData);
        return seasonData;
      }
    } catch (error) {
      console.warn(`📺 Failed to load season ${seasonNumber}:`, error);
    }
    
    return null;
  }

  /**
   * Process: Fetch TMDB Data
   * Purpose: Fetch data from TMDB API with error handling
   * Data Source: TMDB API
   * Update Path: Modify API calls or error handling in this function
   * Dependencies: TMDB API
   */
  async function fetchTMDBData(endpoint) {
    try {
      // Use existing TMDB config if available
      const apiKey = window.TMDB_CONFIG?.apiKey || window.__TMDB_API_KEY__ || window.TMDB_API_KEY || 'your-api-key-here';
      console.log('📺 Episode tracking API key check:', {
        TMDB_CONFIG: !!window.TMDB_CONFIG?.apiKey,
        __TMDB_API_KEY__: !!window.__TMDB_API_KEY__,
        TMDB_API_KEY: !!window.TMDB_API_KEY,
        finalKey: apiKey ? `${apiKey.slice(0,4)}...` : 'none'
      });
      const url = `${TMDB_API_BASE}${endpoint}?api_key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('📺 TMDB API error:', error);
      return null;
    }
  }

  /**
   * Process: Render Seasons
   * Purpose: Render seasons and episodes in the modal
   * Data Source: Seasons data array
   * Update Path: Modify season/episode rendering in this function
   * Dependencies: Seasons data structure
   */
  function renderSeasons(seasonsData, seriesId) {
    const container = document.querySelector('#episode-seasons');
    if (!container) return;
    
    let html = '';
    
    for (let i = 0; i < seasonsData.length; i++) {
      const season = seasonsData[i];
      const isFirstSeason = i === 0;
      
      html += renderSeason(season, seriesId, isFirstSeason);
    }
    
    container.innerHTML = html;
    
    // Add event listeners
    addSeasonEventListeners(seriesId);
  }

  /**
   * Process: Render Season
   * Purpose: Render individual season with episodes
   * Data Source: Season data object
   * Update Path: Modify season rendering in this function
   * Dependencies: Season data structure
   */
  function renderSeason(season, seriesId, isExpanded = false) {
    const seasonNumber = season.season_number;
    const episodes = season.episodes || [];
    const watchedCount = getWatchedCountForSeason(seriesId, seasonNumber);
    const totalEpisodes = episodes.length;
    
    let episodesHtml = '';
    for (const episode of episodes) {
      episodesHtml += renderEpisode(episode, seriesId, seasonNumber);
    }
    
    return `
      <div class="season-container" data-season="${seasonNumber}" style="margin-bottom: 20px; border: 1px solid var(--border, #ddd); border-radius: 8px; overflow: hidden;">
        <button class="season-header" data-season="${seasonNumber}" style="width: 100%; padding: 16px; background: var(--card, #f8f9fa); border: none; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0; font-size: 18px; color: var(--text, #333);">Season ${seasonNumber}</h3>
            <div style="font-size: 14px; color: var(--text-secondary, #666); margin-top: 4px;">
              ${watchedCount}/${totalEpisodes} watched
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="season-progress" style="width: 100px; height: 4px; background: var(--border, #ddd); border-radius: 2px; overflow: hidden;">
              <div class="season-progress-fill" style="height: 100%; background: var(--primary, #007bff); width: ${totalEpisodes > 0 ? (watchedCount / totalEpisodes) * 100 : 0}%; transition: width 0.3s ease;"></div>
            </div>
            <span class="season-chevron" style="font-size: 16px; color: var(--text-secondary, #666);">${isExpanded ? '▾' : '▸'}</span>
          </div>
        </button>
        
        <div class="season-episodes" data-season="${seasonNumber}" style="display: ${isExpanded ? 'block' : 'none'}; background: white;">
          ${episodesHtml}
        </div>
      </div>
    `;
  }

  /**
   * Process: Render Episode
   * Purpose: Render individual episode with watch toggle
   * Data Source: Episode data object
   * Update Path: Modify episode rendering in this function
   * Dependencies: Episode data structure
   */
  function renderEpisode(episode, seriesId, seasonNumber) {
    const episodeNumber = episode.episode_number;
    const title = episode.name || `Episode ${episodeNumber}`;
    const airDate = episode.air_date ? formatDate(episode.air_date) : 'TBA';
    const runtime = episode.runtime ? `${episode.runtime}min` : '';
    const isWatched = isEpisodeWatched(seriesId, seasonNumber, episodeNumber);
    
    return `
      <div class="episode-row" data-series="${seriesId}" data-season="${seasonNumber}" data-episode="${episodeNumber}" 
           style="padding: 12px 16px; border-bottom: 1px solid var(--border, #eee); display: flex; align-items: center; gap: 12px; cursor: pointer;"
           tabindex="0" role="button" aria-label="Mark S${seasonNumber}E${episodeNumber} ${escapeHtml(title)} watched">
        <div class="episode-info" style="flex: 1;">
          <div style="font-weight: 600; color: var(--text, #333);">
            S${seasonNumber}E${episodeNumber} • ${escapeHtml(title)}
          </div>
          <div style="font-size: 14px; color: var(--text-secondary, #666); margin-top: 2px;">
            ${airDate}${runtime ? ` • ${runtime}` : ''}
          </div>
        </div>
        <div class="episode-toggle" style="flex-shrink: 0;">
          <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
            <input type="checkbox" ${isWatched ? 'checked' : ''} 
                   data-series="${seriesId}" data-season="${seasonNumber}" data-episode="${episodeNumber}"
                   style="opacity: 0; width: 0; height: 0;">
            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border, #ccc); transition: 0.3s; border-radius: 24px;">
              <span class="slider-thumb" style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%;"></span>
            </span>
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Process: Add Season Event Listeners
   * Purpose: Add click handlers for season toggles and episode switches
   * Data Source: DOM elements in modal
   * Update Path: Modify event handling in this function
   * Dependencies: DOM elements, seriesId
   */
  function addSeasonEventListeners(seriesId) {
    // Season header clicks
    document.addEventListener('click', (e) => {
      const seasonHeader = e.target.closest('.season-header');
      if (seasonHeader) {
        const seasonNumber = seasonHeader.dataset.season;
        const episodesContainer = document.querySelector(`.season-episodes[data-season="${seasonNumber}"]`);
        const chevron = seasonHeader.querySelector('.season-chevron');
        
        if (episodesContainer && chevron) {
          const isExpanded = episodesContainer.style.display !== 'none';
          episodesContainer.style.display = isExpanded ? 'none' : 'block';
          chevron.textContent = isExpanded ? '▸' : '▾';
        }
      }
    });
    
    // Episode toggle clicks
    document.addEventListener('change', (e) => {
      if (e.target.matches('.episode-toggle input[type="checkbox"]')) {
        const seriesId = e.target.dataset.series;
        const seasonNumber = e.target.dataset.season;
        const episodeNumber = e.target.dataset.episode;
        const watched = e.target.checked;
        
        setEpisodeWatched(seriesId, seasonNumber, episodeNumber, watched);
        updateProgress(seriesId);
      }
    });
    
    // Episode row clicks (for keyboard accessibility)
    document.addEventListener('click', (e) => {
      const episodeRow = e.target.closest('.episode-row');
      if (episodeRow && !e.target.matches('input, label, .switch, .slider')) {
        const checkbox = episodeRow.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        }
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const episodeRow = e.target.closest('.episode-row');
      if (episodeRow) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const checkbox = episodeRow.querySelector('input[type="checkbox"]');
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
          }
        }
      }
    });
  }

  /**
   * Process: Set Episode Watched
   * Purpose: Update watched state for an episode with debouncing
   * Data Source: localStorage episode data
   * Update Path: Modify data storage or sync logic in this function
   * Dependencies: localStorage, debouncing
   */
  function setEpisodeWatched(seriesId, seasonNumber, episodeNumber, watched) {
    console.log(`📺 Setting S${seasonNumber}E${episodeNumber} watched:`, watched);
    
    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set the data immediately for UI responsiveness
    const seriesData = getSeriesData(seriesId);
    if (!seriesData.watched[seasonNumber]) {
      seriesData.watched[seasonNumber] = {};
    }
    seriesData.watched[seasonNumber][episodeNumber] = watched;
    saveSeriesData(seriesId, seriesData);
    
    // Debounce the sync operation
    debounceTimer = setTimeout(() => {
      syncEpisodeData(seriesId);
    }, DEBOUNCE_DELAY);
    
    // Show personality feedback
    showEpisodeFeedback(watched);
  }

  /**
   * Process: Get Series Data
   * Purpose: Get or create series data from localStorage
   * Data Source: localStorage
   * Update Path: Modify data structure if needed
   * Dependencies: localStorage
   */
  function getSeriesData(seriesId) {
    const key = `flicklet:episodeTracking:series:${seriesId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('📺 Error parsing series data:', e);
      }
    }
    
    // Return default structure
    return {
      trackEpisodes: false,
      watched: {}
    };
  }

  /**
   * Process: Save Series Data
   * Purpose: Save series data to localStorage
   * Data Source: localStorage
   * Update Path: Modify data storage if needed
   * Dependencies: localStorage
   */
  function saveSeriesData(seriesId, seriesData) {
    const key = `flicklet:episodeTracking:series:${seriesId}`;
    try {
      localStorage.setItem(key, JSON.stringify(seriesData));
    } catch (e) {
      console.error('📺 Error saving series data:', e);
    }
  }

  /**
   * Process: Sync Episode Data
   * Purpose: Sync episode data to Firebase when signed in
   * Data Source: Firebase, localStorage
   * Update Path: Modify sync logic if needed
   * Dependencies: Firebase, localStorage
   */
  function syncEpisodeData(seriesId) {
    // TODO: Implement Firebase sync when user is signed in
    console.log('📺 Syncing episode data for series:', seriesId);
  }

  /**
   * Process: Update Progress
   * Purpose: Update progress bar and counters
   * Data Source: Episode watched states
   * Update Path: Modify progress calculation if needed
   * Dependencies: Episode data
   */
  function updateProgress(seriesId) {
    const progress = getEpisodeProgress(seriesId);
    const progressText = document.querySelector('#episode-progress');
    const progressBar = document.querySelector('.progress-fill');
    
    if (progressText) {
      progressText.textContent = `${progress.watched}/${progress.total} watched`;
    }
    
    if (progressBar) {
      const percentage = progress.total > 0 ? (progress.watched / progress.total) * 100 : 0;
      progressBar.style.width = `${percentage}%`;
    }
    
    // Update season progress bars
    document.querySelectorAll('.season-progress-fill').forEach(fill => {
      const seasonContainer = fill.closest('.season-container');
      const seasonNumber = seasonContainer.dataset.season;
      const seasonProgress = getWatchedCountForSeason(seriesId, seasonNumber);
      const totalEpisodes = seasonContainer.querySelectorAll('.episode-row').length;
      const percentage = totalEpisodes > 0 ? (seasonProgress / totalEpisodes) * 100 : 0;
      fill.style.width = `${percentage}%`;
    });
  }

  /**
   * Process: Get Episode Progress
   * Purpose: Calculate total watched episodes for a series
   * Data Source: Episode watched states
   * Update Path: Modify progress calculation if needed
   * Dependencies: Episode data
   */
  function getEpisodeProgress(seriesId) {
    const seriesData = getSeriesData(seriesId);
    let watched = 0;
    let total = 0;
    
    // Count episodes from the modal
    const episodeRows = document.querySelectorAll('.episode-row[data-series="' + seriesId + '"]');
    total = episodeRows.length;
    
    for (const row of episodeRows) {
      const seasonNumber = row.dataset.season;
      const episodeNumber = row.dataset.episode;
      if (isEpisodeWatched(seriesId, seasonNumber, episodeNumber)) {
        watched++;
      }
    }
    
    return { watched, total };
  }

  /**
   * Process: Get Watched Count for Season
   * Purpose: Calculate watched episodes for a specific season
   * Data Source: Episode watched states
   * Update Path: Modify season progress calculation if needed
   * Dependencies: Episode data
   */
  function getWatchedCountForSeason(seriesId, seasonNumber) {
    const seriesData = getSeriesData(seriesId);
    const seasonData = seriesData.watched[seasonNumber] || {};
    return Object.values(seasonData).filter(watched => watched).length;
  }

  /**
   * Process: Is Episode Watched
   * Purpose: Check if a specific episode is marked as watched
   * Data Source: Episode watched states
   * Update Path: Modify watched state checking if needed
   * Dependencies: Episode data
   */
  function isEpisodeWatched(seriesId, seasonNumber, episodeNumber) {
    const seriesData = getSeriesData(seriesId);
    return seriesData.watched[seasonNumber]?.[episodeNumber] || false;
  }

  /**
   * Process: Show Episode Feedback
   * Purpose: Show personality feedback when episodes are marked
   * Data Source: Watched state
   * Update Path: Modify feedback messages if needed
   * Dependencies: Notification system
   */
  function showEpisodeFeedback(watched) {
    const messages = watched ? [
      "Marked as watched.",
      "Episode down.",
      "Nice. One more brain worm defeated."
    ] : [
      "Marked as unwatched.",
      "Episode restored.",
      "Back on the watchlist."
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    if (window.Notify?.success) {
      window.Notify.success(message);
    } else {
      console.log('📺', message);
    }
  }

  /**
   * Process: Is Episode Tracking Enabled
   * Purpose: Check if episode tracking is globally enabled
   * Data Source: localStorage settings
   * Update Path: Modify setting check if needed
   * Dependencies: localStorage
   */
  function isEpisodeTrackingEnabled() {
    return localStorage.getItem('flicklet:episodeTracking:enabled') === 'true';
  }

  /**
   * Process: Format Date
   * Purpose: Format date string for display
   * Data Source: Date string
   * Update Path: Modify date formatting if needed
   * Dependencies: None
   */
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'TBA';
    }
  }

  /**
   * Process: Escape HTML
   * Purpose: Escape HTML characters for safe display
   * Data Source: String input
   * Update Path: Modify escaping logic if needed
   * Dependencies: None
   */
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

})();
