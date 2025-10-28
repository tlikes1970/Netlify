# Authentication System Deprecation

## Status
⚠️ **DEPRECATED** - Legacy V1 authentication files are being phased out

## Rationale
The app has been migrated to V2 (React/TypeScript) with a new authentication system in `apps/web/src/lib/auth.ts`. The legacy V1 files are no longer needed for the main application.

## Deprecated Files

### Authentication Files
- `_legacy_v1/www/js/auth.js` (182 lines)
- `_legacy_v1/www/js/auth-manager.js` (1,700 lines)
- `_legacy_v1/www/scripts/auth.js` (465 lines)

### Supporting Files
- `_legacy_v1/www/js/firebase-init.js`
- `_legacy_v1/www/js/firebase-cleanup.js`
- `_legacy_v1/www/js/fix-auth-ui.js`
- `_legacy_v1/www/js/fix-auth-state.js`
- `_legacy_v1/www/js/iframe-auth-helper.js`
- `_legacy_v1/www/firebase-config.js`

### Related Files
- `_legacy_v1/www/js/data-init.js` (contains auth handling)
- `_legacy_v1/www/js/force-data-load.js` (contains auth handling)
- `_legacy_v1/www/js/clean-data-loader.js` (contains auth handling)

## Migration
All authentication functionality has been migrated to:
- **New Auth System**: `apps/web/src/lib/auth.ts`
- **Hook**: `apps/web/src/hooks/useAuth.ts`
- **UI Component**: `apps/web/src/components/AuthModal.tsx`

## Safe to Remove
These files can be safely removed as the V2 authentication system is fully functional and handles:
- Google OAuth
- Apple OAuth
- Email/Password authentication
- Account creation
- Sign out
- Origin validation
- Security enhancements

## Timeline
- **V1 Deprecated**: Current branch `login-fixes`
- **V1 Removal**: After V2 testing complete and verified in production
- **Keep for Reference**: Temporarily for rollback purposes

## Backup Location
Before removing, ensure:
1. All functionality works in V2
2. User data migration is complete
3. Production testing passed
4. Rollback plan documented

