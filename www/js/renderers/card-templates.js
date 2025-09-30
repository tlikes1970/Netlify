import { escapeHtml, calcSxxExx } from '../utils/airdate-utils.js';

export function renderCurrentlyWatchingCard(item) {
  const card = document.createElement('div');
  card.className = 'card cw-card';
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="poster-wrap">
      <img class="poster" alt="${escapeHtml(item.title || item.name || 'Poster')}" src="${item.posterUrl || ''}">
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
  card.querySelector('.btn-want')?.addEventListener('click', () => (window.markWantToWatch?.(iid) ?? console.info('[cw-card] want', iid)));
  card.querySelector('.btn-watched')?.addEventListener('click', () => (window.markWatched?.(iid) ?? console.info('[cw-card] watched', iid)));
  card.querySelector('.btn-notint')?.addEventListener('click', () => (window.markNotInterested?.(iid) ?? console.info('[cw-card] not-interested', iid)));
  card.querySelector('.btn-delete')?.addEventListener('click', () => (window.deleteFromList?.(iid) ?? console.info('[cw-card] delete', iid)));

  return card;
}

export function renderNextUpCard(show, air) {
  const card = document.createElement('div');
  card.className = 'card nu-card';
  card.dataset.id = show.id;

  const sxxexx = calcSxxExx(show) || ''; // implement calcSxxExx to get next or latest known SxxExx
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

