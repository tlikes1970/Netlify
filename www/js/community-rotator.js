// www/js/community-rotator.js
(function(){
  const NS = '[community]';
  let rotator = null;

  function $(root, sel) { return root.querySelector(sel); }
  function $all(root, sel) { return [...root.querySelectorAll(sel)]; }

  function pickRoot() {
    return document.getElementById('group-2-community') ||
           document.querySelector('.community-section') ||
           null;
  }

  function findParts(root) {
    // Be flexible with class names; do not rename existing DOM.
    const layout = root.querySelector('.community-content') || root;
    // The "feed" is actually the community-content itself (contains both left and right)
    const feed = root.querySelector('.community-content');
    const player = root.querySelector('#community-player') ||
                   root.querySelector('.community-player') ||
                   root.querySelector('[data-role="community-player"]') ||
                   root.querySelector('[data-player]');
    return { layout, feed, player };
  }

  function ensurePlayerScaffold(player) {
    let viewport = player.querySelector('.player-viewport');
    let caption = player.querySelector('.player-caption');
    let controls = player.querySelector('.player-controls');

    if (!viewport) { 
      viewport = document.createElement('div'); 
      viewport.className = 'player-viewport'; 
      player.prepend(viewport); 
    }
    if (!caption) { 
      caption = document.createElement('div'); 
      caption.className = 'player-caption'; 
      caption.setAttribute('aria-live','polite'); 
      player.appendChild(caption); 
    }
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'player-controls';
      controls.innerHTML = `
        <button type="button" class="prev" aria-label="Previous">Prev</button>
        <button type="button" class="next" aria-label="Next">Next</button>
      `;
      player.appendChild(controls);
    }
    return { viewport, caption, controls };
  }

  function scoreNode(card) {
    // Prefer richer media
    const type = card.dataset.type || '';
    const hasVideo = type.includes('video') || !!card.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
    const hasImage = !!card.querySelector('img');
    const likes = parseInt(card.dataset.score || card.dataset.likes || '0', 10) || 0;
    const ts = parseInt(card.dataset.timestamp || card.getAttribute('data-ts') || '0', 10) || 0;
    const base = hasVideo ? 3 : hasImage ? 2 : 1;
    return { hasVideo, hasImage, likes, ts, weight: base * 100000 + likes * 1000 + ts };
  }

  async function fetchCommunityData() {
    try {
      const res = await fetch('/data/community-seed.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('community data fetch failed');
      return res.json();
    } catch (error) {
      console.warn(NS, 'failed to fetch community data:', error);
      return { rotation: [] };
    }
  }

  function createCardFromData(item) {
    const card = document.createElement('div');
    card.className = 'community-card';
    card.dataset.type = item.type;
    card.dataset.id = item.id;
    card.dataset.timestamp = new Date(item.createdAtISO).getTime();
    card.dataset.score = item.stats?.views || item.stats?.votesTotal || 0;
    
    // Create title element
    const title = document.createElement('h3');
    title.className = 'title';
    title.textContent = item.title;
    card.appendChild(title);
    
    // Create subtitle if exists
    if (item.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'subtitle';
      subtitle.textContent = item.subtitle;
      card.appendChild(subtitle);
    }
    
    // Create media element based on type
    if (item.media?.kind === 'video' && item.media.src) {
      const video = document.createElement('video');
      video.src = item.media.src;
      video.poster = item.media.poster;
      video.muted = item.media.muted || true;
      video.autoplay = item.media.autoplay || false;
      video.controls = true;
      card.appendChild(video);
    } else if (item.media?.kind === 'image' && item.media.src) {
      const img = document.createElement('img');
      img.src = item.media.src;
      img.alt = item.accessibility?.alt || item.title;
      card.appendChild(img);
    }
    
    // Add description
    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'description';
      desc.textContent = item.description;
      card.appendChild(desc);
    }
    
    return card;
  }

  function collectCandidates(feed) {
    // First try to get cards from DOM
    const domCards = $all(feed || document, '.community-card');
    if (domCards.length > 0) {
      const enriched = domCards.map(card => ({ card, meta: scoreNode(card) }));
      const videos = enriched.filter(x => x.meta.hasVideo).sort((a,b)=>b.meta.weight - a.meta.weight);
      const images = enriched.filter(x => !x.meta.hasVideo && x.meta.hasImage).sort((a,b)=>b.meta.weight - a.meta.weight);
      const text = enriched.filter(x => !x.meta.hasVideo && !x.meta.hasImage).sort((a,b)=>b.meta.weight - a.meta.weight);
      return [...videos, ...images, ...text].map(x => x.card);
    }
    
    // Fallback: return empty array, will be populated by data fetch
    return [];
  }

  function renderInto(viewport, caption, card) {
    viewport.innerHTML = '';
    // try clone poster/video safely
    const media = card.querySelector('video, iframe, img')?.cloneNode(true);
    const title = card.querySelector('[data-title], .title, h3, h4')?.textContent?.trim() || 'Community';
    viewport.appendChild(media || document.createTextNode(title));
    caption.textContent = title;
  }

  async function makeRotator(player, feed) {
    const { viewport, caption, controls } = ensurePlayerScaffold(player);
    let items = collectCandidates(feed);
    let idx = 0;
    let timer = 0;
    let paused = false;

    // If no DOM cards found, fetch from JSON data
    if (items.length === 0) {
      console.info(NS, 'no DOM cards found, fetching community data...');
      const data = await fetchCommunityData();
      items = data.rotation.map(createCardFromData);
      console.info(NS, 'loaded', items.length, 'items from community data');
    }

    function step(next = true) {
      if (!items.length) return;
      idx = (idx + (next ? 1 : -1) + items.length) % items.length;
      renderInto(viewport, caption, items[idx]);
      console.info(NS, 'rotate', { index: idx+1, total: items.length });
    }

    function start() {
      stop();
      if (!items.length) return;
      timer = window.setInterval(()=>{ if (!paused) step(true); }, 7000);
      console.info(NS, 'start', { count: items.length });
    }
    function stop() { if (timer) { clearInterval(timer); timer = 0; } }

    // Controls
    controls.querySelector('.prev').addEventListener('click', ()=>{ step(false); });
    controls.querySelector('.next').addEventListener('click', ()=>{ step(true); });

    // Keyboard access
    player.tabIndex = 0;
    player.addEventListener('keydown', (e)=>{
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(false); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(true); }
    });

    // Pause on hover
    player.addEventListener('mouseenter', ()=>{ paused = true; });
    player.addEventListener('mouseleave', ()=>{ paused = false; });

    // Pause when offscreen
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries)=>{
      entries.forEach(ent => { paused = !ent.isIntersecting; });
    }, { threshold: 0.25 }) : null;
    io?.observe(player);

    // Pause on hidden tab
    document.addEventListener('visibilitychange', ()=>{ paused = document.hidden; });

    // Refresh list when feed changes
    document.addEventListener('community:changed', ()=>{
      items = collectCandidates(feed);
      idx = Math.min(idx, Math.max(0, items.length - 1));
      if (!items.length) { stop(); viewport.innerHTML = ''; caption.textContent = ''; }
      else { renderInto(viewport, caption, items[idx]); start(); }
      console.info(NS, 'refresh', { count: items.length });
    });

    // initial render
    if (items.length) { renderInto(viewport, caption, items[idx]); }
    start();

    return { start, stop, refresh: ()=>document.dispatchEvent(new Event('community:changed')) };
  }

  async function init() {
    const root = pickRoot();
    if (!root) return console.warn(NS, 'root not found');
    const { feed, player } = findParts(root);
    if (!feed || !player) {
      return console.warn(NS, 'missing parts', { hasFeed: !!feed, hasPlayer: !!player });
    }
    // Only one rotator
    if (rotator) return;
    rotator = await makeRotator(player, feed);
  }

  // run after data ready or on DOM ready
  window.addEventListener('app:data:ready', init, { once: true });
  document.addEventListener('DOMContentLoaded', init, { once: true });
  // fallback if neither fires
  setTimeout(init, 2000);
})();
