# Google Play Billing API Implementation Guide

## Why Implement Before Launch?

✅ **Pro features are already built and gated**  
✅ **Infrastructure is ready** (billing.ts, proStatus.ts, proUpgrade.ts)  
✅ **Better user experience** - Real monetization from day one  
✅ **No reason to wait** - Features work, just need payment integration

---

## Implementation Overview

### What Already Exists:

1. ✅ Pro feature gating (`proStatus.ts`, `proConfig.ts`)
2. ✅ Billing structure (`billing.ts` with interfaces)
3. ✅ Upgrade entrypoint (`proUpgrade.ts`)
4. ✅ Pro status resolution (combines settings + billing)

### What Needs to Be Added:

1. ⚠️ Capacitor plugin for Google Play Billing
2. ⚠️ Purchase flow in `proUpgrade.ts`
3. ⚠️ Firestore integration in `billing.ts`
4. ⚠️ Backend validation (recommended)

---

## Step 1: Install Capacitor Plugin

### Install the Plugin

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync android
```

**Alternative:** Use Capacitor's official plugin (if available) or a community plugin.

### Add to Android Dependencies

The plugin should automatically add dependencies, but verify in `android/app/build.gradle`:

```gradle
dependencies {
    // ... existing dependencies
    implementation 'com.android.billingclient:billing:6.0.1'
}
```

---

## Step 2: Update `proUpgrade.ts` for Android

**File:** `apps/web/src/lib/proUpgrade.ts`

Replace the current implementation with:

```typescript
/**
 * Process: Pro Upgrade Entrypoint
 * Purpose: Centralized entrypoint for Pro upgrade flow
 * Data Source: Settings navigation, payment providers
 * Update Path: User clicks "Upgrade to Pro" buttons
 * Dependencies: Settings navigation, payment providers
 */

import { Capacitor } from "@capacitor/core";
import { InAppPurchases } from "@capacitor-community/in-app-purchases";

/**
 * Start Pro upgrade flow
 *
 * Platform-specific:
 * - Android: Google Play Billing API
 * - iOS: App Store in-app purchases
 * - Web: Stripe checkout
 */
export async function startProUpgrade(): Promise<void> {
  console.log("[Pro Upgrade] startProUpgrade() called");

  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    await startAndroidPurchase();
  } else if (platform === "ios") {
    await startIOSPurchase();
  } else {
    // Web/Desktop - Stripe checkout
    await startWebPurchase();
  }
}

/**
 * Android: Google Play Billing purchase flow
 */
async function startAndroidPurchase(): Promise<void> {
  try {
    // Initialize the plugin
    await InAppPurchases.initialize();

    // Get available products
    const products = await InAppPurchases.getProducts({
      productIds: ["pro_subscription_monthly", "pro_subscription_yearly"],
      productType: "subscription",
    });

    // Show product selection UI (you'll need to build this)
    // For now, default to monthly subscription
    const productId = "pro_subscription_monthly";

    // Launch purchase flow
    const purchase = await InAppPurchases.purchase({
      productId,
      productType: "subscription",
    });

    if (purchase.transactionReceipt) {
      // Purchase successful - validate on backend and update Firestore
      await validateAndActivatePurchase(
        purchase.transactionReceipt,
        "android",
        productId
      );
    }
  } catch (error) {
    console.error("[Pro Upgrade] Android purchase failed:", error);
    // Show error to user
  }
}

/**
 * iOS: App Store purchase flow
 */
async function startIOSPurchase(): Promise<void> {
  // Similar to Android but using iOS-specific APIs
  // TODO: Implement when iOS app is ready
  console.log("[Pro Upgrade] iOS purchase (not implemented yet)");
}

/**
 * Web: Stripe checkout flow
 */
async function startWebPurchase(): Promise<void> {
  // Redirect to Stripe checkout or show Stripe Elements
  // TODO: Implement Stripe integration
  console.log("[Pro Upgrade] Web purchase (not implemented yet)");
}

/**
 * Validate purchase receipt and activate Pro status
 */
async function validateAndActivatePurchase(
  receipt: string,
  platform: "android" | "ios",
  productId: string
): Promise<void> {
  // Call backend API to validate receipt
  const response = await fetch("/api/validate-purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      receipt,
      platform,
      productId,
    }),
  });

  if (response.ok) {
    const { isValid, userId } = await response.json();
    if (isValid) {
      // Backend will update Firestore billing status
      // Frontend will pick it up via proStatus.ts
      console.log("[Pro Upgrade] Purchase validated and activated");
    }
  }
}
```

---

## Step 3: Update `billing.ts` to Read from Firestore

**File:** `apps/web/src/lib/billing.ts`

Replace placeholder implementations:

```typescript
import { db } from "./firebaseBootstrap";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth } from "./firebaseBootstrap";

