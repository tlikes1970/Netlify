# Unsubscribe Flow Test Guide

## Quick Test Steps

### 1. Generate Test Token

```bash
cd functions
node test-unsubscribe-simple.js YOUR_USER_UID
```

Replace `YOUR_USER_UID` with an actual user UID from Firebase Auth.

**Output:**
- Test token
- Local URL: `http://localhost:8888/unsubscribe?token=...`
- Production URL: `https://flicklet.app/unsubscribe?token=...`

### 2. Prepare Test User

Before testing, ensure the test user has `emailSubscriber: true`:

1. Firebase Console → Firestore → `users/{uid}`
2. Set `emailSubscriber: true`
3. Save

### 3. Test Locally

1. Start dev server:
   ```bash
   cd apps/web
   npm run dev
   ```

2. Open the local URL from Step 1 in your browser

3. **Expected:**
   - ✅ Page loads
   - ✅ Shows "Processing unsubscribe request..."
   - ✅ After 1-2 seconds, shows success message
   - ✅ Green checkmark appears
   - ✅ Message: "Successfully Unsubscribed"

### 4. Verify in Firestore

1. Firebase Console → Firestore → `users/{uid}`
2. Check `emailSubscriber` field
3. **Expected:** Should be `false`

### 5. Test Error Cases

#### Missing Token
- URL: `http://localhost:8888/unsubscribe`
- **Expected:** Error message about missing token

#### Invalid Token
- URL: `http://localhost:8888/unsubscribe?token=invalid`
- **Expected:** Error message about invalid/expired token

## Test Checklist

- [ ] Token generation works
- [ ] Unsubscribe page loads correctly
- [ ] Loading state displays
- [ ] Success state displays with correct message
- [ ] User document updated (`emailSubscriber: false`)
- [ ] Error handling works (missing token, invalid token)
- [ ] Page is responsive (mobile/desktop)
- [ ] Theme works (light/dark mode)

## Troubleshooting

### Function Not Found Error
- **Cause:** Unsubscribe function not deployed
- **Fix:** Deploy functions: `firebase deploy --only functions:unsubscribe`

### Token Invalid Error
- **Cause:** Token format incorrect or expired
- **Fix:** Regenerate token with correct UID

### User Document Not Updated
- **Cause:** Firestore security rules or user document doesn't exist
- **Fix:** Check security rules allow updates, ensure user document exists

## Next Steps After Testing

1. Deploy unsubscribe function to production
2. Test with real email digest (use `digestPreview` function)
3. Verify unsubscribe link in actual email
4. Test end-to-end flow with production URL

