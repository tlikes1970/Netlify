# Quick Test Run Guide

## Prerequisites
- Node.js installed
- Firebase project configured
- Browser DevTools knowledge

---

## Test Case 3: Email Auto-Creation Disabled

### Desktop (localhost)
1. **Start dev server:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Open browser to:** `http://localhost:8888`
3. **Open DevTools:** Press `F12` or `Right-click → Inspect`
4. **Go to Console tab**
5. **Click "Sign In" button**
6. **Click "Email" button**
7. **Enter these values:**
   - Email: `nonexistent-test-123@example.com`
   - Password: `testpass123`
8. **Click "Sign In"**

### ✅ Expected Result
- ❌ **Should NOT create account**
- ✅ **Error message:** "No account found with this email. Please check your email or sign up."
- ✅ Console shows: `auth/user-not-found` error
- ✅ **Try signing in with this email again** - should fail (no account was created)

### Desktop (Production)
**Same steps but use production URL:**
1. Open: `https://flicklet.netlify.app`
2. Follow steps 3-8 above

### Mobile (Localhost)
1. **Find your computer's IP:** Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. **Start dev server with network access:**
   ```bash
   npm run dev -- --host
   ```
3. **On your phone**, open: `http://YOUR_IP:8888`
   - Example: `http://192.168.1.100:8888`
4. Follow desktop steps 3-8 above

### Mobile (Production)
1. **On your phone**, open: `https://flicklet.netlify.app`
2. Follow desktop steps 3-8 above

---

## Test Case 4: Origin Validation

### Test 4a: Valid Origin (localhost:8888)
1. **Open:** `http://localhost:8888`
2. **Open Console**
3. **Click "Sign in with Google"**
4. **Look for:** "✓ Origin validated" in console
5. **Should proceed** to Google sign-in

### Test 4b: Invalid Origin (Simulate)
You need to temporarily modify the code or use a different port:

**Option 1: Use unauthorized port**
1. Start dev server on different port: `npm run dev -- --port 3000`
2. **Open:** `http://localhost:3000`
3. **Click "Sign in with Google"**
4. **Should see error:** "Unauthorized origin: http://localhost:3000"

**Option 2: Temporarily block origin**
Edit `apps/web/src/lib/authLogin.ts` line 127:
```typescript
// Temporarily comment out localhost:8888
const allowedOrigins = new Set([
  'http://localhost',  // ← Comment this
  // 'http://localhost:8888',  // ← Comment this
  'http://127.0.0.1:8888',
  ...
]);
```

Then:
1. Build: `npm run build`
2. Test: `npm run preview`
3. Try sign-in → Should error

**⚠️ Don't commit this change!**

### Mobile Origin Validation
**Test on actual phone:**
1. Open production URL: `https://flicklet.netlify.app`
2. Should work (authorized origin)
3. Try a non-production URL if testing unauthorized

---

## Test Case 11: Logging Suppression

### Production Build Test
1. **Build for production:**
   ```bash
   cd apps/web
   npm run build
   ```

2. **Check built files:**
   ```bash
   # Windows PowerShell
   Select-String -Path "dist/assets/*.js" -Pattern "console.log" | Measure-Object | Select-Object Count
   
   # Should show 0 or very few results
   ```

3. **Start production server:**
   ```bash
   npm run preview
   ```

4. **Open:** `http://localhost:4173`
5. **Open Console** (F12)
6. **Clear console**
7. **Click "Sign in with Google"**
8. **Look at console output**

### ✅ Expected Result (Production)
- ❌ **NO** `console.log()` output
- ✅ **ONLY** `console.error()` for actual errors
- ✅ **Minimal** logging
- ✅ **No emoji** in logs

### Development Mode Test (Compare)
1. **Run dev server:**
   ```bash
   npm run dev
   ```

2. **Open:** `http://localhost:8888`
3. **Open Console** (F12)
4. **Click "Sign in with Google"**
5. **Look at console output**

### ✅ Expected Result (Development)
- ✅ **Detailed** `console.log()` output
- ✅ Shows: "Starting Google sign-in", "Origin validated", etc.
- ✅ **Emoji** in logs (🚀, ✅, ❌)
- ✅ **Verbose** logging for debugging

### Mobile Comparison
**Test same steps on mobile device:**
- Development (localhost): Should see detailed logs
- Production: Should see minimal logs

---

## Quick Verification Commands

### Check Environment Variables
```bash
cd apps/web
cat .env | Select-String "VITE_FIREBASE"
# Should show all Firebase env vars
```

### Check for Hardcoded Keys (Critical!)
```bash
cd apps/web
npm run build
Select-String -Path "dist/assets/*.js" -Pattern "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM"
# Should return NOTHING (no matches)
```

### Check Logging in Built Files
```bash
cd apps/web
npm run build
Select-String -Path "dist/assets/*.js" -Pattern "console\.log\(" | Measure-Object
# Should show minimal results (only critical errors)
```

---

## Testing Checklist

### Test Case 3 (Email Auto-Creation) ✅
- [ ] Desktop localhost: Try nonexistent@test.com → Should error
- [ ] Desktop production: Try nonexistent@test.com → Should error
- [ ] Mobile localhost: Try nonexistent@test.com → Should error
- [ ] Mobile production: Try nonexistent@test.com → Should error
- [ ] Verify: No account created in Firebase Console

### Test Case 4 (Origin Validation) ✅
- [ ] Desktop localhost: Click Google sign-in → Should work
- [ ] Desktop production: Click Google sign-in → Should work
- [ ] Test unauthorized origin: Should error
- [ ] Mobile production: Click Google sign-in → Should work

### Test Case 11 (Logging) ✅
- [ ] Development mode: See detailed logs ✅
- [ ] Production mode: See minimal logs ✅
- [ ] Check built files: No hardcoded keys ✅
- [ ] Mobile development: See detailed logs ✅
- [ ] Mobile production: See minimal logs ✅

---

## Network Testing

### Desktop Network Test
```bash
# Start dev server accessible on network
cd apps/web
npm run dev -- --host

# Check IP address
ipconfig  # Windows

# Note the IPv4 address, e.g., 192.168.1.100
# Test from: http://192.168.1.100:8888
```

### Mobile Test
1. Connect phone to same WiFi network
2. Find your computer's IP (from ipconfig)
3. On phone: Open `http://YOUR_IP:8888`
4. Run tests on phone browser

---

## Troubleshooting

### "Cannot connect" on mobile
- Check firewall allows port 8888
- Ensure phone and computer on same network
- Try connecting via IP instead of localhost

### "Unauthorized origin" error
- Check allowed origins in `authLogin.ts` line 117
- Add your IP if using network testing
- Don't forget to add `http://` or `https://`

### Hardcoded keys still in build
- Check `.env` file exists
- Verify `vite.config.ts` loads env vars
- Rebuild: `npm run build`

### Logs still showing in production
- Verify `logger.ts` is imported
- Check `import.meta.env.DEV` is working
- Rebuild and test again

