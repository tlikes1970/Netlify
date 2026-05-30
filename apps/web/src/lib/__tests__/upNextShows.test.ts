import { describe, it, expect } from 'vitest';
import {
  buildUpNextShows,
  getUpNextLabel,
  HOME_UP_NEXT_LIMIT,
} from '@/lib/upNextShows';
import {
  isoDaysFromToday,
  mockWatchingTv,
} from './testHelpers/libraryEntries';

describe('HOME_UP_NEXT_LIMIT', () => {
  it('caps Home Up Next at 12 items', () => {
    expect(HOME_UP_NEXT_LIMIT).toBe(12);
  });
});

describe('buildUpNextShows', () => {
  it('includes future dated TV in Watching', () => {
    const watching = [
      mockWatchingTv({
        id: 1,
        title: 'Dated Show',
        nextAirDate: isoDaysFromToday(7),
        showStatus: 'Returning Series',
      }),
    ];
    const result = buildUpNextShows(watching);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Dated Show');
    expect(result[0].displayAirDate).not.toBe('TBA');
  });

  it('excludes Ended and Canceled shows', () => {
    const watching = [
      mockWatchingTv({
        id: 1,
        title: 'Ended Show',
        showStatus: 'Ended',
        nextAirDate: isoDaysFromToday(7),
      }),
      mockWatchingTv({
        id: 2,
        title: 'Canceled Show',
        showStatus: 'Canceled',
        nextAirDate: isoDaysFromToday(7),
      }),
      mockWatchingTv({
        id: 3,
        title: 'Active Show',
        showStatus: 'Returning Series',
        nextAirDate: isoDaysFromToday(7),
      }),
    ];
    const result = buildUpNextShows(watching);
    expect(result.map((s) => s.title)).toEqual(['Active Show']);
  });

  it('rejects past nextAirDate from dated section (keeps show as undated)', () => {
    const watching = [
      mockWatchingTv({
        id: 1,
        title: 'Stale Date Show',
        showStatus: 'Returning Series',
        nextAirDate: isoDaysFromToday(-10),
      }),
    ];
    const result = buildUpNextShows(watching);
    expect(result).toHaveLength(1);
    expect(result[0].displayAirDate).toBe('TBA');
  });

  it('rejects dates more than 365 days out from dated section', () => {
    const watching = [
      mockWatchingTv({
        id: 1,
        title: 'Far Future Show',
        showStatus: 'In Production',
        nextAirDate: isoDaysFromToday(400),
      }),
    ];
    const result = buildUpNextShows(watching);
    expect(result).toHaveLength(1);
    expect(result[0].displayAirDate).toBe('TBA');
  });

  it('sorts dated items soonest first', () => {
    const watching = [
      mockWatchingTv({
        id: 1,
        title: 'Later',
        nextAirDate: isoDaysFromToday(30),
        showStatus: 'Returning Series',
      }),
      mockWatchingTv({
        id: 2,
        title: 'Sooner',
        nextAirDate: isoDaysFromToday(5),
        showStatus: 'Returning Series',
      }),
    ];
    const result = buildUpNextShows(watching);
    expect(result.map((s) => s.title)).toEqual(['Sooner', 'Later']);
  });

  it('places undated Returning Series after dated items', () => {
    const watching = [
      mockWatchingTv({
        id: 1,
        title: 'Undated Returning',
        showStatus: 'Returning Series',
      }),
      mockWatchingTv({
        id: 2,
        title: 'Dated First',
        nextAirDate: isoDaysFromToday(10),
        showStatus: 'Returning Series',
      }),
    ];
    const result = buildUpNextShows(watching);
    expect(result.map((s) => s.title)).toEqual([
      'Dated First',
      'Undated Returning',
    ]);
  });

  it('includes In Production and Planned after dated items', () => {
    const watching = [
      mockWatchingTv({
        id: 1,
        title: 'Planned Show',
        showStatus: 'Planned',
      }),
      mockWatchingTv({
        id: 2,
        title: 'In Production Show',
        showStatus: 'In Production',
      }),
      mockWatchingTv({
        id: 3,
        title: 'Dated Show',
        nextAirDate: isoDaysFromToday(14),
        showStatus: 'Returning Series',
      }),
    ];
    const result = buildUpNextShows(watching);
    expect(result.map((s) => s.title)).toEqual([
      'Dated Show',
      'In Production Show',
      'Planned Show',
    ]);
  });

  it('ignores non-TV items', () => {
    const watching = [
      mockWatchingTv({
        id: 1,
        title: 'Movie',
        mediaType: 'movie',
        nextAirDate: isoDaysFromToday(7),
      }),
    ];
    expect(buildUpNextShows(watching)).toHaveLength(0);
  });
});

describe('getUpNextLabel', () => {
  it('shows Up Next with formatted date for valid future dates outside soon window', () => {
    const label = getUpNextLabel({
      nextAirDate: isoDaysFromToday(30),
      showStatus: 'Returning Series',
    });
    expect(label).toMatch(/^Up Next: /);
    expect(label).not.toBe('Returning Soon');
  });

  it('shows humanized Up Next for soon dates', () => {
    const label = getUpNextLabel({
      nextAirDate: isoDaysFromToday(3),
      showStatus: 'Returning Series',
    });
    expect(label).toMatch(/^Up Next: In 3 days$/);
  });

  it('shows Returning Soon when undated Returning Series', () => {
    expect(
      getUpNextLabel({ showStatus: 'Returning Series' })
    ).toBe('Returning Soon');
  });

  it('shows In Production when undated', () => {
    expect(
      getUpNextLabel({ showStatus: 'In Production' })
    ).toBe('In Production');
  });

  it('shows Date TBA for undated Planned or unknown status', () => {
    expect(getUpNextLabel({ showStatus: 'Planned' })).toBe('Date TBA');
    expect(getUpNextLabel({ showStatus: undefined })).toBe('Date TBA');
  });

  it('does not treat past nextAirDate as a confirmed date', () => {
    expect(
      getUpNextLabel({
        nextAirDate: isoDaysFromToday(-5),
        showStatus: 'Returning Series',
      })
    ).toBe('Returning Soon');
  });
});
