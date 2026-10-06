import { guardMutation } from "../lib/readOnlyGuard";
import { persistLocalContent } from "../lib/restoreBarrier";
// Episode progress utilities
export interface EpisodeProgress {
  watched: number;
  total: number;
  percentage: number;
  hasProgress: boolean;
}

export interface EpisodeSeasonSummary {
  seasonNumber: number;
  episodeNumbers: number[];
}

export interface StoredEpisodeProgress {
  episodes: Record<string, boolean>;
  totalEpisodes?: number;
  seasons?: EpisodeSeasonSummary[];
}

export function readStoredEpisodeProgress(
  showId: number,
): StoredEpisodeProgress {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(`episode-progress-${showId}`) || "{}",
    );
    if (parsed.episodes) return parsed;
    return { episodes: parsed };
  } catch {
    return { episodes: {} };
  }
}

export function writeStoredEpisodeProgress(
  showId: number,
  data: StoredEpisodeProgress,
): boolean {
  if (!guardMutation()) return false;
  persistLocalContent(`episode-progress-${showId}`, JSON.stringify(data));
  window.dispatchEvent(
    new CustomEvent("episode-progress:updated", { detail: { showId } }),
  );
  return true;
}

export function getCurrentSeasonProgress(showId: number): {
  seasonNumber: number;
  watched: number;
  total: number;
  nextEpisode: number | null;
} | null {
  const stored = readStoredEpisodeProgress(showId);
  const seasons = stored.seasons?.filter(
    (season) => season.seasonNumber > 0 && season.episodeNumbers.length > 0,
  ).map(season => ({
    ...season,
    episodeNumbers: [...new Set(season.episodeNumbers)].sort((a, b) => a - b),
  })).sort((a, b) => b.seasonNumber - a.seasonNumber);
  if (!seasons?.length) return null;
  // Stored progress has no per-episode chronology or explicit active season.
  // Follow forward progression: latest numbered season actually begun, retaining
  // completed-season feedback until a later season has watched progress.
  const current = seasons.find(season => season.episodeNumbers.some(
    episode => stored.episodes[`S${season.seasonNumber}E${episode}`],
  )) ?? seasons[0]; // Preserve the existing no-progress/latest-season fallback.
  const watched = current.episodeNumbers.filter(
    (episode) => stored.episodes[`S${current.seasonNumber}E${episode}`],
  ).length;
  const nextEpisode =
    current.episodeNumbers.find(
      (episode) => !stored.episodes[`S${current.seasonNumber}E${episode}`],
    ) ?? null;
  return {
    seasonNumber: current.seasonNumber,
    watched,
    total: current.episodeNumbers.length,
    nextEpisode,
  };
}

/**
 * Get episode progress for a TV show
 */
export function getEpisodeProgress(
  showId: number,
  totalEpisodes?: number,
): EpisodeProgress {
  try {
    const saved = localStorage.getItem(`episode-progress-${showId}`);
    if (!saved) {
      return {
        watched: 0,
        total: totalEpisodes || 0,
        percentage: 0,
        hasProgress: (totalEpisodes || 0) > 0,
      };
    }

    const data = JSON.parse(saved);

    // Handle both old format (just episodes) and new format (with totalEpisodes)
    const episodes = data.episodes || data;
    const savedTotalEpisodes = data.totalEpisodes;

    const watched = Object.values(episodes).filter(Boolean).length;

    // Use provided total episodes, saved total episodes, or fall back to counting saved episodes
    const total =
      totalEpisodes !== undefined
        ? totalEpisodes
        : savedTotalEpisodes !== undefined
          ? savedTotalEpisodes
          : Object.keys(episodes).length;

    const percentage = total > 0 ? Math.round((watched / total) * 100) : 0;

    return {
      watched,
      total,
      percentage,
      hasProgress: total > 0,
    };
  } catch {
    return {
      watched: 0,
      total: totalEpisodes || 0,
      percentage: 0,
      hasProgress: (totalEpisodes || 0) > 0,
    };
  }
}

/**
 * Format episode progress for display
 */
export function formatEpisodeProgress(progress: EpisodeProgress): string {
  if (!progress.hasProgress) return "";

  if (progress.total === 0) return "No episodes";
  if (progress.watched === 0) return `0/${progress.total} episodes`;
  if (progress.watched === progress.total)
    return `All ${progress.total} episodes`;

  return `${progress.watched}/${progress.total} episodes`;
}

/**
 * Get progress color based on completion
 */
export function getProgressColor(progress: EpisodeProgress): string {
  if (!progress.hasProgress) return "var(--muted)";
  if (progress.percentage === 100) return "#10b981"; // green-500
  if (progress.percentage >= 50) return "#f59e0b"; // amber-500
  return "#6b7280"; // gray-500
}

/**
 * Clean up invalid episode keys for a show
 * This removes episode keys that don't correspond to actual episodes
 */
export function cleanupInvalidEpisodeKeys(
  showId: number,
  validEpisodeKeys: string[],
): void {
  if (!guardMutation()) return;
  try {
    const saved = localStorage.getItem(`episode-progress-${showId}`);
    if (!saved) return;

    const data = JSON.parse(saved);
    const episodes = data.episodes || data;

    // Find invalid keys (keys that don't exist in validEpisodeKeys)
    const invalidKeys = Object.keys(episodes).filter(
      (key) => !validEpisodeKeys.includes(key),
    );

    if (invalidKeys.length > 0) {
      console.log(
        `Cleaning up ${invalidKeys.length} invalid episode keys for show ${showId}:`,
        invalidKeys,
      );

      // Remove invalid keys
      invalidKeys.forEach((key) => delete episodes[key]);

      // Save cleaned data
      const cleanedData = {
        episodes: episodes,
        totalEpisodes: data.totalEpisodes,
      };

      persistLocalContent(
        `episode-progress-${showId}`,
        JSON.stringify(cleanedData),
      );
      console.log(`Cleaned episode progress for show ${showId}`);
    }
  } catch (error) {
    console.error("Error cleaning up episode keys:", error);
  }
}

/**
 * Get valid episode keys for a show based on actual episode data
 */
export function getValidEpisodeKeys(seasons: any[]): string[] {
  const validKeys: string[] = [];

  seasons.forEach((season) => {
    season.episodes.forEach((episode: any) => {
      validKeys.push(`S${episode.season_number}E${episode.episode_number}`);
    });
  });

  return validKeys;
}