export interface BillingStatus {
  isPro: boolean;
  source: "alpha" | "gift" | "stripe" | "ios" | "android" | "manual" | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Get billing status for current user
 */
export async function getBillingStatus(uid?: string): Promise<BillingStatus> {
  const userId = uid || auth.currentUser?.uid;
  if (!userId) {
    return {
      isPro: false,
      source: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  try {
    const billingDoc = await getDoc(
      doc(db, "users", userId, "billing", "status")
    );

    if (billingDoc.exists()) {
      const data = billingDoc.data();
      return {
        isPro: data.isPro || false,
        source: data.source || null,
        currentPeriodEnd: data.currentPeriodEnd || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      };
    }
  } catch (error) {
    console.error("[Billing] Error reading billing status:", error);
  }

  return {
    isPro: false,
    source: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

/**
 * Update billing status (called by backend webhooks or admin)
 */
export async function updateBillingStatus(
  uid: string,
  status: Partial<BillingStatus>
): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", uid, "billing", "status"),
      {
        ...status,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
    console.log("[Billing] Billing status updated:", { uid, status });
  } catch (error) {
    console.error("[Billing] Error updating billing status:", error);
    throw error;
  }
}
```

---

## Step 4: Update `proStatus.ts` to Use Billing

**File:** `apps/web/src/lib/proStatus.ts`

Ensure it reads from billing:

```typescript
import { getBillingStatus } from "./billing";
import { settingsManager } from "./settings";

export async function getProStatus(): Promise<{
  isPro: boolean;
  source: string | null;
}> {
  // Try billing first (takes precedence)
  const billing = await getBillingStatus();

  if (billing.isPro && billing.currentPeriodEnd) {
    // Check if subscription is still valid
    const now = new Date();
    const periodEnd = billing.currentPeriodEnd.toDate();

    if (periodEnd > now) {
      return {
        isPro: true,
        source: billing.source || "android",
      };
    }
  }

  // Fall back to settings (alpha/testing)
  const settings = settingsManager.getSettings();
  if (settings.pro.isPro) {
    return {
      isPro: true,
      source: "alpha",
    };
  }

  return {
    isPro: false,
    source: null,
  };
}
```

---

## Step 5: Backend Validation (Recommended)

### Create Netlify Function

**File:** `netlify/functions/validate-purchase.js`

```javascript
const { GoogleAuth } = require("google-auth-library");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { receipt, platform, productId, userId } = JSON.parse(event.body);

  if (platform === "android") {
    // Validate Google Play purchase
    const isValid = await validateGooglePlayPurchase(receipt, productId);

    if (isValid) {
      // Update Firestore billing status
      await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("billing")
        .doc("status")
        .set(
          {
            isPro: true,
            source: "android",
            currentPeriodEnd: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            ),
            cancelAtPeriodEnd: false,
            productId,
            purchaseToken: receipt,
          },
          { merge: true }
        );

      return {
        statusCode: 200,
        body: JSON.stringify({ isValid: true }),
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ isValid: false, error: "Invalid purchase" }),
  };
};

async function validateGooglePlayPurchase(purchaseToken, productId) {
  // Use Google Play Developer API to validate purchase
  // This requires service account credentials
  // See: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions/get

  // For now, return true (implement actual validation)
  // TODO: Implement real Google Play API validation
  return true;
}
```

---

## Step 6: Create In-App Product in Play Console

**Before building:**

1. Go to **Google Play Console** → Your App → **Monetize** → **Products** → **In-app products**
2. Click **Create product**
3. Fill in:
   - **Product ID:** `pro_subscription_monthly`
   - **Name:** "Flicklet Pro Monthly"
   - **Description:** "Unlock advanced notifications, unlimited lists, bloopers & extras, and more"
   - **Billing period:** Monthly
   - **Price:** Set your price (e.g., $4.99)
   - **Free trial:** Optional (e.g., 7 days)
4. Create yearly subscription too: `pro_subscription_yearly`
5. **Activate** both products

---

## Step 7: Testing

### Test Purchases

1. **Use Google Play test accounts:**
   - Add test accounts in Play Console → **Settings** → **License testing**
   - These accounts can make test purchases without being charged

2. **Test purchase flow:**
   - Click "Upgrade to Pro" button
   - Should launch Google Play purchase dialog
   - Complete purchase with test account
   - Verify Pro status activates
   - Verify features unlock

3. **Test subscription management:**
   - Cancel subscription
   - Verify Pro status deactivates at period end
   - Resubscribe
   - Verify Pro status reactivates

---

## Step 8: Update Play Console Listing

### In-App Purchases Section

In Play Console → **Store presence** → **Store listing**:

- **In-app products:** List your Pro subscription products
- **Pricing:** Show pricing clearly
- **Features:** Highlight what Pro unlocks

---

## Implementation Checklist

- [ ] Install Capacitor in-app purchase plugin
- [ ] Update `proUpgrade.ts` with Android purchase flow
- [ ] Update `billing.ts` to read/write Firestore
- [ ] Update `proStatus.ts` to check billing status
- [ ] Create backend validation function (optional but recommended)
- [ ] Create in-app products in Play Console
- [ ] Test purchase flow with test accounts
- [ ] Test subscription cancellation/renewal
- [ ] Update Play Console listing with Pro features

---

## Alternative: Simpler Approach (For Faster Launch)

If you want to launch faster, you can:

1. **Keep alpha toggle for now** (for testing)
2. **Add "Purchase Pro" button** that opens Play Store product page
3. **Manual activation:** Users purchase, then contact support or use a code
4. **Later:** Implement full billing API integration

**Not recommended** but possible if you need to launch immediately.

---

## Recommended Timeline

**Before Launch:**

- ✅ Implement Google Play Billing API (2-3 days)
- ✅ Test thoroughly (1 day)
- ✅ Create products in Play Console (30 minutes)

**Total:** ~3-4 days of work

**Benefits:**

- Real monetization from day one
- Better user experience
- No need to retroactively add billing
- Professional appearance

---

**Status:** Ready to implement  
**Estimated Time:** 3-4 days  
**Priority:** HIGH (should be done before launch)
