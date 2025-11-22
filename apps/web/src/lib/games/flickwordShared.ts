/**
 * Process: FlickWord Share Params
 * Purpose: Type-safe handling of share link parameters for FlickWord games
 * Data Source: Query params from App.tsx → localStorage → FlickWordGame → FlickWordModal → FlickWordReview
 * Update Path: Modify this type if share param structure changes
 * Dependencies: Used by App.tsx, FlickWordGame.tsx, FlickWordModal.tsx, FlickWordReview.tsx
 */

/**
 * Share parameters for FlickWord deep links
 */
export interface FlickWordShareParams {
  date: string; // Required - ISO date string (YYYY-MM-DD)
  gameNumber?: number | null; // Optional - specific game number (1-3) for sharedResult mode
  mode?: "sharedResult" | "sharedAll" | "play" | string; // Optional - share mode
}

/**
 * Storage key for FlickWord share params in localStorage
 */
export const storageKeyFlickWordShareParams = "flickword:shareParams";

/**
 * Parse and validate FlickWord share params from localStorage
 * @param raw - The raw value from localStorage (should be JSON-parsed)
 * @returns Validated FlickWordShareParams or null if invalid
 */
export function parseFlickWordShareParams(raw: unknown): FlickWordShareParams | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  // date is required
  if (!obj.date || typeof obj.date !== "string") {
    return null;
  }

  const date = obj.date;

  // Validate date format (basic check - should be YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  // Parse gameNumber if present
  let gameNumber: number | null = null;
  if (obj.gameNumber !== undefined && obj.gameNumber !== null) {
    if (typeof obj.gameNumber === "number") {
      gameNumber = obj.gameNumber;
    } else if (typeof obj.gameNumber === "string") {
      const parsed = parseInt(obj.gameNumber, 10);
      if (!isNaN(parsed)) {
        gameNumber = parsed;
      }
    }
    // Validate range (1-3)
    if (gameNumber !== null && (gameNumber < 1 || gameNumber > 3)) {
      gameNumber = null;
    }
  }

  // Parse mode if present
  let mode: "sharedResult" | "sharedAll" | "play" | string = "play";
  if (obj.mode !== undefined && obj.mode !== null) {
    if (typeof obj.mode === "string") {
      if (obj.mode === "sharedResult" || obj.mode === "sharedAll" || obj.mode === "play") {
        mode = obj.mode;
      } else {
        mode = obj.mode; // Keep as string for unknown modes
      }
    }
  }

  return {
    date,
    gameNumber: gameNumber ?? null,
    mode,
  };
}

