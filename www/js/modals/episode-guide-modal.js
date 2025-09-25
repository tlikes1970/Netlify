/**
 * Episode Guide Modal - Simple Episode Tracking
 * 
 * Process: Episode Guide Modal
 * Purpose: Simple episode tracking modal with season picker and episode checkboxes
 * Data Source: TMDB API for episode data, localStorage for user progress
 * Update Path: Modify modal structure or episode data handling
 * Dependencies: TMDB API, localStorage, modal system
 */

(function() {
  'use strict';

  console.log('📺 Episode Guide Modal loaded');

  /**
   * Open episode guide modal for a TV show
   * @param {Object} item - Item data
   */
  function openEpisodeGuideModal(item) {
    // Check if it's a TV show
    if (item.media_type !== 'tv' && !item.first_air_date) {
      showToast('info', 'Not Available', 'Episode guide is only available for TV shows');
      return;
    }

    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.dataset.modal = 'episode-guide';
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal modal--episode-guide';
    
    const showTitle = item.title || item.name || 'Unknown Show';
    const showId = item.id || item.tmdb_id || item.tmdbId;
    
    modal.innerHTML = `
      <div class="modal__header">
        <h3 class="modal__title">Episode Guide - ${showTitle}</h3>
        <button class="modal__close" aria-label="Close modal">×</button>
      </div>
      <div class="modal__body">
        <div class="episode-guide">
          <div class="episode-guide__seasons">
            <label for="seasonSelect">Season:</label>
            <select id="seasonSelect" class="episode-guide__select">
              <option value="">Loading seasons...</option>
            </select>
          </div>
          <div class="episode-guide__episodes" id="episodeList">
            <div class="episode-guide__loading">Loading episodes...</div>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--secondary modal__cancel">Cancel</button>
        <button class="btn btn--primary modal__save">Save Progress</button>
      </div>
    `;
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.modal__close');
    const cancelBtn = modal.querySelector('.modal__cancel');
    const saveBtn = modal.querySelector('.modal__save');
    const seasonSelect = modal.querySelector('#seasonSelect');
    const episodeList = modal.querySelector('#episodeList');
    
    const closeModal = () => {
      backdrop.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    
    // Load seasons and episodes
    loadSeasonsAndEpisodes(showId, seasonSelect, episodeList);
    
    // Handle season change
    seasonSelect.addEventListener('change', (e) => {
      const seasonNumber = e.target.value;
      if (seasonNumber) {
        loadEpisodesForSeason(showId, seasonNumber, episodeList);
      }
    });
    
    // Handle save
    saveBtn.addEventListener('click', () => {
      saveEpisodeProgress(showId, episodeList);
      showToast('success', 'Progress Saved', 'Your episode progress has been saved');
      closeModal();
    });
    
    // Focus the modal for accessibility
    setTimeout(() => modal.focus(), 100);
  }

  /**
   * Load seasons and episodes for a show
   * @param {string|number} showId - Show ID
   * @param {HTMLElement} seasonSelect - Season select element
   * @param {HTMLElement} episodeList - Episode list element
   */
  async function loadSeasonsAndEpisodes(showId, seasonSelect, episodeList) {
    try {
      // Load show details to get seasons
      const showData = await window.tmdbGet(`tv/${showId}`);
      
      if (!showData || !showData.id) {
        throw new Error('Failed to load show details');
      }
      const seasons = showData.seasons || [];
      
      // Populate season select
      seasonSelect.innerHTML = '<option value="">Select a season...</option>';
      seasons.forEach(season => {
        if (season.season_number > 0) { // Skip special seasons
          const option = document.createElement('option');
          option.value = season.season_number;
          option.textContent = `Season ${season.season_number}`;
          seasonSelect.appendChild(option);
        }
      });
      
      // Load first season by default
      if (seasons.length > 0) {
        const firstSeason = seasons.find(s => s.season_number === 1);
        if (firstSeason) {
          seasonSelect.value = '1';
          await loadEpisodesForSeason(showId, '1', episodeList);
        }
      }
      
    } catch (error) {
      console.error('Failed to load seasons:', error);
      episodeList.innerHTML = '<div class="episode-guide__error">Failed to load episodes. Please try again.</div>';
    }
  }

  /**
   * Load episodes for a specific season
   * @param {string|number} showId - Show ID
   * @param {string|number} seasonNumber - Season number
   * @param {HTMLElement} episodeList - Episode list element
   */
  async function loadEpisodesForSeason(showId, seasonNumber, episodeList) {
    try {
      episodeList.innerHTML = '<div class="episode-guide__loading">Loading episodes...</div>';
      
      const seasonData = await window.tmdbGet(`tv/${showId}/season/${seasonNumber}`);
      
      if (!seasonData || !seasonData.episodes) {
        throw new Error('Failed to load episodes');
      }
      const episodes = seasonData.episodes || [];
      
      // Load user progress
      const userProgress = loadUserProgress(showId, seasonNumber);
      
      // Render episodes
      if (episodes.length === 0) {
        episodeList.innerHTML = '<div class="episode-guide__empty">No episodes found for this season.</div>';
        return;
      }
      
      const episodesHTML = episodes.map(episode => {
        const isWatched = userProgress.includes(episode.episode_number);
        const airDate = episode.air_date ? new Date(episode.air_date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }) : 'TBA';
        
        return `
          <div class="episode-guide__episode ${isWatched ? 'episode-guide__episode--watched' : ''}">
            <div class="episode-guide__episode-number">S${seasonNumber}E${episode.episode_number}</div>
            <div class="episode-guide__episode-title">${episode.name || 'Untitled'}</div>
            <div class="episode-guide__episode-date">${airDate}</div>
            <div class="episode-guide__episode-rating">${episode.vote_average ? `★${episode.vote_average.toFixed(1)}` : ''}</div>
            <label class="episode-guide__episode-checkbox">
              <input type="checkbox" ${isWatched ? 'checked' : ''} data-episode="${episode.episode_number}">
              <span class="episode-guide__episode-label">Watched</span>
            </label>
          </div>
        `;
      }).join('');
      
      episodeList.innerHTML = episodesHTML;
      
      // Add event listeners for checkboxes
      const checkboxes = episodeList.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const episodeNumber = parseInt(e.target.dataset.episode);
          const episodeElement = e.target.closest('.episode-guide__episode');
          
          if (e.target.checked) {
            episodeElement.classList.add('episode-guide__episode--watched');
          } else {
            episodeElement.classList.remove('episode-guide__episode--watched');
          }
        });
      });
      
    } catch (error) {
      console.error('Failed to load episodes:', error);
      episodeList.innerHTML = '<div class="episode-guide__error">Failed to load episodes. Please try again.</div>';
    }
  }

  /**
   * Load user progress for a season
   * @param {string|number} showId - Show ID
   * @param {string|number} seasonNumber - Season number
   * @returns {Array} Array of watched episode numbers
   */
  function loadUserProgress(showId, seasonNumber) {
    try {
      const key = `flicklet-episode-progress-${showId}-${seasonNumber}`;
      const progress = localStorage.getItem(key);
      return progress ? JSON.parse(progress) : [];
    } catch (error) {
      console.error('Failed to load user progress:', error);
      return [];
    }
  }

  /**
   * Save user progress for a season
   * @param {string|number} showId - Show ID
   * @param {HTMLElement} episodeList - Episode list element
   */
  function saveEpisodeProgress(showId, episodeList) {
    try {
      const seasonNumber = document.querySelector('#seasonSelect').value;
      if (!seasonNumber) return;
      
      const checkboxes = episodeList.querySelectorAll('input[type="checkbox"]');
      const watchedEpisodes = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => parseInt(checkbox.dataset.episode));
      
      const key = `flicklet-episode-progress-${showId}-${seasonNumber}`;
      localStorage.setItem(key, JSON.stringify(watchedEpisodes));
      
      // Update the main app data if needed
      updateAppDataProgress(showId, seasonNumber, watchedEpisodes);
      
    } catch (error) {
      console.error('Failed to save user progress:', error);
    }
  }

  /**
   * Update app data with episode progress
   * @param {string|number} showId - Show ID
   * @param {string|number} seasonNumber - Season number
   * @param {Array} watchedEpisodes - Array of watched episode numbers
   */
  function updateAppDataProgress(showId, seasonNumber, watchedEpisodes) {
    if (!window.appData) return;
    
    // Find the show in the app data
    const lists = ['watching', 'wishlist', 'watched'];
    const mediaTypes = ['tv', 'movies'];
    
    for (const mediaType of mediaTypes) {
      if (!window.appData[mediaType]) continue;
      
      for (const list of lists) {
        if (!window.appData[mediaType][list]) continue;
        
        const showIndex = window.appData[mediaType][list].findIndex(item => 
          (item.id || item.tmdb_id || item.tmdbId) == showId
        );
        
        if (showIndex !== -1) {
          // Update the show with episode progress
          if (!window.appData[mediaType][list][showIndex].episodeProgress) {
            window.appData[mediaType][list][showIndex].episodeProgress = {};
          }
          
          window.appData[mediaType][list][showIndex].episodeProgress[seasonNumber] = watchedEpisodes;
          
          // Save to localStorage
          if (window.saveAppData) {
            window.saveAppData();
          } else {
            localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
          }
          
          break;
        }
      }
    }
  }

  /**
   * Show toast notification
   * @param {string} type - Toast type
   * @param {string} title - Toast title
   * @param {string} message - Toast message
   */
  function showToast(type, title, message) {
    if (window.showToast) {
      window.showToast(type, title, message);
    } else {
      console.log(`Toast [${type}]: ${title} - ${message}`);
    }
  }

  // Expose globally
  window.openEpisodeGuideModal = openEpisodeGuideModal;
  
  console.log('✅ Episode Guide Modal ready');

})();

