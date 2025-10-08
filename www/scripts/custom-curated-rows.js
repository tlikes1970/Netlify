/* ========== custom-curated-rows.js ==========
   Custom Curated Rows System
   Renders personalized genre-based recommendation rows
   Uses user-selected genres instead of hardcoded sections
*/

(function () {
  'use strict';

  console.log('🎭 Custom Curated Rows loaded');

  // Check if feature is enabled
  if (!window.FLAGS?.homeRowCurated) {
    console.log('🎭 Custom curated rows disabled by feature flag');
    return;
  }

  // Initialize on DOM ready with delay to allow seeder to complete
  function initializeWithDelay() {
    setTimeout(() => {
      console.log('🎭 Delayed initialization of Custom Curated Rows...');
      renderCustomCuratedRows();
    }, 2000); // Wait 2 seconds for seeder to complete
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithDelay);
  } else {
    initializeWithDelay();
  }

  /**
   * Process: Custom Curated Rows Rendering
   * Purpose: Renders personalized genre-based recommendation rows
   * Data Source: CustomGenreSelector.exportSelections() and TMDB API
   * Update Path: Modify rendering logic or add new row types
   * Dependencies: CustomGenreSelector, tmdbGet, Card component
   */
  async function renderCustomCuratedRows() {
    console.log('🎭 Rendering custom curated rows...');
    console.log('🎭 Window.CustomGenreSelector available:', !!window.CustomGenreSelector);

    // Get the mount point
    let mount = document.getElementById('curatedSections');
    console.log('🎭 Mount element found:', !!mount, mount);
    if (!mount) {
      console.warn('🎭 Curated sections container not found');
      return;
    }

    // Get user's genre selections
    if (!window.CustomGenreSelector) {
      console.warn('🎭 CustomGenreSelector not available');
      return;
    }

    const selections = window.CustomGenreSelector.exportSelections();
    console.log('🎭 Raw selections from CustomGenreSelector:', selections);
    
    if (selections.length === 0) {
      console.log('🎭 No genre selections found, hiding custom rows');
      mount.style.display = 'none';
      return;
    }

    console.log('🎭 User genre selections:', selections);

    // Clear existing content
    mount.innerHTML = '';

    // Get username for personalized title
    const username = getUsername();
    const sectionTitle = username ? `${username}'s Custom Rows` : 'Your Custom Rows';

    // Create section header
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <h2 class="section-title">${sectionTitle}</h2>
      <p class="section-subtitle">Personalized recommendations based on your genre preferences</p>
    `;
    mount.appendChild(header);

    // Render each genre selection as a row
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      console.log(`🎭 Rendering row ${i + 1} for genre:`, selection);

      try {
        const row = await createCustomGenreRow(selection, i);
        if (row) {
          mount.appendChild(row);
        }
      } catch (error) {
        console.error(`🎭 Error creating row ${i + 1}:`, error);
      }
    }

    // Make the container visible
    mount.style.display = 'block';
    console.log('🎭 Custom curated rows rendered successfully');
  }

  /**
   * Process: Custom Genre Row Creation
   * Purpose: Creates a single recommendation row for a user-selected genre
   * Data Source: Genre selection and TMDB API
   * Update Path: Modify row structure or add new content types
   * Dependencies: loadGenreContent, Card component
   */
  async function createCustomGenreRow(selection, index) {
    const row = document.createElement('div');
    row.className = 'custom-genre-row';
    row.dataset.genre = selection.genre;
    row.dataset.subgenre = selection.subgenre || '';

    // Create row header
    const header = document.createElement('div');
    header.className = 'row-header';
    header.innerHTML = `
      <h3 class="row-title">${selection.displayName}</h3>
      <p class="row-subtitle">Popular ${selection.displayName.toLowerCase()} content</p>
    `;
    row.appendChild(header);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'row-content';
    contentContainer.innerHTML = '<div class="loading-spinner">Loading recommendations...</div>';
    row.appendChild(contentContainer);

    // Load content asynchronously
    loadGenreContent(selection, contentContainer, index);

    return row;
  }

  /**
   * Process: Genre Content Loading
   * Purpose: Fetches and displays content for a specific genre selection
   * Data Source: TMDB API with genre/subgenre filters
   * Update Path: Modify API calls or add new content sources
   * Dependencies: tmdbGet, Card component
   */
  async function loadGenreContent(selection, container, index) {
    try {
      console.log(`🎭 Loading content for ${selection.displayName}...`);

      // Get current language
      const currentLang = window.appData?.settings?.lang || 'en';
      const tmdbLang = currentLang === 'es' ? 'es-ES' : 'en-US';

      // Prepare API parameters
      const params = {
        sort_by: 'popularity.desc',
        page: 1,
        language: tmdbLang,
        with_genres: selection.genre
      };

      // Add subgenre if selected
      if (selection.subgenre) {
        // Parse subgenre ID (format: "genre1,genre2")
        const subgenreIds = selection.subgenre.split(',');
        params.with_genres = subgenreIds.join(',');
      }

      // Fetch both movies and TV shows
      const [moviesData, tvData] = await Promise.all([
        window.tmdbGet('discover/movie', params),
        window.tmdbGet('discover/tv', params)
      ]);

      console.log(`🎭 TMDB API responses for ${selection.displayName}:`, {
        moviesData: moviesData ? `Found ${moviesData.results?.length || 0} movies` : 'undefined',
        tvData: tvData ? `Found ${tvData.results?.length || 0} TV shows` : 'undefined'
      });

      // Combine and format results
      const allItems = [
        ...(moviesData?.results || []).map(item => ({
          ...item,
          media_type: 'movie',
          title: item.title,
          release_date: item.release_date,
          poster_path: item.poster_path
        })),
        ...(tvData?.results || []).map(item => ({
          ...item,
          media_type: 'tv',
          title: item.name,
          release_date: item.first_air_date,
          poster_path: item.poster_path
        }))
      ];

      // Shuffle and limit to 12 items
      const shuffledItems = allItems.sort(() => Math.random() - 0.5).slice(0, 12);

      if (shuffledItems.length === 0) {
        container.innerHTML = '<div class="no-content">No content found for this genre</div>';
        return;
      }

      // Clear loading spinner
      container.innerHTML = '';

      // Create items container
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'items-container';

      // Render each item
      for (const item of shuffledItems) {
        try {
          const card = createItemCard(item);
          if (card) {
            itemsContainer.appendChild(card);
          }
        } catch (error) {
          console.error('🎭 Error creating card for item:', item, error);
        }
      }

      container.appendChild(itemsContainer);
      console.log(`🎭 Loaded ${shuffledItems.length} items for ${selection.displayName}`);

    } catch (error) {
      console.error(`🎭 Error loading content for ${selection.displayName}:`, error);
      container.innerHTML = '<div class="error-message">Failed to load content</div>';
    }
  }

  /**
   * Process: Item Card Creation
   * Purpose: Creates a card component for a content item
   * Data Source: TMDB item data
   * Update Path: Modify card structure or add new card types
   * Dependencies: Card component, createCardData
   */
  function createItemCard(item) {
    // Use Cards V2 system if available
    if (window.renderCuratedCardV2) {
      return window.renderCuratedCardV2(item);
    } else if (window.renderSearchCardV2) {
      return window.renderSearchCardV2(item);
    } else if (window.Card && window.createCardData) {
      // Fallback to old Card component
      const cardData = window.createCardData(item, 'tmdb', 'curated');
      return window.Card({
        variant: 'unified',
        ...cardData,
      });
    } else {
      // Simple fallback card
      const itemEl = document.createElement('div');
      itemEl.className = 'unified-card';
      itemEl.setAttribute('tabindex', '0');
      itemEl.setAttribute('role', 'button');
      itemEl.setAttribute('aria-label', `View details for ${item.title}`);
      itemEl.innerHTML = `
        <div class="card-poster">
          <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '/assets/placeholder-poster.png'}" 
               alt="${item.title}" loading="lazy">
        </div>
        <div class="card-title">${item.title}</div>
      `;
      return itemEl;
    }
  }

  /**
   * Process: Username Retrieval
   * Purpose: Gets the current user's username for personalized titles
   * Data Source: appData.settings.username or Firebase user data
   * Update Path: Modify username source or fallback logic
   * Dependencies: appData, Firebase auth
   */
  function getUsername() {
    // Try to get username from appData
    if (window.appData?.settings?.username) {
      return window.appData.settings.username;
    }

    // Try to get display name from Firebase user
    if (window.appData?.user?.displayName) {
      return window.appData.user.displayName;
    }

    // Try to get email prefix
    if (window.appData?.user?.email) {
      return window.appData.user.email.split('@')[0];
    }

    return null;
  }

  // Expose functions for external use
  window.CustomCuratedRows = {
    render: renderCustomCuratedRows,
    createRow: createCustomGenreRow,
    loadContent: loadGenreContent
  };

  // Manual test function for debugging
  window.testCustomRows = function() {
    console.log('🧪 Manual test triggered');
    console.log('🧪 CustomGenreSelector available:', !!window.CustomGenreSelector);
    console.log('🧪 CustomCuratedRows available:', !!window.CustomCuratedRows);
    
    if (window.CustomGenreSelector) {
      const selections = window.CustomGenreSelector.exportSelections();
      console.log('🧪 Current selections:', selections);
    }
    
    if (window.CustomCuratedRows) {
      window.CustomCuratedRows.render();
    }
  };

})();
