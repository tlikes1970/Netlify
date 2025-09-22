/**
 * FlickWord Tab Component - Home Surface Implementation
 * 
 * Process: FlickWord Tab
 * Purpose: FlickWord tab with header, hero row, and card grid layout using Base Poster Card
 * Data Source: FlickWord game data, word archives, user stats
 * Update Path: FlickWord tab rendering and event handlers
 * Dependencies: BasePosterCard.js, StatsCard.js, components.css
 */

(function() {
  'use strict';

  console.log('🎯 FlickWord Tab component loaded');

  /**
   * Create FlickWord tab content
   * @param {Object} options - Tab configuration
   * @param {Object} options.stats - User stats data
   * @param {Array} options.wordArchives - Word archive data
   * @param {Function} options.onPlay - Play button handler
   * @param {Function} options.onWordClick - Word card click handler
   * @returns {HTMLElement} FlickWord tab element
   */
  function FlickWordTab({
    stats = {},
    wordArchives = [],
    onPlay,
    onWordClick
  }) {
    const tab = document.createElement('div');
    tab.className = 'flickword-tab';
    tab.dataset.testid = 'flickword-tab';

    // Load stats from storage if not provided
    const userStats = stats.streak !== undefined ? stats : window.loadStatsFromStorage ? window.loadStatsFromStorage() : {};

    const tabHTML = `
      <!-- Header Row -->
      <div class="flickword-tab__header">
        <h2 class="flickword-tab__title">FLICKWORD</h2>
        <button class="btn btn--primary" data-testid="play-flickword" onclick="(${onPlay ? onPlay.toString() : '() => {}'})()">
          Play
        </button>
      </div>

      <!-- Hero Row -->
      <div class="flickword-tab__hero">
        <div class="flickword-tab__hero-image">
          <img src="/icons/word-game-hero.png" alt="FlickWord Game" loading="lazy" 
               style="width: 100%; max-width: 480px; min-width: 280px; height: auto; border-radius: 8px;">
        </div>
        <div class="flickword-tab__hero-stats">
          ${window.StatsCard ? window.StatsCard(userStats).outerHTML : ''}
        </div>
      </div>

      <!-- Card Grid -->
      <div class="flickword-tab__grid base-poster-grid" data-testid="flickword-grid">
        ${wordArchives.length > 0 ? 
          wordArchives.map(word => `
            <div class="flickword-word-card" data-word-id="${word.id}">
              ${window.BasePosterCard ? window.BasePosterCard({
                id: word.id,
                posterUrl: word.posterUrl || '/icons/word-puzzle.png',
                title: `WORD #${word.number || word.id}`,
                year: word.date ? new Date(word.date).getFullYear() : undefined,
                onClick: onWordClick || (() => {}),
                overflowActions: [
                  { label: 'Play', onClick: () => onWordClick ? onWordClick(word.id) : null, icon: '▶️' },
                  { label: 'Archive', onClick: () => console.log('Archive word', word.id), icon: '📁' }
                ]
              }).outerHTML : ''
            }
            </div>
          `).join('') : 
          (window.createEmptyState ? window.createEmptyState('No games yet — hit Play!').outerHTML : '')
        }
      </div>
    `;

    tab.innerHTML = tabHTML;

    // Add event listeners
    const playButton = tab.querySelector('[data-testid="play-flickword"]');
    if (playButton && onPlay) {
      playButton.addEventListener('click', onPlay);
    }

    // Add word card click handlers
    const wordCards = tab.querySelectorAll('.flickword-word-card');
    wordCards.forEach(card => {
      const wordId = card.dataset.wordId;
      card.addEventListener('click', () => {
        if (onWordClick) {
          onWordClick(wordId);
        }
      });
    });

    return tab;
  }

  /**
   * Create word archive data for display
   * @param {Array} rawArchives - Raw archive data
   * @returns {Array} Formatted archive data
   */
  function createWordArchives(rawArchives = []) {
    return rawArchives.map((archive, index) => ({
      id: archive.id || `word-${index}`,
      number: archive.number || index + 1,
      date: archive.date || new Date().toISOString(),
      posterUrl: archive.posterUrl || '/icons/word-puzzle.png',
      title: archive.title || `Word #${index + 1}`,
      difficulty: archive.difficulty || 'medium'
    }));
  }

  /**
   * Update FlickWord tab with new data
   * @param {HTMLElement} tab - Tab element
   * @param {Object} newData - New data to update
   */
  function updateFlickWordTab(tab, newData) {
    if (!tab) return;

    const { stats, wordArchives } = newData;

    // Update stats if provided
    if (stats) {
      const statsCard = tab.querySelector('.stats-card');
      if (statsCard && window.updateStatsCard) {
        window.updateStatsCard(statsCard, stats);
      }
    }

    // Update word archives if provided
    if (wordArchives) {
      const grid = tab.querySelector('.flickword-tab__grid');
      if (grid && window.BasePosterCard) {
        const archives = createWordArchives(wordArchives);
        grid.innerHTML = archives.map(word => `
          <div class="flickword-word-card" data-word-id="${word.id}">
            ${window.BasePosterCard({
              id: word.id,
              posterUrl: word.posterUrl,
              title: `WORD #${word.number}`,
              year: word.date ? new Date(word.date).getFullYear() : undefined,
              onClick: () => console.log('Word clicked', word.id),
              overflowActions: [
                { label: 'Play', onClick: () => console.log('Play word', word.id), icon: '▶️' },
                { label: 'Archive', onClick: () => console.log('Archive word', word.id), icon: '📁' }
              ]
            }).outerHTML}
          </div>
        `).join('');
      }
    }
  }

  /**
   * Show loading state for FlickWord tab
   * @param {HTMLElement} tab - Tab element
   */
  function showFlickWordLoading(tab) {
    if (!tab) return;

    const grid = tab.querySelector('.flickword-tab__grid');
    if (grid && window.createSkeletonCards) {
      const skeletons = window.createSkeletonCards(6);
      grid.innerHTML = '';
      skeletons.forEach(skeleton => grid.appendChild(skeleton));
    }
  }

  // Expose FlickWord Tab component globally
  window.FlickWordTab = FlickWordTab;
  window.createWordArchives = createWordArchives;
  window.updateFlickWordTab = updateFlickWordTab;
  window.showFlickWordLoading = showFlickWordLoading;
  
  // Ensure global availability
  if (typeof window !== 'undefined') {
    window.FlickWordTab = window.FlickWordTab || FlickWordTab;
    window.createWordArchives = window.createWordArchives || createWordArchives;
    window.updateFlickWordTab = window.updateFlickWordTab || updateFlickWordTab;
    window.showFlickWordLoading = window.showFlickWordLoading || showFlickWordLoading;
  }

  console.log('✅ FlickWord Tab component ready');

})();
