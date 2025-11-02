import React, { useState, lazy, Suspense } from 'react';
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

        {/* =====  NEW COMMUNITY HUB  ===== */}
        <div className="bg-base rounded-xl shadow-card p-4">
          <h3 className="text-primary text-lg font-semibold mb-3">
            Latest Posts
          </h3>
          <CommunityHub />
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

/* ----------  CommunityHub  ---------- */
function CommunityHub() {
  const [posts, setPosts] = React.useState([]);
  const [page, setPage]   = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const pageSize = 5;

  React.useEffect(() => {
    fetch(`http://localhost:4000/api/v1/posts?page=${page}&pageSize=${pageSize}&sort=newest`)
      .then(r => r.json())
      .then(json => {
        setPosts(json.posts);
        setTotal(json.total);
      })
      .catch(err => console.error('CommunityHub fetch', err));
  }, [page]);

  const handlePostClick = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', `/posts/${slug}`);
    // Dispatch custom event for App.tsx to listen
    window.dispatchEvent(new Event('pushstate'));
  };

  return (
    <div className="space-y-3">
      {posts.map((p: any) => (
        <a
          key={p.slug}
          href={`/posts/${p.slug}`}
          onClick={(e) => handlePostClick(p.slug, e)}
          className="block bg-layer rounded-lg p-3 hover:ring-2 hover:ring-accent-primary transition cursor-pointer"
        >
          <h4 className="text-primary font-medium truncate">{p.title}</h4>
          <p className="text-secondary text-sm mt-1 line-clamp-2">
            {p.content?.slice(0, 100) || p.excerpt || ''}
            {p.content && p.content.length > 100 ? '...' : ''}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-secondary">
            <span>{p.author?.username || p.author?.name || 'Unknown'}</span>
            <span>·</span>
            <span>{new Date(p.publishedAt).toLocaleDateString()}</span>
          </div>
        </a>
      ))}

      {total > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-layer text-secondary disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-secondary text-sm">
            {page} / {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-3 py-1 rounded bg-layer text-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
