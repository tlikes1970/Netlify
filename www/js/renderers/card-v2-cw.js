// Card V2 Currently Watching Renderer
(function() {
  'use strict';
  
  function renderCurrentlyWatchingCardV2(item, options = {}) {
    const container = document.createElement('div');
    const variant = options.variant || 'grid';

    // Transform item data using adapter
    const props = window.toCardProps ? window.toCardProps(item) : {
      id: item.id,
      mediaType: item.media_type || 'tv',
      title: item.title || item.name || 'Unknown',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : (item.posterUrl || ''),
      releaseDate: item.release_date || item.first_air_date || '',
      overview: item.overview || ''
    };

    if (variant === 'preview') {
      props.variant = 'preview';
    }

    // Use main V2 renderer
    const card = window.renderCardV2 ? window.renderCardV2(container, props) : null;
    
    if (card) {
      card.className = `cw-card v2 ${variant === 'preview' ? 'preview-variant' : ''}`;
    }

    return card || container;
  }

  // Expose globally
  window.renderCurrentlyWatchingCardV2 = renderCurrentlyWatchingCardV2;
  
  console.log('✅ Card V2 CW renderer loaded');
})();