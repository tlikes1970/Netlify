import React, { useEffect, useState } from 'react';
import { useUsername } from '../hooks/useUsername';
import { useTranslations } from '../lib/language';
import { useAuth } from '../hooks/useAuth';
import ModalPortal from './ModalPortal';

interface UsernamePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsernamePromptModal({ isOpen, onClose }: UsernamePromptModalProps) {
  const { user } = useAuth();
  const { updateUsername, skipUsernamePrompt } = useUsername();
  const translations = useTranslations();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateUsername(username.trim());
      onClose();
    } catch (error: any) {
      console.error('Failed to update username:', error);
      setError(error.message || 'Failed to save username');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError(null);

    try {
      await skipUsernamePrompt();
      onClose();
    } catch (error: any) {
      console.error('Failed to skip username prompt:', error);
      setError(error.message || 'Failed to skip username prompt');
    } finally {
      setLoading(false);
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

            {error && (
              <div className="p-3 rounded-lg text-sm" 
                   style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    {translations.saving || 'Saving...'}
                  </div>
                ) : (
                  translations.skip || 'Skip'
                )}
              </button>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    {translations.saving || 'Saving...'}
                  </div>
                ) : (
                  translations.save || 'Save'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}