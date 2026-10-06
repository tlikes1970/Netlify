import { isMissingPosterUrl } from '../../lib/posterPlaceholder';

/** Decorative only: reuses the card poster without adding an interaction or image request API. */
export function CardPosterGlow({ posterUrl }: { posterUrl?: string | null }) {
  if (isMissingPosterUrl(posterUrl)) return null;
  return <span className="card-poster-glow" aria-hidden="true">
    <span style={{ backgroundImage: `url(${JSON.stringify(posterUrl)})` }} />
  </span>;
}
