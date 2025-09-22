/**
 * StatsCard Component - FlickWord Statistics Display
 * 
 * Process: StatsCard
 * Purpose: Reusable component for displaying FlickWord game statistics (streak, win%, games, last result)
 * Data Source: FlickWord game data from localStorage or API
 * Update Path: StatsCard component API and data binding
 * Dependencies: components.css, i18n.js
 */

(function() {
  'use strict';

  console.log('📊 StatsCard component loaded');

  /**
   * Create a stats card element for FlickWord
   * @param {Object} options - Stats configuration
   * @param {number} options.streak - Current win streak
   * @param {number} options.winRate - Win percentage (0-100)
   * @param {number} options.totalGames - Total games played
   * @param {string} options.lastResult - Last game result (e.g., "7/10", "WIN", "LOSS")
   * @param {string} options.lastPlayed - Last played date (optional)
   * @returns {HTMLElement} Stats card element
   */
  function StatsCard({
    streak = 0,
    winRate = 0,
    totalGames = 0,
    lastResult = '',
    lastPlayed = ''
  }) {
    const statsCard = document.createElement('div');
    statsCard.className = 'stats-card';
    statsCard.dataset.testid = 'stats-card';

    // Format win rate as percentage
    const formattedWinRate = Math.round(winRate);

    // Format last played date
    const formattedLastPlayed = lastPlayed ? new Date(lastPlayed).toLocaleDateString() : '';

    const statsHTML = `
      <div class="stats-card__header">
        <h3 class="stats-card__title">Your Stats</h3>
      </div>
      <div class="stats-card__content">
        <div class="stats-card__stat">
          <div class="stats-card__stat-value" data-testid="stats-streak">${streak}</div>
          <div class="stats-card__stat-label">Streak</div>
        </div>
        <div class="stats-card__stat">
          <div class="stats-card__stat-value" data-testid="stats-win-rate">${formattedWinRate}%</div>
          <div class="stats-card__stat-label">Win Rate</div>
        </div>
        <div class="stats-card__stat">
          <div class="stats-card__stat-value" data-testid="stats-total-games">${totalGames}</div>
          <div class="stats-card__stat-label">Games</div>
        </div>
        <div class="stats-card__stat">
          <div class="stats-card__stat-value" data-testid="stats-last-result">${lastResult || '—'}</div>
          <div class="stats-card__stat-label">Last Result</div>
        </div>
      </div>
      ${formattedLastPlayed ? `
        <div class="stats-card__footer">
          <div class="stats-card__last-played">Last played: ${formattedLastPlayed}</div>
        </div>
      ` : ''}
    `;

    statsCard.innerHTML = statsHTML;

    return statsCard;
  }

  /**
   * Update stats card with new data
   * @param {HTMLElement} statsCard - Stats card element
   * @param {Object} newStats - New stats data
   */
  function updateStatsCard(statsCard, newStats) {
    if (!statsCard) return;

    const { streak, winRate, totalGames, lastResult, lastPlayed } = newStats;
    
    // Update streak
    const streakElement = statsCard.querySelector('[data-testid="stats-streak"]');
    if (streakElement) streakElement.textContent = streak || 0;

    // Update win rate
    const winRateElement = statsCard.querySelector('[data-testid="stats-win-rate"]');
    if (winRateElement) winRateElement.textContent = `${Math.round(winRate || 0)}%`;

    // Update total games
    const totalGamesElement = statsCard.querySelector('[data-testid="stats-total-games"]');
    if (totalGamesElement) totalGamesElement.textContent = totalGames || 0;

    // Update last result
    const lastResultElement = statsCard.querySelector('[data-testid="stats-last-result"]');
    if (lastResultElement) lastResultElement.textContent = lastResult || '—';

    // Update last played
    const lastPlayedElement = statsCard.querySelector('.stats-card__last-played');
    if (lastPlayedElement && lastPlayed) {
      lastPlayedElement.textContent = `Last played: ${new Date(lastPlayed).toLocaleDateString()}`;
    }
  }

  /**
   * Load stats from localStorage
   * @returns {Object} Stats data
   */
  function loadStatsFromStorage() {
    try {
      const stored = localStorage.getItem('flickword-stats');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load FlickWord stats from localStorage:', error);
    }
    
    return {
      streak: 0,
      winRate: 0,
      totalGames: 0,
      lastResult: '',
      lastPlayed: ''
    };
  }

  /**
   * Save stats to localStorage
   * @param {Object} stats - Stats data to save
   */
  function saveStatsToStorage(stats) {
    try {
      localStorage.setItem('flickword-stats', JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save FlickWord stats to localStorage:', error);
    }
  }

  // Expose StatsCard component globally
  window.StatsCard = StatsCard;
  window.updateStatsCard = updateStatsCard;
  window.loadStatsFromStorage = loadStatsFromStorage;
  window.saveStatsToStorage = saveStatsToStorage;
  
  // Ensure global availability
  if (typeof window !== 'undefined') {
    window.StatsCard = window.StatsCard || StatsCard;
    window.updateStatsCard = window.updateStatsCard || updateStatsCard;
    window.loadStatsFromStorage = window.loadStatsFromStorage || loadStatsFromStorage;
    window.saveStatsToStorage = window.saveStatsToStorage || saveStatsToStorage;
  }

  console.log('✅ StatsCard component ready');

})();
