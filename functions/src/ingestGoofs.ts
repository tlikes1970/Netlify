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
import { getTitlesForGoofs } from "./titlesRepository";

const NETLIFY_FUNCTION_URL =
  process.env.NETLIFY_FUNCTION_URL ||
  "https://flicklet.netlify.app/.netlify/functions/goofs-fetch";

export const ingestGoofs = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 540, // 9 minutes - maximum for 2nd gen callable functions
  },
  async (request) => {
  // Log function invocation from admin UI
  console.log("[ingestGoofs] Function invoked by admin user:", request.auth?.uid);

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

  // Get admin token from environment variable (v2 functions use env vars, not functions.config())
  const token = process.env.GOOFS_INGESTION_ADMIN_TOKEN || "";
  if (!token) {
    throw new HttpsError(
      "internal",
      "Server configuration error: GOOFS_INGESTION_ADMIN_TOKEN environment variable not set. Please set it in Firebase Console → Functions → Configuration → Environment Variables"
    );
  }

  // Get request data
  const { tmdbId, metadata, mode, bulk, titles } = request.data;

  // Validate request
  if (mode === "bulk") {
    /**
     * CURRENT TITLES DATA FLOW (as of migration to canonical /titles collection):
     * 
     * PRIMARY SOURCE: Firestore `/titles` collection
     * - Query `/titles` where `enabledForGoofs == true`
     * - Each title doc must have: tmdbId (required), title, mediaType
     * - Titles without tmdbId are skipped (logged as warnings)
     * 
     * FALLBACK (bootstrap-only, deprecated):
     * - If `/titles` collection is empty, fall back to aggregating from users' watchlists
     * - This fallback is intended only for initial migration/bootstrap
     * - After seeding `/titles` via seedTitles.ts script, this fallback should rarely be used
     * 
     * FUTURE: Remove watchlist fallback once `/titles` is fully populated and stable
     */
    const titlesList = [];

    try {
      console.log("[ingestGoofs] Starting bulk ingestion mode");

      // PRIMARY SOURCE: Fetch titles from canonical Firestore `/titles` collection
      const firestoreTitles = await getTitlesForGoofs();

      if (firestoreTitles.length > 0) {
        // Use canonical titles collection
        console.log(
          `[ingestGoofs] Using canonical /titles collection: ${firestoreTitles.length} titles enabled for goofs`
        );

        // Transform TitleDoc[] to ingestion format
        for (const titleDoc of firestoreTitles) {
          // Skip titles without tmdbId (shouldn't happen due to repository validation, but double-check)
          if (!titleDoc.tmdbId) {
            console.warn(
              `[ingestGoofs] Skipping title "${titleDoc.title}" - missing tmdbId`
            );
            continue;
          }

          // Try to read additional fields from Firestore if they exist
          let runtimeMins = null;
          let episodeCount = null;
          let seasonCount = null;
          let overview = null;
          let synopsis = null;
          let cast = null;
          let keywords = null;
          try {
            const titleDocRef = database
              .collection("titles")
              .doc(String(titleDoc.tmdbId));
            const titleDocSnapshot = await titleDocRef.get();
            if (titleDocSnapshot.exists) {
              const titleData = titleDocSnapshot.data();
              runtimeMins = titleData?.runtimeMinutes || titleData?.runtimeMins || titleData?.runtime || null;
              episodeCount = titleData?.episodeCount || null;
              seasonCount = titleData?.seasonCount || null;
              overview = titleData?.overview || titleData?.synopsis || null;
              synopsis = titleData?.synopsis || titleData?.overview || null;
              cast = titleData?.cast || titleData?.characters || null;
              keywords = titleData?.keywords || titleData?.tags || null;
            }
          } catch (error) {
            // Silently continue if we can't read additional fields
            // This is optional metadata, so ingestion should continue
          }

          titlesList.push({
            tmdbId: titleDoc.tmdbId,
            metadata: {
              tmdbId: titleDoc.tmdbId,
              id: titleDoc.tmdbId,
              title: titleDoc.title,
              mediaType: titleDoc.mediaType,
              genres: titleDoc.genres || [],
              year: titleDoc.year || null,
              runtimeMins: runtimeMins,
              episodeCount: episodeCount,
              seasonCount: seasonCount,
              overview: overview,
              synopsis: synopsis,
              cast: cast,
              keywords: keywords,
            },
          });
        }
      } else {
        // FALLBACK: Aggregate from users' watchlists (bootstrap-only, deprecated)
        console.warn(
          "[ingestGoofs] /titles collection is empty. Falling back to watchlists aggregation (bootstrap mode)."
        );
        console.warn(
          "[ingestGoofs] Consider running seedTitles.ts script to populate /titles collection."
        );

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
      }

      console.log(`[ingestGoofs] Found ${titlesList.length} titles to process`);

      // TEST MODE: Limit to first 5 titles for debugging (remove after fixing duplicate issue)
      // OPTION 1: Temporarily hardcode to true (easiest for testing)
      // OPTION 2: Set via Firebase CLI: firebase functions:secrets:set INGEST_GOOFS_TEST_MODE
      // OPTION 3: Add to .env file in functions directory
      const TEST_MODE = false; // Set to true for testing with limited titles
      const titlesToProcess = TEST_MODE 
        ? titlesList.slice(0, 5)
        : titlesList;
      
      if (TEST_MODE) {
        console.log(`[ingestGoofs] ⚠️ TEST MODE: Processing only first 5 titles (${titlesToProcess.length} total)`);
      }

      if (titlesToProcess.length === 0) {
        throw new HttpsError(
          "not-found",
          "No titles found for goofs ingestion in Firestore `/titles` collection. Please ensure titles collection exists and contains titles with `enabledForGoofs == true`, or run seedTitles.ts script to bootstrap the collection."
        );
      }

      // Process titles in parallel batches for faster execution
      const results = [];
      const errors = [];
      const BATCH_SIZE = 10; // Process 10 titles in parallel
      console.log(
        `[ingestGoofs] Starting to process ${titlesToProcess.length} titles in batches of ${BATCH_SIZE}...`
      );

      // Process titles in batches
      for (let i = 0; i < titlesToProcess.length; i += BATCH_SIZE) {
        const batch = titlesToProcess.slice(i, i + BATCH_SIZE);
        console.log(
          `[ingestGoofs] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(titlesToProcess.length / BATCH_SIZE)} (${batch.length} titles)...`
        );

        // Process batch in parallel
        const batchPromises = batch.map(async (title) => {
          try {
            // Debug logging: Log what we're sending for this title
            console.log("[ingestGoofs] Processing title", {
              titleId: title.tmdbId,
              titleName: title.metadata?.title || "Unknown",
              metadataTmdbId: title.metadata?.tmdbId,
              metadataId: title.metadata?.id,
              metadataGenres: title.metadata?.genres,
              metadataMediaType: title.metadata?.mediaType,
            });

            const requestPayload = {
              tmdbId: title.tmdbId,
              metadata: title.metadata,
            };

            const response = await fetch(NETLIFY_FUNCTION_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-admin-token": token,
              },
              body: JSON.stringify(requestPayload),
            });

            if (response.ok) {
              const result = await response.json();
              
              // Debug logging: Log a preview of what was returned
              const firstInsight = result.insights?.items?.[0];
              console.log(
                `[ingestGoofs] ✅ Successfully ingested title ${title.tmdbId}: ${title.metadata.title}`,
                {
                  itemsGenerated: result.itemsGenerated || 0,
                  resultTmdbId: result.tmdbId,
                  firstInsightPreview: firstInsight?.text?.slice(0, 80) || null,
                  firstInsightId: firstInsight?.id || null,
                }
              );
              
              return {
                success: true,
                tmdbId: title.tmdbId,
                itemsGenerated: result.itemsGenerated || 0,
              };
            } else {
              const errorText = await response.text().catch(() => "");
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                // If response is HTML (like error pages), extract meaningful info
                const isHtml = errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html");
                if (isHtml) {
                  // Try to extract title or meaningful text from HTML
                  const titleMatch = errorText.match(/<title[^>]*>([^<]+)<\/title>/i);
                  const errorTitle = titleMatch ? titleMatch[1] : "Netlify Error Page";
                  errorData = { 
                    message: `Netlify function returned HTML error page (HTTP ${response.status}): ${errorTitle}. Check function deployment and NETLIFY_FUNCTION_URL.`,
                    status: response.status,
                    url: NETLIFY_FUNCTION_URL
                  };
                } else {
                  errorData = { message: errorText || `HTTP ${response.status}` };
                }
              }
              const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
              console.error(
                `[ingestGoofs] ❌ Failed to ingest title ${title.tmdbId} (${title.metadata.title}): ${errorMessage}`
              );
              // Log first error with full details for debugging
              if (errors.length === 0) {
                console.error(
                  `[ingestGoofs] First error details - Status: ${response.status}, URL: ${NETLIFY_FUNCTION_URL}, Response preview: ${errorText.substring(0, 200)}`
                );
              }
              return {
                success: false,
                tmdbId: title.tmdbId,
                error: errorMessage,
              };
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error(
              `[ingestGoofs] ❌ Exception ingesting title ${title.tmdbId} (${title.metadata.title}): ${errorMessage}`
            );
            return {
              success: false,
              tmdbId: title.tmdbId,
              error: errorMessage,
            };
          }
        });

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Separate successes and errors
        for (const result of batchResults) {
          if (result.success) {
            results.push({
              tmdbId: result.tmdbId,
              itemsGenerated: result.itemsGenerated,
            });
          } else {
            errors.push({
              tmdbId: result.tmdbId,
              error: result.error,
            });
          }
        }
      }

      // Log summary
      console.log(
        `[ingestGoofs] Bulk ingestion complete: ${results.length} succeeded, ${errors.length} failed out of ${titlesToProcess.length} total`
      );
      
      // Log first few errors for debugging
      if (errors.length > 0) {
        console.error(
          `[ingestGoofs] First 5 errors:`,
          errors.slice(0, 5).map((e) => `${e.tmdbId}: ${e.error}`)
        );
      }

      return {
        success: true,
        mode: "bulk",
        total: titlesToProcess.length,
        succeeded: results.length,
        failed: errors.length,
        count: results.length,
        testMode: TEST_MODE,
        results,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors to avoid response size limits
        errorSummary: errors.length > 10 
          ? `${errors.length} total errors (showing first 10). Check Firebase logs for full details.`
          : undefined,
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
              "x-admin-token": token,
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
              "x-admin-token": token,
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
