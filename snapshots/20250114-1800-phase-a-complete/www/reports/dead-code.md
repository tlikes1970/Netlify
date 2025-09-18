# TV Tracker - Dead Code Analysis

## Executive Summary
- **Unused Files**: 1,331 files identified by knip
- **Missing Dependencies**: 1 dependency (dotenv)
- **Package Entry Issue**: sw.js not found as package entry
- **Status**: CRITICAL - Significant cleanup required

## Dependency Analysis (depcheck)

### Dependencies Status
- **Total Dependencies**: 8
- **Total Dev Dependencies**: 12
- **Missing Dependencies**: 1
- **Invalid Files**: 0
- **Invalid Directories**: 0

### Missing Dependencies
- **dotenv**: Required by scripts/build-config.js
  - **Impact**: Build configuration may fail
  - **Action**: Add to dependencies or remove usage

### Dependencies in Use
- **@playwright/test**: Used in playwright.config.ts
- **dotenv**: Used in scripts/build-config.js

## Unused Files Analysis (knip)

### Critical Findings
- **1,331 unused files** identified
- **Package entry file not found**: sw.js
- **Configuration needed**: knip.json with workspaces["."] object

### File Categories (Estimated)
1. **Backup Files**: Multiple backup directories
2. **Test Files**: Various test and debug files
3. **Experimental Files**: _quarantine directory contents
4. **Snapshot Files**: Multiple snapshot versions
5. **Utility Scripts**: One-off scripts and fixes

## Detailed Analysis

### Backup Directories (High Priority)
- **backups/**: 6 backup versions
  - backup_v14.3_20250908_165215/
  - backup_v14.4_card_standardization_20250908_171454/
  - backup_v14.5_home_layout_v2_20250908_175130/
  - backup_v23.25_duplicate_fix_20250912_1051/
  - backup_v23.78_before_merge_20250112_093800/
  - backup_v23.78_before_merge_20250112_093803/
  - backup_v23.78_before_merge_20250914_093719/

### Snapshot Directories (Medium Priority)
- **snapshots/**: 7 snapshot versions
  - 20250112-1215/
  - 20250112-1220-phase-b-complete/
  - 20250112-1400/
  - 20250112-1415/
  - 20250112-1500/
  - 20250112-1600/
  - 20250112-1700/

### Quarantine Directory (Low Priority)
- **_quarantine/**: Experimental and test files
  - backups/
  - experiments/
  - root_misc/
  - tests_pages/

### Utility Scripts (Medium Priority)
- **www/scripts/**: 66 files
  - Various utility and test scripts
  - One-off fixes and implementations
  - Debug and verification scripts

## Impact Assessment

### Storage Impact
- **Estimated Space Savings**: 50-70% reduction possible
- **Current Project Size**: Large due to duplicates
- **Cleanup Potential**: Significant

### Maintenance Impact
- **Confusion**: Multiple versions of same files
- **Security Risk**: Unused files may contain vulnerabilities
- **Build Time**: Slower builds due to scanning unused files

### Performance Impact
- **IDE Performance**: Slower file indexing
- **Search Performance**: Slower code search
- **Deployment Size**: Larger deployment packages

## Recommendations

### Immediate Actions (P0)
1. **Remove Backup Directories**: Keep only latest backup
2. **Clean Snapshot Directories**: Keep only essential snapshots
3. **Fix Package Entry**: Update package.json to point to correct entry
4. **Add Missing Dependency**: Add dotenv to package.json

### Short-term Actions (P1)
1. **Consolidate Utility Scripts**: Merge related scripts
2. **Remove Test Files**: Keep only essential tests
3. **Clean Quarantine Directory**: Remove experimental files
4. **Create knip.json**: Configure knip properly

### Long-term Actions (P2)
1. **Implement Build System**: Proper build process
2. **Module Organization**: Better file structure
3. **Version Control Strategy**: Proper backup strategy
4. **Documentation**: Document file purposes

## Cleanup Plan

### Phase 1: Critical Cleanup (Target: 60% reduction)
- Remove all backup directories except latest
- Remove all snapshot directories except latest
- Fix package.json entry point
- Add missing dependencies

### Phase 2: Utility Cleanup (Target: 20% reduction)
- Consolidate utility scripts
- Remove duplicate test files
- Clean quarantine directory
- Remove one-off scripts

### Phase 3: Structure Cleanup (Target: 20% reduction)
- Implement proper build system
- Organize files by purpose
- Create proper documentation
- Establish file naming conventions

## Files to Keep
1. **Core Application**: www/index.html, www/js/, www/styles/
2. **Essential Scripts**: Build and deployment scripts
3. **Configuration**: package.json, manifest.json, netlify.toml
4. **Documentation**: README.md, VERSION_HISTORY.md
5. **Latest Backup**: One recent backup for rollback

## Files to Remove
1. **Old Backups**: All but latest backup
2. **Snapshots**: All but latest snapshot
3. **Test Files**: Non-essential test files
4. **Experimental Files**: _quarantine contents
5. **Duplicate Scripts**: Consolidated utility scripts

## Success Metrics
- **File Count Reduction**: 70%+ reduction
- **Storage Savings**: 50%+ reduction
- **Build Time**: 30%+ faster
- **Maintenance Overhead**: 60%+ reduction
- **Security Risk**: Eliminate unused file vulnerabilities

## Next Steps
1. Create backup of current state
2. Remove identified unused files
3. Fix package.json configuration
4. Implement proper build system
5. Establish file organization standards