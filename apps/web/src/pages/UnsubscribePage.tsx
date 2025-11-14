/**
 * Process: Unsubscribe Page
 * Purpose: Handle email digest unsubscribe requests via token
 * Data Source: URL query params (token), Firebase callable function
 * Update Path: Calls unsubscribe callable function to update user document
 * Dependencies: firebase/functions, firebase/firestore
 */

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebaseBootstrap';

type UnsubscribeStatus = 'loading' | 'success' | 'error' | 'idle';

export default function UnsubscribePage() {
  const [status, setStatus] = useState<UnsubscribeStatus>('idle');
  const [message, setMessage] = useState<string>('');

  const handleUnsubscribe = async (unsubscribeToken: string) => {
    setStatus('loading');
    setMessage('Processing unsubscribe request...');

    try {
      const unsubscribeFunction = httpsCallable<{ token: string }, { message: string }>(functions, 'unsubscribe');
      const result = await unsubscribeFunction({ token: unsubscribeToken });
      
      setStatus('success');
      setMessage(result.data?.message || 'You have been successfully unsubscribed from the weekly email digest.');
    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      setStatus('error');
      
      // Handle specific error types
      if (error.code === 'functions/invalid-argument') {
        setMessage('Invalid or expired unsubscribe link. Please contact support if you continue to receive emails.');
      } else if (error.code === 'functions/internal') {
        setMessage('An error occurred while processing your unsubscribe request. Please try again later or contact support.');
      } else {
        setMessage(error.message || 'Failed to unsubscribe. Please try again later.');
      }
    }
  };

  useEffect(() => {
    // Get token from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Missing unsubscribe token. Please check your email link.');
      return;
    }

    // Auto-process unsubscribe when component mounts with valid token
    handleUnsubscribe(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-md w-full bg-card border border-line rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Unsubscribe from Email Digest</h1>
          <p className="text-muted-foreground text-sm">
            Manage your email preferences
          </p>
        </div>

        {status === 'loading' && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-500">Successfully Unsubscribed</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground">
              You will no longer receive weekly email digests. You can resubscribe anytime from your Settings page.
            </p>
            <div className="mt-6">
              <a
                href="/"
                className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Return to Flicklet
              </a>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-500">Unable to Unsubscribe</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                If you continue to receive emails, you can also unsubscribe from your Settings page.
              </p>
              <div className="flex gap-2 justify-center">
                <a
                  href="/"
                  className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Return to Flicklet
                </a>
                <a
                  href="/settings"
                  className="inline-block px-4 py-2 border border-line rounded-lg hover:opacity-90 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    // Open settings modal if available
                    window.dispatchEvent(new CustomEvent('openSettings'));
                  }}
                >
                  Open Settings
                </a>
              </div>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No unsubscribe token provided. Please use the link from your email.
            </p>
            <div className="mt-6">
              <a
                href="/"
                className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Return to Flicklet
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

