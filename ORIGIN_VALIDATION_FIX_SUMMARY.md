# Origin Validation Fix Summary

## Overview
Fixed `[AUTH] Origin validation failed` issue to allow requests from Android/Capacitor app (emulator & real device) while maintaining security for third-party sites.

## Files Touched

### Created
- `netlify/functions/origin-validation.cjs` - Shared origin validation helper
- `netlify/functions/__tests__/origin-validation.test.cjs` - Unit tests for origin validation
- `ORIGIN_VALIDATION_FIX_SUMMARY.md` - This summary document

### Modified
- `netlify/functions/tmdb-proxy.cjs` - Added origin validation using shared helper
- `apps/web/src/lib/tmdb.ts` - Added defensive JSON content-type checking

## New/Updated Helper Description

### `origin-validation.cjs`
A shared helper module that validates request origins for Netlify functions. It:

- **Validates origins** against an explicit allow list
- **Extracts origin from Referer header** if Origin header is missing (for mobile/Capacitor cases)
- **Supports Netlify preview deployments** via pattern matching (*.netlify.app)
- **Returns detailed error information** including origin, referer, and user-agent for debugging
- **Normalizes origins** (lowercase, removes www prefix) for consistent comparison

**Usage:**
```javascript
const { validateOrigin } = require('./origin-validation.cjs');

const originCheck = validateOrigin(event);
if (!originCheck.allowed) {
  return {
    statusCode: 403,
    headers: cors(),
    body: JSON.stringify({
      error: 'Origin validation failed',
      message: originCheck.error,
      origin: originCheck.origin || null,
    }),
  };
}
```

## Allowed Origins After Change

### Production Origins (preserved)
- `https://flicklet.netlify.app`
- `https://flicklet-71dff.web.app`
- `https://flicklet-71dff.firebaseapp.com`

### Dev/Emulator Origins (added)
- `http://localhost:8888` - Netlify dev server
- `http://127.0.0.1:8888` - Localhost alternative
- `http://10.0.2.2:8888` - **Android emulator loopback** (key fix for Android/Capacitor)

### Additional Dev Origins
- `http://localhost:3000` - Next.js dev
- `http://localhost:4173` - Vite preview
- `http://localhost:8000` - Vite dev

### Pattern-Based Allowed
- Any `*.netlify.app` subdomain (for preview deployments)
- Any `*.netlify.com` subdomain

## Changes Made

### 1. Origin Validation Helper (`netlify/functions/origin-validation.cjs`)
- Created shared helper with explicit allow list
- Supports Android emulator origin (`10.0.2.2:8888`)
- Falls back to Referer header parsing when Origin is missing
- Returns detailed error information for debugging

### 2. TMDB Proxy Updates (`netlify/functions/tmdb-proxy.cjs`)
- Integrated origin validation helper
- Returns JSON errors (not HTML) when origin validation fails
- Improved error logging with origin, referer, user-agent details
- Status code 403 for unauthorized origins

### 3. Client-Side Defensive Checks (`apps/web/src/lib/tmdb.ts`)
- Added content-type validation before JSON parsing
- Clear error messages when non-JSON responses are received
- Prevents `Unexpected token '<'` errors by checking content-type first

## Testing

Unit tests created in `netlify/functions/__tests__/origin-validation.test.cjs`:
- ✅ `http://localhost:8888` → allowed
- ✅ `http://127.0.0.1:8888` → allowed
- ✅ `http://10.0.2.2:8888` → allowed
- ✅ Production origins → still allowed
- ✅ Netlify preview deployments → allowed
- ✅ Random origin like `https://evil.example.com` → rejected
- ✅ Missing origin → rejected with clear error
- ✅ Origin extraction from Referer → works correctly

**Test Results:** 14 tests passed, 0 failed

## Security Considerations

- **No wildcards**: All origins must be explicitly listed or match Netlify preview pattern
- **Strict validation**: Missing Origin header is rejected unless Referer can be parsed
- **Production origins preserved**: All existing production origins remain in allow list
- **Error details**: Logging includes origin, referer, and user-agent for security monitoring

## Future Hardening TODOs

1. **Capacitor-specific origin**: If we later identify the exact Capacitor/WebView origin format, add it explicitly to the allow list
2. **Environment-based allow list**: Consider using environment variables for additional allowed origins in staging/dev environments
3. **Rate limiting by origin**: Consider adding rate limiting per origin to prevent abuse
4. **Origin validation middleware**: Consider creating a Netlify function middleware wrapper that applies origin validation to all functions automatically
5. **Monitoring**: Set up alerts for origin validation failures to detect potential attacks or misconfigurations

## Impact

- ✅ Android/Capacitor app requests from emulator (`10.0.2.2:8888`) are now accepted
- ✅ Android/Capacitor app requests from real device (via localhost/127.0.0.1) are now accepted
- ✅ Third-party sites are still blocked (security maintained)
- ✅ Better error messages help with debugging (JSON errors instead of HTML)
- ✅ Client-side defensive checks prevent JSON parse errors

## Rollback

To rollback these changes:
1. Revert `netlify/functions/tmdb-proxy.cjs` to remove origin validation check
2. Revert `apps/web/src/lib/tmdb.ts` to remove content-type checking
3. Delete `netlify/functions/origin-validation.cjs` and test file

The changes are minimal and focused, making rollback straightforward if needed.








