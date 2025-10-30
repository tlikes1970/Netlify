import { useTranslations } from '../lib/language';
import { useLibrary } from '../lib/storage';
import { useCustomLists } from '../lib/customLists';
import { useReturningShows } from '@/state/selectors/useReturningShows';
import { useEffect, useState, createContext, useContext, useMemo, useRef } from 'react';
import React from 'react';
import { dlog } from '../lib/log';

type TabId = 'watching'|'want'|'watched'|'returning'|'mylists'|'discovery'; // Removed 'not' - now handled by modal
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
  dlog('📱 MobileTabs rendering:', { 
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
      dlog('📱 Visual Viewport API not supported, using safe fallback');
      
      // Safe fallback: listen to resize, orientationchange, and visibilitychange
      const handleFallbackResize = () => {
        dlog('📱 Fallback resize detected, checking for keyboard');
        // Simple heuristic: if viewport height is significantly less than screen height
        const heightDiff = window.innerHeight - window.screen.height;
        if (Math.abs(heightDiff) > 100) {
          setViewportOffset(Math.abs(heightDiff));
        } else {
          setViewportOffset(0);
        }
      };
      
      const handleOrientationChange = () => {
        dlog('📱 Orientation change detected');
        setTimeout(() => setViewportOffset(0), 100); // Reset after orientation settles
      };
      
      const handleVisibilityChange = () => {
        dlog('📱 Visibility change detected');
        if (document.hidden) {
          setViewportOffset(0);
        }
      };
      
      // Listen for safe fallback events
      window.addEventListener('resize', handleFallbackResize);
      window.addEventListener('orientationchange', handleOrientationChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        window.removeEventListener('resize', handleFallbackResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
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
        
        dlog('📱 Visual viewport changed:', { 
          visualHeight, 
          screenHeight, 
          currentOffsetTop,
          prevOffsetTop,
          offsetTopDelta,
          keyboardOpen: offsetTopDelta <= 50 && (screenHeight - visualHeight) > 50
        });
        
        // If offsetTop changed significantly (>50px), it's toolbar animation - ignore
        if (offsetTopDelta > 50) {
          dlog('📱 Toolbar animation detected, ignoring offset change');
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
            navElement.style.bottom = '0';
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
  const returningItems = useReturningShows();
  
  const watchingCount = watchingItems.length;
  const wantCount = wantItems.length;
  const watchedCount = watchedItems.length;
  const myListsCount = Array.isArray(customLists) ? customLists.length : 0;
  const returningCount = returningItems.length;
  
  const TABS: { id: TabId; label: string; count: number }[] = [
    { id: 'watching', label: 'Watching', count: watchingCount },
    { id: 'want',     label: 'Wishlist', count: wantCount },
    { id: 'watched',  label: 'Watched', count: watchedCount },
    { id: 'returning',label: 'Returning', count: returningCount },
    { id: 'mylists',  label: 'Lists', count: myListsCount },
    { id: 'discovery',label: 'Discover', count: 0 }
  ];

  // Split into visible vs overflow (first 4 visible)
  const { visibleTabs, overflowTabs } = useMemo(() => {
    const visible = TABS.slice(0, 4);
    const overflow = TABS.slice(4);
    return { visibleTabs: visible, overflowTabs: overflow };
  }, [TABS]);

  // "More" dropdown for mobile
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!moreRef.current) return;
      if (!moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <ViewportContext.Provider value={{ viewportOffset }}>
      <nav 
        className="mobile-nav fixed left-0 right-0 z-nav px-1 py-2"
        style={{ 
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'var(--bg)',
          borderTop: '1px solid var(--line)',
          height: `${MOBILE_NAV_HEIGHT}px`,
          position: 'fixed',
          bottom: `${viewportOffset}px`, // Dynamic bottom position for iOS Safari keyboard
          left: 0,
          right: 0,
          zIndex: 9999
        }}
      >
        <div className="flex items-center justify-around h-full">
          {/* Home Tab */}
          <button
            onClick={() => onChange('home')}
            className="flex flex-col items-center justify-center p-2 min-h-[60px] transition-all duration-200 ease-out relative flex-1"
            style={{
              color: current === 'home' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: current === 'home' ? '600' : '500'
            }}
          >
            <span className="text-sm font-medium">{translations.home}</span>
            {current === 'home' && (
              <div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              />
            )}
          </button>

          {/* Vertical Separator */}
          <div 
            className="h-8 w-px"
            style={{ backgroundColor: 'var(--line)' }}
          />

          {/* Main Tabs (visible) */}
          {visibleTabs.map((tab, index) => (
            <React.Fragment key={tab.id}>
              <button
                onClick={() => onChange(tab.id)}
                className="flex flex-col items-center justify-center p-2 min-h-[60px] transition-all duration-200 ease-out relative flex-1"
                style={{
                  color: current === tab.id ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: current === tab.id ? '600' : '500'
                }}
              >
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span 
                    className="bg-gray-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 mt-0.5"
                    style={{ fontSize: '10px' }}
                  >
                    {tab.count}
                  </span>
                )}
                {current === tab.id && (
                  <div 
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </button>
              
              {/* Vertical Separator between tabs (except after last tab) */}
              {index < visibleTabs.length - 1 && (
                <div 
                  className="h-8 w-px"
                  style={{ backgroundColor: 'var(--line)' }}
                />
              )}
            </React.Fragment>
          ))}

          {/* More overflow */}
          {overflowTabs.length > 0 && (
            <>
              {/* Separator before More */}
              <div className="h-8 w-px" style={{ backgroundColor: 'var(--line)' }} />
              <div ref={moreRef} className="relative flex-1 flex items-center justify-center">
                <button
                  onClick={() => setMoreOpen(v => !v)}
                  className="flex flex-col items-center justify-center p-2 min-h-[60px] transition-all duration-200 ease-out relative"
                  style={{ color: moreOpen ? 'var(--accent)' : 'var(--muted)', fontWeight: moreOpen ? 600 as any : 500 as any }}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                >
                  <span className="text-sm font-medium">More</span>
                  {overflowTabs.some(t => t.count > 0) && (
                    <span className="bg-gray-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 mt-0.5">
                      {overflowTabs.reduce((sum, t) => sum + (t.count || 0), 0)}
                    </span>
                  )}
                  {moreOpen && (
                    <div 
                      role="menu"
                      className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 min-w-[160px] rounded-xl shadow-lg border"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)' }}
                    >
                      {overflowTabs.map(t => (
                        <button
                          key={t.id}
                          role="menuitem"
                          onClick={() => { setMoreOpen(false); onChange(t.id); }}
                          className="w-full text-left px-4 py-2 flex items-center justify-between hover:opacity-90"
                          style={{ color: 'var(--text)' }}
                        >
                          <span>{t.label}</span>
                          {t.count > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{t.count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </ViewportContext.Provider>
  );
}
