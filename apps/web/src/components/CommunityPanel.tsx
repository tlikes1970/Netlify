import { useState, lazy, Suspense, useEffect } from 'react';
import { useTranslations } from '@/lib/language';
import FlickWordStats from './games/FlickWordStats';
import TriviaStats from './games/TriviaStats';
import CommunityPlayer from './CommunityPlayer';
import NewPostModal from './NewPostModal';

// Lazy load game modals
const FlickWordModal = lazy(() => import('./games/FlickWordModal'));
const TriviaModal = lazy(() => import('./games/TriviaModal'));

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  author: {
    username?: string;
    name?: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  tags?: Array<{ slug: string; name: string }>;
}

export default function CommunityPanel() {
  const translations = useTranslations();
  const [flickWordModalOpen, setFlickWordModalOpen] = useState(false);
  const [triviaModalOpen, setTriviaModalOpen] = useState(false);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      setPostsError(null);
      
      // Determine API URL - check for environment variable or use default
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      const response = await fetch(`${apiUrl}/api/v1/posts?page=1&pageSize=5&sort=newest`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('[CommunityPanel] Error fetching posts:', error);
      // More user-friendly error message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setPostsError('Unable to connect to server. The backend may not be running.');
      } else {
        setPostsError(error instanceof Error ? error.message : 'Failed to load posts');
      }
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = () => {
    // Refresh posts list after new post is created
    fetchPosts();
  };

  // Use global game functions if available
  const openFlickWord = () => {
    if (typeof (window as any).openFlickWordModal === 'function') {
      (window as any).openFlickWordModal();
    } else {
      setFlickWordModalOpen(true);
    }
  };

  const handlePostClick = (slug: string) => {
    window.history.pushState({}, '', `/posts/${slug}`);
    window.dispatchEvent(new Event('pushstate'));
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

        {/* Right: Recent Posts (spans 1 column) */}
        <div className="rounded-2xl bg-neutral-900 border border-white/5 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-200">
              {'Recent Posts'}
            </h3>
            <button
              onClick={() => setNewPostModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
              }}
              aria-label="Create new post"
            >
              Post
            </button>
          </div>
          
          {postsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs text-neutral-400">Loading posts...</div>
            </div>
          ) : postsError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs text-neutral-400">{postsError}</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs text-neutral-400">No posts yet</div>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto">
              {posts.map((post) => {
                const publishDate = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : null;
                
                return (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post.slug)}
                    className="cursor-pointer hover:bg-neutral-800/50 rounded-lg p-2 transition-colors"
                  >
                    <h4 className="text-xs font-semibold text-neutral-200 mb-1 line-clamp-2">
                      {post.title}
                    </h4>
                    {post.excerpt && (
                      <p className="text-xs text-neutral-400 mb-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span>{post.author?.username || post.author?.name || 'Unknown'}</span>
                      {publishDate && (
                        <>
                          <span>·</span>
                          <span>{publishDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* New Post Modal */}
      <NewPostModal
        isOpen={newPostModalOpen}
        onClose={() => setNewPostModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
