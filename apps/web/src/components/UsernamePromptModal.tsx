import React, { useEffect, useState } from 'react';
import { useUsername } from '../hooks/useUsername';
import { useTranslations } from '../lib/language';
import { useAuth } from '../hooks/useAuth';
import ModalPortal from './ModalPortal';
import { ensureUsernameChosen } from '../features/username/usernameFlow';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebaseBootstrap';

interface UsernamePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'working' | 'error' | 'done';

export default function UsernamePromptModal({ isOpen, onClose }: UsernamePromptModalProps) {
  const { user } = useAuth();
  const { updateUsername, skipUsernamePrompt } = useUsername();
  const translations = useTranslations();
  const [username, setUsername] = useState('');
  // ⚠️ FIXED: Initialize state as 'done' (ready for input) instead of 'working' (spinner)
  // 'working' should only be used when actively saving, not when modal first opens
  const [state, setState] = useState<ModalState>('done');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  
  // ⚠️ FIXED: Reset state when modal opens to ensure it's ready for input
  useEffect(() => {
    if (isOpen) {
      setState('done'); // Ready for input, not 'working'
      setError(null);
      setErrorCode(null);
      setUsername(''); // Reset username input
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const { style } = document.documentElement;
    const prev = style.overflow;
    style.overflow = 'hidden';
    return () => { style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError(translations.usernameRequired || 'Username is required');
      setErrorCode('NO_CANDIDATE');
      setState('error');
      return;
    }

    setState('working');
    setError(null);
    setErrorCode(null);

    try {
      await ensureUsernameChosen(async () => username.trim());
      // Also update the hook's state for consistency
      await updateUsername(username.trim());
      setState('done');
      setTimeout(() => onClose(), 300);
    } catch (error: any) {
      console.error('Failed to claim username:', error);
      const code = error?.code || 'UNKNOWN_ERROR';
      setErrorCode(code);
      setError(error.message || 'Failed to save username');
      setState('error');
    }
  };

  const handleSkip = async () => {
    setState('working');
    setError(null);
    setErrorCode(null);

    try {
      await skipUsernamePrompt();
      setState('done');
      setTimeout(() => onClose(), 300);
    } catch (error: any) {
      console.error('Failed to skip username prompt:', error);
      const code = error?.code || 'UNKNOWN_ERROR';
      setErrorCode(code);
      setError(error.message || 'Failed to skip username prompt');
      setState('error');
    }
  };

  const handleRetry = () => {
    setState('working');
    setError(null);
    setErrorCode(null);
    setUsername('');
  };

  const handleSignInAgain = async () => {
    setState('working');
    setError(null);
    setErrorCode(null);

    try {
      await signInWithPopup(auth, googleProvider);
      // After successful sign-in, auth state will update and modal should close
      setState('done');
      setTimeout(() => onClose(), 300);
    } catch (error: any) {
      console.error('Failed to sign in:', error);
      setErrorCode(error?.code || 'SIGNIN_FAILED');
      setError('Failed to sign in. Please try again.');
      setState('error');
    }
  };

  const getSuggestedName = (): string => {
    if (!user) return '';
    
    // Use Firebase displayName or email prefix as suggestion
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={translations.whatShouldWeCallYou || 'Choose a username'}
        className="username-prompt-modal-overlay fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-48 p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div
          className="username-prompt-modal-content rounded-xl w-full max-w-md p-6"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
        >
          
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
              {translations.welcomeToFlicklet || 'Welcome to Flicklet!'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {translations.whatShouldWeCallYou || 'What should we call you?'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                {translations.username || 'Username'}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={getSuggestedName()}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--btn)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                  border: '1px solid'
                }}
                autoFocus
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {translations.usernameDescription || 'This will be used for personalized messages'}
              </p>
            </div>

            {error && state === 'error' && (
              <div className="p-3 rounded-lg text-sm" 
                   style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}>
                <div className="mb-2">{error}</div>
                {errorCode === 'USERNAME_TAKEN' && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-sm underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Try a different username
                  </button>
                )}
                {errorCode === 'AUTH_NOT_SIGNED_IN' && (
                  <button
                    type="button"
                    onClick={handleSignInAgain}
                    className="text-sm underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Sign in again
                  </button>
                )}
                {(errorCode === 'USERNAME_TIMEOUT' || errorCode === 'NO_CANDIDATE') && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-sm underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {state === 'done' && username.trim() && (
              <div className="p-3 rounded-lg text-sm" 
                   style={{ backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb', border: '1px solid' }}>
                ✓ Username saved successfully!
              </div>
            )}

            {/* Hide buttons when success message is shown (modal will auto-close) */}
            {!(state === 'done' && username.trim()) && (
              <div className="flex gap-3">
                {state !== 'error' && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={state === 'working'}
                    className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                  >
                    {state === 'working' ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        {translations.saving || 'Saving...'}
                      </div>
                    ) : (
                      translations.skip || 'Skip'
                    )}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={state === 'working' || !username.trim()}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  {state === 'working' ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      {translations.saving || 'Saving...'}
                    </div>
                  ) : (
                    translations.save || 'Save'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}