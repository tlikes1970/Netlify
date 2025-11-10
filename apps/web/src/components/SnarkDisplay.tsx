import { useRef, useEffect } from 'react';
import { useUsername } from '../hooks/useUsername';
import { useSettings, getPersonalityText } from '../lib/settings';
import { useAuth } from '../hooks/useAuth';
import { openSettingsSheet } from './settings/SettingsSheet';
// ⚠️ REMOVED: flickerDiagnostics import disabled

export default function SnarkDisplay() {
  const { username } = useUsername();
  const settings = useSettings();
  const { isAuthenticated } = useAuth();
  
  // Use refs to track previous values for accurate logging
  const prevUsernameRef = useRef<string | undefined>(username);
  const prevIsAuthenticatedRef = useRef<boolean>(isAuthenticated);
  
  // ⚠️ REMOVED: flickerDiagnostics logging disabled
  useEffect(() => {
    if (prevUsernameRef.current !== username) {
      prevUsernameRef.current = username;
    }
    if (prevIsAuthenticatedRef.current !== isAuthenticated) {
      prevIsAuthenticatedRef.current = isAuthenticated;
    }
  }, [username, isAuthenticated]);

  // If user is authenticated but has no username, show link to set username
  if (isAuthenticated && !username) {
    return (
      <div className="text-xs md:text-sm truncate max-w-[100px] md:max-w-none" style={{ color: 'var(--muted)' }}>
        <button
          onClick={() => openSettingsSheet()}
          className="underline hover:no-underline transition-all"
          style={{ color: 'var(--accent)' }}
        >
          Click here to set a username
        </button>
      </div>
    );
  }

  // If no username (and not authenticated), show nothing
  if (!username) {
    return null;
  }

  // Show welcome message when username exists
  const snarkText = getPersonalityText('welcome', settings.personalityLevel, { username });

  return (
    <div className="text-xs md:text-sm truncate max-w-[100px] md:max-w-none" style={{ color: 'var(--muted)' }}>
      {snarkText}
    </div>
  );
}
