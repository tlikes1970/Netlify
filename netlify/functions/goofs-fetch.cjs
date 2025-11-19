/**
 * Netlify Function: Generate Insights & Easter Eggs for a Movie/TV Show
 *
 * This function generates original "Insights & Easter Eggs" content from Flicklet's own metadata.
 * Content is generated using templates + metadata (title, type, genres, runtime, etc.),
 * NOT from external copyrighted sources.
 *
 * SECURITY: Admin-only function. Requires x-admin-token header matching GOOFS_INGESTION_ADMIN_TOKEN env var.
 *
 * Query Parameters (GET):
 * - tmdbId: TMDB ID of the movie/show (required)
 *
 * Body Parameters (POST):
 * - tmdbId: TMDB ID (required)
 * - metadata: Object containing title metadata (title, mediaType, genres, year, runtime, etc.)
 * - bulk: Optional boolean. If true, processes multiple titles (for bulk ingestion)
 * - titles: Optional array of title objects for bulk ingestion
 *
 * Returns: JSON with generated InsightsSet and summary
 *
 * NOTE: This feature generates original content from Flicklet's own metadata + templates.
 * No external copyrighted blooper/goof text is used.
 *
 * DATA FLOW:
 * - Admin triggers ingestion via Admin UI (Firebase callable function wrapper)
 * - Function validates admin token, fetches/transforms data, writes to Firestore
 * - Clients read only from Firestore via goofsStore.ts (no direct external API calls)
 *
 * FUTURE AUTOMATION:
 * - This function is idempotent (safe to run multiple times with merge: true)
 * - Can be scheduled via Netlify Scheduled Functions or Cloud Scheduler
 * - To schedule: Create a Netlify scheduled function that calls this endpoint with admin token
 * - Example: Run nightly/weekly to refresh insights for popular titles
 * - Environment variable GOOFS_INGESTION_ADMIN_TOKEN must be set in Netlify
 */

// Initialize Firebase Admin (lazy)
let admin = null;
let database = null;

function initFirebase() {
  if (admin && database) return { admin, db: database };

  try {
    admin = require("firebase-admin");

    // Check if already initialized
    if (admin.apps.length === 0) {
      // Try to initialize with service account JSON from env
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Try application default credentials (for Netlify/Cloud environments)
        admin.initializeApp({
          projectId: process.env.GCLOUD_PROJECT || "flicklet-71dff",
        });
      }
    }

    database = admin.firestore();
    return { admin, db: database };
  } catch (error) {
    console.error("[goofs-fetch] Firebase Admin init error:", error.message);
    return { admin: null, db: null };
  }
}

const cors = (contentType = "application/json") => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-admin-token, X-Admin-Token",
  "Content-Type": contentType,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
});

/**
 * Admin token authentication
 * Validates x-admin-token header against GOOFS_INGESTION_ADMIN_TOKEN env var
 */
const ADMIN_TOKEN = process.env.GOOFS_INGESTION_ADMIN_TOKEN;

function isAuthorized(event) {
  if (!ADMIN_TOKEN) {
    console.warn(
      "[goofs-fetch] GOOFS_INGESTION_ADMIN_TOKEN not set - allowing all requests (INSECURE)"
    );
    // In production, this should return false, but for backward compatibility during migration:
    return true;
  }

  const header =
    event.headers?.["x-admin-token"] || event.headers?.["X-Admin-Token"];
  if (!header) {
    return false;
  }

  return header === ADMIN_TOKEN;
}

/**
 * Generate Insights & Easter Eggs from metadata using templates
 * All content is original, generated from metadata - no external copyrighted text
 */
