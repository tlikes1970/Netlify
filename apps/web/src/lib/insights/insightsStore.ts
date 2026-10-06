import { languageManager } from "../language";
import type { Language } from "../language.types";
import spanishInsights from "../../data/insightTranslations.json";
/** Shows Like This observations: existing Firestore content, localized local cache and seed fallback. */
export interface InsightItem {
  id: string;
  type: "continuity" | "prop" | "crew" | "logic" | "style" | "world" | "other"; // Extended categories
  kind?: "insight" | "easterEgg" | "pattern"; // New: distinguishes insight types
  translations?: Partial<Record<Language, string>>;
  textLanguage?: Language;
  text: string; // Original, template-generated text (not scraped from external sources)
  subtlety?: "blink" | "obvious";
}

export interface InsightsSet {
  tmdbId: number | string; // Match existing TMDB id type
  source: "auto" | "admin" | "mixed" | "manual" | "user" | "internal"; // Extended sources
  lastUpdated: string; // ISO date
  items: InsightItem[];
}

type UnsubscribeFn = () => void;

// Storage key for insights data
const STORAGE_KEY = "flicklet.insights.v1";
// Read-only migration input for existing cached/manual Shows Like This observations.
const LEGACY_STORAGE_KEY = "flicklet.goofs.v1";

// In-memory cache
let insightsCache: Record<string, InsightsSet> = {};
const listeners: Map<string, Set<(insights: InsightsSet | null) => void>> = new Map();

/**
 * Load insights from localStorage
 */
function loadFromStorage(): Record<string, InsightsSet> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Failed to load insights from storage:", error);
  }
  return {};
}

/**
 * Save insights to localStorage
 */
function saveToStorage(data: Record<string, InsightsSet>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save insights to storage:", error);
  }
}

/**
 * Get storage key for a TMDB ID
 */
function getStorageKey(tmdbId: number | string, language: Language): string {
  return `${language}:${tmdbId}`;
}

/**
 * Initialize cache from storage
 */
function initializeCache(): void {
  insightsCache = loadFromStorage();
  // Retain older cached/manual observations and give their display copies a locale.
  for (const [key, value] of Object.entries(insightsCache)) {
    if (key.includes(":") || !Array.isArray(value?.items)) continue;
    for (const language of ["en", "es"] as const) {
      const localizedKey = getStorageKey(value.tmdbId ?? key, language);
      insightsCache[localizedKey] ??= { ...value, items: localizeInsightItems(value.items, language) };
    }
  }

  // Always merge seed data (seed data takes precedence if localStorage is empty)
  const seedData = { ...getSeedInsights("en"), ...getSeedInsights("es") };
  let cacheUpdated = localStorage.getItem(STORAGE_KEY) === null && localStorage.getItem(LEGACY_STORAGE_KEY) !== null;

  Object.entries(seedData).forEach(([key, insightsSet]) => {
    // Only add seed data if it doesn't exist in cache
    // This allows manual overrides in localStorage to persist
    if (!insightsCache[key]) {
      insightsCache[key] = insightsSet;
      cacheUpdated = true;
    }
  });

  // Save merged data back if we added any seed data
  if (cacheUpdated) {
    saveToStorage(insightsCache);
  }
}

/**
 * Get insights for a specific title by TMDB ID
 */
export async function getInsightsForTitle(
  tmdbId: number | string,
  language: Language = languageManager.getLanguage()
): Promise<InsightsSet | null> {
  const key = getStorageKey(tmdbId, language);

  // Always ensure cache is initialized
  if (Object.keys(insightsCache).length === 0) {
    initializeCache();
  }

  if (import.meta.env.DEV) {
    console.log(
      `🔍 getInsightsForTitle: Looking for TMDB ID ${tmdbId} (key: ${key})`
    );
    console.log(
      `📦 Cache has ${Object.keys(insightsCache).length} entries:`,
      Object.keys(insightsCache)
    );
  }

  // Check cache first
  if (insightsCache[key]) {
    if (import.meta.env.DEV) {
      console.log(
        `✅ Found insights in cache for ${key}:`,
        insightsCache[key].items.length,
        "items"
      );
    }
    return insightsCache[key];
  }

  // If not in cache, check seed data as fallback
  const seedData = getSeedInsights(language);
  if (seedData[key]) {
    if (import.meta.env.DEV) {
      console.log(
        `✅ Found insights in seed data for ${key}:`,
        seedData[key].items.length,
        "items"
      );
    }
    // Add to cache for future lookups
    insightsCache[key] = seedData[key];
    saveToStorage(insightsCache);
    return seedData[key];
  }

  // If not in cache or seed data, try fetching from Firestore
  try {
    if (import.meta.env.DEV) {
      console.log(`🌐 Fetching insights from Firestore for TMDB ID ${tmdbId}`);
    }

    const firestoreResult = await fetchInsightsFromFirestore(tmdbId, language);
    if (
      firestoreResult &&
      firestoreResult.items &&
      firestoreResult.items.length > 0
    ) {
      if (import.meta.env.DEV) {
        console.log(
          `✅ Fetched ${firestoreResult.items.length} insights from Firestore for ${key}`
        );
      }
      // Cache the Firestore result
      insightsCache[key] = firestoreResult;
      saveToStorage(insightsCache);
      // Notify listeners
      notifyListeners(key, firestoreResult);
      return firestoreResult;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`❌ Failed to fetch insights from Firestore:`, error);
    }
    // Don't throw - just return null if Firestore read fails
  }

  if (import.meta.env.DEV) {
    console.log(`ℹ️ No insights found for TMDB ID ${tmdbId}`);
  }

  return null;
}

