import { signInWithRedirect, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebaseBootstrap";
import { logger } from "./logger";
import { authManager } from "./auth";
import { markAuthInFlight } from "./authBroadcast";
import { ensurePersistenceBeforeAuth } from "./persistence";
import { authLogManager } from "./authLog";

/**
 * Detects if we're in a WebView or standalone PWA
 */
function isWebView(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  const isInAppBrowser =
    ua.includes("wv") || // Android WebView
    ua.includes("FBAN") || // Facebook App Browser
    ua.includes("FBAV") || // Facebook App Browser
    ua.includes("Instagram") || // Instagram in-app
    ua.includes("Line/") || // Line in-app
    ua.includes("Twitter") || // Twitter in-app
    ua.includes("TikTok") || // TikTok in-app
    ua.includes("GSA/") || // Google Search App
    ua.includes("EdgA") || // Edge Android WebView
    (ua.includes("Electron") && !ua.includes("Chrome/91")); // Electron without modern Chrome

  const isStandalone =
    window.matchMedia &&
    window.matchMedia("(display-mode: standalone)").matches;

  // Only treat true in-app browsers/webviews or installed PWA as webview context
  return isInAppBrowser || isStandalone;
}

/**
 * Google sign-in helper that uses redirect on mobile/webview and popup on desktop
 */
export async function googleLogin() {
  // Reliable UA checks
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Android/i.test(ua);
  const disableRedirect = (() => {
    try {
      return localStorage.getItem("flag:disable_redirect") === "1";
    } catch {
      return false;
    }
  })();

  // iOS or Safari: synchronous popup, minimal work before call
  if (isIOS || isSafari) {
    await signInWithPopup(auth, googleProvider);
    return;
  }

  // Minimal UI/logging allowed before popup opens (within user gesture)
  try {
    authLogManager.log("tap_started", { user_gesture: true });
    authLogManager.log("popup_open_in_user_gesture", {
      popup_open_in_user_gesture: true,
    });
  } catch (e) {
    logger.debug("[AuthLogin] Failed to log popup_open_in_user_gesture", e);
  }

  // ANDROID/DESKTOP: If redirects are disabled (by flag) open popup immediately
  // Keep this path as early as possible to avoid popup blockers
  if (!isIOS && disableRedirect) {
    await signInWithPopup(auth, googleProvider);
    return;
  }

  // ⚠️ PERSISTENCE (non‑iOS): Safe to run before sign-in for redirect/popup flows
  // (Bootstrap sets Firebase persistence once; we only ensure browser storage viability here if needed)

  // Also ensure IndexedDB/localStorage availability
  await ensurePersistenceBeforeAuth();

  // Auto-clear redirecting sticky if page doesn't actually leave within 5s
  try {
    const startedAt = Date.now();
    setTimeout(() => {
      try {
        const persisted = localStorage.getItem("flicklet.auth.status");
        const elapsed = Date.now() - startedAt;
        const pageHidden = document.visibilityState === "hidden";
        if (persisted === "redirecting" && !pageHidden) {
          localStorage.removeItem("flicklet.auth.status");
          authLogManager.log("redirect_label_cleared", {
            elapsedMs: elapsed,
            reason: "no_pagehide_in_5s",
          });
          logger.warn(
            "[AuthLogin] Cleared stale redirecting label after 5s (page never left)"
          );
        }
      } catch (e) {
        // ignore
      }
    }, 5000);
  } catch (e) {
    // ignore
  }

  // ⚠️ CRITICAL: Clean URL of debug params before redirect
  // Safari and Firebase may reject OAuth redirects with unexpected query params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("debugAuth")) {
    urlParams.delete("debugAuth");
    const cleanUrl =
      window.location.pathname +
      (urlParams.toString() ? `?${urlParams.toString()}` : "") +
      window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
    logger.debug("Removed debugAuth param from URL before redirect");
  }

  // Mark redirecting only if redirects are enabled
  if (!disableRedirect && !(isIOS || isSafari)) {
    authManager.setStatus("redirecting");
  }

  // Generate unique state ID for integrity check
  const stateId = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Persist status only if redirect is enabled
  if (!disableRedirect && !(isIOS || isSafari)) {
    try {
      localStorage.setItem("flicklet.auth.status", "redirecting");
      localStorage.setItem("flicklet.auth.stateId", stateId);
      localStorage.setItem(
        "flicklet.auth.redirect.start",
        Date.now().toString()
      );
      logger.debug(`Set status to redirecting with stateId: ${stateId}`);
      // Broadcast to other tabs
      markAuthInFlight("redirecting");
    } catch (e) {
      logger.warn("Failed to persist auth status", e);
    }
  }

  // Validate origin before proceeding
  // Note: Safari may show security warnings during OAuth - this is normal
  try {
    validateOAuthOrigin();
  } catch (error: any) {
    logger.warn("[AUTH] Origin validation warning", error?.message || error);
  }

  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  // Log and save to localStorage before redirect
  const logData = {
    method: isLocalhost ? "popup" : "redirect",
    origin: window.location.origin,
    fullUrl: window.location.href,
    timestamp: new Date().toISOString(),
    isIOS: false, // iOS path already handled above
    isLocalhost,
  };

  logger.log(
    "Google sign-in method",
    isLocalhost ? "popup (localhost)" : "redirect (desktop/Android)"
  );
  logger.debug("Current origin", window.location.origin);
  logger.debug("Is localhost", isLocalhost);

  try {
    // LOCALHOST WORKAROUND: Use popup mode even if webview would use redirect
    // This avoids Firebase's redirect handler issues with localhost
    if (isLocalhost) {
      logger.log(
        "Localhost detected - using popup mode to avoid Firebase redirect issues"
      );
      await signInWithPopup(auth, googleProvider);
      logger.log("Popup sign-in successful");
      return;
    }

    // Desktop/Android: Use redirect flow for webviews, popup for regular browsers
    let useRedirect = isWebView();
    if (disableRedirect || isSafari) {
      useRedirect = false;
      logger.warn(
        "[AuthLogin] Redirect disabled (flag or Safari) - using popup"
      );
    }
    if (useRedirect) {
      logger.log("Starting redirect sign-in (webview/Android)");
      // Mark that we initiated a redirect so the app can process the result once
      try {
        sessionStorage.setItem('flk:didRedirect', '1');
      } catch (e) { /* noop */ }

      // Save to localStorage before redirect so we can see it after page reload
      try {
        const existingLogs = JSON.parse(
          localStorage.getItem("auth-debug-logs") || "[]"
        );
        existingLogs.push({ type: "redirect-start", ...logData });
        localStorage.setItem(
          "auth-debug-logs",
          JSON.stringify(existingLogs.slice(-10))
        ); // Keep last 10 entries
        logger.debug("Saved debug log to localStorage");
      } catch (e) {
        logger.error("Failed to save debug log", e);
      }

      await signInWithRedirect(auth, googleProvider);
      logger.log("Redirect initiated - user will be redirected to Google");
    } else {
      logger.log("Starting popup sign-in (desktop browser)");
      await signInWithPopup(auth, googleProvider);
      logger.log("Popup sign-in successful");
    }
  } catch (error: any) {
    logger.error("Google sign-in failed", error);
    logger.debug("Error code", error.code);
    logger.debug("Error message", error.message);

    // Save error to localStorage
    try {
      const existingLogs = JSON.parse(
        localStorage.getItem("auth-debug-logs") || "[]"
      );
      existingLogs.push({
        type: "error",
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(
        "auth-debug-logs",
        JSON.stringify(existingLogs.slice(-10))
      );
    } catch (e) {
      // ignore
    }

    // If popup fails with blocked error, fallback to redirect only when allowed
    if (
      (error.code === "auth/popup-blocked" ||
        error.code === "auth/popup-closed-by-user") &&
      !disableRedirect &&
      !(isIOS || isSafari)
    ) {
      logger.warn("Popup blocked, falling back to redirect (allowed)");
      return signInWithRedirect(auth, googleProvider);
    }

    throw error;
  }
}

/**
 * Normalize origin to canonical form (remove www, ensure https)
 */
function normalizeOrigin(origin: string): string {
  let normalized = origin.toLowerCase();
  // Remove www prefix for consistency
  if (normalized.startsWith("https://www.")) {
    normalized = normalized.replace("https://www.", "https://");
  }
  if (normalized.startsWith("http://www.")) {
    normalized = normalized.replace("http://www.", "http://");
  }
  return normalized;
}

/**
 * Validates the current origin against allowed OAuth origins
 * @returns true if origin is valid, throws error if invalid
 * @throws Error if origin is not authorized
 */
export function validateOAuthOrigin(): boolean {
  if (typeof window === "undefined") return true;

  const origin = window.location.origin;
  const normalized = normalizeOrigin(origin);

  // Known allowed origins (canonical form, no www)
  const allowedOrigins = new Set([
    "http://localhost",
    "http://localhost:8888",
    "http://127.0.0.1:8888",
    "http://192.168.50.56:8888",
    "https://flicklet.netlify.app",
    "https://flicklet-71dff.web.app",
    "https://flicklet-71dff.firebaseapp.com",
  ]);

  // Also allow any netlify.app subdomain (for preview deployments)
  const isNetlifyApp =
    normalized.includes(".netlify.app") || normalized.includes(".netlify.com");

  // Normalize and check
  const normalizedAllowed = Array.from(allowedOrigins).map(normalizeOrigin);
  const isAllowed = normalizedAllowed.includes(normalized) || isNetlifyApp;

  if (!isAllowed) {
    const errorMsg = `Unauthorized origin: ${origin} (normalized: ${normalized}). Please configure this origin in Firebase Console.`;
    logger.error("[AUTH] Origin validation failed", { origin, normalized });
    logger.warn(
      "[AUTH] If this is a Netlify preview deployment, add it to Firebase authorized domains"
    );
    throw new Error(errorMsg);
  }

  if (isNetlifyApp && !normalizedAllowed.includes(normalized)) {
    logger.warn(
      `[AUTH] Netlify preview domain detected: ${origin}. Consider adding to Firebase authorized domains.`
    );
  }

  logger.log("[AUTH] Origin validated", { original: origin, normalized });
  return true;
}

/**
 * Logs the current origin to help verify OAuth configuration
 * @deprecated Use validateOAuthOrigin() instead
 */
export function logAuthOriginHint() {
  try {
    validateOAuthOrigin();
  } catch (error) {
    // Silently fail for logging purposes
    logger.warn("Origin validation warning", error);
  }
}