function buildInsightsForTitle(meta) {
  const items = [];
  const tmdbId = String(meta.tmdbId || meta.id);
  const mediaType = meta.mediaType || meta.type || "movie";
  const genres = Array.isArray(meta.genres) ? meta.genres : [];
  const genreNames = new Set(
    genres.map((g) =>
      typeof g === "string" ? g.toLowerCase() : (g.name || "").toLowerCase()
    )
  );
  const year = meta.year || meta.releaseDate?.slice(0, 4) || null;
  const runtime = meta.runtimeMins || meta.runtime || null;
  const episodeCount = meta.episodeCount || null;
  const seasonCount = meta.seasonCount || null;
  const title = meta.title || "this title";

  // Genre-based insights
  if (genreNames.has("comedy")) {
    items.push({
      id: `insight-comedy-${tmdbId}-${Date.now()}`,
      kind: "insight",
      type: "style",
      text: `This comedy often hides jokes in the background—pay attention to signs, props, and extras for subtle humor.`,
      subtlety: "blink",
    });
  }

  if (genreNames.has("drama")) {
    items.push({
      id: `insight-drama-${tmdbId}-${Date.now()}`,
      kind: "insight",
      type: "style",
      text: `Dramatic moments are often built through careful pacing—notice how scenes linger before key revelations.`,
      subtlety: "obvious",
    });
  }

  if (genreNames.has("sci-fi") || genreNames.has("science fiction")) {
    items.push({
      id: `insight-scifi-${tmdbId}-${Date.now()}`,
      kind: "easterEgg",
      type: "world",
      text: `Science fiction world-building often includes subtle visual details that hint at larger lore—keep an eye on background elements and set design.`,
      subtlety: "blink",
    });
  }

  if (genreNames.has("horror")) {
    items.push({
      id: `insight-horror-${tmdbId}-${Date.now()}`,
      kind: "insight",
      type: "style",
      text: `Horror often uses sound design and framing to build tension—listen for recurring musical themes or visual patterns that signal important moments.`,
      subtlety: "obvious",
    });
  }

  if (genreNames.has("fantasy")) {
    items.push({
      id: `insight-fantasy-${tmdbId}-${Date.now()}`,
      kind: "easterEgg",
      type: "world",
      text: `Fantasy worlds often have consistent rules and symbols—watch for recurring motifs, objects, or locations that carry deeper meaning.`,
      subtlety: "blink",
    });
  }

  if (genreNames.has("crime") || genreNames.has("thriller")) {
    items.push({
      id: `insight-crime-${tmdbId}-${Date.now()}`,
      kind: "pattern",
      type: "logic",
      text: `Crime and thriller narratives often plant clues early—pay attention to seemingly minor details that might become important later.`,
      subtlety: "blink",
    });
  }

  // Media type insights
  if (mediaType === "tv" && episodeCount && episodeCount > 10) {
    items.push({
      id: `pattern-series-${tmdbId}-${Date.now()}`,
      kind: "pattern",
      type: "logic",
      text: `Across the season, you may notice certain character habits or locations repeating as quiet callbacks to earlier episodes.`,
      subtlety: "blink",
    });

    if (seasonCount && seasonCount > 1) {
      items.push({
        id: `pattern-multi-season-${tmdbId}-${Date.now()}`,
        kind: "insight",
        type: "logic",
        text: `Multi-season shows often develop recurring visual motifs—watch for objects, colors, or settings that appear across different seasons.`,
        subtlety: "blink",
      });
    }
  }

  if (mediaType === "tv" && episodeCount && episodeCount <= 10) {
    items.push({
      id: `insight-limited-${tmdbId}-${Date.now()}`,
      kind: "insight",
      type: "style",
      text: `Limited series often have tighter narrative arcs—each episode likely contributes to a larger story, so pay attention to how scenes connect.`,
      subtlety: "obvious",
    });
  }

  if (mediaType === "movie" && runtime) {
    if (runtime > 150) {
      items.push({
        id: `insight-epic-${tmdbId}-${Date.now()}`,
        kind: "insight",
        type: "style",
        text: `Epic-length films often use extended sequences to build atmosphere—notice how pacing and visual composition contribute to the overall experience.`,
        subtlety: "obvious",
      });
    } else if (runtime < 90) {
      items.push({
        id: `insight-tight-${tmdbId}-${Date.now()}`,
        kind: "insight",
        type: "style",
        text: `Shorter films often pack a lot into each scene—watch for efficient storytelling and visual economy.`,
        subtlety: "obvious",
      });
    }
  }

  // Year-based insights (decade patterns)
  if (year) {
    const decade = Math.floor(Number.parseInt(year) / 10) * 10;
    if (decade >= 2020) {
      items.push({
        id: `insight-modern-${tmdbId}-${Date.now()}`,
        kind: "insight",
        type: "style",
        text: `Modern productions often blend practical and digital effects seamlessly—see if you can spot where real sets transition to digital environments.`,
        subtlety: "blink",
      });
    } else if (decade >= 2000 && decade < 2020) {
      items.push({
        id: `insight-2000s-${tmdbId}-${Date.now()}`,
        kind: "easterEgg",
        type: "style",
        text: `Early 2000s productions often have distinctive visual styles—notice the color grading and camera work characteristic of this era.`,
        subtlety: "blink",
      });
    }
  }

  // Ensemble cast insight (if we can infer from episode count or other signals)
  if (mediaType === "tv" && episodeCount && episodeCount > 20) {
    items.push({
      id: `insight-ensemble-${tmdbId}-${Date.now()}`,
      kind: "insight",
      type: "style",
      text: `Long-running series often use ensemble storytelling—watch how different characters take turns driving the narrative forward.`,
      subtlety: "obvious",
    });
  }

  // Ensure we have at least 3-5 items, add generic ones if needed
  if (items.length < 3) {
    items.push({
      id: `insight-generic-1-${tmdbId}-${Date.now()}`,
      kind: "insight",
      type: "style",
      text: `Pay attention to how scenes transition—editing choices often reveal narrative priorities and emotional beats.`,
      subtlety: "obvious",
    });

    items.push({
      id: `easter-egg-generic-${tmdbId}-${Date.now()}`,
      kind: "easterEgg",
      type: "world",
      text: `Background details often tell their own stories—keep an eye on props, set decoration, and background action for hidden layers.`,
      subtlety: "blink",
    });
  }

  // Limit to 8 items max
  return items.slice(0, 8);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors("text/plain"), body: "" };
  }

  // Admin authentication check
  if (!isAuthorized(event)) {
    console.warn(
      "[goofs-fetch] Unauthorized request - missing or invalid admin token"
    );
    return {
      statusCode: 401,
      headers: cors(),
      body: JSON.stringify({
        error: "Unauthorized",
        message: "Admin token required",
      }),
    };
  }

  const { admin: adminInstance, db: firestore } = initFirebase();

  // Parse request
  let tmdbId = null;
  let metadata = null;

  if (event.httpMethod === "GET") {
    const qs = event.queryStringParameters || {};
    tmdbId = qs.tmdbId || qs.tmdb_id;
  } else if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      tmdbId = body.tmdbId || body.tmdb_id;
      metadata = body.metadata || null;
    } catch (error) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({
          error: "Invalid JSON body",
          message: error.message,
        }),
      };
    }
  } else {
    return {
      statusCode: 405,
      headers: cors(),
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!tmdbId) {
    return {
      statusCode: 400,
      headers: cors(),
      body: JSON.stringify({
        error: "Missing required parameter",
        message: 'Provide "tmdbId" in query (GET) or body (POST)',
      }),
    };
  }

  try {
    const tmdbIdString = String(tmdbId);

    // If metadata not provided, try to read from Firestore (if we have a titles collection)
    // For now, we require metadata to be passed in
    if (!metadata) {
      // Try to read from a potential Firestore collection (optional)
      if (firestore) {
        try {
          const titleDocument = await firestore
            .collection("titles")
            .doc(tmdbIdString)
            .get();
          if (titleDocument.exists) {
            metadata = { tmdbId: tmdbId, ...titleDocument.data() };
          }
        } catch (error) {
          // Collection might not exist, that's okay
          console.log(
            "[goofs-fetch] No titles collection or error reading:",
            error.message
          );
        }
      }

      // If still no metadata, return error asking for it
      if (!metadata) {
        return {
          statusCode: 400,
          headers: cors(),
          body: JSON.stringify({
            error: "Metadata required",
            message:
              'Provide "metadata" object in POST body with title, mediaType, genres, etc.',
          }),
        };
      }
    }

    // Ensure tmdbId is in metadata
    metadata.tmdbId = metadata.tmdbId || tmdbId;
    metadata.id = metadata.id || tmdbId;

    // Generate insights
    const items = buildInsightsForTitle(metadata);

    const insightsSet = {
      tmdbId: tmdbIdString,
      source: "auto",
      lastUpdated: new Date().toISOString(),
      items: items,
    };

    // Write to Firestore (idempotent - using merge: true to allow safe re-runs)
    if (firestore) {
      try {
        await firestore
          .collection("insights")
          .doc(tmdbIdString)
          .set(
            {
              ...insightsSet,
              updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true } // Idempotent: safe to run multiple times
          );
        console.log(
          `[goofs-fetch] Wrote ${items.length} insights to Firestore for TMDB ID ${tmdbIdString}`
        );
      } catch (firestoreError) {
        console.error(
          "[goofs-fetch] Firestore write error:",
          firestoreError.message
        );
        // Continue anyway - return the generated insights even if Firestore write fails
      }
    } else {
      console.warn("[goofs-fetch] Firestore not available, skipping write");
    }

    return {
      statusCode: 200,
      headers: {
        ...cors(),
        "Cache-Control": "no-cache", // Don't cache generated content
      },
      body: JSON.stringify({
        success: true,
        tmdbId: tmdbIdString,
        itemsGenerated: items.length,
        insights: insightsSet,
      }),
    };
  } catch (error) {
    console.error("[goofs-fetch] Error generating insights:", error);
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({
        error: "Failed to generate insights",
        message: error.message || String(error),
      }),
    };
  }
};
