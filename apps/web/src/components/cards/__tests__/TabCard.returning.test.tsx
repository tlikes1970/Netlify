import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TabCard from '@/components/cards/TabCard';
import type { MediaItem } from '@/components/cards/card.types';
import { isoDaysFromToday } from '@/lib/__tests__/testHelpers/libraryEntries';

vi.mock('@/lib/proStatus', () => ({
  useProStatus: () => ({ isPro: false, source: null }),
}));

vi.mock('@/components/WatchingListWithBackdrop', () => ({
  useBackdropCallbacks: () => ({}),
}));

vi.mock('@/lib/storage', () => ({
  Library: {
    getEntry: vi.fn(() => undefined),
    subscribe: vi.fn(() => () => {}),
    move: vi.fn(),
  },
}));

vi.mock('@/lib/language', () => ({
  useTranslations: () => ({
    wantToWatchAction: 'Want to Watch',
    watchedAction: 'Watched',
    notInterestedAction: 'Not Interested',
    noPoster: 'No poster',
  }),
}));

vi.mock('@/lib/settings', () => ({
  useSettings: () => ({
    personality: 'default',
    layout: { theme: 'light', episodeTracking: true },
    pro: { isPro: false },
  }),
}));

vi.mock('@/hooks/useDeviceDetection', () => ({
  useIsDesktop: () => ({ ready: true, isDesktop: true }),
}));

vi.mock('@/lib/mobileFlags', () => ({
  isCompactMobileV1: () => false,
  isActionsSplit: () => false,
}));

vi.mock('@/lib/isMobile', () => ({
  isMobileNow: () => false,
}));

vi.mock('@/lib/proUpgrade', () => ({
  startProUpgrade: vi.fn(),
}));

vi.mock('@/components/cards/mobile/TvCardMobile', () => ({
  TvCardMobile: () => null,
}));

vi.mock('@/components/cards/mobile/MovieCardMobile', () => ({
  MovieCardMobile: () => null,
}));

vi.mock('@/components/SwipeableCard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/MyListToggle', () => ({
  default: () => null,
}));

vi.mock('@/components/cards/StarRating', () => ({
  default: () => null,
}));

vi.mock('@/components/cards/ProviderBadge', () => ({
  ProviderBadges: () => null,
}));

vi.mock('@/components/OptimizedImage', () => ({
  OptimizedImage: () => <div data-testid="poster" />,
}));

const baseItem: MediaItem = {
  id: 99,
  mediaType: 'tv',
  title: 'Test Returning Show',
  year: 2024,
  posterUrl: 'https://example.com/poster.jpg',
};

describe('TabCard returning labels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Up Next label for a valid future date', () => {
    render(
      <TabCard
        item={{
          ...baseItem,
          nextAirDate: isoDaysFromToday(20),
          showStatus: 'Returning Series',
        }}
        tabType="returning"
      />
    );

    expect(screen.getByText(/^Up Next: /)).toBeInTheDocument();
  });

  it('shows Returning Soon when there is no valid date', () => {
    render(
      <TabCard
        item={{
          ...baseItem,
          showStatus: 'Returning Series',
        }}
        tabType="returning"
      />
    );

    expect(screen.getByText('Returning Soon')).toBeInTheDocument();
  });

  it('shows Date TBA for undated Planned shows', () => {
    render(
      <TabCard
        item={{
          ...baseItem,
          showStatus: 'Planned',
        }}
        tabType="returning"
      />
    );

    expect(screen.getByText('Date TBA')).toBeInTheDocument();
  });
});
