// Card V2 Currently Watching Renderer
(function() {
  'use strict';
  
  function renderCurrentlyWatchingCardV2(item, options = {}) {
    const container = document.createElement('div');
    const variant = options.variant || 'grid';
    const context = options.context || 'default';

    // Transform item data using adapter
    const props = window.toCardProps ? window.toCardProps(item) : {
      id: item.id,
      mediaType: item.media_type || 'tv',
      title: item.title || item.name || 'Unknown',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : (item.posterUrl || ''),
      releaseDate: item.release_date || item.first_air_date || '',
      overview: item.overview || '',
      genre: item.genre || (item.genres && item.genres[0]?.name) || '',
      seasonEpisode: item.seasonEpisode || item.sxxExx || '',
      nextAirDate: item.next_episode_air_date || item.nextAirDate || item.next_air_date || '',
      userRating: item.userRating || item.rating || 0,
      progress: item.progress || '',
      badges: item.badges || [],
      whereToWatch: item.whereToWatch || ''
    };

    if (variant === 'preview') {
      props.variant = 'preview';
    }

    // Use main V2 renderer with proper context
    const card = window.renderCardV2 ? window.renderCardV2(container, props, {
      listType: 'watching',
      context: context
    }) : null;
    
    if (card) {
      card.className = `cw-card v2 ${variant === 'preview' ? 'preview-variant' : ''}`;
    }

    return card || container;
  }

  // Expose globally
  window.renderCurrentlyWatchingCardV2 = renderCurrentlyWatchingCardV2;
  
  console.log('✅ Card V2 CW renderer loaded');
})();