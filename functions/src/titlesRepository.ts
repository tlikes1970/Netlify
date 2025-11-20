/**
 * Process: Titles Repository
 * Purpose: Helper functions to read titles from Firestore `/titles` collection for goofs ingestion
 * Data Source: Firestore `/titles` collection
 * Update Path: Admin UI or migration scripts
 * Dependencies: firebase-admin/firestore, ./types/titles
 */

import * as admin from "firebase-admin";
import { TitleDoc, MediaType } from "./types/titles";
import { db } from "./admin";

/**
 * Get all titles from Firestore that are enabled for goofs ingestion
 * Returns titles where enabledForGoofs == true (or missing, which defaults to true)
 */
export async function getTitlesForGoofs(): Promise<TitleDoc[]> {
  try {
    const snapshot = await db
      .collection("titles")
      .where("enabledForGoofs", "==", true)
      .get();

    if (snapshot.empty) {
      console.warn(
        "[titlesRepository] No titles found with enabledForGoofs == true"
      );
      return [];
    }

    const titles: TitleDoc[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const tmdbId = data.tmdbId;

      // Skip titles without tmdbId (required for API calls)
      if (!tmdbId) {
        console.warn(
          `[titlesRepository] Skipping title doc ${doc.id} - missing tmdbId`
        );
        continue;
      }

      titles.push({
        tmdbId: Number(tmdbId),
        title: data.title || "Unknown Title",
        mediaType: (data.mediaType || "movie") as MediaType,
        year: data.year || undefined,
        genres: Array.isArray(data.genres) ? data.genres : [],
        enabledForGoofs: data.enabledForGoofs ?? true,
        lastIngestedAt: data.lastIngestedAt,
      });
    }

    console.log(
      `[titlesRepository] Found ${titles.length} titles enabled for goofs ingestion`
    );
    return titles;
  } catch (error) {
    console.error("[titlesRepository] Error fetching titles:", error);
    throw error;
  }
}

/**
 * Update lastIngestedAt timestamp for a title after successful ingestion
 */
export async function updateLastIngestedAt(
  tmdbId: number,
  timestamp?: admin.firestore.Timestamp
): Promise<void> {
  try {
    const docRef = db.collection("titles").doc(String(tmdbId));
    await docRef.update({
      lastIngestedAt:
        timestamp || admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(
      `[titlesRepository] Updated lastIngestedAt for title ${tmdbId}`
    );
  } catch (error) {
    console.error(
      `[titlesRepository] Error updating lastIngestedAt for ${tmdbId}:`,
      error
    );
    // Don't throw - ingestion should continue even if timestamp update fails
  }
}

