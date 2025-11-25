# Ratings & Discovery Analysis

## Dependency Graph
1. **Rating storage** → `apps/web/src/lib/storage.ts:updateRating` wraps `ratingSystem` helpers, emits `library:changed` events, and persists `userRating`/`ratingUpdatedAt` in localStorage and Firebase.
2. **Event propagation** → `apps/web/src/hooks/useSmartDiscovery.ts` listens for `library:changed` (ignoring `origin === 'discovery'`) and uses `libraryHash` (which includes rating values and timestamps) plus `recentRatingChanges` to deduplicate refreshes.
3. **Preference analysis** → The hook calls `apps/web/src/lib/smartDiscovery.ts:analyzeUserPreferences` and `analyzeGenrePreferences`, combining watching/wishlist/watched/not lists (with ratings) into `UserPreferences`.
4. **Scoring** → `apps/web/src/lib/smartDiscovery.ts:scoreRecommendation` then weights TMDB `vote_average`, popularity, genre boosts, media-type preferences, and not-interested markings before `getSmartRecommendations` sorts and caches results per user (`recommendationCache`).
5. **UI consumption** → `apps/web/src/pages/DiscoveryPage.tsx` (and other discovery rails) render the cached recommendations while `apps/web/src/components/cards/CardV2.tsx` surfaces the `voteAverage` metadata, linking back to `apps/web/src/hooks/useSmartDiscovery.ts`.
6. **Search adjacency** → `apps/web/src/search/smartSearch.ts`/`rank.ts`/`api.ts`/`enhancedAutocomplete.ts` feed the `DiscoveryPage` search experiences, reusing the same TMDB rating (`voteAverage`) signals, and share the cache (`smartSearch` LRU + `tmdbCache`) to avoid extra fetches.

## Edge Cases (with code references)
1. **Rapid duplicate rating events** – `apps/web/src/lib/ratingSystem.ts` stores recent updates in `recentUpdates` and `apps/web/src/hooks/useSmartDiscovery.ts` maintains `recentRatingChanges` + `RATING_DEDUP_WINDOW_MS` so two identical ratings within 300–500 ms never retrigger discovery.
2. **Stale sync updates skipped** – `apps/web/src/lib/storage.ts:updateRating` ignores ratings when `origin !== 'user'` and the new timestamp is older than `ratingUpdatedAt`, preventing older Firebase writes from overwriting local changes.
3. **Null/undefined ratings drop out** – `apps/web/src/lib/ratingSystem.ts:createRatingUpdate` returns `null` for `rating === null/undefined`, so discovery never sees empty stars, matching UI expectations.
4. **Not-interested penalty** – `apps/web/src/lib/smartDiscovery.ts:scoreRecommendation` immediately sets `score = 0` when an item is flagged via `preferences.notInterestedIds`, ensuring discovery never re-suggests those entries no matter how high their TMDB rating is.
5. **Recommendation cache staleness** – `recommendationCache` (`apps/web/src/lib/smartDiscovery.ts`) keeps results for 5 minutes (`CACHE_TTL_MS`), so a new rating must wait up to that period before discovery re-fetches even if nothing else changes.
6. **Cold-start prior** – When fewer than `MIN_SAMPLE_SIZE` (5) ratings exist, `analyzeUserPreferences` blends the user average with a 3.0 prior, ensuring discovery has a neutral baseline rather than noisy sparse ratings.
7. **Genre preferences remain empty** – Although `analyzeUserPreferences` defines `favoriteGenres`, it never populates them (the `genreCounts`/`genreRatings` loops are commented or unused), so the genre-weighted branch of `scoreRecommendation` never fires unless `analyzeGenrePreferences` runs later.
8. **Genre fetch timeout/invalid IDs** – `apps/web/src/lib/smartDiscovery.ts:analyzeGenrePreferences` aborts after 8 seconds (`AbortController`) and silently skips invalid genre IDs, leaving the downstream boost empty if TMDB is slow or returns malformed data.
9. **Duplicate search entries demoted** – The demotion step in `apps/web/src/search/smartSearch.ts` lowers `score` by 40 for non-canonical exact matches, ensuring high-rated duplicates don’t crowd the top of discovery/search results.
10. **Missing poster/voteAverage skipped** – `getSmartRecommendations` drops candidates lacking `poster_path`, and `scoreRecommendation` clamps `vote_average` to 0 when undefined, so poor metadata doesn’t crash discovery scoring.
11. **Identical rating updates suppressed** – `useSmartDiscovery` tracks `lastUpdateRef` to skip events that repeat the same rating for the same `itemKey` within the dedup window, so rapid re-renders of the star control do not re-trigger expensive fetches.
12. **Search scoring handles missing vote data** – `apps/web/src/search/rank.ts` clamps `(voteAverage??0)/10` and multiplies by `voteCount`–derived signals; missing TMDB ratings degrade gracefully to 0 without NaNs or crashes.

## Dead/Partial Fixes
- `apps/web/src/lib/smartDiscovery.ts` defines `const genreCounts`/`genreRatings` (commented as “Unused”) and never fills `favoriteGenres`, preventing the genre-weighted branch from ever triggering—a leftover partial fix for genre scoring.
- The `// Bonus for content similar to highly-rated items` comment in `scoreRecommendation` acknowledges a planned similarity boost that remains unimplemented, leaving a dead code path.
- `RatingState` includes `'zero'` (`apps/web/src/lib/ratingSystem.ts:RatingState`) even though `normalizeRating` clamps the scale to 1–5, meaning the zero state is unreachable and likely a vestige of an older flow.
- `recommendationCache` hashes `favoriteGenres`, but because that object stays empty, the cache key never reflects subtle rating-only changes; discovery refreshes therefore rely only on `userRating`/`list` hash updates.

## Discovery Refresh Confirmation
- Every rating update flows through `storage.updateRating` → `window.dispatchEvent(new CustomEvent('library:changed', { operation: 'rating', rating }))`.
- `useSmartDiscovery` listens for that event, updates `_ratingVersion`, recomputes `libraryHash` (which includes `userRating` strings), and re-runs the effect that calls `getSmartRecommendations`.
- The `libraryHash` dependency ensures that even if the rating comes from a sync or a different list, a change in the rating value (or timestamp) triggers a new fetch, so discovery recalculates whenever ratings mutate.

## Caching & Fallback Layers
- `recommendationCache` (per user + `preferencesHash`) plus `smartDiscovery`’s `CACHE_TTL_MS` (5 minutes) throttle backend hits while `tmdbCache` (LRU 5 min TTL in `smartSearch`) deduplicates search endpoints.
- `fetchTMDBWithCircuitBreaker` handles TMDB failures by backoff and eventually returning empty results, letting discovery gracefully show nothing rather than fail hard.
- `scoreRecommendation` ensures outliers (no poster, missing rating, not interested) are filtered before ranking, so discovery never surfaces unsupported items.

