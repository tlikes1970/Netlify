/**
 * Force Card Migration - Convert Old Cards to New Unified Cards
 * 
 * Process: Force Card Migration
 * Purpose: Convert all existing old cards to new unified poster cards
 * Data Source: Existing DOM elements, appData
 * Update Path: Remove after migration is complete
 * Dependencies: unified-poster-card.js, appData
 */

(function() {
  'use strict';

  console.log('🔄 Force Card Migration starting...');

  /**
   * Convert all old cards to new unified cards
   */
  function forceCardMigration() {
    console.log('🔄 Starting force card migration...');
    
    try {
      // Find all card containers
      const cardContainers = [
        'watchingList',
        'wishlistList', 
        'watchedList',
        'discoverList',
        'searchList'
      ];

      let migratedCount = 0;
      let totalOldCards = 0;

      cardContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) {
          console.log(`⚠️ Container ${containerId} not found`);
          return;
        }

        // Find all old card types
        const oldCards = container.querySelectorAll('.show-card, .poster-card, .list-item, .card:not(.unified-poster-card)');
        totalOldCards += oldCards.length;
        
        console.log(`🔄 Found ${oldCards.length} old cards in ${containerId}`);

        oldCards.forEach(card => {
          try {
            // Extract item data from old card
            const itemData = extractItemDataFromCard(card, containerId);
            if (!itemData) {
              console.log('⚠️ Could not extract data from card:', card);
              return;
            }

            // Determine section from container ID
            const section = containerId.replace('List', '');
            
            // Create new unified card
            const newCard = createUnifiedPosterCard(itemData, section);
            if (!newCard) {
              console.log('⚠️ Could not create unified card for:', itemData.title);
              return;
            }

            // Replace old card with new one
            card.parentNode.replaceChild(newCard, card);
            migratedCount++;

            console.log(`✅ Migrated card: ${itemData.title}`);

          } catch (error) {
            console.error('❌ Failed to migrate card:', error, card);
          }
        });
      });

      console.log(`✅ Migration complete: ${migratedCount}/${totalOldCards} cards migrated`);
      
      // Show success message
      if (window.showToast) {
        window.showToast('success', 'Cards Updated', `${migratedCount} cards updated to new design`);
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      if (window.showToast) {
        window.showToast('error', 'Migration Failed', 'Some cards may not have been updated');
      }
    }
  }

  /**
   * Extract item data from old card element
   */
  function extractItemDataFromCard(card, containerId) {
    try {
      // Get basic data from data attributes
      const id = card.dataset.id || card.dataset.tmdbId || card.dataset.tmdb_id;
      const mediaType = card.dataset.mediaType || card.dataset.media_type || 
                       (card.dataset.firstAirDate ? 'tv' : 'movie');
      
      if (!id) {
        console.warn('No ID found for card:', card);
        return null;
      }

      // Extract title
      const titleElement = card.querySelector('.show-title, .poster-title, .card-title, .list-item-title, h3, h4');
      const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';

      // Extract year
      const yearElement = card.querySelector('.show-year, .poster-year, .card-year, .list-item-year');
      const year = yearElement ? yearElement.textContent.trim() : '';

      // Extract rating
      const ratingElement = card.querySelector('.show-rating, .poster-rating, .card-rating, .list-item-rating');
      const rating = ratingElement ? parseFloat(ratingElement.textContent.replace('★', '')) : null;

      // Extract poster
      const posterElement = card.querySelector('img');
      const posterPath = posterElement ? posterElement.src : '';
      const posterSrc = posterPath.includes('image.tmdb.org') ? posterPath : '';

      // Extract additional data from data attributes
      const releaseDate = card.dataset.releaseDate || card.dataset.release_date;
      const firstAirDate = card.dataset.firstAirDate || card.dataset.first_air_date;
      const voteAverage = card.dataset.voteAverage || card.dataset.vote_average;
      const overview = card.dataset.overview;

      // Build item data object
      const itemData = {
        id: parseInt(id),
        title: title,
        name: title, // For TV shows
        media_type: mediaType,
        release_date: releaseDate,
        first_air_date: firstAirDate,
        vote_average: voteAverage ? parseFloat(voteAverage) : rating,
        overview: overview,
        poster_path: posterSrc ? posterSrc.replace('https://image.tmdb.org/t/p/w200', '') : null,
        poster_src: posterSrc,
        year: year
      };

      // Add section-specific data
      const section = containerId.replace('List', '');
      if (section === 'watching') {
        itemData.next_episode = card.dataset.nextEpisode ? JSON.parse(card.dataset.nextEpisode) : null;
        itemData.status = card.dataset.status;
        itemData.availability = card.dataset.availability;
      }

      return itemData;

    } catch (error) {
      console.error('Failed to extract item data from card:', error, card);
      return null;
    }
  }

  /**
   * Create unified poster card (fallback if not available globally)
   */
  function createUnifiedPosterCard(item, section) {
    if (window.createUnifiedPosterCard) {
      return window.createUnifiedPosterCard(item, section);
    }
    
    if (window.createPosterCard) {
      return window.createPosterCard(item, section);
    }
    
    console.error('❌ createUnifiedPosterCard function not available');
    return null;
  }

  /**
   * Wait for unified card component to be available
   */
  function waitForUnifiedCard() {
    return new Promise((resolve) => {
      if (window.createUnifiedPosterCard || window.createPosterCard) {
        resolve();
      } else {
        setTimeout(() => waitForUnifiedCard().then(resolve), 100);
      }
    });
  }

  /**
   * Initialize migration
   */
  async function init() {
    await waitForUnifiedCard();
    
    // Wait a bit for data to load
    setTimeout(() => {
      forceCardMigration();
    }, 2000);
  }

  // Start migration
  init();

  // Expose globally for manual use
  window.forceCardMigration = forceCardMigration;

  console.log('✅ Force Card Migration script ready. Use window.forceCardMigration() to manually migrate.');

})();
