/**
 * Process: Auth Config Error Surface
 * Purpose: Display friendly error message when auth configuration fails (domain mismatch, etc.)
 * Data Source: auth:config-error custom event
 * Update Path: Listen for auth:config-error event and render
 * Dependencies: verifyAuthEnvironment, signInWithPopup
 */

import { useEffect, useState } from 'react';
import { verifyAuthEnvironment } from '@/lib/firebaseBootstrap';
import { signInWithPopup, auth, googleProvider } from '@/lib/firebaseBootstrap';
import { logger } from '@/lib/logger';

interface AuthConfigError {
  error: string;
  code: string;
  timestamp: string;
}

export default function AuthConfigError() {
  const [error, setError] = useState<AuthConfigError | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleError = (e: CustomEvent<AuthConfigError>) => {
      setError(e.detail);
      setShowPopup(true);
    };

    window.addEventListener('auth:config-error', handleError as EventListener);

    return () => {
      window.removeEventListener('auth:config-error', handleError as EventListener);
    };
  }, []);

  const handlePopupSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowPopup(false);
      setError(null);
    } catch (err: any) {
      logger.error('[AuthConfigError] Popup sign-in failed:', err);
      // Error will be shown via the error state
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    setError(null);
  };

  if (!showPopup || !error) {
    return null;
  }

  const env = verifyAuthEnvironment();
  const isNonCanonical = env.recommendPopup;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleDismiss}
    >
      <div
        className="max-w-md w-full rounded-lg p-6"
        style={{
          backgroundColor: 'var(--menu-bg)',
          border: '1px solid var(--menu-border)',
          color: 'var(--menu-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Sign-in Configuration Issue
        </h2>
        
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          {isNonCanonical
            ? "This preview domain isn't authorized for redirect sign-in. Use popup sign-in instead."
            : "This domain isn't authorized for Google sign-in. Use the popup sign-in or try the production site."}
        </p>

        {error.code && (
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            Error: {error.code}
          </p>
        )}

        <div className="flex gap-3">
          {isNonCanonical && (
            <button
              onClick={handlePopupSignIn}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
              }}
            >
              Sign in with Popup
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--btn)',
              color: 'var(--text)',
              border: '1px solid var(--line)',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}


