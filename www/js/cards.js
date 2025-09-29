/**
 * MediaCard Unified System - v28.80
 * Unified card component for TV/Movie tracking
 */

// Import data API functions
let saveUserRating, currentUserIsPro, getActionsForContext, openProUpsell;
let dispatchAction;

// Load data API functions dynamically
let modulesLoaded = false;
const loadModules = async () => {
  if (modulesLoaded) return;
  
  try {
    const dataApi = await import('./data-api.js');
    saveUserRating = dataApi.saveUserRating;
    currentUserIsPro = dataApi.currentUserIsPro;
    getActionsForContext = dataApi.getActionsForContext;
    openProUpsell = dataApi.openProUpsell;
    
    const actionsApi = await import('./actions.js');
    dispatchAction = actionsApi.dispatchAction;
    
    modulesLoaded = true;
    console.log('[MediaCard] Modules loaded successfully');
  } catch (e) {
    console.warn('[MediaCard] Could not load data-api.js or actions.js, using fallbacks');
    // Fallback implementations
    saveUserRating = async (id, rating) => {
      console.log(`[MediaCard] Fallback saveUserRating for ${id}: ${rating}`);
      return Promise.resolve(true);
    };
    currentUserIsPro = () => !!window.appSettings?.user?.isPro;
    getActionsForContext = (ctx) => {
      const fallbacks = {
        watching: [
          { id: 'move-to-wishlist', label: 'Want to Watch', icon: '📥', primary: true, pro: false, handler: 'move-to-wishlist' },
          { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true, pro: false, handler: 'move-to-not' },
          { id: 'details', label: 'Details', icon: '🔎', primary: false, pro: false, handler: 'details' }
        ],
        wishlist: [
          { id: 'move-to-watching', label: 'Move to Watching', icon: '▶️', primary: true, pro: false, handler: 'move-to-watching' },
          { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true, pro: false, handler: 'move-to-not' },
          { id: 'details', label: 'Details', icon: '🔎', primary: false, pro: false, handler: 'details' }
        ],
        watched: [
          { id: 'undo-to-wishlist', label: 'Back to Want', icon: '↩️', primary: true, pro: false, handler: 'undo-to-wishlist' },
          { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true, pro: false, handler: 'move-to-not' },
          { id: 'details', label: 'Details', icon: '🔎', primary: false, pro: false, handler: 'details' }
        ],
        discover: [
          { id: 'add-to-wishlist', label: 'Add to Want', icon: '➕', primary: true, pro: false, handler: 'add-to-wishlist' },
          { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true, pro: false, handler: 'move-to-not' },
          { id: 'details', label: 'Details', icon: '🔎', primary: false, pro: false, handler: 'details' }
        ],
        home: [
          { id: 'details', label: 'Details', icon: '🔎', primary: true, pro: false, handler: 'details' }
        ]
      };
      return fallbacks[ctx] || fallbacks.home;
    };
    openProUpsell = (contextItem) => {
      window.dispatchEvent(new CustomEvent('app:upsell:open', { 
        detail: { source: 'card-action', item: contextItem }
      }));
    };
    dispatchAction = (name, item) => {
      console.log(`[MediaCard] Fallback dispatchAction: ${name} for ${item.title}`);
    };
    modulesLoaded = true;
  }
};

// Load modules immediately
loadModules();

