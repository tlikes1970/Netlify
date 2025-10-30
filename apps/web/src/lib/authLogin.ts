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
  // ⚠️ CRITICAL: Detect iOS at the top - force popup immediately
  // iOS Safari drops OAuth params during redirects, so we must use popup
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const disableRedirect = (() => {
    try {
      return localStorage.getItem("flag:disable_redirect") === "1";
    } catch {
      return false;
    }
  })();

  // ANDROID/DESKTOP: If redirects are disabled (by flag) open popup immediately
  // Keep this path synchronous (no awaits prior) to avoid popup blockers
  if (!isIOS && disableRedirect) {
    try {
      authLogManager.log("popup_forced_no_redirect", {
        platform: navigator.userAgent,
        reason: "disable_redirect_flag",
        timestamp: new Date().toISOString(),
      });
      await signInWithPopup(auth, googleProvider);
      logger.log("[Popup] Sign-in successful (redirect disabled)");
      return;
    } catch (error) {
      logger.error("[Popup] Sign-in failed (redirect disabled)", error);
      throw error;
    }
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

  // ⚠️ iOS FORCE POPUP PATH: Open popup synchronously inside the user gesture
  // No awaits/promises before this call on iOS
  if (isIOS) {
    logger.log("[iOS] Forcing popup mode - Safari drops redirect params");
    authLogManager.log("popup_forced_ios", {
      forced: true,
      reason: "iOS Safari drops OAuth params during redirects",
      timestamp: new Date().toISOString(),
    });

    let resolved = false;
    const watchman = setTimeout(() => {
      if (!resolved) {
        try {
          authLogManager.log("popup_unresolved_after_5s", { hint: true });
          localStorage.setItem("flicklet.auth.popup.hint", "1");
          window.dispatchEvent(new CustomEvent("auth:popup-hint"));
        } catch (e) {
          // ignore
        }
      }
    }, 5000);

    const popupPromise = signInWithPopup(auth, googleProvider)
      .then(async () => {
        resolved = true;
        clearTimeout(watchman);
        try {
          localStorage.removeItem("flicklet.auth.popup.hint");
          window.dispatchEvent(new CustomEvent("auth:popup-hint"));
        } catch (e) {
          /* ignore */
        }
        authLogManager.log("popup_opened", { in_gesture: true });
        logger.log("[iOS] Popup sign-in successful");
        // Post-popup: run persistence/analytics work
        try {
          const { persistenceModuleLoadReady } = await import(
            "./firebaseBootstrap"
          );
          await persistenceModuleLoadReady.catch(() => {
            // ignore
          });
        } catch (e) {
          logger.debug(
            "[AuthLogin] persistenceModuleLoadReady post-popup noop",
            e
          );
        }
        try {
          const { setPersistence, browserLocalPersistence } = await import(
            "firebase/auth"
          );
          await setPersistence(auth, browserLocalPersistence);
          logger.debug("[AuthLogin] Persistence confirmed after popup");
        } catch (e) {
          logger.warn("[AuthLogin] Failed to set persistence after popup", e);
        }
        try {
          await ensurePersistenceBeforeAuth();
        } catch (e) {
          logger.warn(
            "[AuthLogin] ensurePersistenceBeforeAuth post-popup warning",
            e
          );
        }
        authLogManager.log("popup_result", { ok: true });
      })
      .catch((error: unknown) => {
        resolved = true;
        clearTimeout(watchman);
        logger.error("[iOS] Popup sign-in failed", error);
        authLogManager.log("popup_forced_ios_failed", {
          error: (error as any)?.message || String(error),
          code: (error as any)?.code,
        });
        authLogManager.log("popup_result", {
          ok: false,
          error: (error as any)?.code || "unknown",
        });
        throw error;
      });

    return popupPromise;
  }

  // ⚠️ PERSISTENCE (non‑iOS): Safe to run before sign-in for redirect/popup flows
  try {
    const { persistenceModuleLoadReady } = await import("./firebaseBootstrap");
    await persistenceModuleLoadReady.catch(() => {
      /* noop */ return undefined;
    });

    const { setPersistence, browserLocalPersistence } = await import(
      "firebase/auth"
    );
    await setPersistence(auth, browserLocalPersistence);
    logger.debug("[AuthLogin] Persistence confirmed set before sign-in");
  } catch (e) {
    logger.warn(
      "[AuthLogin] Failed to ensure persistence (continuing anyway)",
      e
    );
  }

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

  // ⚠️ CRITICAL: Reset redirect state and mark only if redirects are enabled
  if (!disableRedirect && !(isIOS || isSafari)) {
    // This ensures getRedirectResult() will run when we return from OAuth
    authManager.resetRedirectState();
    // Set redirecting status BEFORE starting redirect
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
    // Log but don't fail on Safari - Safari handles security differently
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      logger.warn(
        "[AUTH] Safari detected - origin validation warning (may be normal)",
        error.message
      );
      // Continue anyway - Safari's security model is different
    } else {
      authManager.setStatus("unauthenticated");
      localStorage.removeItem("flicklet.auth.status");
      logger.error("Origin validation failed before Google sign-in", error);
      throw error;
    }
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

      // Phase B: Redirect liveness probe - detect Safari stall
      // Start a 1500ms timer to detect if redirect never leaves the page
      const redirectStartTime = Date.now();
      let pagehideFired = false;
      let visibilityChangeFired = false;

      const pagehideListener = () => {
        pagehideFired = true;
        logger.log("Redirect liveness: pagehide fired - redirect initiated");
        authLogManager.log("redirect_liveness_pagehide", {
          timestamp: new Date().toISOString(),
          elapsed: Date.now() - redirectStartTime,
        });
      };

      const visibilityListener = () => {
        if (document.visibilityState === "hidden") {
          visibilityChangeFired = true;
          logger.log(
            "Redirect liveness: visibility hidden - redirect initiated"
          );
          authLogManager.log("redirect_liveness_visibility", {
            timestamp: new Date().toISOString(),
            elapsed: Date.now() - redirectStartTime,
          });
        }
      };

      window.addEventListener("pagehide", pagehideListener, { once: true });
      document.addEventListener("visibilitychange", visibilityListener, {
        once: true,
      });

      // Clean up timer if redirect succeeds
      const cleanup = () => {
        if (stuckTimer) {
          clearTimeout(stuckTimer);
        }
        window.removeEventListener("pagehide", pagehideListener);
        document.removeEventListener("visibilitychange", visibilityListener);
      };

      // ⚠️ Redirect liveness probe and auto-fallback
      // If timer fires first, redirect never left the page
      // iOS: switch to popup; Android: attempt popup as best-effort
      const stuckTimer = setTimeout(async () => {
        if (!pagehideFired && !visibilityChangeFired) {
          logger.error(
            "[CRITICAL] Redirect stuck - page never left after 1500ms"
          );
          authLogManager.log("stuck_redirect", {
            timestamp: new Date().toISOString(),
            elapsed: Date.now() - redirectStartTime,
            shouldPopupFallback: true,
            platform: navigator.userAgent,
          });

          // Auto-fallback to popup on iOS; best-effort on Android
          const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
          const isAndroid = /Android/i.test(navigator.userAgent);
          if (isIOS || isAndroid) {
            logger.log(
              "[Auto-fallback] Switching to popup mode after redirect stall"
            );
            try {
              // Clean up the redirect attempt
              cleanup();

              // Switch to popup
              await signInWithPopup(auth, googleProvider);
              logger.log(
                "[Auto-fallback] Popup sign-in successful after redirect stall"
              );
              authLogManager.log("auto_fallback_popup_success", {
                reason: "redirect_stuck",
                platform: isIOS ? "iOS" : isAndroid ? "Android" : "other",
              });
              return; // Exit early - popup succeeded
            } catch (popupError: any) {
              logger.error(
                "[Auto-fallback] Popup failed after redirect stall",
                popupError
              );
              authLogManager.log("auto_fallback_popup_failed", {
                error: popupError?.message || String(popupError),
                code: popupError?.code,
              });
              // Don't throw - let the error bubble up naturally
            }
          }
          // Clean up if popup path didn't succeed
          cleanup();
        } else {
          // Redirect succeeded - clean up listeners
          cleanup();
        }
      }, 1500);

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

      try {
        await signInWithRedirect(auth, googleProvider);
        logger.log("Redirect initiated - user will be redirected to Google");
        // Note: Page will reload after Google auth
        // cleanup() won't run if redirect succeeds (page reloads)
        // If stuckTimer fires, it will handle auto-fallback
      } catch (error) {
        cleanup(); // Clean up if redirect fails
        throw error;
      }
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