/**
 * Subscribe to insights updates for a specific title
 * Returns an unsubscribe function
 */
export function subscribeToInsights(
  tmdbId: number | string,
  callback: (insights: InsightsSet | null) => void,
  language: Language = languageManager.getLanguage()
): UnsubscribeFn {
  const key = getStorageKey(tmdbId, language);

  // Initialize cache if needed
  if (Object.keys(insightsCache).length === 0) {
    initializeCache();
  }

  // Add listener
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);

  // Get current value (check cache first, then seed data)
  let currentValue = insightsCache[key] || null;
  if (!currentValue) {
    const seedData = getSeedInsights(language);
    if (seedData[key]) {
      // Add to cache for future lookups
      insightsCache[key] = seedData[key];
      saveToStorage(insightsCache);
      currentValue = seedData[key];
    } else {
      // Try fetching from Firestore in background
      fetchInsightsFromFirestore(tmdbId, language)
        .then((firestoreResult) => {
          if (
            firestoreResult &&
            firestoreResult.items &&
            firestoreResult.items.length > 0
          ) {
            insightsCache[key] = firestoreResult;
            saveToStorage(insightsCache);
            // Notify this callback and any other listeners
            notifyListeners(key, firestoreResult);
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error("Background Firestore fetch failed:", error);
          }
        });
    }
  }

  // Immediately call with current value (or null if not found)
  callback(currentValue);

  // Return unsubscribe function
  return () => {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.delete(callback);
      if (keyListeners.size === 0) {
        listeners.delete(key);
      }
    }
  };
}

/**
 * Fetch insights from Firestore
 * User path: reads only from Firestore (with localStorage cache)
 * No external API calls for user-facing features
 */
async function fetchInsightsFromFirestore(
  tmdbId: number | string,
  language: Language = languageManager.getLanguage()
): Promise<InsightsSet | null> {
  try {
    // Import Firestore dynamically to avoid issues if Firebase isn't initialized
    const { db } = await import("../firebaseBootstrap");
    const { doc, getDoc } = await import("firebase/firestore");

    if (!db) {
      if (import.meta.env.DEV) {
        console.warn("Firestore not available, skipping Firestore read");
      }
      return null;
    }
    const tmdbIdStr = String(tmdbId);
    const insightsRef = doc(db, "insights", tmdbIdStr);
    const snapshot = await getDoc(insightsRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && Array.isArray(data.items)) {
        const insightsSet: InsightsSet = {
          tmdbId: data.tmdbId || tmdbId,
          source: data.source || "auto",
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          items: localizeInsightItems(data.items, language),
        };

        // Cache in localStorage
        const key = getStorageKey(tmdbId, language);
        insightsCache[key] = insightsSet;
        saveToStorage(insightsCache);

        if (import.meta.env.DEV) {
          console.log(
            `✅ Fetched ${insightsSet.items.length} insights from Firestore for ${key}`
          );
        }
        return insightsSet;
      }
    }

    return null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error fetching insights from Firestore:", error);
    }
    return null;
  }
}

/**
 * Notify all listeners for a specific key
 */
function notifyListeners(key: string, insightsSet: InsightsSet | null): void {
  const keyListeners = listeners.get(key);
  if (keyListeners) {
    keyListeners.forEach((callback) => {
      try {
        callback(insightsSet);
      } catch (error) {
        console.error("Error in insights listener callback:", error);
      }
    });
  }
}

/**
 * Seed data for development/testing
 * Existing observations are retained as the current fallback.
 * This seed data is only used as a fallback for development/testing.
 */
function getRawSeedInsights(): Record<string, InsightsSet> {
  // Example insights for popular shows/movies
  // These are manually seeded for testing purposes only
  return {
    // The Office (US) - TMDB ID 2316
    "2316": {
      tmdbId: 2316,
      source: "manual",
      lastUpdated: new Date().toISOString(),
      items: [
        {
          id: "insight-1",
          type: "continuity",
          text: 'In "The Injury" episode, Michael\'s George Foreman grill injury switches sides between shots.',
          subtlety: "obvious",
        },
        {
          id: "insight-2",
          type: "crew",
          text: "Camera crew visible in multiple episodes, especially in warehouse scenes.",
          subtlety: "blink",
        },
        {
          id: "insight-3",
          type: "prop",
          text: "The \"World's Best Boss\" mug appears and disappears from Michael's desk inconsistently.",
          subtlety: "obvious",
        },
      ],
    },
    // Breaking Bad - TMDB ID 1396
    "1396": {
      tmdbId: 1396,
      source: "manual",
      lastUpdated: new Date().toISOString(),
      items: [
        {
          id: "insight-4",
          type: "continuity",
          text: 'In "Pilot", Walt\'s license plate changes between shots.',
          subtlety: "blink",
        },
        {
          id: "insight-5",
          type: "logic",
          text: "The timeline for Jesse's RV location doesn't always match established geography.",
          subtlety: "obvious",
        },
      ],
    },
  };
}

// Initialize on module load
if (typeof window !== "undefined") {
  initializeCache();
}

export function localizeInsightItems(items: InsightItem[], language: Language): InsightItem[] {
  const known = spanishInsights as Record<string, string>;
  return items.map(item => {
    const translated = item.translations?.[language] || (language === "es" ? known[item.text] : undefined);
    return { ...item, text: translated || item.text, textLanguage: translated ? language : item.textLanguage };
  });
}
function getSeedInsights(language: Language): Record<string, InsightsSet> {
  return Object.fromEntries(Object.entries(getRawSeedInsights()).map(([id, set]) => [getStorageKey(id, language), { ...set, items: localizeInsightItems(set.items, language) }]));
}
