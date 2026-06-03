# Google Play Billing Implementation Status

**Date:** 2025-12-10  
**Status:** ✅ Frontend Complete, ⚠️ Native Android Plugin Needed

---

## ✅ Completed

### Frontend Implementation

1. **`apps/web/src/lib/billing.ts`**
   - ✅ Firestore integration for billing status
   - ✅ `getBillingStatus()` reads from Firestore
   - ✅ `updateBillingStatus()` writes to Firestore
   - ✅ Proper TypeScript interfaces

2. **`apps/web/src/lib/proStatus.ts`**
   - ✅ Async billing status checking
   - ✅ Subscription expiry validation
   - ✅ Caching for performance
   - ✅ React hook `useProStatus()` with auto-refresh

3. **`apps/web/src/lib/proUpgrade.ts`**
   - ✅ Platform detection (Android/iOS/Web)
   - ✅ Purchase flow structure
   - ✅ Purchase validation function
   - ✅ Fallback to alpha toggle when native billing unavailable

4. **Backend API Functions**

   - ✅ `netlify/functions/billing/products.cjs`
     - Returns available subscription products
     - Matches Play Console product IDs
   
   - ✅ `netlify/functions/billing/validate.cjs`
     - Validates Google Play purchase tokens
     - Updates Firestore billing status
     - ⚠️ TODO: Implement actual Google Play API validation
   
   - ✅ `netlify/functions/billing/purchase.cjs`
     - Placeholder (purchases must happen natively)

5. **Netlify Configuration**
   - ✅ API redirects added to `netlify.toml`
   - ✅ `/api/billing/*` routes to functions

---

## ⚠️ Still Needed

### Native Android Implementation

**Critical:** Google Play purchases MUST be initiated from Android native code. The frontend is ready, but a Capacitor plugin is needed.

#### Required Steps:

1. **Create Capacitor Plugin** (`android/app/src/main/java/.../BillingPlugin.java`)
   - Initialize `BillingClient`
   - Expose methods to JavaScript:
     - `initialize()`
     - `getProducts(productIds[])`
     - `purchase(productId)`
     - `restorePurchases()`
   - Handle purchase callbacks
   - Return purchase tokens to JavaScript

2. **Register Plugin** in `MainActivity.java`
   ```java
   import com.yourpackage.BillingPlugin;
   
   public class MainActivity extends BridgeActivity {
       @Override
       public void onCreate(Bundle savedInstanceState) {
           super.onCreate(savedInstanceState);
           registerPlugin(BillingPlugin.class);
       }
   }
   ```

3. **Add Billing Dependency** to `android/app/build.gradle`
   ```gradle
   dependencies {
       implementation 'com.android.billingclient:billing:6.0.1'
   }
   ```

4. **Add Billing Permission** to `AndroidManifest.xml`
   ```xml
   <uses-permission android:name="com.android.vending.BILLING" />
   ```

5. **Update `proUpgrade.ts`** to use the plugin:
   ```typescript
   import { Billing } from '@your-package/billing';
   
   const result = await Billing.purchase({ productId: 'pro_subscription_monthly' });
   await validateAndActivatePurchase(result.purchaseToken, 'android', productId);
   ```

---

## 🔧 Backend Validation TODO

### Google Play API Integration

The `validate.cjs` function currently has placeholder validation. To implement real validation:

1. **Get Google Play Service Account**
   - Go to Google Cloud Console
   - Create service account for Play Console API
   - Download JSON credentials
   - Add to Netlify environment variables as `FIREBASE_SERVICE_ACCOUNT`

2. **Install Google Auth Library**
   ```bash
   npm install google-auth-library --save
   ```

3. **Update `validate.cjs`**:
   ```javascript
   const { GoogleAuth } = require('google-auth-library');
   
   async function validateGooglePlayPurchase(purchaseToken, productId, packageName) {
     const auth = new GoogleAuth({
       scopes: ['https://www.googleapis.com/auth/androidpublisher'],
       credentials: JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT),
     });
     
     const client = await auth.getClient();
     const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
     
     const response = await client.request({ url });
     // Check purchaseState, expiryTimeMillis, etc.
     return { isValid: true, ...response.data };
   }
   ```

---

## 📋 Testing Checklist

Once native plugin is implemented:

- [ ] Test purchase flow on Android device
- [ ] Test with Google Play test accounts
- [ ] Verify purchase token validation
- [ ] Verify Firestore billing status updates
- [ ] Verify Pro features unlock after purchase
- [ ] Test subscription cancellation
- [ ] Test subscription renewal
- [ ] Test restore purchases flow

---

## 📚 Resources

- [Google Play Billing Library Documentation](https://developer.android.com/google/play/billing)
- [Capacitor Plugin Development Guide](https://capacitorjs.com/docs/plugins)
- [Google Play Developer API](https://developers.google.com/android-publisher/api-ref)

---

## Current Behavior

**Android:**
- Detects platform correctly
- Falls back to alpha toggle in Settings (for testing)
- Ready for native plugin integration

**Web/Desktop:**
- Falls back to alpha toggle in Settings
- Stripe integration can be added later

**iOS:**
- Placeholder for future implementation

---

**Next Step:** Create Capacitor plugin for Android BillingClient integration.


