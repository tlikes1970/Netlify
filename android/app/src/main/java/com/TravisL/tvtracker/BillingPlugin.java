package com.TravisL.tvtracker;

import android.app.Activity;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.*;

import java.util.ArrayList;
import java.util.List;
import org.json.JSONException;

@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener, BillingClientStateListener {
    
    private static final String TAG = "BillingPlugin";
    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private PluginCall pendingInitializeCall;
    
    @PluginMethod
    public void initialize(PluginCall call) {
        Log.d(TAG, "Initializing BillingClient");
        
        pendingInitializeCall = call;
        
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases()
            .build();
        
        billingClient.startConnection(this);
    }
    
    @PluginMethod
    public void getProducts(PluginCall call) {
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("BillingClient not initialized. Call initialize() first.");
            return;
        }
        
        List<String> productIds;
        try {
            productIds = call.getArray("productIds").toList();
        } catch (JSONException e) {
            call.reject("Invalid productIds array: " + e.getMessage());
            return;
        }
        String productType = call.getString("productType", "subscription");
        
        String skuTypeString = productType.equals("subscription") ? "subs" : "inapp";
        
        SkuDetailsParams.Builder params = SkuDetailsParams.newBuilder()
            .setSkusList(productIds)
            .setType(skuTypeString);
        
        billingClient.querySkuDetailsAsync(params.build(), (billingResult, skuDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && skuDetailsList != null) {
                List<JSObject> products = new ArrayList<>();
                for (SkuDetails skuDetails : skuDetailsList) {
                    JSObject product = new JSObject();
                    product.put("productId", skuDetails.getSku());
                    product.put("title", skuDetails.getTitle());
                    product.put("description", skuDetails.getDescription());
                    product.put("price", skuDetails.getPrice());
                    product.put("currency", skuDetails.getPriceCurrencyCode());
                    products.add(product);
                }
                
                JSObject result = new JSObject();
                result.put("products", products);
                call.resolve(result);
            } else {
                call.reject("Failed to query products: " + billingResult.getDebugMessage());
            }
        });
    }
    
    @PluginMethod
    public void purchase(PluginCall call) {
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("BillingClient not initialized. Call initialize() first.");
            return;
        }
        
        String productId = call.getString("productId");
        String productType = call.getString("productType", "subscription");
        
        if (productId == null) {
            call.reject("productId is required");
            return;
        }
        
        // Query product details first
        List<String> productIds = new ArrayList<>();
        productIds.add(productId);
        
        String skuTypeString = productType.equals("subscription") ? "subs" : "inapp";
        
        SkuDetailsParams.Builder params = SkuDetailsParams.newBuilder()
            .setSkusList(productIds)
            .setType(skuTypeString);
        
        billingClient.querySkuDetailsAsync(params.build(), (billingResult, skuDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK 
                && skuDetailsList != null 
                && !skuDetailsList.isEmpty()) {
                
                SkuDetails skuDetails = skuDetailsList.get(0);
                pendingPurchaseCall = call;
                
                // Launch billing flow
                BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setSkuDetails(skuDetails)
                    .build();
                
                Activity activity = getActivity();
                if (activity != null) {
                    BillingResult result = billingClient.launchBillingFlow(activity, flowParams);
                    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        pendingPurchaseCall = null;
                        call.reject("Failed to launch billing flow: " + result.getDebugMessage());
                    }
                } else {
                    pendingPurchaseCall = null;
                    call.reject("Activity not available");
                }
            } else {
                call.reject("Product not found: " + productId);
            }
        });
    }
    
    @PluginMethod
    public void restorePurchases(PluginCall call) {
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("BillingClient not initialized. Call initialize() first.");
            return;
        }
        
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            (billingResult, purchases) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    List<JSObject> purchaseList = new ArrayList<>();
                    for (Purchase purchase : purchases) {
                        JSObject purchaseObj = new JSObject();
                        purchaseObj.put("productId", purchase.getProducts().get(0));
                        purchaseObj.put("purchaseToken", purchase.getPurchaseToken());
                        purchaseObj.put("transactionReceipt", purchase.getPurchaseToken());
                        purchaseList.add(purchaseObj);
                    }
                    
                    JSObject result = new JSObject();
                    result.put("purchases", purchaseList);
                    call.resolve(result);
                } else {
                    call.reject("Failed to restore purchases: " + billingResult.getDebugMessage());
                }
            }
        );
    }
    
    // BillingClientStateListener implementation
    @Override
    public void onBillingSetupFinished(BillingResult billingResult) {
        Log.d(TAG, "Billing setup finished: " + billingResult.getResponseCode());
        
        if (pendingInitializeCall != null) {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                JSObject result = new JSObject();
                result.put("ready", true);
                pendingInitializeCall.resolve(result);
            } else {
                pendingInitializeCall.reject("Billing setup failed: " + billingResult.getDebugMessage());
            }
            pendingInitializeCall = null;
        }
    }
    
    @Override
    public void onBillingServiceDisconnected() {
        Log.w(TAG, "Billing service disconnected");
        // Try to restart connection
        if (billingClient != null) {
            billingClient.startConnection(this);
        }
    }
    
    // PurchasesUpdatedListener implementation
    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        Log.d(TAG, "Purchases updated: " + billingResult.getResponseCode());
        
        if (pendingPurchaseCall == null) {
            return;
        }
        
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                // Acknowledge purchase if needed
                if (!purchase.isAcknowledged()) {
                    AcknowledgePurchaseParams acknowledgeParams = AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(purchase.getPurchaseToken())
                        .build();
                    
                    billingClient.acknowledgePurchase(acknowledgeParams, (ackResult) -> {
                        if (ackResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                            Log.d(TAG, "Purchase acknowledged");
                        }
                    });
                }
                
                // Return purchase result
                JSObject result = new JSObject();
                result.put("purchaseToken", purchase.getPurchaseToken());
                result.put("productId", purchase.getProducts().get(0));
                result.put("transactionReceipt", purchase.getPurchaseToken());
                pendingPurchaseCall.resolve(result);
                pendingPurchaseCall = null;
                return;
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            pendingPurchaseCall.reject("User canceled purchase");
            pendingPurchaseCall = null;
        } else {
            pendingPurchaseCall.reject("Purchase failed: " + billingResult.getDebugMessage());
            pendingPurchaseCall = null;
        }
    }
}


