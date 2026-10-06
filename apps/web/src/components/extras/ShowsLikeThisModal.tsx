import { t, useLanguage, getMetadataLanguage } from '@/lib/language';
import { useEffect, useState } from 'react';
import { getRelatedTitles } from '../../lib/relatedTitles';
import type { MediaItem } from '../cards/card.types';
import { useEntitlements } from '../../hooks/useEntitlements';
import { UpgradeToProCTA } from '../UpgradeToProCTA';
import { MobileControlDialog } from '../MobileControlDialog';
import { POSTER_PLACEHOLDER } from '../../lib/posterPlaceholder';

type Props = { isOpen: boolean; onClose: () => void; tmdbId: number | string | null; mediaType: 'movie' | 'tv'; title?: string; onSelect?: (item: MediaItem) => void };
export function ShowsLikeThisModal({ isOpen, onClose, tmdbId, mediaType, title, onSelect }: Props) {
  const language = useLanguage();
  const { hasFullAccess } = useEntitlements();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    if (!isOpen || !hasFullAccess || !tmdbId) return;
    let current = true;
    setState('loading'); setItems([]);
    getRelatedTitles(tmdbId, mediaType, getMetadataLanguage()).then(result => {
      if (current) { setItems(result); setState('ready'); }
    }).catch(() => { if (current) setState('error'); });
    return () => { current = false; };
  }, [isOpen, tmdbId, mediaType, hasFullAccess, language]);
  if (!isOpen) return null;
  return <MobileControlDialog title={title ? `${title} - ${t('coreShowsLikeThis')}` : t('coreShowsLikeThis')} onClose={onClose}>
    {!hasFullAccess ? <UpgradeToProCTA variant="panel" message={t('accessSimilarTrial')}/> : state === 'loading' ? <p role="status">{t('relatedLoading')}</p> : state === 'error' ? <p role="alert">{t('relatedUnavailable')}</p> : !items.length ? <p>{t('relatedEmpty')}</p> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => <a key={`${item.mediaType}:${item.id}`} href={`/?view=title&tmdbId=${item.id}&mediaType=${item.mediaType}`} className="min-w-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={event => { if (onSelect && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onSelect(item); } }}>
        <img src={item.posterUrl || POSTER_PLACEHOLDER} alt="" className="w-full aspect-[2/3] object-cover rounded" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = POSTER_PLACEHOLDER; }}/>
        <span className="block break-words font-medium mt-1">{item.title}</span>{item.year && <span className="text-sm" style={{color:'var(--muted)'}}>{item.year}</span>}
      </a>)}
    </div>}
  </MobileControlDialog>;
}