import { useEffect, useState, type ComponentProps } from 'react';
import { useAndroidBackDismiss } from '../hooks/useAndroidBackDismiss';
import SearchResults from '../search/SearchResults';
import { parseSharedTitle, resolveSharedTitle } from '../lib/sharedTitle';
import { useTranslations, useLanguage } from '../lib/language';
import type { MediaItem } from './cards/card.types';
type Props = Omit<ComponentProps<typeof SearchResults>, 'query' | 'resolvedItems'> & { queryString: string };
export default function SharedTitleExperience({ queryString, ...props }: Props) {
  useAndroidBackDismiss(true, () => props.onBackToHome?.());
  const language = useLanguage();
  const t = useTranslations(); const [items, setItems] = useState<MediaItem[] | null>(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true; setItems(null); setError(''); const request = parseSharedTitle(queryString);
    if ('error' in request) { setError(request.error === 'legacy' ? t.sharedTitleLegacy : t.sharedTitleInvalid); return; }
    void resolveSharedTitle(request).then(item => { if (current) setItems([item]); }).catch(() => { if (current) setError(t.sharedTitleUnavailable); });
    return () => { current = false; };
  }, [queryString, retry, language, t.sharedTitleInvalid, t.sharedTitleLegacy, t.sharedTitleUnavailable]);
  if (items) return <SearchResults {...props} query="" resolvedItems={items} />;
  return <section className="mx-auto max-w-2xl p-4 space-y-3 pb-mobile-nav"><h2>{t.sharedTitleHeading}</h2><p role={error ? 'alert' : 'status'}>{error || t.sharedTitleLoading}</p>{error && <button className="min-h-[44px] border rounded px-4" onClick={() => setRetry(retry + 1)}>{t.sharingRetry}</button>}<button className="min-h-[44px] border rounded px-4" onClick={props.onBackToHome}>{t.home}</button></section>;
}
