/**
 * Process: Titles Schema
 * Purpose: Canonical type definitions for Firestore titles collection
 * Data Source: Firestore `/titles` collection
 * Update Path: Admin UI or migration scripts
 * Dependencies: Firebase Firestore Timestamp type
 */

export type MediaType = "movie" | "tv";

export interface TitleDoc {
  tmdbId: number; // required - TMDB ID used for API calls
  title: string; // display title
  mediaType: MediaType; // "movie" | "tv"
  year?: number; // release year
  genres?: string[]; // array of genre names
  enabledForGoofs?: boolean; // default true if missing - controls whether title is included in goofs ingestion
  lastIngestedAt?: any; // Firestore Timestamp - type varies between client/server SDKs
}

