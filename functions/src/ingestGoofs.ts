/**
 * Process: Ingest Goofs/Insights
 * Purpose: Callable Cloud Function wrapper for goofs ingestion Netlify function
 * Data Source: Netlify function (goofs-fetch), Firestore insights collection
 * Update Path: Admin triggers ingestion, writes to Firestore
 * Dependencies: firebase-admin/auth, Netlify function endpoint
 *
 * This function acts as a secure proxy:
 * - Verifies caller is admin via Firebase Auth custom claims
 * - Calls Netlify function with admin token from environment
 * - Returns ingestion results to client
 *
 * DATA FLOW:
 * - Admin UI calls this Firebase callable function
 * - Function verifies admin status, then calls Netlify function with admin token
 * - Netlify function fetches/transforms data and writes to Firestore
 * - Clients read only from Firestore via goofsStore.ts
 *
 * FUTURE AUTOMATION:
 * - This function can be called from scheduled jobs (Cloud Scheduler, Netlify Scheduled Functions)
 * - For scheduled runs: Create a Cloud Function or Netlify scheduled function that calls ingestGoofs
 * - Ensure the calling service has admin privileges or uses a service account with admin role
 * - The ingestion pipeline is idempotent and safe to run regularly
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db as database } from "./admin";

const NETLIFY_FUNCTION_URL =
  process.env.NETLIFY_FUNCTION_URL ||
  "https://flicklet.netlify.app/.netlify/functions/goofs-fetch";
const ADMIN_TOKEN = process.env.GOOFS_INGESTION_ADMIN_TOKEN;

export const ingestGoofs = onCall({ cors: true }, async (request) => {
  // Check caller is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  // Check caller is admin by verifying their token claims
  const callerRole = request.auth.token?.role;

  if (callerRole !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Only admins can trigger goofs ingestion"
    );
  }

  if (!ADMIN_TOKEN) {
    throw new HttpsError(
      "internal",
      "Server configuration error: GOOFS_INGESTION_ADMIN_TOKEN not set"
    );
  }

  // Get request data
  const { tmdbId, metadata, mode, bulk, titles } = request.data;

  // Validate request
  if (mode === "bulk") {
    // True bulk mode: fetch titles automatically from Firestore
    const titlesList = [];

    try {
      console.log("[ingestGoofs] Starting bulk ingestion mode");

      // First, try to fetch from a titles collection if it exists
      const titlesSnapshot = await database
        .collection("titles")
        .limit(1000)
        .get();

      const titlesCount = titlesSnapshot.empty ? 0 : titlesSnapshot.size;
      console.log(
        `[ingestGoofs] Titles collection query result: ${titlesSnapshot.empty ? "empty" : `${titlesCount} documents`}`
      );

      if (titlesSnapshot.empty) {
        // Fallback: aggregate titles from all users' watchlists
        const usersSnapshot = await database
          .collection("users")
          .limit(500)
          .get();
        const uniqueTitles = new Map();

        for (const userDocument of usersSnapshot.docs) {
          const userData = userDocument.data();
          const watchlists = userData.watchlists || {};

          // Process movies
          const movies = [
            ...(watchlists.movies?.watching || []),
            ...(watchlists.movies?.wishlist || []),
            ...(watchlists.movies?.watched || []),
          ];

          // Process TV shows
          const tvShows = [
            ...(watchlists.tv?.watching || []),
            ...(watchlists.tv?.wishlist || []),
            ...(watchlists.tv?.watched || []),
          ];

          // Aggregate unique titles
          for (const item of [...movies, ...tvShows]) {
            const id = item.id || item.tmdbId || item.tmdb_id;
            if (id && !uniqueTitles.has(String(id))) {
              uniqueTitles.set(String(id), {
                tmdbId: id,
                metadata: {
                  tmdbId: id,
                  id: id,
                  title: item.title || "Unknown Title",
                  mediaType: item.media_type || item.mediaType || "movie",
                  genres: item.genres || [],
                  year: item.year || item.release_date?.slice(0, 4) || null,
                  runtimeMins: item.runtimeMins || item.runtime || null,
                  episodeCount: item.episodeCount || null,
                  seasonCount: item.seasonCount || null,
                },
              });
            }
          }
        }

        titlesList.push(...uniqueTitles.values());
      } else {
        // Use titles collection
        for (const document_ of titlesSnapshot.docs) {
          const data = document_.data();
          titlesList.push({
            tmdbId: data.tmdbId || data.id || data.tmdb_id || document_.id,
            metadata: {
              tmdbId: data.tmdbId || data.id || data.tmdb_id || document_.id,
              id: data.tmdbId || data.id || data.tmdb_id || document_.id,
              title: data.title,
              mediaType: data.mediaType || data.media_type || "movie",
              genres: data.genres || [],
              year: data.year || data.release_date?.slice(0, 4) || null,
              runtimeMins: data.runtimeMins || data.runtime || null,
              episodeCount: data.episodeCount || null,
              seasonCount: data.seasonCount || null,
            },
          });
        }
      }

      console.log(`[ingestGoofs] Found ${titlesList.length} titles to process`);

      if (titlesList.length === 0) {
        throw new HttpsError(
          "not-found",
          "No titles found in Firestore. Please ensure titles collection exists or users have watchlists."
        );
      }

      // Process each title
      const results = [];
      const errors = [];
      console.log(
        `[ingestGoofs] Starting to process ${titlesList.length} titles...`
      );

      for (const title of titlesList) {
        try {
          const response = await fetch(NETLIFY_FUNCTION_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-token": ADMIN_TOKEN,
            },
            body: JSON.stringify({
              tmdbId: title.tmdbId,
              metadata: title.metadata,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            results.push({
              tmdbId: title.tmdbId,
              itemsGenerated: result.itemsGenerated || 0,
            });
          } else {
            const errorData = await response.json().catch(() => ({}));
            errors.push({
              tmdbId: title.tmdbId,
              error: errorData.message || `HTTP ${response.status}`,
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          errors.push({
            tmdbId: title.tmdbId,
            error: errorMessage,
          });
        }
      }

      return {
        success: true,
        mode: "bulk",
        total: titlesList.length,
        succeeded: results.length,
        failed: errors.length,
        count: results.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error("[ingestGoofs] Bulk ingestion error:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to fetch titles for bulk ingestion";
      console.error(
        `[ingestGoofs] Throwing HttpsError with message: ${errorMessage}`
      );
      throw new HttpsError("internal", errorMessage);
    }
  } else if (bulk && titles) {
    // Bulk ingestion mode
    if (!Array.isArray(titles) || titles.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "titles must be a non-empty array for bulk ingestion"
      );
    }

    // Process each title
    const results = [];
    const errors = [];

    for (const title of titles) {
      try {
        const response = await fetch(NETLIFY_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": ADMIN_TOKEN,
          },
          body: JSON.stringify({
            tmdbId: title.tmdbId || title.tmdb_id,
            metadata: title.metadata || title,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          results.push({
            tmdbId: title.tmdbId || title.tmdb_id,
            itemsGenerated: result.itemsGenerated || 0,
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          errors.push({
            tmdbId: title.tmdbId || title.tmdb_id,
            error: errorData.message || `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({
          tmdbId: title.tmdbId || title.tmdb_id,
          error: errorMessage,
        });
      }
    }

    return {
      success: true,
      mode: "bulk",
      total: titles.length,
      succeeded: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } else {
    // Single title ingestion (default mode)
    // Support both mode: "single" and legacy format (no mode specified)
    if (mode && mode !== "single") {
      throw new HttpsError(
        "invalid-argument",
        `Unknown mode: ${mode}. Use "single" or "bulk"`
      );
    }

    if (!tmdbId) {
      throw new HttpsError(
        "invalid-argument",
        "tmdbId is required for single title ingestion"
      );
    }

    try {
      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": ADMIN_TOKEN,
        },
        body: JSON.stringify({
          tmdbId,
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new HttpsError(
          "internal",
          errorData.message || `HTTP ${response.status}`
        );
      }

      const result = await response.json();
      return {
        success: true,
        mode: "single",
        tmdbId,
        itemsGenerated: result.itemsGenerated || 0,
        insights: result.insights,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Failed to ingest goofs";
      throw new HttpsError("internal", errorMessage);
    }
  }
});
