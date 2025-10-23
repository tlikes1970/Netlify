import Tabs from '@/components/Tabs';
import MobileTabs, { useViewportOffset } from '@/components/MobileTabs';
import FlickletHeader from '@/components/FlickletHeader';
import Rail from '@/components/Rail';
import Section from '@/components/Section';
import CommunityPanel from '@/components/CommunityPanel';
import TheaterInfo from '@/components/TheaterInfo';
import FeedbackPanel from '@/components/FeedbackPanel';
import SearchResults from '@/search/SearchResults';
import HomeYourShowsRail from '@/components/rails/HomeYourShowsRail';
import HomeUpNextRail from '@/components/rails/HomeUpNextRail';
import { SettingsFAB, ThemeToggleFAB } from '@/components/FABs';
import ScrollToTopArrow from '@/components/ScrollToTopArrow';
import { lazy, Suspense } from 'react';
import { openSettingsSheet } from '@/components/settings/SettingsSheet';
import { flag } from '@/lib/flags';

// Lazy load heavy components
const SettingsPage = lazy(() => import('@/components/SettingsPage'));
const NotesAndTagsModal = lazy(() => import('@/components/modals/NotesAndTagsModal'));
import { ShowNotificationSettingsModal } from '@/components/modals/ShowNotificationSettingsModal';
const FlickWordModal = lazy(() => import('@/components/games/FlickWordModal'));
import { BloopersModal } from '@/components/extras/BloopersModal';
import { ExtrasModal } from '@/components/extras/ExtrasModal';
import { HelpModal } from '@/components/HelpModal';
const ListPage = lazy(() => import('@/pages/ListPage'));
const MyListsPage = lazy(() => import('@/pages/MyListsPage'));
const DiscoveryPage = lazy(() => import('@/pages/DiscoveryPage'));
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper';
import { useForYouRows } from '@/hooks/useForYouRows';
import { useForYouContent } from '@/hooks/useGenreContent';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Library, useLibrary } from '@/lib/storage';
import { mountActionBridge, setToastCallback } from '@/state/actions';
import { useSettings, settingsManager } from '@/lib/settings';
import { useInTheaters } from '@/hooks/useTmdb';
import { useTranslations } from '@/lib/language';
import { getPersonalityText } from '@/lib/settings';
import Toast, { useToast } from '@/components/Toast';
import PersonalityErrorBoundary from '@/components/PersonalityErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';
import '@/styles/flickword.css';
import { backfillShowStatus } from '@/utils/backfillShowStatus';

type View = 'home'|'watching'|'want'|'watched'|'mylists'|'discovery';
type SearchType = 'all' | 'movies-tv' | 'people';
type SearchState = { q: string; genre: string | null; type: SearchType; nonce: number };

