import Tabs from '@/components/Tabs';
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
import GenreDropdown from '@/components/GenreDropdown';
import { useEffect, useState } from 'react';
import { Library, useLibrary } from '@/lib/storage';
import { mountActionBridge, setToastCallback } from '@/state/actions';
import { useSettings, settingsManager } from '@/lib/settings';
import { useForYou, useInTheaters } from '@/hooks/useTmdb';
import { useTranslations } from '@/lib/language';
import { getPersonalityText } from '@/lib/settings';
import Toast, { useToast } from '@/components/Toast';
import PersonalityErrorBoundary from '@/components/PersonalityErrorBoundary';
import { useAuth } from '@/hooks/useAuth';

type View = 'home'|'watching'|'want'|'watched'|'mylists'|'discovery';

export default function App() {
  const [view, setView] = useState<View>('home');
  const isHome = typeof window !== 'undefined' && window.location.pathname === '/';

  // Settings state
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const translations = useTranslations();
  
  // Toast system
  const { toasts, addToast, removeToast } = useToast();

  // Auth state
  const { user } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGenre, setSearchGenre] = useState<string | null>(null);
  const searchActive = !!searchQuery.trim();

  // Genre preferences for For You section
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['drama', 'comedy', 'horror']);

  // Lists - using new Library system with reactive updates
  const watching = useLibrary('watching');
  const wishlist = useLibrary('wishlist');
  const watched = useLibrary('watched');

  // Data rails
  const forYou = useForYou();
  const theaters = useInTheaters();

  // Initialize action bridge
  useEffect(() => {
    // Set up toast callback for personality-based feedback
    setToastCallback(addToast);
    
    const cleanup = mountActionBridge();
    return cleanup;
  }, [addToast]);

  function itemsFor(id: string) {
    switch (id) {
      case 'currently-watching': return watching;
      case 'up-next':            return []; // TODO: populate from episodes
      case 'for-you-drama':
      case 'for-you-comedy':
      case 'for-you-horror':     return forYou.data ?? [];
      case 'in-theaters':        return theaters.data ?? [];
      default:                   return undefined;
    }
  }

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
            <Tabs current={view} onChange={setView} />
            {view === 'watching'  && <ListPage title="Currently Watching" items={watching} mode="watching" />}
            {view === 'want'      && <ListPage title="Want to Watch"     items={wishlist}     mode="want"  />}
            {view === 'watched'   && <ListPage title="Watched"           items={watched}  mode="watched" />}
                    {view === 'mylists'  && <MyListsPage />}
            {view === 'discovery' && <DiscoveryPage query={searchQuery} genreId={searchGenre} />}
          </>
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
          marqueeSpeedSec={30}
          changeEveryMs={20000}
        />
        {searchActive ? (
          <SearchResults query={searchQuery} genre={searchGenre} />
        ) : (
          <>
            <Tabs current={view} onChange={setView} />

            {/* Your Shows - using new rail components */}
            <HomeYourShowsRail />
            <HomeUpNextRail />

            {/* Community container, always visible */}
            <Section title={translations.community}>
              <CommunityPanel />
            </Section>

            {/* For you container with genre dropdown and rails */}
            <Section title={translations.forYou}>
              <div className="mb-4">
                <GenreDropdown
                  selectedGenres={selectedGenres}
                  onGenresChange={setSelectedGenres}
                  className="max-w-md"
                />
              </div>
              <div className="space-y-4">
                {selectedGenres.map(genre => (
                  <Rail 
                    key={`for-you-${genre}`}
                    id={`for-you-${genre}`}  
                    title={genre.charAt(0).toUpperCase() + genre.slice(1)}  
                    items={itemsFor('for-you-drama')}  // TODO: Filter by genre
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
          </>
        )}

        {/* FAB Components - Only show on home page */}
        {view === 'home' && (
          <>
            <SettingsFAB onClick={() => setShowSettings(true)} />
            <ThemeToggleFAB 
              theme={settings.layout.theme} 
              onToggle={() => settingsManager.updateTheme(settings.layout.theme === 'dark' ? 'light' : 'dark')} 
            />
          </>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <SettingsPage onClose={() => setShowSettings(false)} />
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
