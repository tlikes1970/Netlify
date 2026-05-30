import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeUpNextRail from '@/components/rails/HomeUpNextRail';
import { HOME_UP_NEXT_LIMIT } from '@/lib/upNextShows';
import type { UpNextShow } from '@/lib/upNextShows';

const mockUseReturningShows = vi.fn<[], UpNextShow[]>();

vi.mock('@/state/selectors/useReturningShows', () => ({
  useReturningShows: () => mockUseReturningShows(),
}));

vi.mock('@/components/cards/UpNextCard', () => ({
  default: ({ item }: { item: { title: string } }) => (
    <div data-testid="up-next-card">{item.title}</div>
  ),
}));

vi.mock('@/lib/language', () => ({
  useTranslations: () => ({
    upNext: 'Up Next',
    addTvShowsToWatchingList: 'Add TV shows to Watching.',
  }),
}));

vi.mock('@/lib/settings', () => ({
  useSettings: () => ({ personality: 'default' }),
  getPersonalityText: () => 'Nothing queued yet.',
  DEFAULT_PERSONALITY: 'default',
}));

function makeShow(index: number): UpNextShow {
  return {
    id: index,
    title: `Show ${index}`,
    mediaType: 'tv',
    list: 'watching',
    addedAt: index,
    displayAirDate: 'TBA',
  };
}

describe('HomeUpNextRail', () => {
  beforeEach(() => {
    mockUseReturningShows.mockReset();
  });

  it('renders a capped number of Up Next cards from the shared selector', () => {
    mockUseReturningShows.mockReturnValue(
      Array.from({ length: HOME_UP_NEXT_LIMIT + 5 }, (_, i) => makeShow(i + 1))
    );

    render(<HomeUpNextRail />);

    expect(screen.getByText('Up Next')).toBeInTheDocument();
    expect(screen.getAllByTestId('up-next-card')).toHaveLength(
      HOME_UP_NEXT_LIMIT
    );
    expect(screen.getByText('Show 1')).toBeInTheDocument();
    expect(screen.queryByText(`Show ${HOME_UP_NEXT_LIMIT + 1}`)).toBeNull();
  });

  it('shows empty copy when the shared selector returns no items', () => {
    mockUseReturningShows.mockReturnValue([]);

    render(<HomeUpNextRail />);

    expect(screen.queryByTestId('up-next-card')).toBeNull();
    expect(
      screen.getByText(/Add TV shows to Watching\./)
    ).toBeInTheDocument();
  });
});
