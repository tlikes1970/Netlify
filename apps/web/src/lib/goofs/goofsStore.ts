/**
 * Process: Goofs Store
 * Purpose: Local data model and storage for goofs/slip-ups per title
 * Data Source: Manual seeding or future admin/editor tools
 * Update Path: Manual admin tools or user contributions (future)
 * Dependencies: localStorage (local), Firestore (future sync)
 */

export interface GoofItem {
  id: string;
  type: "continuity" | "prop" | "crew" | "logic" | "other";
  text: string;
  subtlety?: "blink" | "obvious";
}

export interface GoofSet {
  tmdbId: number | string; // Match existing TMDB id type
  source: "manual" | "user" | "internal";
  lastUpdated: string; // ISO date
  items: GoofItem[];
}

type UnsubscribeFn = () => void;

// Storage key for goofs data
const STORAGE_KEY = "flicklet.goofs.v1";

// In-memory cache
let goofsCache: Record<string, GoofSet> = {};
const listeners: Map<string, Set<(goofs: GoofSet | null) => void>> = new Map();

/**
 * Load goofs from localStorage
 */
function loadFromStorage(): Record<string, GoofSet> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Failed to load goofs from storage:", error);
  }
  return {};
}

/**
 * Save goofs to localStorage
 */
function saveToStorage(data: Record<string, GoofSet>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save goofs to storage:", error);
  }
}

/**
 * Get storage key for a TMDB ID
 */
function getStorageKey(tmdbId: number | string): string {
  return String(tmdbId);
}

/**
 * Initialize cache from storage
 */
function initializeCache(): void {
  goofsCache = loadFromStorage();

  // Always merge seed data (seed data takes precedence if localStorage is empty)
  const seedData = getSeedGoofs();
  let cacheUpdated = false;

  Object.entries(seedData).forEach(([key, goofSet]) => {
    // Only add seed data if it doesn't exist in cache
    // This allows manual overrides in localStorage to persist
    if (!goofsCache[key]) {
      goofsCache[key] = goofSet;
      cacheUpdated = true;
    }
  });

  // Save merged data back if we added any seed data
  if (cacheUpdated) {
    saveToStorage(goofsCache);
  }
}

/**
 * Get goofs for a specific title by TMDB ID
 */
export async function getGoofsForTitle(
  tmdbId: number | string
): Promise<GoofSet | null> {
  const key = getStorageKey(tmdbId);

  // Always ensure cache is initialized
  if (Object.keys(goofsCache).length === 0) {
    initializeCache();
  }

  if (import.meta.env.DEV) {
    console.log(
      `🔍 getGoofsForTitle: Looking for TMDB ID ${tmdbId} (key: ${key})`
    );
    console.log(
      `📦 Cache has ${Object.keys(goofsCache).length} entries:`,
      Object.keys(goofsCache)
    );
  }

  // Check cache first
  if (goofsCache[key]) {
    if (import.meta.env.DEV) {
      console.log(
        `✅ Found goofs in cache for ${key}:`,
        goofsCache[key].items.length,
        "items"
      );
    }
    return goofsCache[key];
  }

  // If not in cache, check seed data as fallback
  const seedData = getSeedGoofs();
  if (seedData[key]) {
    if (import.meta.env.DEV) {
      console.log(
        `✅ Found goofs in seed data for ${key}:`,
        seedData[key].items.length,
        "items"
      );
    }
    // Add to cache for future lookups
    goofsCache[key] = seedData[key];
    saveToStorage(goofsCache);
    return seedData[key];
  }

  // If not in cache or seed data, try fetching from API
  try {
    if (import.meta.env.DEV) {
      console.log(`🌐 Fetching goofs from API for TMDB ID ${tmdbId}`);
    }

    const apiResult = await fetchGoofsFromApi(tmdbId);
    if (apiResult && apiResult.items && apiResult.items.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          `✅ Fetched ${apiResult.items.length} goofs from API for ${key}`
        );
      }
      // Cache the API result
      goofsCache[key] = apiResult;
      saveToStorage(goofsCache);
      // Notify listeners
      notifyListeners(key, apiResult);
      return apiResult;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`❌ Failed to fetch goofs from API:`, error);
    }
    // Don't throw - just return null if API fails
  }

  if (import.meta.env.DEV) {
    console.log(`ℹ️ No goofs found for TMDB ID ${tmdbId}`);
  }

  return null;
}

