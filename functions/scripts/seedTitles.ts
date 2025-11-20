/**
 * ONE-TIME MIGRATION SCRIPT: Seed Titles Collection from Watchlists
 * 
 * Purpose: Bootstrap the `/titles` Firestore collection by aggregating unique titles
 * from all users' watchlists. This is a one-time migration to populate the canonical
 * titles collection.
 * 
 * Usage:
 *   - Run once via: npx ts-node functions/scripts/seedTitles.ts
 *   - Or deploy as a temporary callable function and call it once, then remove
 * 
 * After running this script, the `/titles` collection will contain all unique titles
 * from user watchlists, which can then be managed via Admin UI.
 * 
 * NOTE: This script should be run ONCE to bootstrap the collection. After that,
 * titles should be managed through the Admin UI or other migration scripts.
 */

import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { TitleDoc } from "../src/types/titles";

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Aggregate unique titles from all users' watchlists
 */
async function aggregateTitlesFromWatchlists(): Promise<
  Map<number, TitleDoc>
> {
  const uniqueTitles = new Map<number, TitleDoc>();

  console.log("[seedTitles] Fetching users...");
  const usersSnapshot = await db.collection("users").limit(500).get();

  console.log(`[seedTitles] Processing ${usersSnapshot.size} users...`);

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
      if (!id) {
        continue;
      }

      const tmdbId = Number(id);
      if (isNaN(tmdbId)) {
        console.warn(
          `[seedTitles] Skipping invalid tmdbId: ${id} for title: ${item.title || "Unknown"}`
        );
        continue;
      }

      // Only add if not already in map (keep first occurrence)
      if (!uniqueTitles.has(tmdbId)) {
        uniqueTitles.set(tmdbId, {
          tmdbId,
          title: item.title || "Unknown Title",
          mediaType:
            (item.media_type || item.mediaType || "movie") === "tv"
              ? "tv"
              : "movie",
          year: item.year
            ? Number(item.year)
            : item.release_date
              ? Number(item.release_date.slice(0, 4))
              : undefined,
          genres: Array.isArray(item.genres) ? item.genres : [],
          enabledForGoofs: true, // Default to enabled
        });
      }
    }
  }

  console.log(
    `[seedTitles] Aggregated ${uniqueTitles.size} unique titles from watchlists`
  );
  return uniqueTitles;
}

/**
 * Seed titles into Firestore `/titles` collection
 */
async function seedTitles() {
  try {
    console.log("[seedTitles] Starting title seeding process...");

    // Aggregate titles from watchlists
    const titlesMap = await aggregateTitlesFromWatchlists();

    if (titlesMap.size === 0) {
      console.warn(
        "[seedTitles] No titles found in watchlists. Nothing to seed."
      );
      return;
    }

    // Write to Firestore in batches (Firestore batch limit is 500)
    const batchSize = 500;
    const titlesArray = Array.from(titlesMap.values());
    let totalWritten = 0;

    for (let i = 0; i < titlesArray.length; i += batchSize) {
      const batch = db.batch();
      const batchTitles = titlesArray.slice(i, i + batchSize);

      for (const title of batchTitles) {
        const docId = String(title.tmdbId);
        const docRef = db.collection("titles").doc(docId);

        // Use set with merge: true to avoid overwriting existing titles
        batch.set(
          docRef,
          {
            tmdbId: title.tmdbId,
            title: title.title,
            mediaType: title.mediaType,
            year: title.year || null,
            genres: title.genres || [],
            enabledForGoofs: title.enabledForGoofs ?? true,
          },
          { merge: true }
        );
      }

      await batch.commit();
      totalWritten += batchTitles.length;
      console.log(
        `[seedTitles] Committed batch: ${totalWritten}/${titlesArray.length} titles`
      );
    }

    console.log(
      `[seedTitles] ✅ Successfully seeded ${totalWritten} titles into Firestore /titles collection`
    );
  } catch (error) {
    console.error("[seedTitles] Error seeding titles:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedTitles()
    .then(() => {
      console.log("[seedTitles] Migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[seedTitles] Migration failed:", error);
      process.exit(1);
    });
}

export { seedTitles };

