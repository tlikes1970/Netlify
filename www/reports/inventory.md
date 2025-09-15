# TV Tracker - File Inventory Report

## Project Overview
- **Project Type**: Web Application (PWA)
- **Build System**: None (static files in www/)
- **Main Entry**: www/index.html
- **Service Worker**: www/sw.js

## File Statistics

### JavaScript Files
- **Total JS Files**: 101 files
- **Total JS Size**: 1.37 MB (1,440,866 bytes)
- **Average File Size**: ~14.3 KB
- **Largest Files**: 
  - www/index.html (2,865 lines) - Main application file
  - Multiple JS files in www/js/ directory

### CSS Files
- **Total CSS Files**: 7 files
- **Total CSS Size**: 0.34 MB (340 KB)
- **Average File Size**: ~48.6 KB

### HTML Files
- **Total HTML Files**: 12 files
- **Main Files**:
  - www/index.html (2,865 lines) - Main application
  - Various test and feature files

## Directory Structure Analysis

### Core Application (www/)
- **js/**: 20 JavaScript modules
- **styles/**: 7 CSS files
- **scripts/**: 66 JavaScript files (utilities, tests, fixes)
- **features/**: 4 feature-specific files
- **netlify/functions/**: 2 serverless functions

### Backup Directories
- **backups/**: 6 backup versions (v14.3 to v23.78)
- **snapshots/**: 7 snapshot versions
- **_quarantine/**: Experimental and test files

## Code Quality Hotspots

### High-Risk Areas
1. **www/index.html** (2,865 lines) - Monolithic main file
2. **Duplication**: 36.03% code duplication detected
3. **Security**: 8,612 potential security sinks/sources found
4. **Dead Code**: 1,331 unused files identified by knip

### File Size Concerns
- Main index.html is extremely large (2,865 lines)
- Multiple backup directories consuming significant space
- Large number of utility scripts (66 files in scripts/)

## Recommendations
1. **Immediate**: Split monolithic index.html into modules
2. **High Priority**: Remove duplicate code (36% duplication)
3. **Security**: Audit and sanitize 8,612 potential security sinks
4. **Cleanup**: Remove unused files and consolidate backups
5. **Architecture**: Implement proper build system for optimization

## Next Steps
- Phase B: Implement fixes in /staging/ directory
- Focus on P0 issues: infinite loops, event leaks, security sinks
- Bundle optimization and dead code removal
- Accessibility improvements to reach ≥95 score