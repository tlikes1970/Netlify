import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import LibraryPage from '@/pages/LibraryPage';
import type { LibrarySegment } from '@/lib/navigation';
import { mockWatchingTv } from '@/lib/__tests__/testHelpers/libraryEntries';

vi.mock('@/lib/customLists', () => ({
  useCustomLists: () => ({ customLists: [{ itemCount: 3 }, { itemCount: 4 }] }),
}));
vi.mock('@/pages/ListPage', () => ({
  default: ({ title, items, mode }: { title: string; items: { title: string }[]; mode: string }) => (
    <section data-testid="library-content" data-mode={mode}>
      <h1>{title}</h1>{items.map(item => <p key={item.title}>{item.title}</p>)}
    </section>
  ),
}));
vi.mock('@/pages/MyListsPage', () => ({ default: () => <h1>My Lists</h1> }));
vi.mock('@/components/PullToRefreshWrapper', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));

function LibraryHarness() {
  const [segment, setSegment] = useState<LibrarySegment>('watching');
  return <LibraryPage segment={segment} onSegmentChange={setSegment}
    watchingItems={[mockWatchingTv({ id: 1, title: 'Watching Show' })]}
    wishlistItems={[mockWatchingTv({ id: 2, title: 'Wanted Show', list: 'wishlist' })]}
    watchedItems={[mockWatchingTv({ id: 3, title: 'Watched Show', list: 'watched' })]}
    onRefresh={() => {}} />;
}

describe('Library destination removal', () => {
  it('keeps all four destinations and their counts without an Up Next page', () => {
    render(<LibraryHarness />);
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.queryByText('Up Next')).toBeNull();
    for (const [name, content] of [
      ['Want to Watch, 1 item', 'Wanted Show'],
      ['Watched, 1 item', 'Watched Show'],
      ['Custom Lists, 2 lists', 'My Lists'],
      ['Watching, 1 item', 'Watching Show'],
    ]) {
      const tab = screen.getByRole('tab', { name });
      fireEvent.click(tab);
      expect(tab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText(content)).toBeInTheDocument();
      expect(screen.queryByText('Up Next')).toBeNull();
    }
  });
});
