# TMDB Poster Builders Audit Report

## Executive Summary

This audit identified **6 primary poster builder functions** that create TMDB poster `<img>` elements across the Flicklet codebase. All builders use consistent URL patterns but lack responsive `srcset` attributes for optimal mobile performance.

## A) Builders Table

| File | Function | Creates `<img>` | Used By (Surfaces) | Example URL Pattern | Size Used |
|------|----------|-----------------|-------------------|-------------------|-----------|
| `scripts/tmdb-images.js` | `getPosterUrl()` | ✅ (via callers) | All surfaces | `https://image.tmdb.org/t/p/w342/path` | w342 (default) |
| `scripts/components/Card.js` | `Card()` | ✅ | Home curated rows, personalized rows | `https://image.tmdb.org/t/p/w342/path` | w342 |
| `scripts/components/Card.js` | `createCardData()` | ✅ (via Card) | All Card v2 surfaces | `https://image.tmdb.org/t/p/w342/path` | w342 |
| `scripts/rows/personalized.js` | `createCardV2()` | ✅ (via Card) | Personalized rows | `https://image.tmdb.org/t/p/w200/path` | w200 |
| `scripts/rows/personalized.js` | `createLegacyCard()` | ✅ | Personalized rows (fallback) | `https://image.tmdb.org/t/p/w200/path` | w200 |
| `scripts/curated-rows.js` | `TMDB_IMG()` | ✅ | Curated rows | `https://image.tmdb.org/t/p/w342/path` | w342 |
| `scripts/curated-rows.js` | `renderCuratedCard()` | ✅ | Curated rows | `https://image.tmdb.org/t/p/w342/path` | w342 |
| `scripts/currently-watching-preview.js` | `createPreviewCard()` | ✅ | Currently Watching preview | `https://image.tmdb.org/t/p/w200/path` | w200 |
| `scripts/next-up-this-week.js` | `getPosterSrc()` | ✅ | Next Up This Week | `https://image.tmdb.org/t/p/w500/path` | w500 |
| `scripts/inline-script-02.js` | `createShowCard()` | ✅ | Search results, list views | `https://image.tmdb.org/t/p/w200/path` | w200 |

## B) Call Graph

### Primary Poster URL Builder
- **`getPosterUrl()`** (tmdb-images.js)
  - Called by: Card.js, personalized.js, currently-watching-preview.js
  - Fallback: Direct string concatenation in all files

### Card Component System
- **`Card()`** (Card.js) 
  - Called by: personalized.js, curated-rows.js, currently-watching-preview.js
  - Uses: `getPosterUrl()` or direct concatenation

### Legacy Card Builders
- **`createLegacyCard()`** (personalized.js)
  - Called by: personalized.js (fallback when Card v2 disabled)
  - Uses: Direct string concatenation

- **`createShowCard()`** (inline-script-02.js)
  - Called by: updateList() function, search results
  - Uses: `getPosterUrl()` or direct concatenation

### Specialized Builders
- **`TMDB_IMG()`** (curated-rows.js)
  - Called by: curated-rows.js mapCuratedItem()
  - Uses: Direct string concatenation

- **`getPosterSrc()`** (next-up-this-week.js)
  - Called by: next-up-this-week.js renderNextUpRow()
  - Uses: Direct string concatenation

## C) Coverage Summary

### Home Curated Rows
- **Primary**: `renderCuratedCard()` → `TMDB_IMG()` (w342)
- **Fallback**: `Card()` → `getPosterUrl()` (w342)
- **Coverage**: ✅ Complete

### Currently Watching
- **Primary**: `createPreviewCard()` → `getPosterUrl()` (w200)
- **List View**: `createShowCard()` → `getPosterUrl()` (w200)
- **Coverage**: ✅ Complete

### Generic Card Grids
- **Personalized Rows**: `createCardV2()` → `Card()` → `getPosterUrl()` (w200)
- **Search Results**: `createShowCard()` → `getPosterUrl()` (w200)
- **Coverage**: ✅ Complete

### Specialized Rows
- **Next Up This Week**: `getPosterSrc()` (w500)
- **Community Spotlight**: Direct concatenation (w780)
- **Coverage**: ✅ Complete

## D) Patch Plan (img-srcset-01)

### Files to Modify (in order of priority):

1. **`scripts/tmdb-images.js`** - Add `tmdbSrcset()` helper function
2. **`scripts/components/Card.js`** - Update `Card()` function (lines 106-107, 131-132)
3. **`scripts/rows/personalized.js`** - Update `createCardV2()` and `createLegacyCard()` (lines 230-231, 265)
4. **`scripts/curated-rows.js`** - Update `TMDB_IMG()` and `renderCuratedCard()` (lines 109-112, 171)
5. **`scripts/currently-watching-preview.js`** - Update `createPreviewCard()` (lines 439, 498)
6. **`scripts/next-up-this-week.js`** - Update `getPosterSrc()` (lines 113, 118)
7. **`scripts/inline-script-02.js`** - Update `createShowCard()` (lines 2875-2876)

### Helper Function to Add:
```javascript
function tmdbSrcset(path) {
  const b = 'https://image.tmdb.org/t/p';
  return `${b}/w200${path} 200w, ${b}/w300${path} 300w, ${b}/w342${path} 342w, ${b}/w500${path} 500w`;
}
```

### Example URL Patterns Found:
- **w200**: `https://image.tmdb.org/t/p/w200/path` (personalized rows, currently watching)
- **w342**: `https://image.tmdb.org/t/p/w342/path` (curated rows, Card component)
- **w500**: `https://image.tmdb.org/t/p/w500/path` (next up this week)
- **w780**: `https://image.tmdb.org/t/p/w780/path` (community spotlight)

## E) Key Findings

### Consistent URL Building
- All builders use the same base URL: `https://image.tmdb.org/t/p/`
- Path cleaning is handled consistently (removing leading slashes)
- Fallback to placeholder images when no poster_path available

### Size Distribution
- **w200**: Most common (personalized rows, currently watching, search)
- **w342**: Curated rows and Card component
- **w500**: Next Up This Week row
- **w780**: Community spotlight thumbnails

### DOM Insertion Methods
- **innerHTML**: Most common (curated-rows.js, personalized.js)
- **createElement + appendChild**: Card component system
- **Template strings**: All builders use string interpolation

## F) Acceptance Criteria

After implementing `img-srcset-01` patch:

- ✅ At mobile width (~375px), first 8 poster images have naturalWidth/Height >= 2× rendered dimensions
- ✅ No change to layout/sticky-search code or unrelated CSS
- ✅ Lazy-loading, alt attributes, and existing classes remain untouched
- ✅ All 6 primary builders updated with srcset + sizes attributes
- ✅ Consistent `sizes="(max-width: 480px) 148px, 200px"` across all builders

## G) Implementation Notes

### Priority Order:
1. Add `tmdbSrcset()` helper to `tmdb-images.js`
2. Update `getPosterUrl()` to optionally return srcset data
3. Update Card component system (highest usage)
4. Update specialized builders (curated, personalized, currently watching)
5. Update legacy builders (createShowCard, next-up-this-week)

### Testing Strategy:
- Verify mobile viewport (375px) shows crisp images
- Check all row types: curated, personalized, currently watching, next up
- Ensure no layout shifts or broken images
- Validate srcset attributes in browser dev tools

---

**Status**: Ready for implementation
**Next Step**: Await approval with "APPROVED: img-srcset-01"
