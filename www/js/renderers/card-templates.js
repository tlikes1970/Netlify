import { escapeHtml, calcSxxExx } from '../utils/airdate-utils.js';

export function renderCurrentlyWatchingCard(item) {
  // Use V2 renderer if available, otherwise fallback to legacy
  if (window.renderCurrentlyWatchingCardV2) {
    return window.renderCurrentlyWatchingCardV2(item, { context: 'home' });
  }

  // Legacy fallback
  const card = document.createElement('div');
  card.className = 'card cw-card';
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="poster-wrap">
      <img class="poster" alt="${escapeHtml(item.title || item.name || 'Poster')}" src="${item.poster || item.posterUrl || ''}">
    </div>
    <div class="card-body">
      <div class="title">${escapeHtml(item.title || item.name || 'Untitled')}</div>
      <div class="action-grid">
        <button class="btn btn-want">Want to Watch</button>
        <button class="btn btn-watched">Watched</button>
        <button class="btn btn-notint">Not Interested</button>
        <button class="btn btn-delete">Delete</button>
      </div>
    </div>
  `;

  // Remove any poster→TMDB handler if previously attached.
  card.querySelector('.poster-wrap')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, { once: true });

  // Wire actions to existing handlers or stub
  const iid = item.id;
  card.querySelector('.btn-want')?.addEventListener('click', () => (window.moveItem?.(iid, 'wishlist') ?? console.info('[cw-card] want', iid)));
  card.querySelector('.btn-watched')?.addEventListener('click', () => (window.moveItem?.(iid, 'watched') ?? console.info('[cw-card] watched', iid)));
  card.querySelector('.btn-notint')?.addEventListener('click', () => (window.removeItemFromCurrentList?.(iid) ?? console.info('[cw-card] not-interested', iid)));
  card.querySelector('.btn-delete')?.addEventListener('click', () => (window.removeItemFromCurrentList?.(iid) ?? console.info('[cw-card] delete', iid)));

  return card;
}

export function renderNextUpCard(show, air) {
  // Use V2 renderer if available
  if (window.renderCardV2) {
    const container = document.createElement('div');
    const props = {
      id: show.id,
      mediaType: show.media_type || 'tv',
      title: show.title || show.name || 'Unknown',
      poster: show.posterUrl || show.poster_path ? `https://image.tmdb.org/t/p/w200${show.poster_path}` : '',
      releaseDate: show.release_date || show.first_air_date || '',
      genre: (show.genres && show.genres[0]?.name) || '',
      seasonEpisode: calcSxxExx(show) || '',
      nextAirDate: air.date || air.label || ''
    };
    
    return window.renderCardV2(container, props, {
      listType: 'next-up',
      context: 'home'
    });
  }

  // Legacy fallback
  const card = document.createElement('div');
  card.className = 'card nu-card';
  card.dataset.id = show.id;

  const sxxexx = calcSxxExx(show) || '';
  const genre = (show.genres && show.genres[0]?.name) ? show.genres[0].name : '';

  card.innerHTML = `
    <div class="poster-wrap">
      <img class="poster" alt="${escapeHtml(show.title || show.name || 'Poster')}" src="${show.posterUrl || ''}">
    </div>
    <div class="meta">
      <div class="line">${[sxxexx, genre].filter(Boolean).join(' | ')}</div>
      <div class="line">${escapeHtml(air.label)}</div>
    </div>
  `;

  // No poster→TMDB link
  card.querySelector('.poster-wrap')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, { once: true });

  return card;
}






