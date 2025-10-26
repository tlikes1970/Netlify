import { useState, useMemo } from 'react';
import { MOBILE_NAV_HEIGHT, useViewportOffset } from './MobileTabs';

// Settings FAB (COG icon) - Bottom left
export function SettingsFAB({ onClick }: { onClick: () => void }) {
  const [isPressed, setIsPressed] = useState(false);
  const { viewportOffset } = useViewportOffset();
  
  // Cap viewportOffset at 0 if <50px to avoid toolbar micro-shifts
  const effectiveOffset = useMemo(() => Math.max(0, viewportOffset - 50), [viewportOffset]);

  const handleClick = () => {
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 200);
  };

  console.log('🔧 SettingsFAB rendered');

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-4 left-4 lg:bottom-8 lg:left-8 z-nav w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 ease-out ${
        isPressed ? 'scale-95 active:shadow-inner' : 'hover:scale-105 hover:shadow-md'
      }`}
      style={{
        backgroundColor: isPressed ? 'var(--accent)' : 'var(--btn)',
        borderColor: 'var(--line)',
        color: 'var(--text)',
        // Only apply mobile positioning on mobile screens
        ...(window.innerWidth < 1024 && {
          bottom: `calc(${MOBILE_NAV_HEIGHT}px + ${effectiveOffset}px + 16px)`,
          left: '16px'
        })
      }}
      aria-label="Open Settings"
      title="Settings"
      disabled={isPressed}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  );
}

// Theme Toggle FAB (Moon/Sun icon) - Bottom right
export function ThemeToggleFAB({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const [isPressed, setIsPressed] = useState(false);
  const { viewportOffset } = useViewportOffset();
  
  // Cap viewportOffset at 0 if <50px to avoid toolbar micro-shifts
  const effectiveOffset = useMemo(() => Math.max(0, viewportOffset - 50), [viewportOffset]);

  const handleClick = () => {
    setIsPressed(true);
    onToggle();
    setTimeout(() => setIsPressed(false), 200);
  };

  console.log('🌙 ThemeToggleFAB rendered');

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-4 right-4 lg:bottom-8 lg:right-8 z-nav w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 ease-out ${
        isPressed ? 'scale-95 active:shadow-inner' : 'hover:scale-105 hover:shadow-md'
      }`}
      style={{
        backgroundColor: isPressed ? 'var(--accent)' : 'var(--btn)',
        borderColor: 'var(--line)',
        color: 'var(--text)',
        // Only apply mobile positioning on mobile screens
        ...(window.innerWidth < 1024 && {
          bottom: `calc(${MOBILE_NAV_HEIGHT}px + ${effectiveOffset}px + 16px)`,
          right: '16px'
        })
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      disabled={isPressed}
    >
      {theme === 'dark' ? (
        // Sun icon for light theme
        <svg
          className="w-6 h-6"
          style={{ color: '#fbbf24' }} // yellow-400
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for dark theme
        <svg
          className="w-6 h-6"
          style={{ color: '#60a5fa' }} // blue-400
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
