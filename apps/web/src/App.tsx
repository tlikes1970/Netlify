import Tabs from '@/components/Tabs';
import ListPage from '@/pages/ListPage';
import HolidaysPage from '@/pages/HolidaysPage';
import DiscoveryPage from '@/pages/DiscoveryPage';
import FlickletHeader from '@/components/FlickletHeader';
import SearchBar from '@/components/SearchBar';
import MarqueeBar from '@/components/MarqueeBar';
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
import { HOME_RAILS } from '@/config/structure';
import { useEffect, useMemo, useState } from 'react';
import { useFlag } from './lib/flags';
import { Library } from '@/lib/storage';
import { mountActionBridge } from '@/state/actions';
import { useSettings, settingsManager } from '@/lib/settings';
import { useForYou, useInTheaters } from '@/hooks/useTmdb';
import { useFeatured } from '@/hooks/useFeatured';
import { useTranslations } from '@/lib/language';

type View = 'home'|'watching'|'want'|'watched'|'holidays'|'discovery';

export default function App() {
  const [view, setView] = useState<View>('home');
  const isHome = typeof window !== 'undefined' && window.location.pathname === '/';

  // Settings state
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const translations = useTranslations();

  // User/auth state
  const [user, setUser] = useState<{ name: string; loggedIn: boolean }>(() => {
    try { return JSON.parse(localStorage.getItem('flicklet:v2:user') || '') || { name: 'Guest', loggedIn: false }; } catch { return { name: 'Guest', loggedIn: false }; }
  });
  const toggleLogin = () => {
    setUser(u => {
      const next = u.loggedIn ? { name: 'Guest', loggedIn: false } : { name: 'User', loggedIn: true };
      localStorage.setItem('flicklet:v2:user', JSON.stringify(next));
      return next;
    });
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGenre, setSearchGenre] = useState<string | null>(null);
  const searchActive = !!searchQuery.trim();
  const doSearch = () => setView('discovery');
  const clearSearch = () => { setSearchQuery(''); setSearchGenre(null); }

  // Lists - using new Library system
  const watching = Library.getByList('watching');
  const wishlist = Library.getByList('wishlist');
  const watched = Library.getByList('watched');
  const notInterested = Library.getByList('not');

  // Data rails
  const forYou = useForYou();
  const theaters = useInTheaters();

  // Initialize action bridge
  useEffect(() => {
    const cleanup = mountActionBridge();
    return cleanup;
  }, []);

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
          username={user.name}
          isAuthed={user.loggedIn}
          onLogin={toggleLogin}
          onLogout={toggleLogin}
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
            {view === 'want'      && <ListPage title="Want to Watch"     items={wishlist}     mode="catalog"  />}
            {view === 'watched'   && <ListPage title="Watched"           items={watched}  mode="watching" />}
            {view === 'holidays'  && <HolidaysPage />}
            {view === 'discovery' && <DiscoveryPage query={searchQuery} genreId={searchGenre} />}
          </>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <FlickletHeader
          appName="Flicklet"
          username={user.name}
          isAuthed={user.loggedIn}
          onLogin={toggleLogin}
          onLogout={toggleLogin}
          showMarquee={isHome && !searchActive}
          onSearch={(q, g) => { setSearchQuery(q); setSearchGenre(g ?? null); }}
          onClear={() => { setSearchQuery(''); setSearchGenre(null); }}
                messages={[
                  translations.marqueeMessage1,
                  translations.marqueeMessage2,
                  translations.marqueeMessage3,
                  translations.marqueeMessage4,
                  translations.marqueeMessage5,
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

          {/* For you container with three rails */}
          <Section title={translations.forYou}>
            <div className="space-y-4">
              <Rail id="for-you-drama"  title={translations.drama}  items={itemsFor('for-you-drama')}  skeletonCount={12} />
              <Rail id="for-you-comedy" title={translations.comedy} items={itemsFor('for-you-comedy')} skeletonCount={12} />
              <Rail id="for-you-horror" title={translations.horror} items={itemsFor('for-you-horror')} skeletonCount={12} />
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
    </main>
  );
}
