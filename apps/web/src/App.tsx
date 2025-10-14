import Tabs from '@/components/Tabs';
import MobileTabs from '@/components/MobileTabs';
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
import { useForYouRows } from '@/hooks/useForYouRows';
import { useForYouContent } from '@/hooks/useGenreContent';
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
  
  // Notes and Tags modal state
  const [notesModalItem, setNotesModalItem] = useState<any>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  // Toast system
  const { toasts, addToast, removeToast } = useToast();

  // Auth state
  const { user } = useAuth();

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
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
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
            <div className="hidden md:block">
              <Tabs current={view} onChange={setView} />
            </div>
            
            {/* Mobile Tabs */}
            <div className="block md:hidden">
              <MobileTabs current={view} onChange={setView} />
            </div>
            
            {/* Add bottom padding for mobile tabs */}
            <div className="pb-20 md:pb-0">
              {view === 'watching'  && <ListPage title="Currently Watching" items={watching} mode="watching" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} />}
              {view === 'want'      && <ListPage title="Want to Watch"     items={wishlist}     mode="want" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} />}
              {view === 'watched'   && <ListPage title="Watched"           items={watched}  mode="watched" onNotesEdit={handleNotesEdit} onTagsEdit={handleTagsEdit} />}
              {view === 'mylists'  && <MyListsPage />}
              {view === 'discovery' && <DiscoveryPage query={searchQuery} genreId={searchGenre} />}
            </div>
          </>
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
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
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
        <div className="hidden md:block">
          <Tabs current={view} onChange={(tab) => { 
            setView(tab); 
            if (searchActive) { 
              setSearchQuery(''); 
              setSearchGenre(null); 
            } 
          }} />
        </div>
        
        {/* Mobile Tabs - always visible */}
        <div className="block md:hidden">
          <MobileTabs current={view} onChange={(tab) => { 
            setView(tab); 
            if (searchActive) { 
              setSearchQuery(''); 
              setSearchGenre(null); 
            } 
          }} />
        </div>
        
        {searchActive ? (
          <SearchResults query={searchQuery} genre={searchGenre} />
        ) : (
          <>
            {view === 'home' && (
              <div className="pb-20 md:pb-0">
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
                    {forYouContent.map((contentQuery, index) => (
                      <Rail 
                        key={`for-you-${contentQuery.rowId}`}
                        id={`for-you-${contentQuery.rowId}`}  
                        title={contentQuery.title}
                        items={contentQuery.data ?? []}
                        skeletonCount={12} 
                      />
                    ))}
                  </div>
                </Section>

                {/* In theaters container with address/info header */}
                <Section title={translations.inTheatersNearYou}>
                  <TheaterInfo />
                  <Rail id="in-theaters" title={translations.nowPlaying} items={itemsFor('in-theaters')} skeletonCount={12} />
                </Section>

                {/* Feedback container */}
                <Section title={translations.feedback}>
                  <FeedbackPanel />
                </Section>
              </div>
            )}

            {view === 'watching' && (
              <ListPage 
                title={translations.currentlyWatching} 
                items={watching} 
                mode="watching"
              />
            )}
            {view === 'want' && (
              <ListPage 
                title={translations.wantToWatch} 
                items={wishlist} 
                mode="want"
              />
            )}
            {view === 'watched' && (
              <ListPage 
                title={translations.alreadyWatched} 
                items={watched} 
                mode="watched"
              />
            )}
            {view === 'mylists' && <MyListsPage />}
            {view === 'discovery' && <DiscoveryPage />}
          </>
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
