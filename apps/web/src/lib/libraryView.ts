import type { LibraryEntry } from './storage';
import type { ListFiltersState } from '@/components/ListFilters';
import type { SortMode } from '@/components/SortDropdown';

export const libraryIdentity = (item: Pick<LibraryEntry, 'id' | 'mediaType'>) => `${item.id}:${item.mediaType}`;

export function applyCustomOrder<T extends Pick<LibraryEntry, 'id' | 'mediaType'>>(items: T[], ids: string[] = []): T[] {
  const ranks = new Map<string, number>();
  ids.forEach((id, index) => { if (!ranks.has(id)) ranks.set(id, index); });
  const rank = (item: T) => ranks.get(libraryIdentity(item)) ?? ranks.get(String(item.id)) ?? Infinity;
  return [...items].sort((a,b) => {
    const ar=rank(a), br=rank(b);
    return ar===br ? 0 : ar < br ? -1 : 1;
  });
}

/** Reorder visible identities in their occupied slots, preserving hidden titles. */
export function reorderedIdentities(items: LibraryEntry[], savedIds: string[], visibleIds: string[], from: number, to: number): string[] {
  const full = applyCustomOrder(items, savedIds).map(libraryIdentity);
  const valid = new Set(full);
  const visible = [...new Set(visibleIds.filter(id => valid.has(id)))];
  if (from<0 || to<0 || from>=visible.length || to>=visible.length) return full;
  const [moved]=visible.splice(from,1); visible.splice(to,0,moved);
  const slots=new Set(visible); let index=0;
  return full.map(id => slots.has(id) ? visible[index++] : id);
}

export function processLibraryItems(items: LibraryEntry[], filters: ListFiltersState, tag: string | null, tagSort: boolean, sort: SortMode, orderIds: string[] = []): LibraryEntry[] {
  let result=items.filter(item =>
    (filters.type==='all' || item.mediaType===filters.type) &&
    (!filters.providers.length || filters.providers.some(name => item.networks?.some(network => typeof network==='string' && network.toLowerCase()===name.toLowerCase()))) &&
    (!tag || item.tags?.some(value => value.trim().toLowerCase() === tag.trim().toLowerCase()))
  );
  if (tagSort) return [...result].sort((a,b) => {
    const at=a.tags?.[0], bt=b.tags?.[0];
    if (at && !bt) return -1;
    if (!at && bt) return 1;
    return at && bt ? at.toLowerCase().localeCompare(bt.toLowerCase()) : 0;
  });
  if (sort==='custom') return applyCustomOrder(result, orderIds);
  result=[...result].sort((a,b) => {
    let comparison=0;
    switch(sort) {
      case 'date-newest': comparison=(b.addedAt||0)-(a.addedAt||0); break;
      case 'date-oldest': comparison=(a.addedAt||0)-(b.addedAt||0); break;
      case 'alphabetical-az': comparison=(a.title||'').localeCompare(b.title||'',undefined,{sensitivity:'base'}); break;
      case 'alphabetical-za': comparison=(b.title||'').localeCompare(a.title||'',undefined,{sensitivity:'base'}); break;
      case 'streaming-service': comparison=(a.networks?.[0]?.toLowerCase()||'zzz_no_service').localeCompare(b.networks?.[0]?.toLowerCase()||'zzz_no_service',undefined,{sensitivity:'base'}); break;
    }
    return comparison || String(a.id).localeCompare(String(b.id));
  });
  return result;
}
