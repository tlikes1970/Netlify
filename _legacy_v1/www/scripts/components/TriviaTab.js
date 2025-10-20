/**
 * Trivia Tab Component - Home Surface Implementation
 *
 * Process: Trivia Tab
 * Purpose: Trivia tab with header and TriviaCard grid layout using Base Poster Card
 * Data Source: Trivia category data, user progress, game statistics
 * Update Path: Trivia tab rendering and event handlers
 * Dependencies: BasePosterCard.js, components.css
 */

(function () {
  'use strict';

  console.log('🧠 Trivia Tab component loaded');

  /**
   * Create stats panel with Basic and Pro rows
   * @returns {string} HTML for stats panel
   */
  function createStatsPanel() {
    const isPro = window.appData?.settings?.pro || false;
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `flicklet:trivia:daily:${today}`;
    const dailyCount = parseInt(localStorage.getItem(dailyKey) || '0');
    const streak = parseInt(localStorage.getItem('flicklet:trivia:v1:streak') || '0');

    return `
      <div class="stats-panel">
        <div class="stats-row ${isPro ? 'pro-active' : 'basic-active'}">
          <div class="stats-label">Basic Plan</div>
          <div class="stats-value">${dailyCount}/5 questions today</div>
          <div class="stats-status">${isPro ? 'Upgraded' : 'Active'}</div>
        </div>
        <div class="stats-row ${isPro ? 'pro-active' : 'pro-locked'}">
          <div class="stats-label">Pro Plan</div>
          <div class="stats-value">${isPro ? `${dailyCount}/50 questions today` : '50 questions/day'}</div>
          <div class="stats-status">${isPro ? 'Active' : 'Locked'}</div>
        </div>
        <div class="stats-summary">
          <div class="streak-info">Current Streak: ${streak} days</div>
          ${!isPro ? '<div class="upgrade-hint">Upgrade to Pro for 10x more questions!</div>' : ''}
        </div>
      </div>
    `;
  }

  /**
   * Create Trivia tab content
   * @param {Object} options - Tab configuration
   * @param {Array} options.categories - Trivia category data
   * @param {Function} options.onPlay - Play button handler
   * @param {Function} options.onCategoryClick - Category card click handler
   * @returns {HTMLElement} Trivia tab element
   */
  function TriviaTab({ categories = [], onPlay, onCategoryClick }) {
    const tab = document.createElement('div');
    tab.className = 'trivia-tab';
    tab.dataset.testid = 'trivia-tab';

    const tabHTML = `
      <!-- Header Row -->
      <div class="trivia-tab__header">
        <h2 class="trivia-tab__title">TRIVIA</h2>
        <button class="btn btn--primary" data-testid="play-trivia" onclick="(${onPlay ? onPlay.toString() : '() => {}'})()">
          Play
        </button>
      </div>

      <!-- Stats Panel -->
      <div class="trivia-stats-panel" data-testid="trivia-stats">
        ${createStatsPanel()}
      </div>

      <!-- Card Grid -->
      <div class="trivia-tab__grid" data-testid="trivia-grid">
        ${
          categories.length > 0
            ? categories
                .map(
                  (category) => `
            <div class="trivia-category-card" data-category-id="${category.id}">
              ${
                window.BasePosterCard
                  ? window.BasePosterCard({
                      id: category.id,
                      posterUrl: category.posterUrl || getCategoryIcon(category.type),
                      title: category.name || category.title,
                      subline: formatCategorySubline(category),
                      hideRating: true,
                      onClick: onCategoryClick || (() => {}),
                      overflowActions: [
                        {
                          label: 'Play',
                          onClick: () => (onCategoryClick ? onCategoryClick(category.id) : null),
                          icon: '▶️',
                        },
                        {
                          label: 'Details',
                          onClick: () => console.log('Category details', category.id),
                          icon: 'ℹ️',
                        },
                        {
                          label: 'Save',
                          onClick: () => console.log('Save category', category.id),
                          icon: '💾',
                        },
                      ],
                    }).outerHTML
                  : ''
              }
            </div>
          `,
                )
                .join('')
            : window.createEmptyState
              ? window.createEmptyState('No trivia categories available').outerHTML
              : ''
        }
      </div>
    `;

    tab.innerHTML = tabHTML;

    // Add event listeners
    const playButton = tab.querySelector('[data-testid="play-trivia"]');
    if (playButton && onPlay) {
      playButton.addEventListener('click', onPlay);
    }

    // Add category card click handlers
    const categoryCards = tab.querySelectorAll('.trivia-category-card');
    categoryCards.forEach((card) => {
      const categoryId = card.dataset.categoryId;
      card.addEventListener('click', () => {
        if (onCategoryClick) {
          onCategoryClick(categoryId);
        }
      });
    });

    return tab;
  }

  /**
   * Get category icon based on type
   * @param {string} type - Category type
   * @returns {string} Icon URL or emoji
   */
  function getCategoryIcon(type) {
    const iconMap = {
      movies: '/icons/movie-reel.png',
      tv: '/icons/tv-screen.png',
      music: '/icons/music-note.png',
      sports: '/icons/sports-ball.png',
      history: '/icons/history-book.png',
      science: '/icons/science-lab.png',
      geography: '/icons/globe.png',
      literature: '/icons/book.png',
      art: '/icons/palette.png',
      general: '/icons/brain.png',
    };

    return iconMap[type] || '/icons/trivia-default.png';
  }

  /**
   * Format category subline with stats
   * @param {Object} category - Category data
   * @returns {string} Formatted subline
   */
  function formatCategorySubline(category) {
    const parts = [];

    if (category.questionCount) {
      parts.push(`${category.questionCount} questions`);
    }

    if (category.avgTime) {
      parts.push(`avg ${category.avgTime}`);
    }

    if (category.lastScore !== undefined) {
      parts.push(`last score ${category.lastScore}`);
    }

    return parts.join(' • ') || '10 questions • avg 6:30';
  }

  /**
   * Create trivia category data for display
   * @param {Array} rawCategories - Raw category data
   * @returns {Array} Formatted category data
   */
  function createTriviaCategories(rawCategories = []) {
    return rawCategories.map((category, index) => ({
      id: category.id || `category-${index}`,
      name: category.name || category.title || `Category ${index + 1}`,
      type: category.type || 'general',
      posterUrl: category.posterUrl || getCategoryIcon(category.type || 'general'),
      questionCount: category.questionCount || 10,
      avgTime: category.avgTime || '6:30',
      lastScore: category.lastScore,
      difficulty: category.difficulty || 'medium',
      description: category.description || '',
    }));
  }

  /**
   * Update Trivia tab with new data
   * @param {HTMLElement} tab - Tab element
   * @param {Object} newData - New data to update
   */
  function updateTriviaTab(tab, newData) {
    if (!tab) return;

    const { categories } = newData;

    // Update categories if provided
    if (categories) {
      const grid = tab.querySelector('.trivia-tab__grid');
      if (grid && window.BasePosterCard) {
        const formattedCategories = createTriviaCategories(categories);
        grid.innerHTML = formattedCategories
          .map(
            (category) => `
          <div class="trivia-category-card" data-category-id="${category.id}">
            ${
              window.BasePosterCard({
                id: category.id,
                posterUrl: category.posterUrl,
                title: category.name,
                subline: formatCategorySubline(category),
                hideRating: true,
                onClick: () => console.log('Category clicked', category.id),
                overflowActions: [
                  {
                    label: 'Play',
                    onClick: () => console.log('Play category', category.id),
                    icon: '▶️',
                  },
                  {
                    label: 'Details',
                    onClick: () => console.log('Category details', category.id),
                    icon: 'ℹ️',
                  },
                  {
                    label: 'Save',
                    onClick: () => console.log('Save category', category.id),
                    icon: '💾',
                  },
                ],
              }).outerHTML
            }
          </div>
        `,
          )
          .join('');
      }
    }
  }

  /**
   * Show loading state for Trivia tab
   * @param {HTMLElement} tab - Tab element
   */
  function showTriviaLoading(tab) {
    if (!tab) return;

    const grid = tab.querySelector('.trivia-tab__grid');
    if (grid && window.createSkeletonCards) {
      const skeletons = window.createSkeletonCards(8);
      grid.innerHTML = '';
      skeletons.forEach((skeleton) => grid.appendChild(skeleton));
    }
  }

  // Expose Trivia Tab component globally
  window.TriviaTab = TriviaTab;
  window.createTriviaCategories = createTriviaCategories;
  window.updateTriviaTab = updateTriviaTab;
  window.showTriviaLoading = showTriviaLoading;

  // Ensure global availability
  if (typeof window !== 'undefined') {
    window.TriviaTab = window.TriviaTab || TriviaTab;
    window.createTriviaCategories = window.createTriviaCategories || createTriviaCategories;
    window.updateTriviaTab = window.updateTriviaTab || updateTriviaTab;
    window.showTriviaLoading = window.showTriviaLoading || showTriviaLoading;
  }

  console.log('✅ Trivia Tab component ready');
})();
