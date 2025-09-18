/**
 * Unified Card Migration Script
 * 
 * Process: Card System Migration
 * Purpose: Replace legacy card systems with unified poster card system
 * Data Source: Existing card implementations and DOM elements
 * Update Path: Update migration logic as new card systems are added
 * Dependencies: unified-poster-card.js, DOM manipulation
 */

(function() {
  'use strict';

  console.log('🔄 Unified Card Migration starting...');

  /**
   * Migrate all existing cards to unified system
   */
  function migrateToUnifiedCards() {
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

      cardContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const section = containerId.replace('List', '');
        const existingCards = container.querySelectorAll('.show-card, .poster-card, .list-item, .card');
        
        console.log(`🔄 Migrating ${existingCards.length} cards in ${section} section`);

        existingCards.forEach(card => {
          try {
            // Extract item data from existing card
            const itemData = extractItemDataFromCard(card, section);
            if (!itemData) return;

            // Create new unified card
            const newCard = window.createUnifiedPosterCard(itemData, section);
            if (!newCard) return;

            // Replace old card with new one
            card.parentNode.replaceChild(newCard, card);
            migratedCount++;

          } catch (error) {
            console.error('❌ Failed to migrate card:', error, card);
          }
        });
      });

      console.log(`✅ Migration complete: ${migratedCount} cards migrated`);
      
      // Update any remaining references
      updateCardReferences();
      
      // Show success message
      if (window.showToast) {
        window.showToast('success', 'Migration Complete', `${migratedCount} cards updated to new design`);
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      if (window.showToast) {
        window.showToast('error', 'Migration Failed', 'Some cards may not have been updated');
      }
    }
  }

  /**
   * Extract item data from existing card element
   * @param {HTMLElement} card - Existing card element
   * @param {string} section - Section type
   * @returns {Object|null} Item data
   */
  function extractItemDataFromCard(card, section) {
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
   * Update any remaining references to old card systems
   */
  function updateCardReferences() {
    try {
      // Update any functions that create cards
      if (window.createShowCard) {
        window.createShowCard = window.createUnifiedPosterCard;
      }
      
      if (window.createPosterCard && !window.createPosterCard.toString().includes('unified')) {
        window.createPosterCard = window.createUnifiedPosterCard;
      }

      // Update any event listeners that target old card classes
      const oldCardSelectors = ['.show-card', '.list-item', '.card:not(.unified-poster-card)'];
      
      oldCardSelectors.forEach(selector => {
        const cards = document.querySelectorAll(selector);
        cards.forEach(card => {
          // Add unified card class if not already present
          if (!card.classList.contains('unified-poster-card')) {
            card.classList.add('unified-poster-card');
          }
        });
      });

      console.log('✅ Card references updated');

    } catch (error) {
      console.error('❌ Failed to update card references:', error);
    }
  }

  /**
   * Initialize migration when DOM is ready
   */
  function initMigration() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', migrateToUnifiedCards);
    } else {
      // DOM is already ready
      setTimeout(migrateToUnifiedCards, 1000); // Wait for other scripts to load
    }
  }

  // Start migration
  initMigration();

  // Expose migration function globally for manual use
  window.migrateToUnifiedCards = migrateToUnifiedCards;

  console.log('✅ Unified Card Migration script loaded');

})();

