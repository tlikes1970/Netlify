/**
 * Card Data Normalizer - Unified Data Shape
 * 
 * Process: Card Data Normalization
 * Purpose: Normalize item data from various sources for consistent card rendering
 * Data Source: TMDB API responses, user lists, search results
 * Update Path: Update when data sources change
 * Dependencies: TMDB API, i18n.js
 */

(function() {
  'use strict';

  console.log('🔧 Card Data Normalizer loaded');

  /**
   * Normalize item data for poster card rendering
   * @param {Object} item - Raw item data from any source
   * @param {string} source - Source context ('tmdb', 'user-list', 'search')
   * @param {string} section - Section context ('watching', 'wishlist', 'watched', 'discover', 'search')
   * @returns {Object} Normalized card data
   */
  function normalizeCardData(item, source = 'tmdb', section = 'discover') {
    if (!item || typeof item !== 'object') {
      console.warn('Invalid item data:', item);
      return null;
    }

    // Determine media type
    const mediaType = determineMediaType(item);
    
    // Extract basic info
    const id = item.id || item.tmdb_id || item.tmdbId;
    const title = extractTitle(item);
    const year = extractYear(item);
    const rating = extractRating(item);
    const posterPath = extractPosterPath(item);
    const posterUrl = generatePosterUrl(posterPath);
    
    // Extract media-specific info
    const runtime = extractRuntime(item, mediaType);
    const season = extractSeason(item, mediaType);
    const episode = extractEpisode(item, mediaType);
    
    // Generate badges
    const badges = generateBadges(item, mediaType, section);
    
    // Determine if item is new (released in last 30 days)
    const isNew = isItemNew(item, mediaType);
    
    // Check availability (placeholder - would integrate with streaming APIs)
    const isAvailable = checkAvailability(item);
    
    // Generate progress data for watching items
    const progress = generateProgress(item, mediaType, section);
    
    // Generate quick actions based on section
    const quickActions = generateQuickActions(section, item);
    
    // Generate overflow actions
    const overflowActions = generateOverflowActions(section, item, mediaType);
    
    return {
      id,
      mediaType,
      title,
      posterUrl,
      posterPath,
      year,
      rating,
      runtime,
      season,
      episode,
      badges,
      isNew,
      isAvailable,
      progress,
      quickActions,
      overflowActions,
      originalData: item // Keep original for reference
    };
  }

  /**
   * Determine media type from item data
   */
  function determineMediaType(item) {
    if (item.media_type) {
      return item.media_type;
    }
    
    if (item.first_air_date) {
      return 'tv';
    }
    
    if (item.release_date) {
      return 'movie';
    }
    
    // Fallback based on common patterns
    if (item.name && !item.title) {
      return 'tv';
    }
    
    return 'movie';
  }

  /**
   * Extract title from item data
   */
  function extractTitle(item) {
    return item.title || item.name || item.original_title || item.original_name || 'Unknown Title';
  }

  /**
   * Extract year from item data
   */
  function extractYear(item) {
    const date = item.release_date || item.first_air_date || item.last_air_date;
    if (date) {
      return new Date(date).getFullYear().toString();
    }
    return '';
  }

  /**
   * Extract rating from item data
   */
  function extractRating(item) {
    const rating = item.vote_average || item.rating || 0;
    return Math.round(rating * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Extract poster path from item data
   */
  function extractPosterPath(item) {
    return item.poster_path || item.poster || '';
  }

  /**
   * Generate poster URL from path
   */
  function generatePosterUrl(posterPath) {
    if (!posterPath) return '';
    
    if (posterPath.startsWith('http')) {
      return posterPath;
    }
    
    return `https://image.tmdb.org/t/p/w200${posterPath}`;
  }

  /**
   * Extract runtime for movies
   */
  function extractRuntime(item, mediaType) {
    if (mediaType === 'movie' && item.runtime) {
      return parseInt(item.runtime);
    }
    return null;
  }

  /**
   * Extract season info for TV shows
   */
  function extractSeason(item, mediaType) {
    if (mediaType === 'tv') {
      return item.season_number || item.season || null;
    }
    return null;
  }

  /**
   * Extract episode info for TV shows
   */
  function extractEpisode(item, mediaType) {
    if (mediaType === 'tv') {
      return item.episode_number || item.episode || null;
    }
    return null;
  }

  /**
   * Generate badges for the item
   */
  function generateBadges(item, mediaType, section) {
    const badges = [];
    
    // Add HD/4K badge if available
    if (item.video_quality) {
      badges.push({
        label: item.video_quality,
        kind: 'quality',
        color: 'blue'
      });
    }
    
    // Add language badges
    if (item.original_language && item.original_language !== 'en') {
      const languageNames = {
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese'
      };
      
      badges.push({
        label: languageNames[item.original_language] || item.original_language.toUpperCase(),
        kind: 'language',
        color: 'gray'
      });
    }
    
    return badges;
  }

  /**
   * Check if item is new (released in last 30 days)
   */
  function isItemNew(item, mediaType) {
    const date = item.release_date || item.first_air_date;
    if (!date) return false;
    
    const releaseDate = new Date(date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return releaseDate >= thirtyDaysAgo;
  }

  /**
   * Check availability on streaming services (placeholder)
   */
  function checkAvailability(item) {
    // This would integrate with streaming availability APIs
    // For now, return false as placeholder
    return false;
  }

  /**
   * Generate progress data for watching items
   */
  function generateProgress(item, mediaType, section) {
    if (section !== 'watching') return {};
    
    const progress = {};
    
    if (mediaType === 'tv') {
      // Calculate days until next episode
      const nextAirDate = item.next_episode_to_air?.air_date;
      if (nextAirDate) {
        const nextDate = new Date(nextAirDate);
        const today = new Date();
        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        progress.nextEpisode = true;
        progress.daysUntil = Math.max(0, diffDays);
      }
    } else if (mediaType === 'movie') {
      // Calculate watched percentage
      const watchedPercent = item.watched_percent || 0;
      progress.watchedPercent = watchedPercent;
    }
    
    return progress;
  }

  /**
   * Generate quick actions based on section
   */
  function generateQuickActions(section, item) {
    const actions = {};
    
    switch (section) {
      case 'watching':
        actions.continue = {
          label: 'Continue',
          icon: '▶️',
          onClick: () => handleContinue(item)
        };
        break;
        
      case 'wishlist':
        actions.addToWatching = {
          label: 'Add to Watching',
          icon: '➕',
          onClick: () => handleAddToWatching(item)
        };
        break;
        
      case 'watched':
        actions.rewatch = {
          label: 'Rewatch',
          icon: '🔄',
          onClick: () => handleRewatch(item)
        };
        break;
        
      case 'discover':
      case 'search':
        actions.addToList = {
          label: 'Add to List',
          icon: '➕',
          onClick: () => handleAddToList(item)
        };
        break;
    }
    
    return actions;
  }

  /**
   * Generate overflow actions based on section
   */
  function generateOverflowActions(section, item, mediaType) {
    const actions = [];
    
    // Common actions
    actions.push({
      label: 'Details',
      icon: 'ℹ️',
      action: 'details',
      onClick: () => handleOpenDetails(item)
    });
    
    actions.push({
      label: 'Share',
      icon: '📤',
      action: 'share',
      onClick: () => handleShare(item)
    });
    
    actions.push({
      label: 'Open on TMDB',
      icon: '🔗',
      action: 'tmdb',
      onClick: () => handleOpenTMDB(item)
    });
    
    // Section-specific actions
    switch (section) {
      case 'watching':
        actions.unshift({
          label: 'Move to Wishlist',
          icon: '❤️',
          action: 'move-to-wishlist',
          onClick: () => handleMoveToList(item, 'wishlist')
        });
        actions.unshift({
          label: 'Mark as Watched',
          icon: '✅',
          action: 'mark-watched',
          onClick: () => handleMoveToList(item, 'watched')
        });
        break;
        
      case 'wishlist':
        actions.unshift({
          label: 'Add to Watching',
          icon: '▶️',
          action: 'add-to-watching',
          onClick: () => handleMoveToList(item, 'watching')
        });
        actions.unshift({
          label: 'Mark as Watched',
          icon: '✅',
          action: 'mark-watched',
          onClick: () => handleMoveToList(item, 'watched')
        });
        break;
        
      case 'watched':
        actions.unshift({
          label: 'Add to Watching',
          icon: '▶️',
          action: 'add-to-watching',
          onClick: () => handleMoveToList(item, 'watching')
        });
        actions.unshift({
          label: 'Add to Wishlist',
          icon: '❤️',
          action: 'add-to-wishlist',
          onClick: () => handleMoveToList(item, 'wishlist')
        });
        break;
        
      case 'discover':
      case 'search':
        actions.unshift({
          label: 'Add to Watching',
          icon: '▶️',
          action: 'add-to-watching',
          onClick: () => handleMoveToList(item, 'watching')
        });
        actions.unshift({
          label: 'Add to Wishlist',
          icon: '❤️',
          action: 'add-to-wishlist',
          onClick: () => handleMoveToList(item, 'wishlist')
        });
        break;
    }
    
    // Remove action
    actions.push({
      label: 'Remove from List',
      icon: '🗑️',
      action: 'remove',
      onClick: () => handleRemoveFromList(item, section)
    });
    
    return actions;
  }

  // Action handlers (delegate to existing functions)
  function handleContinue(item) {
    if (window.handleContinue) {
      window.handleContinue(item);
    } else {
      console.log('Continue action:', item);
    }
  }

  function handleAddToWatching(item) {
    if (window.addToWatching) {
      window.addToWatching(item);
    } else {
      console.log('Add to watching action:', item);
    }
  }

  function handleRewatch(item) {
    if (window.handleRewatch) {
      window.handleRewatch(item);
    } else {
      console.log('Rewatch action:', item);
    }
  }

  function handleAddToList(item) {
    if (window.addToList) {
      window.addToList(item);
    } else {
      console.log('Add to list action:', item);
    }
  }

  function handleOpenDetails(item) {
    if (window.openDetails) {
      window.openDetails(item);
    } else {
      console.log('Open details action:', item);
    }
  }

  function handleShare(item) {
    if (window.shareItem) {
      window.shareItem(item);
    } else {
      console.log('Share action:', item);
    }
  }

  function handleOpenTMDB(item) {
    if (window.openTMDBLink) {
      window.openTMDBLink(item.id, item.media_type || 'movie');
    } else {
      console.log('Open TMDB action:', item);
    }
  }

  function handleMoveToList(item, listName) {
    if (window.moveItemToList) {
      window.moveItemToList(item, listName);
    } else {
      console.log('Move to list action:', item, listName);
    }
  }

  function handleRemoveFromList(item, currentList) {
    if (window.removeItemFromList) {
      window.removeItemFromList(item, currentList);
    } else {
      console.log('Remove from list action:', item, currentList);
    }
  }

  // Export to global scope
  window.CardDataNormalizer = {
    normalize: normalizeCardData
  };
  
  console.log('✅ Card Data Normalizer ready');
})();