/**
 * Subscribe to goofs updates for a specific title
 * Returns an unsubscribe function
 */
export function subscribeToGoofs(
  tmdbId: number | string,
  callback: (goofs: GoofSet | null) => void
): UnsubscribeFn {
  const key = getStorageKey(tmdbId);

  // Initialize cache if needed
  if (Object.keys(goofsCache).length === 0) {
    initializeCache();
  }

  // Add listener
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);

  // Get current value (check cache first, then seed data)
  let currentValue = goofsCache[key] || null;
  if (!currentValue) {
    const seedData = getSeedGoofs();
    if (seedData[key]) {
      // Add to cache for future lookups
      goofsCache[key] = seedData[key];
      saveToStorage(goofsCache);
      currentValue = seedData[key];
    } else {
      // Try fetching from API in background
      fetchGoofsFromApi(tmdbId)
        .then((apiResult) => {
          if (apiResult && apiResult.items && apiResult.items.length > 0) {
            goofsCache[key] = apiResult;
            saveToStorage(goofsCache);
            // Notify this callback and any other listeners
            notifyListeners(key, apiResult);
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error("Background API fetch failed:", error);
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
 * Fetch goofs from Netlify function API
 */
async function fetchGoofsFromApi(
  tmdbId: number | string
): Promise<GoofSet | null> {
  try {
    const url = `/api/goofs-fetch?tmdbId=${encodeURIComponent(tmdbId)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }
      return null;
    }

    const data = await response.json();

    // Validate response structure
    if (data && Array.isArray(data.items)) {
      return {
        tmdbId: data.tmdbId || tmdbId,
        source: data.source || "api",
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        items: data.items,
      };
    }

    return null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error fetching goofs from API:", error);
    }
    return null;
  }
}

/**
 * Notify all listeners for a specific key
 */
function notifyListeners(key: string, goofSet: GoofSet | null): void {
  const keyListeners = listeners.get(key);
  if (keyListeners) {
    keyListeners.forEach((callback) => {
      try {
        callback(goofSet);
      } catch (error) {
        console.error("Error in goofs listener callback:", error);
      }
    });
  }
}

/**
 * Seed data for development/testing
 * TODO: Replace with proper admin/editor tool in production
 */
function getSeedGoofs(): Record<string, GoofSet> {
  // Example goofs for popular shows/movies
  // These are manually seeded for testing purposes only
  return {
    // The Office (US) - TMDB ID 2316
    "2316": {
      tmdbId: 2316,
      source: "manual",
      lastUpdated: new Date().toISOString(),
      items: [
        {
          id: "goof-1",
          type: "continuity",
          text: 'In "The Injury" episode, Michael\'s George Foreman grill injury switches sides between shots.',
          subtlety: "obvious",
        },
        {
          id: "goof-2",
          type: "crew",
          text: "Camera crew visible in multiple episodes, especially in warehouse scenes.",
          subtlety: "blink",
        },
        {
          id: "goof-3",
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
          id: "goof-4",
          type: "continuity",
          text: 'In "Pilot", Walt\'s license plate changes between shots.',
          subtlety: "blink",
        },
        {
          id: "goof-5",
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

/**
 * TODO: Future implementation notes
 *
 * When ready to add Firestore sync:
 * 1. Add Firebase import and getCurrentFirebaseUser helper
 * 2. Create Firestore collection: users/{uid}/goofs/{tmdbId}
 * 3. Implement sync functions similar to firebaseSync.ts pattern
 * 4. Add real-time listeners for authenticated users
 * 5. Merge local and cloud data with conflict resolution
 *
 * When ready to add admin/editor tools:
 * 1. Create admin UI for adding/editing goofs
 * 2. Add validation for goof text and type
 * 3. Add moderation workflow for user-submitted goofs
 * 4. Add bulk import from external sources (IMDb, etc.)
 */
