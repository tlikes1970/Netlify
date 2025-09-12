# Backup Summary - v14.3

**Backup Date:** September 8, 2025, 4:52 PM  
**Version:** v14.3  
**Backup Directory:** `backup_v14.3_20250908_165215`

## What's Included

### Core Application Files
- Complete `www/` directory with all application files
- All HTML, CSS, JavaScript, and asset files
- Firebase configuration
- Service worker
- Manifest files

### Configuration Files
- `manifest.json` - PWA manifest
- `package.json` - Node.js dependencies
- `capacitor.config.json` - Capacitor configuration
- `netlify.toml` - Netlify deployment configuration

### Netlify Functions
- `netlify/functions/` - Serverless functions for API calls

## Purpose
This backup was created to preserve the current state of the TV Tracker application at version 14.3, enabling easy rollback if needed.

## Restoration
To restore from this backup:
1. Copy all files from this backup directory back to the project root
2. Ensure the `www/` directory structure is maintained
3. Run any necessary dependency installations

## Notes
- This backup represents a stable state of the application
- All core functionality should be preserved
- Version indicator shows v14.3 in the top-left corner
