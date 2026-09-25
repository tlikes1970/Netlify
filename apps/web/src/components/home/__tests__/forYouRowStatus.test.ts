import { describe, expect, it } from 'vitest';
import {
  getForYouRowLoadState,
  isForYouRowError,
  isForYouRowLoading,
} from '../forYouRowStatus';

describe('getForYouRowLoadState', () => {
  const base = {
    data: [] as unknown[],
    rawData: undefined as unknown[] | undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    isSuccess: false,
  };

  it('returns idle when filtered items exist', () => {
    expect(
      getForYouRowLoadState({
        ...base,
        data: [{ id: '1' }],
      })
    ).toBe('idle');
  });

  it('returns idle when cached raw data exists but filter removed all items', () => {
    expect(
      getForYouRowLoadState({
        ...base,
        rawData: [{ id: '1' }],
        isError: true,
      })
    ).toBe('idle');
  });

  it('returns idle on successful empty TMDB response', () => {
    expect(
      getForYouRowLoadState({
        ...base,
        isSuccess: true,
      })
    ).toBe('idle');
  });

  it('returns loading while pending without cache', () => {
    expect(
      getForYouRowLoadState({
        ...base,
        isPending: true,
        isFetching: true,
      })
    ).toBe('loading');
  });

  it('returns loading while fetching without cache', () => {
    expect(
      getForYouRowLoadState({
        ...base,
        isFetching: true,
      })
    ).toBe('loading');
  });

  it('returns error when fetch failed and no cache', () => {
    expect(
      getForYouRowLoadState({
        ...base,
        isError: true,
      })
    ).toBe('error');
  });

  it('does not treat error-with-cache as error state', () => {
    const row = {
      ...base,
      data: [{ id: '2' }],
      rawData: [{ id: '2' }],
      isError: true,
    };
    expect(isForYouRowError(row)).toBe(false);
    expect(getForYouRowLoadState(row)).toBe('idle');
  });

  it('isForYouRowLoading matches loading state', () => {
    expect(
      isForYouRowLoading({
        ...base,
        isPending: true,
      })
    ).toBe(true);
    expect(
      isForYouRowLoading({
        ...base,
        isError: true,
      })
    ).toBe(false);
  });
});
