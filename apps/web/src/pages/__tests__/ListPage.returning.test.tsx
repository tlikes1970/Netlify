import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ListPage from '@/pages/ListPage';
import type { LibraryEntry } from '@/lib/storage';
import { mockWatchingTv } from '@/lib/__tests__/testHelpers/libraryEntries';

vi.mock('@/hooks/useDragAndDrop', () => ({
  useDragAndDrop: () => ({
    dragState: {
      draggedItem: null,
      draggedOverIndex: null,
      isDragging: false,
    },
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
  }),
}));

vi.mock('@/lib/settings', () => ({
  useSettings: () => ({ personality: 'default', layout: { theme: 'light' } }),
  getPersonalityText: () => 'Empty list',
  DEFAULT_PERSONALITY: 'default',
}));

vi.mock('@/lib/tabState', () => ({
  getTabKey: () => 'returning',
  restoreTabState: () => ({
    sort: 'date-newest',
    filter: { type: 'all', providers: [] },
  }),
  saveTabState: vi.fn(),
  resetTabState: () => ({
    sort: 'date-newest',
    filter: { type: 'all', providers: [] },
  }),
  validateFilters: (filters: unknown) => filters,
}));

vi.mock('@/lib/analytics', () => ({
  trackSortChange: vi.fn(),
  trackFilterChange: vi.fn(),
  trackReorderCompleted: vi.fn(),
  trackTabStateReset: vi.fn(),
}));

vi.mock('@/components/ScrollToTopArrow', () => ({
  default: () => null,
}));

vi.mock('@/components/modals/EpisodeTrackingModal', () => ({
  EpisodeTrackingModal: () => null,
}));

vi.mock('@/components/WatchingListWithBackdrop', () => ({
  WatchingListWithBackdrop: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/cards/TabCard', () => ({
  default: ({
    item,
    tabType,
  }: {
    item: { title: string };
    tabType?: string;
  }) => (
    <div data-testid="returning-tab-card" data-tab-type={tabType}>
      {item.title}
    </div>
  ),
}));

function returningItem(
  overrides: Partial<LibraryEntry> & Pick<LibraryEntry, 'id' | 'title'>
): LibraryEntry {
  return mockWatchingTv(overrides);
}

describe('ListPage returning mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders returning items instead of a blank workspace', () => {
    const items = [
      returningItem({ id: 1, title: 'Alpha Returning' }),
      returningItem({ id: 2, title: 'Beta Returning' }),
    ];

    render(<ListPage title="Returning" items={items} mode="returning" />);

    expect(screen.getByRole('heading', { name: 'Returning' })).toBeInTheDocument();
    expect(
      screen.getByText(/All upcoming and returning shows from your Watching list/)
    ).toBeInTheDocument();
    const cards = screen.getAllByTestId('returning-tab-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute('data-tab-type', 'returning');
    expect(screen.getByText('Alpha Returning')).toBeInTheDocument();
    expect(screen.getByText('Beta Returning')).toBeInTheDocument();
  });

  it('shows an empty state when no returning items exist', () => {
    render(<ListPage title="Returning" items={[]} mode="returning" />);

    expect(
      screen.getByText(/No upcoming shows in your Watching list yet/)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('returning-tab-card')).toBeNull();
  });
});
