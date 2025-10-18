import { useState, lazy, Suspense } from 'react';
import { useTranslations } from '@/lib/language';
import FlickWordStats from './games/FlickWordStats';
import TriviaStats from './games/TriviaStats';
import CommunityPlayer from './CommunityPlayer';

// Lazy load game modals
const FlickWordModal = lazy(() => import('./games/FlickWordModal'));
const TriviaModal = lazy(() => import('./games/TriviaModal'));

export default function CommunityPanel() {
  const translations = useTranslations();
  const [flickWordModalOpen, setFlickWordModalOpen] = useState(false);
  const [triviaModalOpen, setTriviaModalOpen] = useState(false);

  // Use global game functions if available
  const openFlickWord = () => {
    if (typeof (window as any).openFlickWordModal === 'function') {
      (window as any).openFlickWordModal();
    } else {
      setFlickWordModalOpen(true);
    }
  };

  return (
    <div className="relative">
      <div data-rail="community" className="grid md:grid-cols-3 gap-4 items-stretch">
        {/* Left: Player (spans 1 column) */}
        <div className="md:col-span-1">
          <CommunityPlayer />
        </div>

        {/* Middle: Stacked Games (spans 1 column) */}
        <div className="grid grid-rows-[1fr_1fr] gap-4 h-full">
          {/* FlickWord Game Card */}
          <div 
            className="rounded-2xl bg-neutral-900 border border-white/5 p-4 flex flex-col justify-between cursor-pointer hover:bg-neutral-800 transition-colors"
            onClick={openFlickWord}
          >
            <div className="w-full">
              <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                {translations.flickword || 'FlickWord'}
              </h3>
              <p className="text-xs text-neutral-400 mb-3">
                {translations.flickword_tagline || 'Wordle-style daily word play'}
              </p>
            </div>
            
            {/* Stats Display */}
            <div className="mt-auto">
              <FlickWordStats />
            </div>
            
            <div className="mt-3">
              <button 
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  openFlickWord();
                }}
              >
                {translations.play_now || 'Play Now'}
              </button>
            </div>
          </div>

          {/* Trivia Game Card */}
          <div
            className="rounded-2xl bg-neutral-900 border border-white/5 p-4 flex flex-col justify-between cursor-pointer hover:bg-neutral-800 transition-colors"
            onClick={() => setTriviaModalOpen(true)}
          >
            <div className="w-full">
              <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                {translations.daily_trivia || 'Daily Trivia'}
              </h3>
              <p className="text-xs text-neutral-400 mb-3">
                {translations.daily_trivia_tagline || 'Fresh question, new bragging rights'}
              </p>
            </div>

            {/* Stats Display */}
            <div className="mt-auto mb-3">
              <TriviaStats />
            </div>

            <div className="mt-auto">
              <button
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setTriviaModalOpen(true);
                }}
              >
                {translations.play_now || 'Play Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Coming Soon (spans 1 column) */}
        <div className="rounded-2xl bg-neutral-900 border border-white/5 p-4 flex flex-col justify-center items-center text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="text-sm font-semibold text-neutral-200 mb-2">
            Coming Soon
          </h3>
          <p className="text-xs text-neutral-400">
            More community features and interactive content coming your way!
          </p>
        </div>
      </div>

      {/* FlickWord Modal - Now rendered via Portal */}
      <Suspense fallback={<div className="loading-spinner">Loading FlickWord...</div>}>
        <FlickWordModal
          isOpen={flickWordModalOpen}
          onClose={() => setFlickWordModalOpen(false)}
        />
      </Suspense>

      {/* Trivia Modal - Now rendered via Portal */}
      <Suspense fallback={<div className="loading-spinner">Loading Trivia...</div>}>
        <TriviaModal
          isOpen={triviaModalOpen}
          onClose={() => setTriviaModalOpen(false)}
        />
      </Suspense>
    </div>
  );
}
