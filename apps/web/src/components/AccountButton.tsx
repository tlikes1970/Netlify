import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslations } from '../lib/language';
import AuthModal from './AuthModal';

export default function AccountButton() {
  const { user, signOut, isAuthenticated } = useAuth();
  const translations = useTranslations();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleClick = async () => {
    if (isAuthenticated) {
      try {
        await signOut();
      } catch (error) {
        console.error('Sign-out failed:', error);
      }
    } else {
      setShowAuthModal(true);
    }
  };

  const getDisplayName = (): string => {
    if (!user) return translations.signIn || 'Sign In';
    
    // Use Firebase displayName (from Google/Apple) or email prefix as fallback
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  const getHelperText = (): string => {
    return isAuthenticated 
      ? (translations.clickToSignOut || 'Click to sign out')
      : (translations.signInHere || 'Sign in here');
  };

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          {getHelperText()}
        </div>
        <button
          onClick={handleClick}
          className="px-4 py-2 rounded-lg transition-colors hover:scale-105"
          style={{ 
            backgroundColor: 'var(--btn)', 
            color: 'var(--text)', 
            borderColor: 'var(--line)', 
            border: '1px solid' 
          }}
          title={isAuthenticated 
            ? `${translations.signedInAs || 'Signed in as'} ${user?.email}. ${translations.clickToSignOut || 'Click to sign out'}.`
            : (translations.clickToSignIn || 'Click to sign in')
          }
        >
          {isAuthenticated ? `👤 ${getDisplayName()}` : getDisplayName()}
        </button>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
