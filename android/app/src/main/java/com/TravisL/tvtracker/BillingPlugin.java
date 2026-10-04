package com.TravisL.tvtracker;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.BiConsumer;
import org.json.JSONException;

@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener, BillingClientStateListener {
    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private PluginCall pendingInitializeCall;
    private String pendingProductId;

    @PluginMethod
    public void initialize(PluginCall call) {
        if (billingClient != null && billingClient.isReady()) { JSObject value=new JSObject(); value.put("ready",true); call.resolve(value); return; }
        if (pendingInitializeCall != null) { call.reject("Billing initialization in progress"); return; }
        pendingInitializeCall=call;
        if (billingClient == null) billingClient=BillingClient.newBuilder(getContext()).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
        billingClient.startConnection(this);
    }

    private ProductDetails.OneTimePurchaseOfferDetails buyOffer(ProductDetails product) {
        List<ProductDetails.OneTimePurchaseOfferDetails> offers=product.getOneTimePurchaseOfferDetailsList();
        if (offers == null) return null;
        for (ProductDetails.OneTimePurchaseOfferDetails offer: offers)
            if (offer.getRentalDetails() == null) return offer;
        return null;
    }

    private void query(List<String> ids, BiConsumer<BillingResult,List<ProductDetails>> callback) {
        List<QueryProductDetailsParams.Product> products=new ArrayList<>();
        for(String id:ids) products.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build());
        billingClient.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(products).build(),
            (result,details)->callback.accept(result,details.getProductDetailsList()));
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        if(billingClient==null||!billingClient.isReady()){call.reject("BillingClient not initialized. Call initialize() first.");return;}
        List<String> ids;
        try { if(call.getArray("productIds")==null)throw new JSONException("missing"); ids=call.getArray("productIds").toList(); }
        catch(JSONException error){call.reject("Invalid productIds");return;}
        query(ids,(result,details)->{
            if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK){call.reject("Failed to query products");return;}
            List<JSObject> products=new ArrayList<>();
            for(ProductDetails product:details){
                ProductDetails.OneTimePurchaseOfferDetails offer=buyOffer(product);if(offer==null)continue;
                JSObject value=new JSObject();value.put("productId",product.getProductId());value.put("title",product.getTitle());
                value.put("description",product.getDescription());value.put("price",offer.getFormattedPrice());value.put("currency",offer.getPriceCurrencyCode());products.add(value);
            }
            JSObject value=new JSObject();value.put("products",products);call.resolve(value);
        });
    }

    @PluginMethod
    public void purchase(PluginCall call){
        if(billingClient==null||!billingClient.isReady()){call.reject("BillingClient not initialized. Call initialize() first.");return;}
        if(pendingPurchaseCall!=null){call.reject("Purchase in progress");return;}
        String id=call.getString("productId"),account=call.getString("obfuscatedAccountId");
        if(!"flicklet_full_access".equals(id)||account==null||!account.matches("[a-f0-9]{64}")){call.reject("Product and account identity required");return;}
        pendingPurchaseCall=call;pendingProductId=id;
        query(Collections.singletonList(id),(result,details)->{
            ProductDetails product=details.stream().filter(p->id.equals(p.getProductId())).findFirst().orElse(null);
            ProductDetails.OneTimePurchaseOfferDetails offer=product==null?null:buyOffer(product);
            if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK||offer==null){pendingPurchaseCall=null;call.reject("Product not found: "+id);return;}
            BillingFlowParams.ProductDetailsParams item=BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).setOfferToken(offer.getOfferToken()).build();
            if(getActivity()==null){pendingPurchaseCall=null;call.reject("Activity not available");return;}
            BillingResult launched=billingClient.launchBillingFlow(getActivity(),BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(item)).setObfuscatedAccountId(account).build());
            if(launched.getResponseCode()!=BillingClient.BillingResponseCode.OK){pendingPurchaseCall=null;call.reject("Failed to launch billing flow",launched.getResponseCode()==BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED?"ITEM_ALREADY_OWNED":"BILLING_ERROR");}
        });
    }

    @PluginMethod
    public void restorePurchases(PluginCall call){
        if(billingClient==null||!billingClient.isReady()){call.reject("BillingClient not initialized. Call initialize() first.");return;}
        billingClient.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),(result,purchases)->{
            if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK){call.reject("Failed to restore purchases");return;}
            List<JSObject> values=new ArrayList<>();
            for(Purchase purchase:purchases)for(String product:purchase.getProducts()){
                JSObject value=new JSObject();value.put("productId",product);value.put("purchaseState",purchase.getPurchaseState());
                if(purchase.getPurchaseState()==Purchase.PurchaseState.PURCHASED)value.put("purchaseToken",purchase.getPurchaseToken());
                values.add(value);
            }
            JSObject value=new JSObject();value.put("purchases",values);call.resolve(value);
        });
    }

    @Override public void onBillingSetupFinished(BillingResult result){
        if(pendingInitializeCall==null)return;
        if(result.getResponseCode()==BillingClient.BillingResponseCode.OK){JSObject value=new JSObject();value.put("ready",true);pendingInitializeCall.resolve(value);}
        else pendingInitializeCall.reject("Billing setup failed: "+result.getDebugMessage());
        pendingInitializeCall=null;
    }
    @Override public void onBillingServiceDisconnected(){ /* Billing 8 reconnects on the next operation. */ }
    @Override protected void handleOnResume(){super.handleOnResume();notifyListeners("ownershipChanged",new JSObject());}
    @Override protected void handleOnDestroy(){if(billingClient!=null)billingClient.endConnection();super.handleOnDestroy();}

    // Server verifies, binds and acknowledges. Native never consumes this non-consumable.
    @Override public void onPurchasesUpdated(BillingResult result,List<Purchase> purchases){
        if(pendingPurchaseCall==null){notifyListeners("ownershipChanged",new JSObject());return;}
        PluginCall call=pendingPurchaseCall;
        if(result.getResponseCode()==BillingClient.BillingResponseCode.OK&&purchases!=null){
            for(Purchase purchase:purchases){
                if(!purchase.getProducts().contains(pendingProductId))continue;
                pendingPurchaseCall=null;JSObject value=new JSObject();value.put("productId",pendingProductId);value.put("purchaseState",purchase.getPurchaseState());
                if(purchase.getPurchaseState()==Purchase.PurchaseState.PURCHASED)value.put("purchaseToken",purchase.getPurchaseToken());
                call.resolve(value);return;
            }
        }
        pendingPurchaseCall=null;
        String code=result.getResponseCode()==BillingClient.BillingResponseCode.USER_CANCELED?"USER_CANCELED":result.getResponseCode()==BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED?"ITEM_ALREADY_OWNED":"BILLING_ERROR";
        call.reject(code.equals("USER_CANCELED")?"User canceled purchase":"Purchase failed",code);
    }
}
