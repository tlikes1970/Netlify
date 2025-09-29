/**
 * MediaCard Unified System - v28.80
 * Unified card component for TV/Movie tracking
 */

// Import data API functions
let saveUserRating, currentUserIsPro, proActionsForContext;

// Load data API functions dynamically
(async () => {
  try {
    const dataApi = await import('./data-api.js');
    saveUserRating = dataApi.saveUserRating;
    currentUserIsPro = dataApi.currentUserIsPro;
    proActionsForContext = dataApi.proActionsForContext;
  } catch (e) {
    console.warn('[MediaCard] Could not load data-api.js, using fallbacks');
    // Fallback implementations
    saveUserRating = async (id, rating) => {
      console.log(`[MediaCard] Fallback saveUserRating for ${id}: ${rating}`);
      return Promise.resolve(true);
    };
    currentUserIsPro = () => !!window.appSettings?.user?.isPro;
    proActionsForContext = (ctx) => {
      const defaults = {
        watching: [
          { id: 'move-to-wishlist', label: 'Want to Watch', icon: '📥', primary: true },
          { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true },
          { id: 'details', label: 'Details', icon: '🔎', primary: false }
        ],
        wishlist: [
          { id: 'move-to-watching', label: 'Move to Watching', icon: '▶️', primary: true },
          { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true },
          { id: 'details', label: 'Details', icon: '🔎', primary: false }
        ],
        watched: [
          { id: 'undo-to-wishlist', label: 'Back to Want', icon: '↩️', primary: true },
          { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true },
          { id: 'details', label: 'Details', icon: '🔎', primary: false }
        ],
        discover: [
          { id: 'add-to-wishlist', label: 'Add to Want', icon: '➕', primary: true },
          { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true },
          { id: 'details', label: 'Details', icon: '🔎', primary: false }
        ],
        home: [
          { id: 'details', label: 'Details', icon: '🔎', primary: true }
        ]
      };
      return defaults[ctx] || defaults.home;
    };
  }
})();

export function renderMediaCard(item, context) {
  const el = document.createElement('article');
  el.className = 'media-card';
  el.setAttribute('aria-labelledby', `t-${item.id}`);
  
  el.innerHTML = `
    <a href="${item.tmdbUrl}" target="_blank" rel="noopener">
      <img class="poster" src="${item.posterUrl || ''}" alt="${escapeHtml(item.title)} poster" loading="lazy" decoding="async"/>
    </a>
    <div class="card-body">
      <h3 id="t-${item.id}" class="title">${escapeHtml(item.title)}</h3>
      <div class="sub">${item.year || ''}</div>
      <div class="meta">
        <span class="pill">${item.type}</span>
        ${item.genres?.slice(0,2).map(g => `<span class="pill">${escapeHtml(g)}</span>`).join('')}
      </div>
      <div class="description">${escapeHtml(item.description || item.overview || 'No description available.')}</div>
      ${renderRating(item)}
      <div class="actions">${renderActions(item, context)}</div>
      <div class="hint">Poster opens TMDB</div>
    </div>
  `;
  
  bindRating(el, item);
  wireActions(el, item);
  return el;
}

function renderRating(item) {
  const val = clamp(item.userRating || 0, 0, 5);
  return `<div class="rating" role="radiogroup" aria-label="Your rating">
    ${[1,2,3,4,5].map(n => 
      `<button class="star" type="button" role="radio" aria-checked="${n === val}" data-value="${n}" data-active="${n <= val}">${svgStar()}</button>`
    ).join('')}
  </div>`;
}

function bindRating(root, item) {
  const stars = [...root.querySelectorAll('.star')];
  const setVal = v => stars.forEach((s, i) => {
    s.dataset.active = i < v;
    s.setAttribute('aria-checked', i + 1 === v);
  });
  
  stars.forEach(star => star.addEventListener('click', async () => {
    const v = parseInt(star.dataset.value, 10);
    setVal(v);
    try {
      await saveUserRating(item.id, v);
      window.dispatchEvent(new CustomEvent('app:rating:updated', {
        detail: { id: item.id, rating: v }
      }));
    } catch (e) {
      console.warn('rating failed', e);
    }
  }));
}

function renderActions(item, ctx) {
  const isPro = currentUserIsPro();
  const actions = proActionsForContext(ctx);
  const primary = actions.filter(a => a.primary).map(a => btn(a, isPro)).join('');
  const secondary = actions.filter(a => !a.primary).map(a => ov(a, isPro)).join('');
  
  // Episode tracking for watching tab
  const epi = ctx === 'watching' ? 
    `<button class="btn" data-action="episode-toggle">📺<span class="label">Episode Tracking</span></button>` : '';
  
  // Pro-locked export action
  const proExport = `<button class="btn locked" aria-disabled="true" title="Pro feature">🔒<span class="label">Export (Pro)</span></button>`;
  
  // Overflow menu for secondary actions
  const overflow = secondary ? 
    `<div class="overflow" aria-expanded="false">
      <button class="btn" data-overflow-toggle>⋯</button>
      <div class="overflow-menu">${secondary}</div>
    </div>` : '';
  
  return primary + epi + proExport + overflow;
}

function btn(a, isPro) {
  return a.pro && !isPro ? 
    `<button class="btn locked" aria-disabled="true">🔒<span class="label">${a.label}</span></button>` :
    `<button class="btn" data-action="${a.id}">${a.icon || ''}<span class="label">${a.label}</span></button>`;
}

function ov(a, isPro) {
  return a.pro && !isPro ? 
    `<div class="overflow-item" aria-disabled="true">🔒 ${a.label}</div>` :
    `<a href="#" class="overflow-item" data-action="${a.id}">${a.icon || ''} ${a.label}</a>`;
}

function wireActions(root, item) {
  root.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    handleAction(b.dataset.action, item);
  }));
}

function handleAction(action, item) {
  console.log(`[MediaCard] Action: ${action} for item: ${item.id}`);
  
  switch (action) {
    case 'move-to-wishlist':
      if (window.moveItem) window.moveItem(item.id, 'wishlist');
      break;
    case 'move-to-watching':
      if (window.moveItem) window.moveItem(item.id, 'watching');
      break;
    case 'add-to-wishlist':
      if (window.addToListFromCache) window.addToListFromCache(item.id, 'wishlist');
      break;
    case 'move-to-not':
      if (window.removeItemFromCurrentList) window.removeItemFromCurrentList(item.id);
      break;
    case 'details':
      if (window.openTMDBLink) window.openTMDBLink(item.id, item.mediaType);
      break;
    case 'episode-toggle':
      if (window.openEpisodeTrackingModal) window.openEpisodeTrackingModal(item.id);
      break;
    default:
      console.warn(`[MediaCard] Unknown action: ${action}`);
  }
}

function svgStar() {
  return `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// Expose globally for integration with existing system
window.renderMediaCard = renderMediaCard;
