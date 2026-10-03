import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import HomeUpNextRail from '@/components/rails/HomeUpNextRail';
import type { LibraryEntry } from '@/lib/storage';
import { mockWatchingTv, isoDaysFromToday } from '@/lib/__tests__/testHelpers/libraryEntries';
import { getShowStatusInfo } from '@/utils/showStatus';

const lists = vi.hoisted(() => ({ watching: [] as LibraryEntry[], watched: [] as LibraryEntry[] }));
vi.mock('@/lib/storage', () => ({ useLibrary: (list: keyof typeof lists) => lists[list] }));
vi.mock('@/lib/language', async (importOriginal) => ({...await importOriginal<typeof import("@/lib/language")>(), useTranslations: () => ({ upNext: 'Up Next', noPoster: 'No poster' }) }));
vi.mock('@/lib/settings', () => ({ useSettings: () => ({ personalityLevel: 2 }), resolveFlickletLine: () => 'Nothing queued yet.' }));
vi.mock('@/tmdb/tv', () => ({ fetchCurrentEpisodeInfo: async () => ({ season: 2, episode: 3 }) }));
vi.mock('@/components/OptimizedImage', () => ({ OptimizedImage: () => null }));
vi.mock('@/lib/log', () => ({ dlog: () => {} }));

async function renderRail() {
  await act(async () => { render(<HomeUpNextRail />); });
}

describe('Home Up Next remains intact after Library destination removal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-30T12:00:00Z'));
    lists.watching = [];
    lists.watched = [];
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('uses the real shared selector and cards, preserving the 20-card cap and ascending order', async () => {
    lists.watching = Array.from({ length: 25 }, (_, i) => mockWatchingTv({
      id: 25 - i, title: `Show ${25 - i}`, nextAirDate: isoDaysFromToday(25 - i), showStatus: 'Returning Series',
    }));
    await renderRail();
    expect(screen.getByText('Up Next')).toBeInTheDocument();
    const cards = screen.getAllByTestId('up-next-card');
    expect(cards).toHaveLength(20);
    expect(cards.map(card => card.getAttribute('aria-label'))).toEqual(Array.from({ length: 20 }, (_, i) => `Show ${i + 1}`));
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(within(cards[0]).getByRole('link', { name: 'View Show 1 on TMDB' }));
    expect(open).toHaveBeenCalledWith('https://www.themoviedb.org/tv/1', '_blank', 'noopener,noreferrer');
    expect(within(cards[0]).getByText(/S02E03/)).toBeInTheDocument();
  });

  it('keeps Watching and Watched membership, exclusions and undated status priority', async () => {
    lists.watching = [
      mockWatchingTv({ id: 1, title: 'Planned', showStatus: 'Planned' }),
      mockWatchingTv({ id: 2, title: 'Production', showStatus: 'In Production' }),
      mockWatchingTv({ id: 3, title: 'Returning', showStatus: 'Returning Series' }),
      mockWatchingTv({ id: 4, title: 'Ended', showStatus: 'Ended' }),
      mockWatchingTv({ id: 5, title: 'Canceled', showStatus: 'Canceled' }),
      mockWatchingTv({ id: 6, title: 'Movie', mediaType: 'movie' }),
      mockWatchingTv({ id: 7, title: 'Want', list: 'wishlist' }),
    ];
    lists.watched = [mockWatchingTv({ id: 8, title: 'Caught Up', list: 'watched', nextAirDate: isoDaysFromToday(4), showStatus: 'Returning Series' })];
    await renderRail();
    expect(screen.getAllByTestId('up-next-card').map(card => card.getAttribute('aria-label')))
      .toEqual(['Caught Up', 'Returning', 'Production', 'Planned']);
    expect(screen.getByText('Returning Soon')).toBeInTheDocument();
    expect(screen.getByText('In Production')).toBeInTheDocument();
    for (const [status, badge] of [['Returning Series', 'RETURNING'], ['In Production', 'IN PRODUCTION'], ['Planned', 'PLANNED'], ['Ended', 'ENDED'], ['Canceled', 'CANCELLED']] as const) {
      expect(getShowStatusInfo(status)?.badge).toBe(badge);
    }
  });
});
