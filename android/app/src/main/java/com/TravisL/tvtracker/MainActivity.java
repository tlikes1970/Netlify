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

    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
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
        Insets statusBars = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
        Insets navBars = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
        Insets cutout = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout());

        lastSafeTop = Math.max(statusBars.top, cutout.top);
        lastSafeBottom = navBars.bottom;

        Log.d(
            TAG,
            "insets statusTop="
                + statusBars.top
                + " cutoutTop="
                + cutout.top
                + " navBottom="
                + navBars.bottom
                + " => safeTop="
                + lastSafeTop
                + " safeBottom="
                + lastSafeBottom
        );

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
            Insets statusBars = current.getInsets(WindowInsetsCompat.Type.statusBars());
            Insets navBars = current.getInsets(WindowInsetsCompat.Type.navigationBars());
            Insets cutout = current.getInsets(WindowInsetsCompat.Type.displayCutout());
            lastSafeTop = Math.max(statusBars.top, cutout.top);
            lastSafeBottom = navBars.bottom;
            Log.d(
                TAG,
                "syncInsetsNow safeTop=" + lastSafeTop + " safeBottom=" + lastSafeBottom
            );
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

        injectSafeAreaCss(webView, lastSafeTop, lastSafeBottom);
    }

    private static void injectSafeAreaCss(WebView webView, int safeTop, int safeBottom) {
        float density = webView.getResources().getDisplayMetrics().density;
        float safeTopCss = density > 0 ? safeTop / density : safeTop;
        float safeBottomCss = density > 0 ? safeBottom / density : safeBottom;

        Log.d(
            TAG,
            "injectSafeAreaCss density="
                + density
                + " physicalTop="
                + safeTop
                + " physicalBottom="
                + safeBottom
                + " cssTop="
                + safeTopCss
                + " cssBottom="
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
                + "r.setAttribute('data-safe-area-ready','true');"
                + "r.dispatchEvent(new CustomEvent('capacitor-safe-area',{detail:{top:"
                + safeTopCss
                + ",bottom:"
                + safeBottomCss
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