export default function App() {
  const [view, setView] = useState<View>('home');
  const isHome = typeof window !== 'undefined' && window.location.pathname === '/';

  // Settings state
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const translations = useTranslations();
  
  // Viewport offset for iOS Safari keyboard handling
  const { viewportOffset } = useViewportOffset();
  
  // Notes and Tags modal state
  const [notesModalItem, setNotesModalItem] = useState<any>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  // Game modal state
  const [showFlickWordModal, setShowFlickWordModal] = useState(false);
  
  // Notification modal state
  const [notificationModalItem, setNotificationModalItem] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Bloopers modal state
  const [bloopersModalItem, setBloopersModalItem] = useState<any>(null);
  const [showBloopersModal, setShowBloopersModal] = useState(false);

  // Extras modal state
  const [extrasModalItem, setExtrasModalItem] = useState<any>(null);
  const [showExtrasModal, setShowExtrasModal] = useState(false);

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔔 Modal state changed:', { 
      showNotificationModal, 
      notificationModalItem: notificationModalItem?.title 
    });
  }, [showNotificationModal, notificationModalItem]);

  // Debug bloopers modal state changes
  useEffect(() => {
    console.log('🎬 Bloopers modal state changed:', { 
      showBloopersModal, 
      hasBloopersModalItem: !!bloopersModalItem, 
      bloopersModalItemTitle: bloopersModalItem?.title
    });
  }, [showBloopersModal, bloopersModalItem]);

  // Debug extras modal state changes
  useEffect(() => {
    console.log('🎭 Extras modal state changed:', { 
      showExtrasModal, 
      hasExtrasModalItem: !!extrasModalItem, 
      extrasModalItemTitle: extrasModalItem?.title
    });
  }, [showExtrasModal, extrasModalItem]);
  
  // Toast system
  const { toasts, addToast, removeToast } = useToast();

  // Auth state
  const { loading: authLoading, authInitialized, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-prompt for authentication when not authenticated
  useEffect(() => {
    if (!authLoading && authInitialized && !isAuthenticated) {
      // Small delay to ensure the app has fully loaded
      const timer = setTimeout(() => {
        setShowAuthModal(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, authInitialized, isAuthenticated]);

  // Service Worker for offline caching
  const { isOnline } = useServiceWorker();

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    console.log('🔄 Pull-to-refresh triggered');
    
    // Force refresh of library data
    // Library.refresh(); // Commented out - method doesn't exist
    
    // Trigger custom refresh events for components that need it
    window.dispatchEvent(new CustomEvent('force-refresh'));
    
    // Small delay to show the refresh animation
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Search state - centralized with nonce
  const [search, setSearch] = useState<SearchState>({ q: '', genre: null, type: 'all', nonce: 0 });
  const searchActive = !!search.q.trim();

  // Search handlers
  const handleSearch = (q: string, genre: string | null, type: SearchType) => {
    const nextQ = q.trim();
    setSearch(prev => ({ q: nextQ, genre, type, nonce: prev.nonce + 1 }));
  };

  const handleClear = () => setSearch({ q: '', genre: null, type: 'all', nonce: 0 });

  // For You configuration from settings
  const forYouRows = useForYouRows();
  const forYouContent = useForYouContent(forYouRows);

  // Lists - using new Library system with reactive updates
  const watching = useLibrary('watching');
  const wishlist = useLibrary('wishlist');
  const watched = useLibrary('watched');

  // Data rails
  const theaters = useInTheaters();

  // Handle settings click - check gate and flag conditions
  const handleSettingsClick = () => {
    const gate = document.documentElement.dataset.compactMobileV1 === 'true';
    const flagEnabled = flag('settings_mobile_sheet_v1');
    
    if (gate && flagEnabled) {
      openSettingsSheet();
    } else {
      setShowSettings(true);
    }
  };

  // Initialize action bridge and backfill show status
  useEffect(() => {
    // Set up toast callback for personality-based feedback
    setToastCallback(addToast);
    
    const cleanup = mountActionBridge();
    
    // Trigger show status backfill after a short delay
    const backfillTimer = setTimeout(() => {
      console.log('🔄 App.tsx triggering show status backfill...');
      backfillShowStatus();
    }, 3000); // Wait 3 seconds after app loads
    
    return () => {
      cleanup();
      clearTimeout(backfillTimer);
    };
  }, [addToast]);

  // Handle deep links for settings sheet and games
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#settings/')) {
        const tab = hash.replace('#settings/', '').toLowerCase();
        const gate = document.documentElement.dataset.compactMobileV1 === 'true';
        const flagEnabled = flag('settings_mobile_sheet_v1');
        
        if (gate && flagEnabled) {
          // Validate tab is a valid TabId before passing to openSettingsSheet
          if (['account', 'display', 'advanced'].includes(tab)) {
            openSettingsSheet(tab as 'account' | 'display' | 'advanced');
          } else {
            openSettingsSheet(); // Use default tab
          }
        }
      } else if (hash === '#games/flickword') {
        setShowFlickWordModal(true);
      }
    };

    // Check hash on load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Expose game functions globally for compatibility with legacy code
  useEffect(() => {
    (window as any).openFlickWordModal = () => {
      setShowFlickWordModal(true);
    };
    
    (window as any).closeFlickWordModal = () => {
      setShowFlickWordModal(false);
    };

    return () => {
      delete (window as any).openFlickWordModal;
      delete (window as any).closeFlickWordModal;
    };
  }, []);


  function itemsFor(id: string) {
    switch (id) {
      case 'currently-watching': return watching;
      case 'up-next':            return []; // TODO: populate from episodes
      case 'in-theaters':        return theaters.data ?? [];
      default:                   return undefined;
    }
  }

  // Notes and Tags handlers
  const handleNotesEdit = (item: any) => {
    setNotesModalItem(item);
    setShowNotesModal(true);
  };

  const handleTagsEdit = (item: any) => {
    setNotesModalItem(item);
    setShowNotesModal(true);
  };

  // Notification handler
  const handleNotificationToggle = (item: any) => {
    console.log('🔔 App.tsx handleNotificationToggle called for:', item.title, item.mediaType);
    console.log('🔔 Setting notification modal state:', { 
      showNotificationModal: true, 
      notificationModalItem: item 
    });
    setNotificationModalItem(item);
    setShowNotificationModal(true);
    console.log('🔔 Modal state should now be set');
  };

  // Simple reminder handler (Free feature)
  const handleSimpleReminder = (item: any) => {
    console.log('⏰ App.tsx handleSimpleReminder called for:', item.title, item.mediaType);
    // For now, just show a simple alert - this will be replaced with actual reminder logic
    alert(`⏰ Simple reminder set for "${item.title}" - you'll be notified 24 hours before the next episode airs!`);
  };

  // Bloopers handler
  const handleBloopersOpen = (item: any) => {
    console.log('🎬 App.tsx handleBloopersOpen called for:', item.title, item.mediaType);
    console.log('🎬 Setting bloopers modal state:', { 
      showBloopersModal: true, 
      bloopersModalItem: item
    });
    
    flushSync(() => {
      setBloopersModalItem(item);
      setShowBloopersModal(true);
    });
    
    console.log('🎬 Bloopers modal state should now be set');
  };

  // Extras handler
  const handleExtrasOpen = (item: any) => {
    console.log('🎭 App.tsx handleExtrasOpen called for:', item.title, item.mediaType);
    console.log('🎭 Setting extras modal state:', { 
      showExtrasModal: true, 
      extrasModalItem: item
    });
    
    flushSync(() => {
      setExtrasModalItem(item);
      setShowExtrasModal(true);
    });
    
    console.log('🎭 Extras modal state should now be set');
  };

  // Help handler
  const handleHelpOpen = () => {
    console.log('❓ App.tsx handleHelpOpen called');
    console.log('❓ Current showHelpModal state:', showHelpModal);
    setShowHelpModal(true);
    console.log('❓ setShowHelpModal(true) called');
  };

  const handleSaveNotesAndTags = (item: any, notes: string, tags: string[]) => {
    // Update the item in the library with new notes and tags
    Library.updateNotesAndTags(item.id, item.mediaType, notes, tags);
    setShowNotesModal(false);
    setNotesModalItem(null);
  };

  if (view !== 'home') {
    return (
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100lvh' }}>
        {/* Debug: Show when modal should be visible - TOP LEVEL */}
        {showExtrasModal && (
          <div style={{ 
            position: 'fixed', 
            top: '10px', 
            left: '10px', 
            background: 'red', 
            color: 'white', 
            padding: '10px', 
            zIndex: 9999,
            fontSize: '12px'
          }}>
            🎬 MODAL SHOULD BE VISIBLE: {extrasModalItem?.title}
          </div>
        )}
        
        <FlickletHeader
          appName="Flicklet"
          showMarquee={false}
          onSearch={(q, g, t) => handleSearch(q, g ?? null, (t as SearchType) ?? 'all')}
          onClear={handleClear}
          onHelpOpen={() => {
            console.log('❓ App.tsx onHelpOpen prop called');
            handleHelpOpen();
          }}
        />
        
        {/* Desktop Tabs - Always visible */}
        <div className="hidden lg:block">
          <Tabs current={view} onChange={setView} />
        </div>
        
        {/* Mobile Tabs - Always visible */}
        <div className="block lg:hidden">
          <MobileTabs current={view} onChange={setView} />
        </div>
        
        {/* Content Area */}
        <div className="pb-20 lg:pb-0" style={{ 
          paddingBottom: viewportOffset > 0 && window.visualViewport?.offsetTop === 0 
            ? `${80 + viewportOffset}px` 
            : undefined 
        }}>
          {searchActive ? (
            <SearchResults query={search.q} genre={search.genre} searchType={search.type} nonce={search.nonce} />
          ) : (
            <>
              {(view as View) === 'home' && (
                <div className="min-h-screen" data-page="home">
                  {/* Home Page Content */}
                  <div className="px-4 py-6">
                    <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
                      Welcome to Flicklet
                    </h1>
                    <div className="grid gap-6">
                      {/* Your Shows Rail */}
                      <HomeYourShowsRail />
                      
                      {/* Up Next Rail */}
                      <HomeUpNextRail />
                      
                      {/* For You Content */}
                      {forYouContent.map((row, index) => (
                        <Rail key={index} id={row.rowId} {...row} />
                      ))}
                      
                      {/* Community Panel */}
                      <CommunityPanel />
                      
                      {/* Theater Info */}
                      <TheaterInfo />
                      
                      {/* Feedback Panel */}
                      <FeedbackPanel />
                    </div>
                  </div>
                </div>
              )}
              {view === 'watching'  && (
                <Suspense fallback={<div className="loading-spinner">Loading watching list...</div>}>
                  <div data-page="lists" data-list="watching">
                    <ListPage title="Currently Watching" items={watching} mode="watching" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} onNotificationToggle={handleNotificationToggle} onSimpleReminder={handleSimpleReminder} onBloopersOpen={handleBloopersOpen} onExtrasOpen={handleExtrasOpen} />
                  </div>
                </Suspense>
              )}
              {view === 'want'      && (
                <Suspense fallback={<div className="loading-spinner">Loading wishlist...</div>}>
                  <div data-page="lists" data-list="wishlist">
                    <ListPage title="Want to Watch" items={wishlist} mode="want" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} onNotificationToggle={handleNotificationToggle} onSimpleReminder={handleSimpleReminder} onBloopersOpen={handleBloopersOpen} onExtrasOpen={handleExtrasOpen} />
                  </div>
                </Suspense>
              )}
              {view === 'watched'   && (
                <Suspense fallback={<div className="loading-spinner">Loading watched list...</div>}>
                  <div data-page="lists" data-list="watched">
                    <ListPage title="Watched" items={watched} mode="watched" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} onNotificationToggle={handleNotificationToggle} onSimpleReminder={handleSimpleReminder} onBloopersOpen={handleBloopersOpen} onExtrasOpen={handleExtrasOpen} />
                  </div>
                </Suspense>
              )}
              {view === 'mylists'  && (
                <Suspense fallback={<div className="loading-spinner">Loading my lists...</div>}>
                  <div data-page="lists" data-list="mylists">
                    <MyListsPage />
                  </div>
                </Suspense>
              )}
              {view === 'discovery' && (
                <Suspense fallback={<div className="loading-spinner">Loading discovery...</div>}>
                  <DiscoveryPage query={search.q} genreId={search.genre ? parseInt(search.genre) : null} />
                </Suspense>
              )}
            </>
          )}
        </div>

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
            📱 You're offline - viewing cached content
          </div>
        )}

        {/* FAB Components - Available on all tabs */}
        <SettingsFAB onClick={handleSettingsClick} />
        <ThemeToggleFAB 
          theme={settings.layout.theme} 
          onToggle={() => settingsManager.updateTheme(settings.layout.theme === 'dark' ? 'light' : 'dark')} 
        />

        {/* Settings Modal */}
        {showSettings && (
          <Suspense fallback={<div className="loading-spinner">Loading settings...</div>}>
            <SettingsPage onClose={() => setShowSettings(false)} />
          </Suspense>
        )}

        {/* Notes and Tags Modal */}
        {showNotesModal && notesModalItem && (
          <Suspense fallback={<div className="loading-spinner">Loading notes...</div>}>
            <NotesAndTagsModal
              item={notesModalItem}
              isOpen={showNotesModal}
              onClose={() => setShowNotesModal(false)}
              onSave={handleSaveNotesAndTags}
            />
          </Suspense>
        )}

        {/* Show Notification Settings Modal */}
        {(() => {
          const shouldRender = showNotificationModal && notificationModalItem;
          console.log('🔔 Modal render check:', { 
            showNotificationModal, 
            notificationModalItem: notificationModalItem?.title,
            shouldRender 
          });
          return shouldRender;
        })() && (
          <ShowNotificationSettingsModal
            isOpen={showNotificationModal}
            onClose={() => {
              console.log('🔔 Closing notification modal');
              setShowNotificationModal(false);
            }}
            show={{
              id: Number(notificationModalItem.id),
              title: notificationModalItem.title,
              mediaType: notificationModalItem.mediaType
            }}
          />
        )}

        {/* Bloopers Modal */}
        {console.log('🎬 BloopersModal render check:', { showBloopersModal, hasBloopersModalItem: !!bloopersModalItem, bloopersModalItemTitle: bloopersModalItem?.title })}
        {showBloopersModal && bloopersModalItem && (
          <BloopersModal
            isOpen={showBloopersModal}
            onClose={() => setShowBloopersModal(false)}
            showId={(() => {
              const id = typeof bloopersModalItem.id === 'string' ? parseInt(bloopersModalItem.id) : bloopersModalItem.id;
              console.log('🎬 BloopersModal showId conversion:', { originalId: bloopersModalItem.id, convertedId: id, type: typeof id });
              return id;
            })()}
            showTitle={bloopersModalItem.title}
          />
        )}

        {/* Extras Modal */}
        {showExtrasModal && extrasModalItem && (
          <ExtrasModal
            isOpen={showExtrasModal}
            onClose={() => setShowExtrasModal(false)}
            showId={(() => {
              const id = typeof extrasModalItem.id === 'string' ? parseInt(extrasModalItem.id) : extrasModalItem.id;
              console.log('🎭 ExtrasModal showId conversion:', { originalId: extrasModalItem.id, convertedId: id, type: typeof id });
              return id;
            })()}
            showTitle={extrasModalItem.title}
          />
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
        )}
      </main>
    );
  }

  // Show loading screen until auth state is initialized
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PersonalityErrorBoundary>
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100lvh' }}>
        <FlickletHeader
          appName="Flicklet"
          showMarquee={isHome && !searchActive}
          onSearch={(q, g, t) => handleSearch(q, g ?? null, (t as SearchType) ?? 'all')}
          onClear={handleClear}
          onHelpOpen={handleHelpOpen}
          messages={[
            getPersonalityText('marquee1', settings.personalityLevel),
            getPersonalityText('marquee2', settings.personalityLevel),
            getPersonalityText('marquee3', settings.personalityLevel),
            getPersonalityText('marquee4', settings.personalityLevel),
            getPersonalityText('marquee5', settings.personalityLevel),
          ]}
          marqueeSpeedSec={60}
          changeEveryMs={30000}
        />
        
        {/* Desktop Tabs - always visible */}
        <div className="hidden lg:block">
          <Tabs current={view} onChange={(tab) => { 
            setView(tab); 
            if (searchActive) { 
              handleClear();
            } 
          }} />
        </div>
        
        {/* Mobile Tabs - always visible */}
        <div className="block lg:hidden">
          <MobileTabs current={view} onChange={(tab) => { 
            setView(tab); 
            if (searchActive) { 
              handleClear();
            } 
          }} />
        </div>
        
        {searchActive ? (
          <PullToRefreshWrapper onRefresh={handleRefresh}>
            <SearchResults query={search.q} genre={search.genre} searchType={search.type} nonce={search.nonce} />
          </PullToRefreshWrapper>
        ) : (
          <PullToRefreshWrapper onRefresh={handleRefresh}>
            <>
              {view === 'home' && (
              <div className="pb-20 lg:pb-0" style={{ 
                paddingBottom: viewportOffset > 0 && window.visualViewport?.offsetTop === 0 
                  ? `${80 + viewportOffset}px` 
                  : undefined 
              }}>
                {/* Your Shows container with both rails */}
                <Section title={translations.yourShows}>
                  <div className="space-y-4">
                    <HomeYourShowsRail />
                    <HomeUpNextRail />
                  </div>
                </Section>

                {/* Community container, always visible */}
                <Section title={translations.community}>
                  <CommunityPanel />
                </Section>

                {/* For you container with dynamic rails based on settings */}
                <Section title={translations.forYou}>
                  <div className="space-y-4">
                    {forYouContent.map((contentQuery) => (
                      <Rail 
                        key={`for-you-${contentQuery.rowId}`}
                        id={`for-you-${contentQuery.rowId}`}  
                        title={contentQuery.title}
                        items={Array.isArray(contentQuery.data) ? contentQuery.data : []}
                        skeletonCount={12} 
                      />
                    ))}
                  </div>
                </Section>

                {/* In theaters container with address/info header */}
                <Section title={translations.inTheatersNearYou}>
                  <TheaterInfo />
                  <Rail id="in-theaters" title={translations.nowPlaying} items={Array.isArray(itemsFor('in-theaters')) ? itemsFor('in-theaters')!.map(item => ({ ...item, id: String(item.id), year: item.year ? parseInt(String(item.year)) : undefined })) : []} skeletonCount={12} />
                </Section>

                {/* Feedback container */}
                <Section title={translations.feedback}>
                  <FeedbackPanel />
                </Section>

                {/* Scroll to top arrow - appears when scrolled down */}
                <ScrollToTopArrow threshold={400} />
              </div>
            )}

            {/* These views are handled in the main home view above */}
            </>
          </PullToRefreshWrapper>
        )}

        {/* FAB Components - Available on all tabs */}
        <SettingsFAB onClick={handleSettingsClick} />
        <ThemeToggleFAB 
          theme={settings.layout.theme} 
          onToggle={() => settingsManager.updateTheme(settings.layout.theme === 'dark' ? 'light' : 'dark')} 
        />

        {/* Settings Modal */}
        {showSettings && (
          <Suspense fallback={<div className="loading-spinner">Loading settings...</div>}>
            <SettingsPage onClose={() => setShowSettings(false)} />
          </Suspense>
        )}

        {/* Notes and Tags Modal */}
        {showNotesModal && notesModalItem && (
          <Suspense fallback={<div className="loading-spinner">Loading notes...</div>}>
            <NotesAndTagsModal
              item={notesModalItem}
              isOpen={showNotesModal}
              onClose={() => setShowNotesModal(false)}
              onSave={handleSaveNotesAndTags}
            />
          </Suspense>
        )}

        {/* Toast Notifications */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            personalityLevel={settings.personalityLevel}
            onClose={() => removeToast(toast.id)}
          />
        ))}

        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />

        {/* FlickWord Game Modal */}
        {showFlickWordModal && (
          <Suspense fallback={<div className="loading-spinner">Loading game...</div>}>
            <FlickWordModal 
              isOpen={showFlickWordModal} 
              onClose={() => setShowFlickWordModal(false)}
            />
          </Suspense>
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
        )}
      </main>
    </PersonalityErrorBoundary>
  );
}
