import Tabs from '@/components/Tabs';
import MobileTabs, { useViewportOffset } from '@/components/MobileTabs';
import ListPage from '@/pages/ListPage';
import MyListsPage from '@/pages/MyListsPage';
import DiscoveryPage from '@/pages/DiscoveryPage';
import FlickletHeader from '@/components/FlickletHeader';
import Rail from '@/components/Rail';
import Section from '@/components/Section';
import CommunityPanel from '@/components/CommunityPanel';
import TheaterInfo from '@/components/TheaterInfo';
import FeedbackPanel from '@/components/FeedbackPanel';
import SearchResults from '@/search/SearchResults';
import HomeYourShowsRail from '@/components/rails/HomeYourShowsRail';
import HomeUpNextRail from '@/components/rails/HomeUpNextRail';
import SettingsPage from '@/components/SettingsPage';
import { SettingsFAB, ThemeToggleFAB } from '@/components/FABs';
import NotesAndTagsModal from '@/components/modals/NotesAndTagsModal';
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper';
import { useForYouRows } from '@/hooks/useForYouRows';
import { useForYouContent } from '@/hooks/useGenreContent';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useEffect, useState } from 'react';
import { Library, useLibrary } from '@/lib/storage';
import { mountActionBridge, setToastCallback } from '@/state/actions';
import { useSettings, settingsManager } from '@/lib/settings';
import { useInTheaters } from '@/hooks/useTmdb';
import { useTranslations } from '@/lib/language';
import { getPersonalityText } from '@/lib/settings';
import Toast, { useToast } from '@/components/Toast';
import PersonalityErrorBoundary from '@/components/PersonalityErrorBoundary';
import '@/styles/flickword.css';
import { useAuth } from '@/hooks/useAuth';

