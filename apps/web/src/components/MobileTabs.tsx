import { useTranslations } from '../lib/language';
import { useLibrary } from '../lib/storage';
import { useCustomLists } from '../lib/customLists';
import { useEffect, useState, createContext, useContext } from 'react';

type TabId = 'watching'|'want'|'watched'|'mylists'|'discovery';
export type MobileTabsProps = { current: 'home' | TabId; onChange: (next: 'home' | TabId) => void; };

// Single source of truth for mobile nav height
export const MOBILE_NAV_HEIGHT = 80;

// Context for sharing viewport offset with other components
const ViewportContext = createContext<{ viewportOffset: number }>({ viewportOffset: 0 });
export const useViewportOffset = () => useContext(ViewportContext);

export default function MobileTabs({ current, onChange }: MobileTabsProps) {
  const translations = useTranslations();
  const customLists = useCustomLists();
  
  // Visual Viewport API state for iOS Safari keyboard handling
  const [viewportOffset, setViewportOffset] = useState(0);
  
  // Debug logging
  console.log('📱 MobileTabs rendering:', { 
    current, 
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    viewportHeight: window.visualViewport?.height || 'no visualViewport',
    scrollY: window.scrollY,
    bodyHeight: document.body.scrollHeight,
    viewportOffset
  });
  
  // Visual Viewport API listener for iOS Safari keyboard handling
  useEffect(() => {
    if (!window.visualViewport) {
      console.log('📱 Visual Viewport API not supported, using focus/blur fallback');
      
      // Fallback for older iOS: listen to input focus/blur
      const handleInputFocus = () => {
        console.log('📱 Input focused, adjusting nav position');
        setViewportOffset(250); // Reduced estimate for iOS keyboard
      };
      
      const handleInputBlur = () => {
        console.log('📱 Input blurred, resetting nav position');
        setViewportOffset(0);
      };
      
      // Listen for input focus/blur events
      document.addEventListener('focusin', handleInputFocus);
      document.addEventListener('focusout', handleInputBlur);
      
      return () => {
        document.removeEventListener('focusin', handleInputFocus);
        document.removeEventListener('focusout', handleInputBlur);
      };
    }
    
    let prevOffsetTop = 0;
    let throttleTimeout: number | null = null;
    
    const handleViewportChange = () => {
      // Throttle to prevent rapid fires from iOS toolbar animations
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        
        const visualHeight = window.visualViewport?.height || window.innerHeight;
        const screenHeight = window.innerHeight;
        const currentOffsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
        
        // Calculate delta to detect toolbar changes vs keyboard
        const offsetTopDelta = Math.abs(currentOffsetTop - prevOffsetTop);
        
        console.log('📱 Visual viewport changed:', { 
          visualHeight, 
          screenHeight, 
          currentOffsetTop,
          prevOffsetTop,
          offsetTopDelta,
          keyboardOpen: offsetTopDelta <= 50 && (screenHeight - visualHeight) > 50
        });
        
        // If offsetTop changed significantly (>50px), it's toolbar animation - ignore
        if (offsetTopDelta > 50) {
          console.log('📱 Toolbar animation detected, ignoring offset change');
          setViewportOffset(0);
          prevOffsetTop = currentOffsetTop;
          return;
        }
        
        // Only adjust for height changes with stable offsetTop (keyboard)
        const offset = Math.max(0, screenHeight - visualHeight);
        // Only apply offset if it's significant (>50px) to avoid toolbar micro-shifts
        setViewportOffset(offset > 50 ? offset : 0);
        prevOffsetTop = currentOffsetTop;
        
      }, 50); // Throttle to max 20fps
    };
    
    // Scroll reset listener for aggressive repaint forcing
    let scrollResetTimeout: number | null = null;
    const handleScrollReset = () => {
      if (scrollResetTimeout) clearTimeout(scrollResetTimeout);
      scrollResetTimeout = setTimeout(() => {
        // Reset nav position on scroll end if toolbar is stable
        if (window.visualViewport && Math.abs(window.visualViewport.offsetTop) < 50) {
          const navElement = document.querySelector('.mobile-nav') as HTMLElement;
          if (navElement) {
            navElement.style.bottom = '0px';
          }
        }
      }, 100);
    };
    
    // Initial calculation
    handleViewportChange();
    
    // Listen for viewport changes (keyboard open/close)
    window.visualViewport.addEventListener('resize', handleViewportChange);
    // Listen for scroll events to reset position
    window.addEventListener('scroll', handleScrollReset, { passive: true });
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleScrollReset);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      if (scrollResetTimeout) {
        clearTimeout(scrollResetTimeout);
      }
    };
  }, []);
  
  // Get reactive counts for each list
  const watchingItems = useLibrary('watching');
  const wantItems = useLibrary('wishlist');
  const watchedItems = useLibrary('watched');
  
  const watchingCount = watchingItems.length;
  const wantCount = wantItems.length;
  const watchedCount = watchedItems.length;
  const myListsCount = Array.isArray(customLists) ? customLists.length : 0;
  
  const TABS: { id: TabId; label: string; count: number; icon: string }[] = [
    { id: 'watching', label: 'Watching', count: watchingCount, icon: '▶️' },
    { id: 'want',     label: 'Wishlist', count: wantCount, icon: '❤️' },
    { id: 'watched',  label: 'Watched', count: watchedCount, icon: '✅' },
    { id: 'mylists',  label: 'Lists', count: myListsCount, icon: '📋' },
    { id: 'discovery',label: 'Discover', count: 0, icon: '🔍' }
  ];

  return (
    <ViewportContext.Provider value={{ viewportOffset }}>
      <nav 
        className="mobile-nav fixed left-0 right-0 z-[9999] px-1 py-2"
        style={{ 
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'var(--bg)',
          borderTop: '1px solid var(--line)',
          height: `${MOBILE_NAV_HEIGHT}px`,
          position: 'fixed',
          bottom: viewportOffset, // Dynamic bottom position for iOS Safari keyboard
          left: 0,
          right: 0,
          zIndex: 9999
        }}
      >
        <div className="flex items-center justify-around h-full">
          {/* Home Tab */}
          <button
            onClick={() => onChange('home')}
            className="flex flex-col items-center justify-center p-1 min-h-[60px] transition-all duration-300 ease-out relative flex-1"
            style={{
              color: current === 'home' ? 'var(--accent)' : 'var(--muted)',
              transform: current === 'home' ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            <span className="text-lg mb-1">🏠</span>
            <span className="text-xs font-medium">{translations.home}</span>
            {current === 'home' && (
              <div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              />
            )}
          </button>

          {/* Main Tabs */}
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex flex-col items-center justify-center p-1 min-h-[60px] transition-all duration-300 ease-out relative flex-1"
              style={{
                color: current === tab.id ? 'var(--accent)' : 'var(--muted)',
                transform: current === tab.id ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              <div className="relative">
                <span className="text-lg mb-1">{tab.icon}</span>
                {tab.count > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                    style={{ fontSize: '10px' }}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
              {current === tab.id && (
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </ViewportContext.Provider>
  );
}
