import { authManager } from './auth';
import { getMetadataLanguage, languageManager } from './language';
import { isMutationBlocked } from './readOnlyGuard';
import { isRestoring } from './restoreBarrier';
import { Library } from './storage';
import { fetchFullMediaMetadata } from '../search/api';

/** One mounted controller; language generations invalidate every obsolete response. */
export function mountSavedMetadataLanguageRefresh(): () => void {
  let language = getMetadataLanguage();
  let generation = 0;
  let stopped = false;
  let running = false;
  let pending = false;
  let requested = false;
  const attempted = new Set<string>();

  async function drain() {
    if (running || stopped || !requested || isRestoring() || isMutationBlocked()) return;
    running = true;
    try {
      do {
        pending = false;
        const version = generation;
        const target = language;
        const uid = authManager.getCurrentUser()?.uid;
        const valid = () => !stopped && version === generation && target === getMetadataLanguage()
          && uid === authManager.getCurrentUser()?.uid && !isRestoring() && !isMutationBlocked();
        const items = Library.getAll().filter(item => item.mediaType !== 'person'
          && /^\d+$/.test(String(item.id)) && Number(item.id) > 0
          && !attempted.has(`${item.mediaType}:${item.id}`));
        let cursor = 0;
        await Promise.all(Array.from({ length: Math.min(3, items.length) }, async () => {
          while (cursor < items.length && valid()) {
            const item = items[cursor++];
            attempted.add(`${item.mediaType}:${item.id}`);
            try {
              const metadata = await fetchFullMediaMetadata(item, target);
              if (valid()) Library.updateMetadata(item.id, item.mediaType, metadata);
            } catch {
              // Failed requests leave saved metadata intact; retry on the next language change.
            }
          }
        }));
      } while (pending && !stopped && requested && !isRestoring() && !isMutationBlocked());
    } finally {
      running = false;
    }
  }
  const schedule = () => { pending = true; void drain(); };
  const unsubscribeLanguage = languageManager.subscribe(() => {
    const next = getMetadataLanguage();
    if (next === language) return;
    language = next;
    generation++;
    attempted.clear();
    requested = true;
    schedule();
  });
  const unsubscribeLibrary = Library.subscribe(schedule);
  const clear = () => { generation++; requested = false; attempted.clear(); };
  window.addEventListener('library:cleared', clear);
  return () => {
    stopped = true;
    generation++;
    unsubscribeLanguage();
    unsubscribeLibrary();
    window.removeEventListener('library:cleared', clear);
  };
}
