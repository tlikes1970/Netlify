import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslations } from '../lib/language';
import type { AuthProvider } from '../lib/auth.types';
import ModalPortal from './ModalPortal';
import { googleLogin } from '../lib/authLogin';
import { logger } from '../lib/logger';

// Detect if we're in a blocked OAuth context
function isBlockedOAuthContext(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent || '';
  const isPWAStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const isInAppBrowser = 
    ua.includes('wv') ||          // Android WebView
    ua.includes('FBAN') ||         // Facebook App Browser
    ua.includes('FBAV') ||         // Facebook App Browser
    ua.includes('Instagram') ||    // Instagram in-app
    ua.includes('Line/') ||        // Line in-app
    ua.includes('Twitter') ||      // Twitter in-app
    ua.includes('TikTok') ||       // TikTok in-app
    ua.includes('GSA/') ||         // Google Search App
    ua.includes('EdgA') ||         // Edge Android WebView
    (ua.includes('Electron') && !ua.includes('Chrome/91')); // Electron without modern Chrome
  
  const isStandalone = (window as any).standalone || isPWAStandalone;
  
  return isStandalone || isInAppBrowser;
}

function getOpenInBrowserURL(): string {
  const currentURL = window.location.href;
  const url = new URL(currentURL);
  url.searchParams.set('redirect_bounce', '1');
  return url.toString();
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithProvider, signInWithEmail: signInEmail, createAccountWithEmail } = useAuth();
  const translations = useTranslations();
  const [loading, setLoading] = useState<AuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBlocked] = useState(() => isBlockedOAuthContext());
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowEmailForm(false);
      setEmail('');
      setPassword('');
      setError(null);
      return;
    }
    const { style } = document.documentElement;
    const prev = style.overflow;
    style.overflow = 'hidden';
    return () => { style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderSignIn = async (provider: AuthProvider) => {
    console.log(`🔐 AuthModal: handleProviderSignIn called with provider: ${provider}`);
    console.log(`📍 Current origin: ${window.location.origin}`);
    console.log(`📍 Full URL: ${window.location.href}`);
    
    if (isBlocked) {
      console.log(`🔐 AuthModal: Blocked context detected, not attempting sign-in`);
      return;
    }
    
    setLoading(provider);
    setError(null);
    
    try {
      console.log(`🔐 AuthModal: Calling sign-in for ${provider}`);
      
      // Use the new googleLogin helper for Google sign-in
      if (provider === 'google') {
        console.log('🔐 Using googleLogin helper...');
        await googleLogin();
        console.log('✅ googleLogin returned successfully');
      } else {
        // Fall back to authManager for other providers (Apple, email)
        console.log('🔐 Using authManager for non-Google provider...');
        await signInWithProvider(provider);
      }
      
      console.log(`🔐 AuthModal: ${provider} sign-in completed successfully`);
      // Close modal after successful sign-in (popup or regular flow)
      // For redirect flow, the page will reload anyway so modal state doesn't matter
      onClose();
    } catch (error: any) {
      console.error(`🔐 AuthModal: ${provider} sign-in failed:`, error);
      
      if (error.message === 'OAUTH_BLOCKED') {
        setError('blocked');
      } else {
        setError(error.message || 'Sign-in failed. Please try again.');
      }
      setLoading(null);
    }
  };

  const handleEmailSignIn = () => {
    setShowEmailForm(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading('email');
      
      if (isCreatingAccount) {
        logger.log('Creating account', { email });
        await createAccountWithEmail(email, password);
        logger.log('Account creation successful');
      } else {
        logger.log('Attempting email sign-in', { email });
        await signInEmail(email, password);
        logger.log('Email sign-in successful');
      }
      
      onClose();
      setShowEmailForm(false);
    } catch (error: any) {
      logger.error(isCreatingAccount ? 'Account creation failed' : 'Email sign-in failed', error);
      
      // For invalid-credential errors during sign-in, suggest creating account
      if (error.code === 'auth/invalid-credential' && !isCreatingAccount) {
        setError('Invalid email or password. No account found. Would you like to create one?');
      } else {
        setError(error.message || (isCreatingAccount ? 'Account creation failed' : 'Sign-in failed. Please try again.'));
      }
      
      setLoading(null);
    }
  };

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={translations.signIn || 'Sign In'}
        className="auth-modal-overlay fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-48 p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div
          className="auth-modal-content rounded-xl w-full max-w-md p-6 relative z-10"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {translations.signIn || 'Sign In'}
            </h3>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error === 'blocked' ? (
            <div className="mb-4 p-4 rounded-lg" 
                 style={{ backgroundColor: '#fff3cd', borderColor: '#ffc107', border: '2px solid' }}>
              <p className="mb-2 font-semibold" style={{ color: '#856404' }}>
                Sign-in needs your device's browser
              </p>
              <p className="mb-3 text-sm" style={{ color: '#856404' }}>
                This screen is an embedded browser, which Google doesn't allow for security reasons. 
                Tap 'Open in browser' to continue securely.
              </p>
              <a
                href={getOpenInBrowserURL()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg font-semibold text-center"
                style={{ backgroundColor: '#ffc107', color: '#000' }}
              >
                Open in Browser
              </a>
            </div>
          ) : error ? (
            <div className="mb-4 p-3 rounded-lg text-sm" 
                 style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}>
              {error}
            </div>
          ) : null}

          {showEmailForm ? (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--btn)', 
                    color: 'var(--text)', 
                    borderColor: 'var(--line)',
                    outline: 'none'
                  }}
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--btn)', 
                    color: 'var(--text)', 
                    borderColor: 'var(--line)',
                    outline: 'none'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmail('');
                    setPassword('');
                    setError(null);
                    setIsCreatingAccount(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                  style={{ 
                    backgroundColor: 'var(--btn)', 
                    color: 'var(--text)', 
                    borderColor: 'var(--line)',
                    touchAction: 'manipulation'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading === 'email'}
                  className="flex-1 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: '#fff', 
                    border: 'none',
                    touchAction: 'manipulation'
                  }}
                >
                  {loading === 'email' 
                    ? (isCreatingAccount ? 'Creating...' : 'Signing in...') 
                    : (isCreatingAccount ? 'Create Account' : 'Sign In')}
                </button>
              </div>
              
              {!isCreatingAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingAccount(true);
                    setError(null);
                  }}
                  className="w-full text-sm text-center underline"
                  style={{ color: 'var(--muted)' }}
                >
                  Don't have an account? Create one
                </button>
              )}
              
              {isCreatingAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingAccount(false);
                    setError(null);
                  }}
                  className="w-full text-sm text-center underline"
                  style={{ color: 'var(--muted)' }}
                >
                  Already have an account? Sign in
                </button>
              )}
            </form>
          ) : (

          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('🔐 AuthModal: Google button clicked');
                if (!isBlocked) {
                  handleProviderSignIn('google');
                }
              }}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={loading === 'google' || isBlocked}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: isBlocked ? 'var(--muted)' : 'var(--btn)', 
                color: 'var(--text)', 
                borderColor: 'var(--line)', 
                border: '1px solid',
                touchAction: 'manipulation'
              }}
            >
              {loading === 'google' ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{translations.signInWithGoogle || 'Sign in with Google'}</span>
            </button>

            <button
              onClick={() => handleProviderSignIn('apple')}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={loading === 'apple'}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid', touchAction: 'manipulation' }}
            >
              {loading === 'apple' ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              <span>{translations.signInWithApple || 'Sign in with Apple'}</span>
            </button>

            <button
              onClick={handleEmailSignIn}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid', touchAction: 'manipulation' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{translations.signInWithEmail || 'Sign in with Email'}</span>
            </button>
          </div>
          )}

          <div className="mt-4 text-xs text-center" style={{ color: 'var(--muted)' }}>
            {translations.signInDescription || 'Sign in to sync your lists across devices'}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}