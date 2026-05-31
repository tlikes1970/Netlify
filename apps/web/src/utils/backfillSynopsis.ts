import { Library, type LibraryEntry } from '../lib/storage';
import { fetchFullMediaMetadata } from '../search/api';
import { getItemSynopsis, itemNeedsSynopsisBackfill } from '../lib/itemSynopsis';

const backfilledKeys = new Set<string>();

function itemKey(item: Pick<LibraryEntry, 'id' | 'mediaType'>) {
  return `${item.mediaType}:${item.id}`;
}

async function backfillOneItem(item: LibraryEntry): Promise<void> {
  const key = itemKey(item);
  if (backfilledKeys.has(key)) return;
  backfilledKeys.add(key);

  try {
    const metadata = await fetchFullMediaMetadata(item);
    const synopsis = getItemSynopsis(metadata as LibraryEntry);

    if (synopsis) {
      Library.upsert({ ...item, synopsis }, item.list);
    }
  } catch (error) {
    backfilledKeys.delete(key);
    console.error(`Failed to backfill synopsis for ${item.title}:`, error);
  }
}

export async function backfillSynopsisForItems(items: LibraryEntry[]) {
  const itemsNeedingSynopsis = items.filter(itemNeedsSynopsisBackfill);

  for (const item of itemsNeedingSynopsis) {
    await backfillOneItem(item);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function backfillSynopsis() {
  const watchingItems = Library.getByList('watching');
  const wishlistItems = Library.getByList('wishlist');
  const watchedItems = Library.getByList('watched');
  const notItems = Library.getByList('not');

  await backfillSynopsisForItems(
    watchingItems.concat(wishlistItems).concat(watchedItems).concat(notItems)
  );
}
