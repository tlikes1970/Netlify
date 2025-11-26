/**
 * Cache TTL tests for Smart Discovery
 * Verifies recommendation cache behavior:
 * - Returns cached results within TTL
 * - Re-evaluates scoring after TTL expires
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSmartRecommendations, UserPreferences } from '@/lib/smartDiscovery';
import * as storage from '@/lib/storage';

// Mock the storage module
vi.mock('@/lib/storage', () => ({
  Library: {
    getAll: vi.fn(() => []),
  },
}));

const basePreferences: UserPreferences = {
  favoriteGenres: {},
  preferredMediaTypes: { movie: 0.5, tv: 0.5 },
  averageRating: 3.5,
  notInterestedIds: new Set(),
  favoriteIds: new Set()
};

// Mock TMDB API response
const mockTmdbResponse = {
  results: [
    {
      id: 123,
      title: 'Test Movie',
      media_type: 'movie',
      poster_path: '/test.jpg',
      vote_average: 8.0,
      popularity: 100,
      release_date: '2024-01-01',
      genre_ids: [18]
    },
    {
      id: 456,
      title: 'Test Movie 2',
      media_type: 'movie',
      poster_path: '/test2.jpg',
      vote_average: 7.5,
      popularity: 80,
      release_date: '2024-02-01',
      genre_ids: [28]
    }
  ]
};

describe('Discovery cache — TTL behavior', () => {
  let mockTmdbApi: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Reset the mock for each test
    mockTmdbApi = vi.fn().mockResolvedValue(mockTmdbResponse);
    vi.mocked(storage.Library.getAll).mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns cached results within TTL (cache hit)', async () => {
    const userId = 'test-user-cache-hit';

    // First call - should fetch from API
    const result1 = await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId
    );

    // API should have been called (6 endpoints: trending x2, movies x2, tv x2)
    const callCountAfterFirst = mockTmdbApi.mock.calls.length;
    expect(callCountAfterFirst).toBe(6);

    // Advance time by 2 minutes (within 5-minute TTL)
    vi.advanceTimersByTime(2 * 60 * 1000);

    // Second call - should return cached results
    const result2 = await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId
    );

    // API should NOT have been called again (still same 6 calls)
    expect(mockTmdbApi.mock.calls.length).toBe(callCountAfterFirst);

    // Results should be the same (cached)
    expect(result1).toEqual(result2);
  });

  it('re-evaluates scoring after TTL expires (cache miss)', async () => {
    const userId = 'test-user-cache-miss';

    // First call - should fetch from API
    await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId
    );

    const callCountAfterFirst = mockTmdbApi.mock.calls.length;
    expect(callCountAfterFirst).toBe(6);

    // Advance time by 6 minutes (past 5-minute TTL)
    vi.advanceTimersByTime(6 * 60 * 1000);

    // Second call - should re-fetch (cache expired)
    await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId
    );

    // API should have been called again (12 total calls: 6 + 6)
    expect(mockTmdbApi.mock.calls.length).toBe(callCountAfterFirst * 2);
  });

  it('uses separate cache entries for different users', async () => {
    const userId1 = 'user-1';
    const userId2 = 'user-2';

    // First call for user 1
    await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId1
    );

    expect(mockTmdbApi.mock.calls.length).toBe(6);

    // Call for user 2 - should NOT use user 1's cache
    await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId2
    );

    // Should have called API again for user 2
    expect(mockTmdbApi.mock.calls.length).toBe(12);
  });

  it('invalidates cache when preferences change', async () => {
    const userId = 'test-user-prefs-change';

    // First call with base preferences
    await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId
    );

    expect(mockTmdbApi.mock.calls.length).toBe(6);

    // Call with different preferences (different cache key)
    const differentPrefs: UserPreferences = {
      ...basePreferences,
      averageRating: 4.5 // Changed
    };

    await getSmartRecommendations(
      differentPrefs,
      10,
      mockTmdbApi,
      userId
    );

    // Should have called API again due to different preferences
    expect(mockTmdbApi.mock.calls.length).toBe(12);
  });

  it('invalidates cache when library changes', async () => {
    const userId = 'test-user-library-change';

    // First call with empty library
    vi.mocked(storage.Library.getAll).mockReturnValue([]);
    await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId
    );

    expect(mockTmdbApi.mock.calls.length).toBe(6);

    // Simulate library change
    vi.mocked(storage.Library.getAll).mockReturnValue([
      { id: '999', mediaType: 'movie', title: 'New Movie', list: 'watching' }
    ] as storage.LibraryEntry[]);

    // Call again - cache key includes library, so should refetch
    await getSmartRecommendations(
      basePreferences,
      10,
      mockTmdbApi,
      userId
    );

    // Should have called API again due to library change
    expect(mockTmdbApi.mock.calls.length).toBe(12);
  });
});