type View = 'home'|'watching'|'want'|'watched'|'mylists'|'discovery';

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
  
  // Toast system
  const { toasts, addToast, removeToast } = useToast();

  // Auth state
  const { user } = useAuth();

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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGenre, setSearchGenre] = useState<string | null>(null);
  const searchActive = !!searchQuery.trim();

  // For You configuration from settings
  const forYouRows = useForYouRows();
  const forYouContent = useForYouContent(forYouRows);

  // Lists - using new Library system with reactive updates
  const watching = useLibrary('watching');
  const wishlist = useLibrary('wishlist');
  const watched = useLibrary('watched');

  // Data rails
  const theaters = useInTheaters();

  // Initialize action bridge
  useEffect(() => {
    // Set up toast callback for personality-based feedback
    setToastCallback(addToast);
    
    const cleanup = mountActionBridge();
    return cleanup;
  }, [addToast]);

      // Handle search events from search cards
      useEffect(() => {
        const handleSimilarSearch = (event: CustomEvent) => {
          console.log('📥 App.tsx received search:similar event:', event.detail);
          const { query, genre, similarityFactors } = event.detail;
          console.log('🔄 Setting search query to:', query, 'genre:', genre);
          console.log('🎯 Genre-focused similarity factors:', similarityFactors);
          console.log('🎭 Genre breakdown:', {
            totalGenres: similarityFactors?.genreCount || 0,
            primary: similarityFactors?.primaryGenre,
            secondary: similarityFactors?.secondaryGenre,
            allGenres: similarityFactors?.genres
          });
          setSearchQuery(query);
          setSearchGenre(genre);
        };

        const handleRefineSearch = (event: CustomEvent) => {
          console.log('📥 App.tsx received search:refine event:', event.detail);
          const { query, genre, refinementFilters } = event.detail;
          console.log('🔄 Setting search query to:', query, 'genre:', genre);
          console.log('🎯 Refinement filters:', refinementFilters);
          setSearchQuery(query);
          setSearchGenre(genre);
        };

    console.log('🎧 App.tsx setting up event listeners for search events');
    document.addEventListener('search:similar', handleSimilarSearch as EventListener);
    document.addEventListener('search:refine', handleRefineSearch as EventListener);
    
    return () => {
      console.log('🧹 App.tsx cleaning up search event listeners');
      document.removeEventListener('search:similar', handleSimilarSearch as EventListener);
      document.removeEventListener('search:refine', handleRefineSearch as EventListener);
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

  const handleSaveNotesAndTags = (item: any, notes: string, tags: string[]) => {
    // Update the item in the library with new notes and tags
    Library.updateNotesAndTags(item.id, item.mediaType, notes, tags);
    setShowNotesModal(false);
    setNotesModalItem(null);
  };

  if (view !== 'home') {
    return (
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100lvh' }}>
        <FlickletHeader
          appName="Flicklet"
          showMarquee={false}
          onSearch={(q, g) => { setSearchQuery(q); setSearchGenre(g ?? null); }}
          onClear={() => { setSearchQuery(''); setSearchGenre(null); }}
        />
        {searchActive ? (
          <SearchResults query={searchQuery} genre={searchGenre} />
        ) : (
          <>
            {/* Desktop Tabs */}
            <div className="hidden lg:block">
              <Tabs current={view} onChange={setView} />
            </div>
            
            {/* Mobile Tabs */}
            <div className="block lg:hidden">
              <MobileTabs current={view} onChange={setView} />
            </div>
            
            {/* Add bottom padding for mobile tabs */}
            <div className="pb-20 lg:pb-0" style={{ 
              paddingBottom: viewportOffset > 0 && window.visualViewport?.offsetTop === 0 
                ? `${80 + viewportOffset}px` 
                : undefined 
            }}>
              {view === 'watching'  && <ListPage title="Currently Watching" items={watching} mode="watching" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} />}
              {view === 'want'      && <ListPage title="Want to Watch"     items={wishlist}     mode="want" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} />}
              {view === 'watched'   && <ListPage title="Watched"           items={watched}  mode="watched" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} />}
              {view === 'mylists'  && <MyListsPage />}
              {view === 'discovery' && <DiscoveryPage query={searchQuery} genreId={searchGenre ? parseInt(searchGenre) : null} />}
            </div>
          </>
        )}

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
            📱 You're offline - viewing cached content
          </div>
        )}

        {/* FAB Components - Available on all tabs */}
        <SettingsFAB onClick={() => setShowSettings(true)} />
        <ThemeToggleFAB 
          theme={settings.layout.theme} 
          onToggle={() => settingsManager.updateTheme(settings.layout.theme === 'dark' ? 'light' : 'dark')} 
        />

        {/* Settings Modal */}
        {showSettings && (
          <SettingsPage onClose={() => setShowSettings(false)} />
        )}

        {/* Notes and Tags Modal */}
        {showNotesModal && notesModalItem && (
          <NotesAndTagsModal
            item={notesModalItem}
            isOpen={showNotesModal}
            onClose={() => setShowNotesModal(false)}
            onSave={handleSaveNotesAndTags}
          />
        )}
      </main>
    );
  }

  return (
    <PersonalityErrorBoundary>
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100lvh' }}>
        <FlickletHeader
          appName="Flicklet"
          showMarquee={isHome && !searchActive}
          onSearch={(q, g) => { setSearchQuery(q); setSearchGenre(g ?? null); }}
          onClear={() => { setSearchQuery(''); setSearchGenre(null); }}
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
              setSearchQuery(''); 
              setSearchGenre(null); 
            } 
          }} />
        </div>
        
        {/* Mobile Tabs - always visible */}
        <div className="block lg:hidden">
          <MobileTabs current={view} onChange={(tab) => { 
            setView(tab); 
            if (searchActive) { 
              setSearchQuery(''); 
              setSearchGenre(null); 
            } 
          }} />
        </div>
        
        {searchActive ? (
          <PullToRefreshWrapper onRefresh={handleRefresh}>
            <SearchResults query={searchQuery} genre={searchGenre} />
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
                  <Rail id="in-theaters" title={translations.nowPlaying} items={Array.isArray(itemsFor('in-theaters')) ? itemsFor('in-theaters') : []} skeletonCount={12} />
                </Section>

                {/* Feedback container */}
                <Section title={translations.feedback}>
                  <FeedbackPanel />
                </Section>
              </div>
            )}

            {/* These views are handled in the main home view above */}
            </>
          </PullToRefreshWrapper>
        )}

        {/* FAB Components - Available on all tabs */}
        <SettingsFAB onClick={() => setShowSettings(true)} />
        <ThemeToggleFAB 
          theme={settings.layout.theme} 
          onToggle={() => settingsManager.updateTheme(settings.layout.theme === 'dark' ? 'light' : 'dark')} 
        />

        {/* Settings Modal */}
        {showSettings && (
          <SettingsPage onClose={() => setShowSettings(false)} />
        )}

        {/* Notes and Tags Modal */}
        {showNotesModal && notesModalItem && (
          <NotesAndTagsModal
            item={notesModalItem}
            isOpen={showNotesModal}
            onClose={() => setShowNotesModal(false)}
            onSave={handleSaveNotesAndTags}
          />
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
      </main>
    </PersonalityErrorBoundary>
  );
}
