/**
 * Game Tabs Initialization - FlickWord and Trivia Tab Management
 *
 * Process: Game Tabs Init
 * Purpose: Initialize and manage FlickWord and Trivia tabs with unified card system
 * Data Source: User stats, word archives, trivia categories
 * Update Path: Tab rendering and event handling
 * Dependencies: BasePosterCard.js, StatsCard.js, FlickWordTab.js, TriviaTab.js
 */

(function () {
  'use strict';

  console.log('🎮 Game Tabs initialization loaded');

  // Sample data for demonstration
  const sampleFlickWordStats = {
    streak: 5,
    winRate: 85,
    totalGames: 23,
    lastResult: '7/10',
    lastPlayed: new Date().toISOString(),
  };

  const sampleWordArchives = [
    { id: 'word-1', number: 1, date: '2024-01-15', title: 'PUZZLE' },
    { id: 'word-2', number: 2, date: '2024-01-16', title: 'RIDDLE' },
    { id: 'word-3', number: 3, date: '2024-01-17', title: 'BRAIN' },
    { id: 'word-4', number: 4, date: '2024-01-18', title: 'LOGIC' },
    { id: 'word-5', number: 5, date: '2024-01-19', title: 'THINK' },
  ];

  const sampleTriviaCategories = [
    {
      id: 'movies-90s',
      name: 'MOVIES: 1990s',
      type: 'movies',
      questionCount: 10,
      avgTime: '6:30',
      lastScore: '7/10',
    },
    {
      id: 'tv-shows',
      name: 'TV SHOWS',
      type: 'tv',
      questionCount: 15,
      avgTime: '8:45',
      lastScore: '12/15',
    },
    {
      id: 'music-classic',
      name: 'MUSIC: Classic Rock',
      type: 'music',
      questionCount: 12,
      avgTime: '5:20',
      lastScore: '9/12',
    },
    {
      id: 'sports-nfl',
      name: 'SPORTS: NFL',
      type: 'sports',
      questionCount: 8,
      avgTime: '4:15',
      lastScore: '6/8',
    },
    {
      id: 'history-ww2',
      name: 'HISTORY: World War II',
      type: 'history',
      questionCount: 20,
      avgTime: '12:30',
      lastScore: '16/20',
    },
    {
      id: 'science-physics',
      name: 'SCIENCE: Physics',
      type: 'science',
      questionCount: 10,
      avgTime: '7:45',
      lastScore: '8/10',
    },
  ];

  let currentTab = 'flickword';
  let flickwordTab = null;
  let triviaTab = null;

  /**
   * Initialize game tabs
   */
  function initGameTabs() {
    console.log('🎮 Initializing game tabs...');

    // Get tab containers
    const flickwordContainer = document.getElementById('flickword-tab');
    const triviaContainer = document.getElementById('trivia-tab');
    const tabButtons = document.querySelectorAll('.game-tab-btn');

    if (!flickwordContainer || !triviaContainer) {
      console.error('Game tab containers not found');
      return;
    }

    // Initialize FlickWord tab
    if (window.FlickWordTab) {
      flickwordTab = window.FlickWordTab({
        stats: sampleFlickWordStats,
        wordArchives: sampleWordArchives,
        onPlay: handleFlickWordPlay,
        onWordClick: handleWordClick,
      });
      flickwordContainer.appendChild(flickwordTab);
    }

    // Initialize Trivia tab
    if (window.TriviaTab) {
      triviaTab = window.TriviaTab({
        categories: sampleTriviaCategories,
        onPlay: handleTriviaPlay,
        onCategoryClick: handleCategoryClick,
      });
      triviaContainer.appendChild(triviaTab);
    }

    // Add tab button event listeners
    tabButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        switchTab(tabName);
      });
    });

    // Show initial tab
    switchTab('flickword');

    console.log('✅ Game tabs initialized');
  }

  /**
   * Switch between tabs
   * @param {string} tabName - Tab to switch to
   */
  function switchTab(tabName) {
    console.log(`🔄 Switching to ${tabName} tab`);

    // Update tab buttons
    document.querySelectorAll('.game-tab-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.game-tab').forEach((tab) => {
      tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    currentTab = tabName;
  }

  /**
   * Handle FlickWord play button click
   */
  function handleFlickWordPlay() {
    console.log('🎯 FlickWord play clicked');
    // Open FlickWord modal
    if (window.openFlickWordModal) {
      window.openFlickWordModal();
    } else {
      console.warn('FlickWord modal function not available');
    }
  }

  /**
   * Handle word card click
   * @param {string} wordId - Word ID
   */
  function handleWordClick(wordId) {
    console.log('📝 Word clicked:', wordId);
    // Open FlickWord modal with specific word
    if (window.openFlickWordModal) {
      window.openFlickWordModal(wordId);
    }
  }

  /**
   * Handle Trivia play button click
   */
  function handleTriviaPlay() {
    console.log('🧠 Trivia play clicked');
    // Open Trivia modal
    if (window.openTriviaModal) {
      window.openTriviaModal();
    } else {
      console.warn('Trivia modal function not available');
    }
  }

  /**
   * Handle category card click
   * @param {string} categoryId - Category ID
   */
  function handleCategoryClick(categoryId) {
    console.log('📚 Category clicked:', categoryId);
    // Open Trivia modal with specific category
    if (window.openTriviaModal) {
      window.openTriviaModal(categoryId);
    }
  }

  /**
   * Update FlickWord stats
   * @param {Object} newStats - New stats data
   */
  function updateFlickWordStats(newStats) {
    if (flickwordTab && window.updateFlickWordTab) {
      window.updateFlickWordTab(flickwordTab, { stats: newStats });
    }
  }

  /**
   * Update Trivia categories
   * @param {Array} newCategories - New categories data
   */
  function updateTriviaCategories(newCategories) {
    if (triviaTab && window.updateTriviaTab) {
      window.updateTriviaTab(triviaTab, { categories: newCategories });
    }
  }

  /**
   * Show loading state for current tab
   */
  function showLoading() {
    if (currentTab === 'flickword' && flickwordTab && window.showFlickWordLoading) {
      window.showFlickWordLoading(flickwordTab);
    } else if (currentTab === 'trivia' && triviaTab && window.showTriviaLoading) {
      window.showTriviaLoading(triviaTab);
    }
  }

  // Expose functions globally
  window.initGameTabs = initGameTabs;
  window.switchGameTab = switchTab;
  window.updateFlickWordStats = updateFlickWordStats;
  window.updateTriviaCategories = updateTriviaCategories;
  window.showGameTabLoading = showLoading;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGameTabs);
  } else {
    initGameTabs();
  }

  console.log('✅ Game Tabs initialization ready');
})();
