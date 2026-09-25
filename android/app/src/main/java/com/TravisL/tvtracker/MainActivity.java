package com.TravisL.tvtracker;

import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Edge-to-edge WebView with CSS safe areas driven by WindowInsets (all Android versions).
 * IME is excluded from --safe-bottom; keyboard UX is handled in the web layer.
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "FlickletInsets";
    private static final int WEBVIEW_RETRY_MS = 50;
    private static final int WEBVIEW_RETRY_MAX = 60;

    private boolean insetListenerInstalled = false;
    private boolean jsBridgeAttached = false;
    private int lastSafeTop = 0;
    private int lastSafeBottom = 0;
    private int lastSafeLeft = 0;
    private int lastSafeRight = 0;

    private final WebViewListener safeAreaWebViewListener = new WebViewListener() {
        @Override
        public void onPageStarted(WebView webView) {
            Log.d(TAG, "WebView page started; waiting for document-ready inset sync");
        }

        @Override
        public void onPageLoaded(WebView webView) {
            Log.d(TAG, "WebView page loaded; synchronizing insets to active document");
            syncInsetsNow();
        }
    };

    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        if (getBridge() != null) {
            getBridge().addWebViewListener(safeAreaWebViewListener);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        getWindow().getDecorView().post(this::ensureInsetsPipeline);
    }

    @Override
    public void onResume() {
        super.onResume();
        getWindow().getDecorView().post(this::syncInsetsNow);
    }

    @Override
    public void onConfigurationChanged(android.content.res.Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Log.d(TAG, "configuration changed; synchronizing four-sided insets to active document");
        View decor = getWindow().getDecorView();
        decor.post(this::syncInsetsNow);
        decor.postDelayed(this::syncInsetsNow, 50);
        decor.postDelayed(this::syncInsetsNow, 250);
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            super.onBackPressed();
            return;
        }

        String js =
            "(function(){"
                + "var event=new CustomEvent('flicklet:android-back',{cancelable:true});"
                + "return window.dispatchEvent(event)===false;"
                + "})();";
        webView.evaluateJavascript(js, handled -> {
            if (!"true".equals(handled)) {
                MainActivity.super.onBackPressed();
            }
        });
    }

    private void ensureInsetsPipeline() {
        if (!insetListenerInstalled) {
            insetListenerInstalled = true;
            View decor = getWindow().getDecorView();
            ViewCompat.setOnApplyWindowInsetsListener(decor, (view, windowInsets) -> {
                updateInsetsFrom(windowInsets);
                return windowInsets;
            });
            ViewCompat.requestApplyInsets(decor);
            Log.d(TAG, "Installed decorView inset listener");
        }

        attachWebSyncBridgeWithRetry(0);
        syncInsetsNow();
    }

    private void updateInsetsFrom(WindowInsetsCompat windowInsets) {
        captureSafeArea(windowInsets, "insets");
        applyInsetsToWebView();
    }

    private void syncInsetsNow() {
        if (!insetListenerInstalled) {
            ensureInsetsPipeline();
            return;
        }

        View decor = getWindow().getDecorView();
        WindowInsetsCompat current = ViewCompat.getRootWindowInsets(decor);
        if (current != null) {
            captureSafeArea(current, "syncInsetsNow");
        } else {
            Log.d(TAG, "syncInsetsNow: root insets null, requesting apply");
            ViewCompat.requestApplyInsets(decor);
        }

        applyInsetsToWebView();
    }

    private void attachWebSyncBridgeWithRetry(int attempt) {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            if (attempt < WEBVIEW_RETRY_MAX) {
                getWindow()
                    .getDecorView()
                    .postDelayed(() -> attachWebSyncBridgeWithRetry(attempt + 1), WEBVIEW_RETRY_MS);
            } else {
                Log.w(TAG, "WebView not available after retries");
            }
            return;
        }

        if (!jsBridgeAttached) {
            jsBridgeAttached = true;
            webView.addJavascriptInterface(new SafeAreaSyncBridge(), "FlickletNativeInsets");
            Log.d(TAG, "Attached FlickletNativeInsets JS bridge");
        }

        applyInsetsToWebView();
    }

    private void applyInsetsToWebView() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            return;
        }

        injectSafeAreaCss(webView, lastSafeTop, lastSafeBottom, lastSafeLeft, lastSafeRight);
    }

    /**
     * One coherent safe-area state: top/bottom keep the verified Fix 1–3 rules;
     * left/right take the max of status bars, navigation bars, and display cutout.
     */
    private void captureSafeArea(WindowInsetsCompat windowInsets, String source) {
        Insets statusBars = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
        Insets navBars = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
        Insets cutout = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout());

        lastSafeTop = Math.max(statusBars.top, cutout.top);
        lastSafeBottom = navBars.bottom;
        lastSafeLeft = Math.max(Math.max(statusBars.left, navBars.left), cutout.left);
        lastSafeRight = Math.max(Math.max(statusBars.right, navBars.right), cutout.right);

        Log.d(
            TAG,
            source
                + " status="
                + statusBars.left
                + ","
                + statusBars.top
                + ","
                + statusBars.right
                + ","
                + statusBars.bottom
                + " nav="
                + navBars.left
                + ","
                + navBars.top
                + ","
                + navBars.right
                + ","
                + navBars.bottom
                + " cutout="
                + cutout.left
                + ","
                + cutout.top
                + ","
                + cutout.right
                + ","
                + cutout.bottom
                + " => physical LTRB="
                + lastSafeLeft
                + ","
                + lastSafeTop
                + ","
                + lastSafeRight
                + ","
                + lastSafeBottom
        );
    }

    private static float toCssPixels(int physicalPx, float density) {
        return density > 0 ? physicalPx / density : physicalPx;
    }

    private static void injectSafeAreaCss(
        WebView webView,
        int safeTop,
        int safeBottom,
        int safeLeft,
        int safeRight
    ) {
        float density = webView.getResources().getDisplayMetrics().density;
        float safeTopCss = toCssPixels(safeTop, density);
        float safeBottomCss = toCssPixels(safeBottom, density);
        float safeLeftCss = toCssPixels(safeLeft, density);
        float safeRightCss = toCssPixels(safeRight, density);

        Log.d(
            TAG,
            "injectSafeAreaCss density="
                + density
                + " physicalLTRB="
                + safeLeft
                + ","
                + safeTop
                + ","
                + safeRight
                + ","
                + safeBottom
                + " cssLTRB="
                + safeLeftCss
                + ","
                + safeTopCss
                + ","
                + safeRightCss
                + ","
                + safeBottomCss
        );

        String js =
            "(function(){"
                + "var r=document.documentElement;"
                + "if(!r)return;"
                + "r.classList.add('capacitor-native');"
                + "r.classList.add('capacitor-android');"
                + "r.style.setProperty('--safe-top','"
                + safeTopCss
                + "px');"
                + "r.style.setProperty('--safe-bottom','"
                + safeBottomCss
                + "px');"
                + "r.style.setProperty('--safe-left','"
                + safeLeftCss
                + "px');"
                + "r.style.setProperty('--safe-right','"
                + safeRightCss
                + "px');"
                + "r.setAttribute('data-safe-area-ready','true');"
                + "r.dispatchEvent(new CustomEvent('capacitor-safe-area',{detail:{top:"
                + safeTopCss
                + ",bottom:"
                + safeBottomCss
                + ",left:"
                + safeLeftCss
                + ",right:"
                + safeRightCss
                + "}}));"
                + "})();";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private final class SafeAreaSyncBridge {
        @JavascriptInterface
        public void requestSync() {
            runOnUiThread(MainActivity.this::syncInsetsNow);
        }
    }
}
