# Testing Unsubscribe Flow

This guide explains how to test the email digest unsubscribe functionality end-to-end.

## Prerequisites

1. A user account in Firebase Auth
2. User document in Firestore with `emailSubscriber: true`
3. Firebase Functions deployed (or running locally with emulator)

## Step 1: Get a Test User UID

### Option A: From Browser Console (Easiest)

1. Open the app in your browser
2. Sign in with your test account
3. Open browser DevTools (F12)
4. Go to Console tab
5. Run:
   ```javascript
   // Get current user UID
   const auth = firebase.auth();
   const user = auth.currentUser;
   console.log('User UID:', user?.uid);
   ```

### Option B: From Firebase Console

1. Go to Firebase Console → Authentication
2. Find your test user
3. Copy the User UID

## Step 2: Set Up Test User

Make sure the test user has `emailSubscriber: true` in Firestore:

1. Go to Firebase Console → Firestore Database
2. Navigate to `users/{uid}`
3. Edit the document
4. Set `emailSubscriber` to `true` (or add the field if it doesn't exist)
5. Save

## Step 3: Generate Test Unsubscribe Token

Run the test script:

```bash
cd functions
node test-unsubscribe-simple.js <your-uid>
```

Example:
```bash
node test-unsubscribe-simple.js abc123xyz456
```

This will output:
- The generated token
- Local test URL: `http://localhost:8888/unsubscribe?token=...`
- Production test URL: `https://flicklet.app/unsubscribe?token=...`

## Step 4: Test the Unsubscribe Page

### Local Testing

1. Start the dev server:
   ```bash
   cd apps/web
   npm run dev
   ```

2. Open the local test URL in your browser (from Step 3)

3. **Expected Behavior:**
   - Page loads showing "Processing unsubscribe request..."
   - Loading spinner appears
   - After a few seconds, shows success message: "Successfully Unsubscribed"
   - Green checkmark icon appears
   - Message: "You have been successfully unsubscribed from the weekly email digest."

### Production Testing

1. Open the production test URL in your browser (from Step 3)

2. **Expected Behavior:**
   - Same as local testing
   - Should work even if user is not signed in (token-based)

## Step 5: Verify Unsubscribe Worked

### Option A: Firebase Console

1. Go to Firebase Console → Firestore Database
2. Navigate to `users/{uid}`
3. Check the `emailSubscriber` field
4. **Expected:** Should be `false`

### Option B: Browser Console

1. Open browser DevTools → Console
2. Run:
   ```javascript
   const { doc, getDoc } = await import('firebase/firestore');
   const { db } = await import('./lib/firebaseBootstrap');
   const userRef = doc(db, 'users', 'YOUR_UID');
   const userDoc = await getDoc(userRef);
   console.log('emailSubscriber:', userDoc.data()?.emailSubscriber);
   ```

## Step 6: Test Error Cases

### Test 1: Missing Token

1. Open: `http://localhost:8888/unsubscribe` (no token)
2. **Expected:** Shows error message: "Missing unsubscribe token. Please check your email link."

### Test 2: Invalid Token

1. Open: `http://localhost:8888/unsubscribe?token=invalid-token`
2. **Expected:** Shows error message: "Invalid or expired unsubscribe link..."

### Test 3: Expired Token

1. Generate a token with expired timestamp (modify test script)
2. Open unsubscribe URL with expired token
3. **Expected:** Shows error message: "Invalid or expired unsubscribe link..."

## Step 7: Test Resubscription

After unsubscribing, test that the user can resubscribe:

1. Go to Settings → Notifications tab
2. Toggle "Email Digest" to ON
3. Verify `emailSubscriber` is set to `true` in Firestore

## Troubleshooting

### Issue: "Failed to unsubscribe"

**Possible causes:**
- Firebase Functions not deployed
- Functions emulator not running (for local testing)
- Network error

**Solution:**
- Check Firebase Functions logs: `firebase functions:log`
- For local testing, start emulator: `cd functions && npm run serve`

### Issue: Page shows "Loading..." forever

**Possible causes:**
- Unsubscribe function not deployed
- Function name mismatch
- CORS issues

**Solution:**
- Verify function is deployed: `firebase functions:list`
- Check browser console for errors
- Verify function name matches: `unsubscribe`

### Issue: Token works but user document not updated

**Possible causes:**
- User document doesn't exist
- Firestore security rules blocking update
- Wrong UID in token

**Solution:**
- Check Firestore security rules allow updates
- Verify token contains correct UID (decode token to check)
- Ensure user document exists in Firestore

## Test Checklist

- [ ] Test user has `emailSubscriber: true` before test
- [ ] Generated token successfully
- [ ] Unsubscribe page loads correctly
- [ ] Loading state shows while processing
- [ ] Success message appears after unsubscribe
- [ ] User document updated: `emailSubscriber: false`
- [ ] Error handling works (missing token, invalid token, expired token)
- [ ] User can resubscribe via Settings

## Notes

- Tokens expire after 30 days
- Unsubscribe works without user being signed in (token-based)
- The unsubscribe function is a Firebase callable function
- Test tokens can be generated using `test-unsubscribe-simple.js`









