/* ========== series-org.js ==========
   Seasons collapsed accordion with lazy episode render.
   Data sources (priority):
   1) localStorage["flicklet:series:<id>"] -> { title, seasons: [{season_number,name,episode_count,episodes:[{episode_number,name,air_date,overview}]}] }
   2) window.fetchSeries(id) -> same shape
   3) tvMovieTrackerData fallback -> seasons only (guesses by number_of_seasons)
*/
(function () {
  const mount = document.getElementById('seriesOrg');
  if (!mount) return;

  // Determine series id & title
  const forcedId = mount.getAttribute('data-series-id');
  let series = null;

  init();

  // Expose refresh function globally
  window.__FlickletRefreshSeriesOrganizer = function () {
    console.log('🗂️ Refreshing series organizer content');
    // Clear any cached data to force fresh load
    if (series) {
      const seriesId = series.id;
      if (seriesId) {
        const cacheKey = `flicklet:series:${seriesId}`;
        localStorage.removeItem(cacheKey);
        console.log('🗂️ Cleared series cache:', cacheKey);
      }
    }
    // Re-initialize the series organizer
    init();
  };

  async function init() {
    const ctx = pickSeriesContext(forcedId);
    if (!ctx) {
      mount.innerHTML = emptyState('No series selected.');
      return;
    }

    // Load data
    series = await loadSeries(ctx.id, ctx.title, ctx.seasonsGuess);

    // Render
    mount.innerHTML = renderSeriesHead(series) + `<div class="seasons" id="seasons"></div>`;
    const container = mount.querySelector('#seasons');

    // One section per season
    for (const s of series.seasons) {
      container.insertAdjacentHTML('beforeend', seasonShellHTML(s));
    }

    // Wire interactions
    mount.addEventListener('click', onClick);
    mount.addEventListener('keydown', onKey);
  }

  function onClick(e) {
    const btn = e.target.closest('.season-toggle');
    if (!btn) return;
    const wrap = btn.closest('.season');
    const expanded = wrap.getAttribute('aria-expanded') === 'true';
    wrap.setAttribute('aria-expanded', String(!expanded));

    // Lazy render episodes
    if (!expanded && !wrap.dataset.loaded) {
      const sn = Number(wrap.dataset.seasonNumber);
      const epWrap = wrap.querySelector('.episodes');
      const eps = getEpisodesForSeason(sn);
      epWrap.innerHTML = episodesHTML(eps, sn);
      wrap.dataset.loaded = '1';
    }
  }

  function onKey(e) {
    const btn = e.target.closest('.season-toggle');
    if (!btn) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
    if (e.key === 'ArrowRight') {
      const wrap = btn.closest('.season');
      wrap.setAttribute('aria-expanded', 'true');
    }
    if (e.key === 'ArrowLeft') {
      const wrap = btn.closest('.season');
      wrap.setAttribute('aria-expanded', 'false');
    }
  }

  function pickSeriesContext(forced) {
    if (forced) return { id: Number(forced), title: null, seasonsGuess: null };

    // Try current "watching" from tvMovieTrackerData
    try {
      const raw = localStorage.getItem('tvMovieTrackerData');
      if (!raw) return null;
      const data = JSON.parse(raw);
      const tv = data?.tv?.watching || [];
      if (!tv.length) return null;
      const first = tv[0];
      const id = Number(first.id);
      const title = first.name || first.title || first.original_name || 'Series';
      const guess = first.number_of_seasons || null;
      return { id, title, seasonsGuess: guess };
    } catch (_) {
      return null;
    }
  }

  async function loadSeries(id, hintTitle, seasonsGuess) {
    // 1) local cache
    try {
      const cached = JSON.parse(localStorage.getItem(seriesKey(id)) || 'null');
      if (cached && cached.seasons?.length) return cached;
    } catch (_) {}

    // 2) optional app hook
    if (typeof window.fetchSeries === 'function') {
      try {
        const fetched = await window.fetchSeries(id);
        if (fetched?.seasons?.length) {
          // persist for next time
          safeSet(seriesKey(id), fetched);
          return fetched;
        }
      } catch (_) {}
    }

    // 3) fallback skeleton from tvMovieTrackerData entry if present
    const skeleton = skeletonFromTracker(id, hintTitle, seasonsGuess);
    safeSet(seriesKey(id), skeleton);
    return skeleton;
  }

  function skeletonFromTracker(id, hintTitle, seasonsGuess) {
    // Try to extract a title/backdrop if available
    let title = hintTitle || 'Series';
    try {
      const raw = localStorage.getItem('tvMovieTrackerData');
      if (raw) {
        const data = JSON.parse(raw);
        const all = [...(data?.tv?.watching || []), ...(data?.tv?.watched || [])];
        const hit = all.find((x) => Number(x.id) === Number(id));
        if (hit) {
          title = hit.name || hit.title || title;
        }
      }
    } catch (_) {}

    const count = Number(seasonsGuess || 3) || 3;
    const seasons = [];
    for (let i = 1; i <= count; i++) {
      seasons.push({
        season_number: i,
        name: `Season ${i}`,
        episode_count: 10,
        episodes: fakeEpisodes(i, 10), // placeholder list; replaced if real data exists later
      });
    }
    return { id, title, seasons };
  }

  function seriesKey(id) {
    return `flicklet:series:${id}`;
  }
  function safeSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (_) {}
  }

  function renderSeriesHead(s) {
    const totalSeasons = s.seasons.length;
    const totalEps = s.seasons.reduce(
      (n, x) => n + (x.episode_count || x.episodes?.length || 0),
      0,
    );
    return `
      <div class="series-head">
        <h2 class="series-title">${esc(s.title || 'Series')}</h2>
        <div class="series-meta" aria-live="polite">${totalSeasons} season${totalSeasons !== 1 ? 's' : ''} • ~${totalEps} episodes</div>
      </div>`;
  }

  function seasonShellHTML(season) {
    const sn = Number(season.season_number);
    const name = season.name || `Season ${sn}`;
    const count = season.episode_count || (season.episodes?.length ?? 0) || '';
    return `
      <section class="season" data-season-number="${sn}" aria-expanded="false">
        <button class="season-toggle" type="button" aria-expanded="false" aria-controls="season-${sn}-episodes">
          <span class="chev">▸</span>
          <span class="name">${esc(name)}</span>
          <span class="count">${count ? `${count} eps` : ''}</span>
        </button>
        <div id="season-${sn}-episodes" class="episodes" role="region" aria-label="${esc(name)} episodes"></div>
      </section>`;
  }

  function getEpisodesForSeason(sn) {
    const season = series.seasons.find((s) => Number(s.season_number) === Number(sn));
    return season?.episodes || [];
  }

  function episodesHTML(episodes, sn) {
    if (!episodes?.length)
      return `<div class="ep-empty" style="opacity:.7;">No episodes available.</div>`;
    const firstFive = episodes.slice(0, 5).map(epHTML).join('');
    const hasMore = episodes.length > 5;
    const moreBtn = hasMore
      ? `
      <div class="more-row">
        <button class="btn" data-more data-sn="${sn}">Show all (${episodes.length})</button>
      </div>`
      : '';
    return `<div data-ep-wrap data-sn="${sn}">
      <div data-ep-list>${firstFive}</div>
      ${moreBtn}
    </div>`;
  }

  function epHTML(ep) {
    const n = ep.episode_number ?? '?';
    const title = ep.name || `Episode ${n}`;
    const date = ep.air_date ? ` • ${niceDate(ep.air_date)}` : '';
    const overview = ep.overview ? `<div class="ep-meta">${esc(ep.overview)}</div>` : '';
    return `
      <article class="episode" data-ep="${esc(String(n))}">
        <div class="ep-no">E${n}</div>
        <div class="ep-body">
          <div class="ep-title">${esc(title)}<span class="ep-date">${esc(date)}</span></div>
          ${overview}
          <div class="ep-actions">
            <button class="btn" data-action="watched">Mark watched</button>
            <button class="btn" data-action="remind">Remind me</button>
          </div>
        </div>
      </article>`;
  }

  // Handle "Show all" + action buttons
  mount.addEventListener('click', (e) => {
    const more = e.target.closest('[data-more]');
    if (more) {
      const sn = Number(more.getAttribute('data-sn'));
      const listWrap = mount.querySelector(`[data-ep-wrap][data-sn="${sn}"]`);
      const season = series.seasons.find((s) => Number(s.season_number) === sn);
      if (!season || !listWrap) return;
      listWrap.querySelector('[data-ep-list]').innerHTML = season.episodes.map(epHTML).join('');
      more.remove();
      return;
    }
    const actionBtn = e.target.closest('.ep-actions .btn');
    if (actionBtn) {
      const act = actionBtn.dataset.action;
      const ep = actionBtn.closest('.episode')?.dataset?.ep;
      if (act === 'watched') {
        // Wire to your app's function if present
        window.Notify?.success?.(`Marked E${ep} watched`);
      } else if (act === 'remind') {
        window.Notify?.info?.(`Reminder set for E${ep}`);
      }
    }
  });

  // Utils
  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m],
    );
  }
  function niceDate(s) {
    // Accept YYYY-MM-DD
    const [y, m, d] = (s || '').split('-').map(Number);
    if (!y || !m || !d) return '';
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function fakeEpisodes(seasonNum, count) {
    const out = [];
    for (let i = 1; i <= count; i++) {
      out.push({ episode_number: i, name: `Episode ${i}`, air_date: '', overview: '' });
    }
    return out;
  }
  function emptyState(msg) {
    return `<div style="padding:12px; opacity:.7;">${esc(msg)}</div>`;
  }
})();
