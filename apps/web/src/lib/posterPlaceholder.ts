/** Shared neutral poster placeholder (SVG data URI) — used by cards when TMDB has no poster. */
export const POSTER_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="112" height="168" viewBox="0 0 112 168">
    <defs>
      <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
        <stop stop-color="#1f2937" offset="0"/>
        <stop stop-color="#111827" offset="1"/>
      </linearGradient>
    </defs>
    <rect width="112" height="168" fill="url(#g)"/>
    <rect x="8" y="8" width="96" height="152" rx="8" ry="8" fill="none" stroke="#374151" stroke-width="2"/>
    <g fill="#4B5563">
      <circle cx="56" cy="62" r="22"/>
      <rect x="28" y="96" width="56" height="12" rx="6"/>
      <rect x="36" y="116" width="40" height="10" rx="5"/>
    </g>
  </svg>
`);

/** True when src is missing or not a loadable http(s)/data poster URL. */
export function isMissingPosterUrl(src?: string | null): boolean {
  if (!src || !src.trim()) return true;
  const t = src.trim();
  return t === POSTER_PLACEHOLDER;
}

/** Prefer TMDB poster URL; otherwise shared placeholder (no extra TMDB calls). */
export function resolvePosterUrl(poster?: string | null): string {
  if (!poster || !poster.trim()) return POSTER_PLACEHOLDER;
  return poster.trim();
}
