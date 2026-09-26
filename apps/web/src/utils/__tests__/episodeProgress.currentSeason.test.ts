import { beforeEach, describe, expect, it } from 'vitest';
import { getCurrentSeasonProgress, writeStoredEpisodeProgress } from '../episodeProgress';

describe('current-season episode progress', () => {
  beforeEach(() => localStorage.clear());

  it('reports next episode and count within the latest season only', () => {
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
});
