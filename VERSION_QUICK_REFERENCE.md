# Quick Version Reference

## Current Version: 15.3
**Status:** KISS Responsive Sizing System - mobile-first responsive design with simple breakpoints

## Recent Versions (Last 5)
| Version | Date | Key Fix |
|---------|------|---------|
| 15.3 | Jan 9, 2025 | KISS Responsive Sizing System - mobile-first responsive design |
| 14.7 | Jan 9, 2025 | Overflow Menu Crash Fix - fixed scope issues and improved menu reliability |
| 14.6 | Jan 9, 2025 | Phase 1 Card Standardization - unified Card component |
| 12.0 | Jan 9, 2025 | Version management system and documentation |
| 11.9 | Jan 9, 2025 | Episode modal UI improvements (scrolling, fonts) |
| 11.7 | Jan 9, 2025 | Episode tracking API key fix |
| 11.6 | Jan 9, 2025 | Episode tracking event handler fix |
| 11.5 | Jan 9, 2025 | Episode tracking button display fix |

## Quick Rollback Commands
```bash
# To see all commits with version numbers
git log --oneline --grep="v11"

# To rollback to a specific version (replace X.X with version)
git checkout <commit-hash> -- www/index.html
git checkout <commit-hash> -- www/styles/components.css
git checkout <commit-hash> -- www/scripts/episode-tracking.js
```

## Current Features Status
- ✅ Episode tracking modal opens
- ✅ API key authentication works
- ✅ Seasons and episodes load
- ✅ Modal has proper scrolling
- ✅ Compact, readable UI
- ✅ Event handlers work correctly

## Known Issues
- None currently identified

---
*For detailed change history, see VERSION_HISTORY.md*
