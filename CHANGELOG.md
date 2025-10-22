# Changelog

All notable changes to this project will be documented in this file.

## [Restore - 2025-01-15]

### Restored Features
This release restores the codebase to a "good" state from a 9 PM backup (Jan 15, 2025) with all critical fixes re-applied.

#### Netlify/Vite Monorepo Development
- ✅ Netlify dev command configured: `npm run dev --prefix apps/web -- --port 4173 --strictPort`
- ✅ Functions directory path set to `netlify/functions`
- ✅ Serverless function `send-email.cjs` restored with SendGrid integration
- ✅ Serverless function `tmdb-proxy.cjs` restored for TMDB API proxying

#### Game Cache Busting
- ✅ FlickWord game components restored (`FlickWordGame.tsx`, `FlickWordModal.tsx`)
- ✅ Cache busting utilities implemented (`clearWordCache`, `getFreshWord`, `clearTriviaCache`, `getFreshTrivia`)
- ✅ API provider swaps: Datamuse and Random Word Generator integrated
- ✅ FlickWord CSS sizing rules restored for 375px mobile compatibility

#### API Provider Swaps
- ✅ Daily word API with multiple providers (Datamuse, Random Word Generator)
- ✅ Daily trivia API with OpenTriviaDB integration
- ✅ Fallback mechanisms for API failures

#### Lighthouse Meta/Manifest
- ✅ Meta description, theme-color, and manifest.webmanifest restored
- ✅ Accessibility targets maintained (44px tap targets, proper ARIA)

#### CardV2 Button Sizing
- ✅ Poster click opens TMDB in new tab
- ✅ Square button logic preserved (informational check)
- ✅ TabCard watching move actions restored

#### Discovery Handlers
- ✅ Discovery page uses `Library.upsert` for actions
- ✅ Smart discovery logic removed (no deduplication)
- ✅ Action handlers: `onWant`, `onWatched`, `onNotInterested`

#### Header/Search Refactor
- ✅ HeaderV2 component with three-zone layout
- ✅ UnifiedSearch component with integrated filters
- ✅ AvatarMenu component for user authentication
- ✅ Filters row removed (filters now inside search input)

#### Bottom Nav Layout
- ✅ MobileTabs component with `flex-1` classes for equal width
- ✅ Proper ARIA labels maintained

#### Auth Timing Race
- ✅ `useAuth` hook maintains `loading: true` until `onAuthStateChanged` fires
- ✅ No login modal flash after refresh for authenticated users

#### Settings
- ✅ Pro features enabled by default (`isPro: true`)

### Technical Improvements
- ✅ Automated audit script (`scripts/audit-simple.ps1`) for truth detection
- ✅ TypeScript build errors resolved
- ✅ All unused imports and functions cleaned up
- ✅ Legacy function references removed (`getTodaysWord`, `getTodaysTrivia`)

### Files Created/Modified
- **Created**: `netlify/functions/send-email.cjs`
- **Created**: `netlify/functions/tmdb-proxy.cjs`
- **Created**: `apps/web/src/lib/dailyTriviaApi.ts`
- **Created**: `apps/web/src/components/HeaderV2.tsx`
- **Created**: `apps/web/src/components/UnifiedSearch.tsx`
- **Created**: `apps/web/src/components/AvatarMenu.tsx`
- **Created**: `apps/web/src/styles/flickword.css`
- **Created**: `scripts/audit-simple.ps1`
- **Modified**: `apps/web/src/pages/DiscoveryPage.tsx` (removed smart discovery)
- **Modified**: `apps/web/src/lib/dailyWordApi.ts` (removed legacy functions)
- **Modified**: `apps/web/src/lib/triviaApi.ts` (removed legacy functions)
- **Deleted**: `apps/web/src/hooks/useSmartDiscovery.ts`

### Audit Results
All 22 audit checks pass:
- Netlify Configuration: ✅ 4/4 checks
- FlickWord Components: ✅ 3/3 checks  
- Game Cache Helpers: ✅ 2/2 checks
- TypeScript Cleanup: ✅ 1/1 checks
- Lighthouse Meta Tags: ✅ 1/1 checks
- Card Actions: ✅ 4/4 checks
- Settings: ✅ 1/1 checks
- Discovery: ✅ 2/2 checks
- Header Components: ✅ 2/2 checks
- Mobile Navigation: ✅ 1/1 checks
- Auth System: ✅ 1/1 checks

### Rollback Instructions
If regressions occur, revert this commit or flip feature flags as needed. The audit script can be used to verify the restore state.

---

*This restore was performed using an automated audit script to ensure all critical fixes from the "good" state were properly re-applied.*
