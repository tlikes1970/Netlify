export function getNextAirInfo(show) {
  // Expected props (TMDB-like if available):
  // show.status: 'Returning Series' | 'Ended' | 'In Production' | ...
  // show.next_episode_to_air: { air_date: 'YYYY-MM-DD', season_number, episode_number }
  // show.seasons: [{ season_number, episodes: [{ air_date, episode_number, ...}], ... }]
  // Fallbacks as needed.

  const fmt = (d) => {
    try { return new Date(d).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }); }
    catch { return d || 'TBA'; }
  };

  // 1) Direct field wins.
  const next = show?.next_episode_to_air?.air_date;
  if (next) return { label: `Up next: ${fmt(next)}`, date: next, ended: false };

  // 2) Search episodes in seasons for the first future air_date > today.
  const today = new Date();
  const futureDates = [];
  for (const s of (show?.seasons || [])) {
    for (const ep of (s?.episodes || [])) {
      if (ep?.air_date) {
        const ad = new Date(ep.air_date);
        if (!isNaN(+ad) && ad >= today) futureDates.push({ date: ad, air_date: ep.air_date, s: s.season_number, e: ep.episode_number });
      }
    }
  }
  futureDates.sort((a,b) => a.date - b.date);
  if (futureDates.length) {
    const first = futureDates[0];
    return { label: `Up next: ${fmt(first.air_date)}`, date: first.air_date, ended: false };
  }

  // 3) No future date; check status.
  const ended = String(show?.status || '').toLowerCase() === 'ended';
  if (ended) return { label: 'Ended', date: null, ended: true };

  // 4) Unknown future; if there are past episodes, say TBA.
  return { label: 'Up next: TBA', date: null, ended: false };
}

// helpers
export function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

export function calcSxxExx(show) {
  // pick next known ep numbers if present, else latest aired
  const ne = show?.next_episode_to_air;
  if (ne?.season_number != null && ne?.episode_number != null) {
    return `S${String(ne.season_number).padStart(2,'0')}E${String(ne.episode_number).padStart(2,'0')}`;
  }
  // fallback to highest season/episode that has an air_date in the past
  let best = null;
  for (const s of (show?.seasons || [])) {
    for (const ep of (s?.episodes || [])) {
      if (ep?.air_date && new Date(ep.air_date) <= new Date()) {
        best = ep;
      }
    }
  }
  if (best?.season_number != null && best?.episode_number != null) {
    return `S${String(best.season_number).padStart(2,'0')}E${String(best.episode_number).padStart(2,'0')}`;
  }
  return '';
}








