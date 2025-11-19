/**
 * Geo Client - Single-flight reverse geocoding with cache
 * 
 * Prevents multiple simultaneous requests for the same coordinates
 * and caches results for 10 minutes.
 */

import { singleFlight } from './singleFlight';

const KEY = (lat: number, lon: number) => `geo:${lat.toFixed(3)},${lon.toFixed(3)}`;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchGeo(lat: number, lon: number) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
  const r = await fetch(url, { cache: 'no-store' });
  return r.ok ? r.json() : null;
}

export function makeGeoResolver(lat: number, lon: number) {
  const k = KEY(lat, lon);

  const run = singleFlight(async () => {
    try {
      const cached = localStorage.getItem(k);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < TTL_MS) return data;
      }

      const data = await fetchGeo(lat, lon);
      try {
        localStorage.setItem(k, JSON.stringify({ ts: Date.now(), data }));
      } catch {
        // Ignore localStorage errors
      }
      return data;
    } catch {
      return null;
    }
  });

  return () => run();
}














