import { beforeEach, describe, expect, it } from 'vitest';
import { getCurrentSeasonProgress, writeStoredEpisodeProgress } from '../episodeProgress';

describe('current-season episode progress', () => {
  beforeEach(() => localStorage.clear());

  it('reports next episode and count within the latest season with progress', () => {
    writeStoredEpisodeProgress(42, {
      episodes: { S1E1: true, S1E2: true, S2E1: true },
      seasons: [
        { seasonNumber: 1, episodeNumbers: [1, 2] },
        { seasonNumber: 2, episodeNumbers: [1, 2, 3] },
      ],
    });
    expect(getCurrentSeasonProgress(42)).toEqual({
      seasonNumber: 2,
      watched: 1,
      total: 3,
      nextEpisode: 2,
    });
  });

  it('clears Up next when the current season is complete', () => {
    writeStoredEpisodeProgress(42, {
      episodes: { S3E1: true, S3E2: true },
      seasons: [{ seasonNumber: 3, episodeNumbers: [1, 2] }],
    });
    expect(getCurrentSeasonProgress(42)?.nextEpisode).toBeNull();
  });

  const seasons = [
    { seasonNumber: 1, episodeNumbers: [1, 2] },
    { seasonNumber: 2, episodeNumbers: [1, 2, 3, 4, 5, 6] },
    { seasonNumber: 3, episodeNumbers: [1, 2, 3] },
    { seasonNumber: 4, episodeNumbers: [1, 2] },
  ];
  function save(episodes: Record<string, boolean>, summaries = seasons) {
    localStorage.setItem('episode-progress-42', JSON.stringify({ episodes, seasons: summaries }));
  }
  it('uses earlier active season with its watched count and total despite newer metadata', () => {
    save({ S2E1: true, S2E2: true, S2E3: true, S2E4: true });
    expect(getCurrentSeasonProgress(42)).toEqual({ seasonNumber: 2, watched: 4, total: 6, nextEpisode: 5 });
  });
  it('keeps latest-season progress correct', () => {
    save({ S4E1: true });
    expect(getCurrentSeasonProgress(42)).toEqual({ seasonNumber: 4, watched: 1, total: 2, nextEpisode: 2 });
  });
  it('advances when the user actually begins a later season', () => {
    save({ S2E1: true });
    expect(getCurrentSeasonProgress(42)?.seasonNumber).toBe(2);
    save({ S2E1: true, S3E1: true });
    expect(getCurrentSeasonProgress(42)).toEqual({ seasonNumber: 3, watched: 1, total: 3, nextEpisode: 2 });
  });
  it('completed earlier season does not override later active progress', () => {
    save({ S1E1: true, S1E2: true, S2E1: true });
    expect(getCurrentSeasonProgress(42)?.seasonNumber).toBe(2);
  });
  it('retains completed-season feedback until a later season is begun', () => {
    save({ S1E1: true, S1E2: true });
    expect(getCurrentSeasonProgress(42)).toEqual({ seasonNumber: 1, watched: 2, total: 2, nextEpisode: null });
  });
  it.each([{}, { S2E1: false }, { S0E1: true }])('preserves latest-season fallback without numbered watched progress: %j', episodes => {
    save(episodes);
    expect(getCurrentSeasonProgress(42)).toEqual({ seasonNumber: 4, watched: 0, total: 2, nextEpisode: 1 });
  });
  it('specials cannot override numbered-season progress', () => {
    save({ S0E1: true, S2E3: true }, [{ seasonNumber: 0, episodeNumbers: [1] }, ...seasons]);
    expect(getCurrentSeasonProgress(42)).toEqual({ seasonNumber: 2, watched: 1, total: 6, nextEpisode: 1 });
  });
  it('uses forward progression when multiple seasons are partial, regardless of record order', () => {
    save({ S3E2: true, S1E2: true, S2E4: true, S3E1: false });
    expect(getCurrentSeasonProgress(42)).toEqual({ seasonNumber: 3, watched: 1, total: 3, nextEpisode: 1 });
  });
  it('handles sparse, unordered episode numbers and ignores stale out-of-range watched records', () => {
    save({ S2E5: true, S2E99: true, S4E99: true }, [seasons[3], { seasonNumber: 2, episodeNumbers: [5, 1, 3, 3] }]);
    expect(getCurrentSeasonProgress(42)).toEqual({ seasonNumber: 2, watched: 1, total: 3, nextEpisode: 1 });
  });
  it('does not mutate stored episode or season data', () => {
    save({ S2E3: true }, [...seasons].reverse());
    const before = localStorage.getItem('episode-progress-42');
    getCurrentSeasonProgress(42); getCurrentSeasonProgress(42);
    expect(localStorage.getItem('episode-progress-42')).toBe(before);
  });
  it('preserves absence when season summaries are unavailable or only Specials exist', () => {
    save({ S0E1: true }, [{ seasonNumber: 0, episodeNumbers: [1] }]);
    expect(getCurrentSeasonProgress(42)).toBeNull();
    localStorage.setItem('episode-progress-42', JSON.stringify({ S2E1: true }));
    expect(getCurrentSeasonProgress(42)).toBeNull();
  });
});
