# Safari "Invalid Site" Issue - Troubleshooting

## What "Invalid Site" Means in Safari

Safari's "invalid site" message typically means one of:
1. **SSL Certificate Issue** - Safari doesn't trust the HTTPS certificate
2. **Mixed Content** - Page loads HTTP resources on HTTPS
3. **Intelligent Tracking Prevention (ITP)** - Safari blocks third-party cookies/OAuth
4. **Origin Validation** - Origin not in Firebase authorized domains

## Fixes Applied

### 1. Safari-Specific Origin Validation
- Safari now continues even if origin validation fails (logs warning only)
- Safari's security model is stricter - normal warnings may occur

### 2. Netlify Preview Deployments
- All `.netlify.app` domains now allowed
- Warning logged but doesn't block auth

## Firebase Console Checklist

Verify these are configured in Firebase Console:

1. **Authentication > Settings > Authorized domains:**
   - ✅ flicklet.netlify.app
   - ✅ flicklet-71dff.web.app
   - ✅ flicklet-71dff.firebaseapp.com
   - ✅ Any custom domain you use

2. **Authentication > Sign-in method > Google:**
   - ✅ Enabled
   - ✅ Authorized JavaScript origins includes:
     - `https://flicklet.netlify.app`
     - `https://flicklet-71dff.web.app`
   - ✅ Authorized redirect URIs includes:
     - `https://flicklet.netlify.app/__/auth/handler`
     - `https://flicklet.netlify.app` (for redirect result)

## Safari-Specific Workarounds

If Safari still shows "invalid site":

1. **Clear Safari Cache:**
   - Settings > Safari > Clear History and Website Data

2. **Check Safari Settings:**
   - Settings > Safari > Prevent Cross-Site Tracking (try disabling temporarily)
   - Settings > Safari > Privacy & Security > Block All Cookies (should be OFF)

3. **Try Private Browsing:**
   - Safari Private Window to bypass ITP

4. **Check URL:**
   - Ensure using `https://` not `http://`
   - Check for typos in domain

## Debug Steps

1. Open Safari Console (if possible):
   - Safari > Develop > Show Web Inspector
   - Check for errors related to:
     - `firebase`
     - `auth`
     - `oauth`
     - `redirect`

2. Check localStorage:
   ```javascript
   localStorage.getItem('flicklet.auth.status')
   localStorage.getItem('flicklet.debugAuth')
   ```

3. Check sessionStorage:
   ```javascript
   // Should see Firebase auth keys
   Object.keys(sessionStorage).filter(k => k.includes('firebase'))
   ```

## Next Steps

If issue persists:
1. Verify Firebase Console configuration
2. Check Safari version (needs iOS 15+ or Safari 15+)
3. Try Chrome/Firefox on same device to isolate Safari issue
4. Check Netlify deployment logs for errors

