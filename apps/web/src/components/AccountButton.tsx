import { useState } from 'react';
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
      <div className="flex flex-col items-center gap-0.5 md:gap-1">
        <div className="text-[10px] md:text-xs hidden md:block" style={{ color: 'var(--muted)' }}>
          {getHelperText()}
        </div>
        <button
          onClick={handleClick}
          className="px-2 py-1 md:px-4 md:py-2 rounded-lg transition-colors hover:scale-105 text-xs md:text-sm min-w-[2rem] md:min-w-0"
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
          data-testid="account-button"
          data-role="avatar"
        >
          <span className="block md:hidden">👤</span>
          <span className="hidden md:block">{isAuthenticated ? `👤 ${getDisplayName()}` : getDisplayName()}</span>
        </button>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
