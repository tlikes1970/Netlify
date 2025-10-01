// Card V2 Curated Renderer
(function() {
  'use strict';
  
  function renderCuratedCardV2(item, options = {}) {
    const container = document.createElement('div');
    const variant = options.variant || 'grid';

    // Transform item data using adapter
    const props = window.toCardProps ? window.toCardProps(item) : {
      id: item.id,
      mediaType: item.media_type || 'movie',
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
      card.className = `curated-card v2 ${variant === 'preview' ? 'preview-variant' : ''}`;
    }

    return card || container;
  }

  // Expose globally
  window.renderCuratedCardV2 = renderCuratedCardV2;
  
  console.log('✅ Card V2 curated renderer loaded');
})();