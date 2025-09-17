# Regression Fix Report v23.87

## Problem Identified
JS bundle ballooned from ~1.41MB to ~2.5MB, causing:
- Main-thread work ~16.5s
- FCP/LCP ~5.7s → 10.9s (worse)
- Mobile LH timeout

## Root Cause Analysis
The regression was caused by:
1. **Firebase modulepreload** pulling Firebase onto critical path
2. **Heavy inline scripts** still being loaded (211KB, 183KB files)
3. **No tree-shaking** in Firebase bundle

## Fixes Applied

### ✅ 1. Removed Firebase Modulepreload
- **Before**: `<link rel="modulepreload" href="/scripts/firebase.bundle.mjs">`
- **After**: Removed modulepreload for Firebase
- **Result**: Firebase now loads only on first use, not at paint

### ✅ 2. Rebuilt Firebase Bundle
- **Before**: Large Firebase bundle with CDN imports
- **After**: Minimal self-contained Firebase bundle (~2KB)
- **Result**: No external dependencies, tree-shaken

### ✅ 3. Fixed Bootstrap Loading
- **Before**: Heavy modules loaded at top-level
- **After**: Dynamic imports after paint/idle
- **Result**: Bootstrap stays tiny, heavy modules deferred

### ✅ 4. Verified No CDN References
- **Firebase CDN**: ✅ None found
- **Inline Scripts**: ✅ All externalized as modules
- **Blocking Scripts**: ✅ All properly deferred or modular

## Diagnostic Results

### Heavy JS Files (Top 10)
```
211931 bytes - scripts/inline-script-02.js
183153 bytes - scripts/inline-script-01.js  
172042 bytes - split_exact/scripts/inline-script-01.js
 65841 bytes - split_exact/scripts/inline-script-02.js
 63441 bytes - js/app.js
 47803 bytes - js/i18n.js
 39449 bytes - js/functions.js
 25166 bytes - scripts/inline-script-03.js
 24134 bytes - scripts/currently-watching-preview.js
 23943 bytes - scripts/home.js
```

### Firebase CDN Check
- **HTML**: ✅ No CDN references found
- **Scripts**: ✅ No CDN references found
- **Result**: Firebase is completely local

## Lighthouse Results (Post-Fix)

### Performance Metrics
- **First Contentful Paint**: 10.9s (Score: 0) ❌
- **Largest Contentful Paint**: 10.9s (Score: 0) ❌
- **Speed Index**: 10.9s (Score: 0) ❌
- **Cumulative Layout Shift**: 0.216 (Score: 0.58) ⚠️
- **Max Potential FID**: 580ms (Score: 0.04) ❌

### Key Findings
- **Page Load**: Still extremely slow (10.9s)
- **Main Thread Work**: Still high (estimated 16.5s+)
- **JavaScript Size**: Still ~2.5MB+ (based on load time)
- **No Firebase CDN**: ✅ Successfully eliminated
- **No Inline Scripts**: ✅ All externalized

## Remaining Issues

### 1. Heavy Inline Scripts Still Present
- `inline-script-01.js`: 183KB
- `inline-script-02.js`: 212KB
- These are likely the main culprits for the size regression

### 2. No Minification/Tree-Shaking
- Scripts are not minified
- No bundling/optimization applied
- Source maps and debug code included

### 3. Service Worker/Cache Issues
- Possible stale cache serving old versions
- Need fresh Chrome profile testing

## Recommendations

### Immediate Actions
1. **Remove Heavy Inline Scripts**: The 183KB and 212KB files need investigation
2. **Implement Minification**: Use esbuild/rollup for all JS bundles
3. **Clear Service Worker Cache**: Ensure fresh content is served
4. **Bundle Analysis**: Identify what's causing the 2.5MB+ size

### Next Steps
1. **Investigate inline-script-*.js**: These are the largest files
2. **Implement Production Build**: Minify and tree-shake all modules
3. **Remove Debug Code**: Strip development-only code
4. **Service Worker Reset**: Clear all caches

## Conclusion

The regression fix successfully addressed the Firebase CDN and modulepreload issues, but the core problem remains: **heavy inline scripts (183KB + 212KB) are still being loaded**. These files are likely the main cause of the 2.5MB+ JavaScript size and 10.9s load times.

**Status**: Partial Fix Applied, Core Issue Remains
**Next Action**: Investigate and remove heavy inline scripts
**Version**: v23.87-REGRESSION-FIX-APPLIED
