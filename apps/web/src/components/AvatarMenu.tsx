import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

interface AvatarMenuProps {
  user: any;
  isAuthenticated: boolean;
}

export default function AvatarMenu({ user, isAuthenticated }: AvatarMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowMenu(false);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const getDisplayName = (): string => {
    if (!user) return 'Guest';
    
    // Use Firebase displayName (from Google/Apple) or email prefix as fallback
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  const getInitials = (): string => {
    const name = getDisplayName();
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
          aria-label="User menu"
        >
          {isAuthenticated ? (
            <>
              {/* Avatar Circle */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getInitials()}
              </div>
              {/* Name */}
              <span className="text-sm text-white hidden sm:block">
                {getDisplayName()}
              </span>
            </>
          ) : (
            <>
              {/* Guest Icon */}
              <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center text-white text-sm">
                👤
              </div>
              {/* Sign In Text */}
              <span className="text-sm text-white hidden sm:block">
                Sign In
              </span>
            </>
          )}
          
          {/* Dropdown Arrow */}
          <svg 
            className={`w-4 h-4 text-white transition-transform ${showMenu ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-white/10 rounded-lg shadow-lg z-50">
            <div className="py-2">
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="px-4 py-2 border-b border-white/10">
                    <div className="text-sm text-white font-medium">
                      {getDisplayName()}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {user?.email}
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      // TODO: Open settings
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      // TODO: Open profile
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    Profile
                  </button>
                  
                  <div className="border-t border-white/10 my-1"></div>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </>
  );
}
