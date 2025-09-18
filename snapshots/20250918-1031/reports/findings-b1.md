# Phase A Analysis - Duplication & Dead Code Findings

## Summary
- **JS Bundle Size**: 1.4 MB (within target of ≤2.0 MB)
- **CSS Bundle Size**: 3.14 MB (exceeds target of ≤0.25 MB - needs optimization)
- **Duplication Rate**: 6.47% (exceeds threshold of 0%)

## Top Duplication Clusters (≥50 tokens)

### 1. TMDB Functions Duplication
- **Files**: `www/functions/tmdb.js` ↔ `www/netlify/functions/tmdb.js`
- **Size**: 356 lines, 3108 tokens
- **Impact**: Complete duplication of API functions
- **Action**: Consolidate to single source

### 2. Feedback Functions Duplication  
- **Files**: `www/functions/feedback.js` ↔ `www/netlify/functions/feedback.js`
- **Size**: 121 lines, 1062 tokens
- **Impact**: Complete duplication of feedback handling
- **Action**: Consolidate to single source

### 3. Audit Tools Duplication
- **Files**: Multiple audit tools with overlapping functionality
- **Key clusters**:
  - `www/tools/run-audit.js` ↔ `www/tools/simple-audit.mjs` (multiple 9-21 line clusters)
  - `www/tools/baseline-summary.mjs` ↔ `www/tools/console-summary.js` (28-18 line clusters)
- **Action**: Consolidate audit tools

### 4. Translation Tools Duplication
- **Files**: Multiple translation scanning/processing tools
- **Key clusters**:
  - `www/critical-translations.js` ↔ `www/simple-translation-scanner.js` (13-14 line clusters)
  - `www/critical-translations.js` ↔ `www/find-missing-translations.js` (14-10 line clusters)
- **Action**: Consolidate translation utilities

### 5. Component Code Duplication
- **Files**: `www/scripts/components/Card.js` (9 lines, 62 tokens)
- **Files**: `www/scripts/components/ActionBar.js` (12 lines, 77 tokens)
- **Action**: Extract common patterns to utilities

### 6. CSS Duplication
- **Files**: `www/styles/mobile.css` (16-17 line clusters)
- **Files**: `www/styles/action-bar.css` (12 line clusters)
- **Action**: Consolidate CSS patterns

## High-Confidence Removals (depcheck/knip)

### Unused Dependencies
- `dotenv` - only used in build scripts, not in main app
- Consider removing if not needed for production

### Unused Files (from knip analysis)
- 1617 unused files detected
- Need manual review of `sw.js` package entry file issue

## Priority Actions for Phase B

1. **High Impact**: Consolidate TMDB and Feedback functions (saves ~4KB)
2. **Medium Impact**: Consolidate audit tools (saves ~2KB)  
3. **Medium Impact**: Consolidate translation tools (saves ~1KB)
4. **Low Impact**: Extract component patterns (saves ~500B)
5. **CSS Optimization**: Reduce CSS bundle from 3.14MB to <0.25MB
6. **File Cleanup**: Remove unused files identified by knip

## Estimated Savings
- **JS Reduction**: ~7.5KB (0.5% of current bundle)
- **CSS Reduction**: ~2.9MB (92% reduction needed)
- **File Count**: ~1000+ unused files can be removed









