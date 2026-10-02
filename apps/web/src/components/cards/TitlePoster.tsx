import type { ReactNode } from 'react';
import type { MediaItem } from './card.types';
import { OptimizedImage } from '../OptimizedImage';
import { POSTER_PLACEHOLDER, isMissingPosterUrl } from '../../lib/posterPlaceholder';
import { useTranslations } from '../../lib/language';

export function getTitleResearchUrl(item: Pick<MediaItem, 'id' | 'mediaType'>) {
  const id = Number(item.id);
  return Number.isSafeInteger(id) && id > 0 && (item.mediaType === 'movie' || item.mediaType === 'tv')
    ? `https://www.themoviedb.org/${item.mediaType}/${id}` : undefined;
}

/** Only the poster is a research target; controls remain outside this link. */
export function TitlePoster({item, className = '', onOpen}: {item: MediaItem; className?: string; onOpen?: () => void}) {
  const translations = useTranslations();
  const href = getTitleResearchUrl(item);
  const image: ReactNode = <OptimizedImage src={isMissingPosterUrl(item.posterUrl) ? '' : item.posterUrl || ''} alt={item.title} context="poster" fallbackSrc={POSTER_PLACEHOLDER} className="h-full w-full" loading="lazy" key={item.posterUrl || "fallback"}/>;
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={(translations.viewTitleOnTmdb || 'View {title} on TMDB').replace('{title}', item.title)} className={`title-poster block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`} onClick={event => { event.preventDefault(); onOpen?.(); window.open(href, "_blank", "noopener,noreferrer"); }}>{image}</a>
    : <div className={`title-poster ${className}`}>{image}</div>;
}
