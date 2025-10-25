export type FlickletEventMap = {
  'search:submit': { query: string; genre?: string | null };
  'search:clear': Record<string, never>;
  'card:want': { id: string | number; mediaType: 'movie' | 'tv'; };
  'card:watched': { id: string | number; mediaType: 'movie' | 'tv'; };
  'card:notInterested': { id: string | number; mediaType: 'movie' | 'tv'; };
  'card:holidayAdd': { id: string | number; mediaType: 'movie' | 'tv'; };
  'card:startWatching': { id: string | number; mediaType: 'movie' | 'tv'; };
};

type Handler<T> = (detail: T) => void;

export function on<K extends keyof FlickletEventMap>(type: K, handler: Handler<FlickletEventMap[K]>) {
  const fn = ((e: CustomEvent) => handler(e.detail)) as EventListener;
  window.addEventListener(type, fn as EventListener);
  return () => window.removeEventListener(type, fn as EventListener);
}

export function emit<K extends keyof FlickletEventMap>(type: K, detail: FlickletEventMap[K]) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}
