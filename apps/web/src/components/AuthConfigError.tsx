/**
 * Process: Auth Config Error Surface
 * Purpose: Display friendly error message when auth configuration fails (domain mismatch, etc.)
 * Data Source: auth:config-error custom event
 * Update Path: Listen for auth:config-error event and render
 * Dependencies: verifyAuthEnvironment, signInWithPopup
 */

import { useEffect, useState } from "react";
import { verifyAuthEnvironment } from "@/lib/firebaseBootstrap";
import { signInWithPopup, auth, googleProvider } from "@/lib/firebaseBootstrap";
import { logger } from "@/lib/logger";

interface AuthConfigError {
  error: string;
  code: string;
  timestamp: string;
}

interface OriginMismatchError {
  got: string;
  expected: string;
  message: string;
}

interface RedirectEmptyError {
  message: string;
}

export default function AuthConfigError() {
  const [error, setError] = useState<AuthConfigError | null>(null);
  const [originMismatch, setOriginMismatch] =
    useState<OriginMismatchError | null>(null);
  const [redirectEmpty, setRedirectEmpty] = useState<RedirectEmptyError | null>(
    null
  );
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleError = (e: CustomEvent<AuthConfigError>) => {
      setError(e.detail);
      setShowPopup(true);
    };

    const handleOriginMismatch = (e: CustomEvent<OriginMismatchError>) => {
      setOriginMismatch(e.detail);
      setShowPopup(true);
    };

    const handleRedirectEmpty = (e: CustomEvent<RedirectEmptyError>) => {
      setRedirectEmpty(e.detail);
      setShowPopup(true);
    };

    window.addEventListener("auth:config-error", handleError as EventListener);
    window.addEventListener(
      "auth:origin-mismatch",
      handleOriginMismatch as EventListener
    );
    window.addEventListener(
      "auth:redirect-empty",
      handleRedirectEmpty as EventListener
    );

    return () => {
      window.removeEventListener(
        "auth:config-error",
        handleError as EventListener
      );
      window.removeEventListener(
        "auth:origin-mismatch",
        handleOriginMismatch as EventListener
      );
      window.removeEventListener(
        "auth:redirect-empty",
        handleRedirectEmpty as EventListener
      );
    };
  }, []);

  const handlePopupSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowPopup(false);
      setError(null);
    } catch (err: any) {
      logger.error("[AuthConfigError] Popup sign-in failed:", err);
      // Error will be shown via the error state
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    setError(null);
    setOriginMismatch(null);
    setRedirectEmpty(null);
  };

  const handleTryPopup = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("authMode", "popup");
    window.location.href = url.toString();
    // Function intentionally has side effect (navigation)
  };

  if (!showPopup || (!error && !originMismatch && !redirectEmpty)) {
    return null;
  }

  const env = verifyAuthEnvironment();
  const isNonCanonical = env.recommendPopup;

  // Show redirect empty banner (non-blocking)
  if (redirectEmpty) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 p-4"
        style={{
          backgroundColor: "#ffc107",
          color: "#000",
          borderBottom: "2px solid #ff9800",
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <strong>{redirectEmpty.message}</strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTryPopup}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                color: "#000",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
              }}
            >
              Try Popup Sign-In
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                color: "#000",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show origin mismatch banner (non-blocking)
  if (originMismatch) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 p-4"
        style={{
          backgroundColor: "#dc3545",
          color: "white",
          borderBottom: "2px solid #c82333",
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <strong>Auth return origin mismatch:</strong> got{" "}
            {originMismatch.got} expected {originMismatch.expected}. Check OAuth
            Authorized domains and Firebase authDomain.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePopupSignIn}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.2)";
              }}
            >
              Retry with Popup
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.2)";
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={handleDismiss}
    >
      <div
        className="max-w-md w-full rounded-lg p-6"
        style={{
          backgroundColor: "var(--menu-bg)",
          border: "1px solid var(--menu-border)",
          color: "var(--menu-text)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-semibold mb-3"
          style={{ color: "var(--text)" }}
        >
          Sign-in Configuration Issue
        </h2>

        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {isNonCanonical
            ? "This preview domain isn't authorized for redirect sign-in. Use popup sign-in instead."
            : "This domain isn't authorized for Google sign-in. Use the popup sign-in or try the production site."}
        </p>

        {error && error.code && (
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Error: {error.code}
          </p>
        )}

        <div className="flex gap-3">
          {isNonCanonical && (
            <button
              onClick={handlePopupSignIn}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "white",
              }}
            >
              Sign in with Popup
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              border: "1px solid var(--line)",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