export async function renderMediaCard(item, context) {
  // Ensure modules are loaded before rendering
  await loadModules();
  
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
  const actions = getActionsForContext(ctx);
  
  // Define button order: card moves first, then other functions, with Not Interested and Delete last
  const buttonOrder = [
    // Card movement actions (first)
    'move-to-wishlist', 'move-to-watching', 'mark-watched', 'undo-to-wishlist', 'add-to-wishlist',
    // Episode tracking for watching tab
    'episode-toggle',
    // Other functions
    'details',
    // Pro features (if any)
    ...actions.filter(a => a.pro && !['move-to-wishlist', 'move-to-watching', 'mark-watched', 'undo-to-wishlist', 'add-to-wishlist', 'move-to-not', 'delete-item', 'details', 'episode-toggle'].includes(a.id)).map(a => a.id),
    // Always last: Not Interested and Delete
    'move-to-not', 'delete-item'
  ];
  
  // Create ordered list of actions to render
  const orderedActions = [];
  
  // Add actions in the specified order
  buttonOrder.forEach(actionId => {
    // Handle episode tracking specially for watching tab
    if (actionId === 'episode-toggle' && ctx === 'watching') {
      orderedActions.push({ id: 'episode-toggle', label: 'Episode Tracking', icon: '📺', primary: false, pro: false, handler: 'episode-toggle' });
    } else {
      const action = actions.find(a => a.id === actionId);
      if (action) {
        orderedActions.push(action);
      }
    }
  });
  
  // Render all buttons in a single horizontal row
  return orderedActions.map(a => btn(a, isPro)).join('');
}

function btn(a, isPro) {
  return a.pro && !isPro
    ? `<button class="btn locked" data-locked="${a.id}">🔒<span class="label">${a.label}</span></button>`
    : `<button class="btn" data-action="${a.id}" data-handler="${a.handler || a.id}">${a.icon || ''}<span class="label">${a.label}</span></button>`;
}

function ov(a, isPro) {
  return a.pro && !isPro
    ? `<div class="overflow-item" data-locked="${a.id}" aria-disabled="true">🔒 ${a.label}</div>`
    : `<a href="#" class="overflow-item" data-action="${a.id}" data-handler="${a.handler || a.id}">${a.icon || ''} ${a.label}</a>`;
}

function wireActions(root, item) {
  // Unlocked actions → dispatch handler
  root.querySelectorAll('[data-action]').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      const handler = b.dataset.handler || b.dataset.action;
      try { 
        dispatchAction(handler, item); 
      } catch(err) { 
        console.warn('[actions] no handler for', handler, err); 
      }
    });
  });
  
  // Locked actions → upsell
  root.querySelectorAll('[data-locked]').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      openProUpsell(item);
    });
  });
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

// Listen for data changes to re-render cards
document.addEventListener('cards:changed', (event) => {
  console.log('[MediaCard] cards:changed event received:', event.detail);
  
  // If this is a move event, re-render both source and destination tabs
  if (event.detail && event.detail.action === 'move') {
    const fromList = event.detail.fromList;
    const toList = event.detail.toList;
    console.log('[MediaCard] Move event detected, re-rendering both tabs:', fromList, '→', toList);
    
    // Re-render both tabs involved in the move
    if (typeof window.updateTabContent === 'function') {
      if (fromList && ['watching', 'wishlist', 'watched', 'discover'].includes(fromList)) {
        console.log('[MediaCard] Re-rendering source tab:', fromList);
        window.updateTabContent(fromList);
      }
      if (toList && ['watching', 'wishlist', 'watched', 'discover'].includes(toList)) {
        console.log('[MediaCard] Re-rendering destination tab:', toList);
        window.updateTabContent(toList);
      }
    }
  } else {
    // For other events, re-render the current tab if it's a list tab
    const currentTab = window.FlickletApp?.currentTab;
    if (currentTab && ['watching', 'wishlist', 'watched', 'discover'].includes(currentTab)) {
      console.log('[MediaCard] Re-rendering current tab:', currentTab);
      if (typeof window.updateTabContent === 'function') {
        window.updateTabContent(currentTab);
      }
    }
  }
});

// Listen for home page updates
document.addEventListener('curated:rerender', () => {
  console.log('[MediaCard] curated:rerender event received');
  if (typeof window.renderHomeRails === 'function') {
    window.renderHomeRails();
  }
});

document.addEventListener('currentlyWatching:rerender', () => {
  console.log('[MediaCard] currentlyWatching:rerender event received');
  if (typeof window.renderCurrentlyWatchingPreview === 'function') {
    window.renderCurrentlyWatchingPreview();
  }
});
