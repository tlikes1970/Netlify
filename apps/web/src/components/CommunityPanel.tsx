import { useState, lazy, Suspense, useEffect, useRef, memo } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebaseBootstrap";
import { useTranslations } from "@/lib/language";
import FlickWordStats from "./games/FlickWordStats";
import TriviaStats from "./games/TriviaStats";
import CommunityPlayer from "./CommunityPlayer";
import NewPostModal from "./NewPostModal";
// ⚠️ REMOVED: flickerDiagnostics import disabled

// Lazy load game modals
const FlickWordModal = lazy(() => import("./games/FlickWordModal"));
const TriviaModal = lazy(() => import("./games/TriviaModal"));

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

// ⚠️ FIXED: Memoize component to prevent unnecessary re-renders from parent
const CommunityPanel = memo(function CommunityPanel() {
  // ⚠️ REMOVED: flickerDiagnostics logging disabled

  const translations = useTranslations();
  const [flickWordModalOpen, setFlickWordModalOpen] = useState(false);
  const [triviaModalOpen, setTriviaModalOpen] = useState(false);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const prevPostsRef = useRef<Post[]>([]);
  const prevLoadingRef = useRef(true);
  const prevErrorRef = useRef<string | null>(null);

  // Fetch posts from Firestore
  const fetchPosts = async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setPostsLoading(true);
      setPostsError(null);

      // Query Firestore for recent posts
      const postsRef = collection(db, "posts");
      const postsQuery = query(
        postsRef,
        orderBy("publishedAt", "desc"),
        limit(5)
      );

      const snapshot = await getDocs(postsQuery);
      const newPosts: Post[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          slug: data.slug || "",
          title: data.title || "Untitled",
          excerpt: data.excerpt,
          publishedAt:
            data.publishedAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          author: {
            username: data.authorName,
            name: data.authorName,
          },
          tags: (data.tagSlugs || []).map((slug: string) => ({
            slug,
            name: slug,
          })),
        };
      });

      console.log("[CommunityPanel] Fetched posts from Firestore:", {
        count: newPosts.length,
        posts: newPosts.map((p: Post) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
        })),
      });
      prevPostsRef.current = newPosts;
      setPosts(newPosts);
      hasFetchedRef.current = true;
    } catch (error) {
      console.error("[CommunityPanel] Error fetching posts:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load posts";

      prevErrorRef.current = errorMsg;
      prevPostsRef.current = [];
      setPostsError(errorMsg);
      setPosts([]);
      hasFetchedRef.current = true;
    } finally {
      prevLoadingRef.current = false;
      setPostsLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    // ⚠️ REMOVED: flickerDiagnostics logging disabled
    // Only fetch once on mount
    if (!hasFetchedRef.current) {
      fetchPosts();
    }
  }, []);

  const handlePostCreated = () => {
    // Refresh posts list immediately after new post is created
    console.log(
      "[CommunityPanel] Post created callback triggered, refreshing posts..."
    );
    hasFetchedRef.current = false; // Allow refetch after post creation
    // Small delay to ensure Firestore write is complete
    setTimeout(() => {
      console.log("[CommunityPanel] Fetching posts after delay...");
      fetchPosts();
    }, 300);
  };

  // Use global game functions if available
  const openFlickWord = () => {
    if (typeof (window as any).openFlickWordModal === "function") {
      (window as any).openFlickWordModal();
    } else {
      setFlickWordModalOpen(true);
    }
  };

  const handlePostClick = (slug: string) => {
    window.history.pushState({}, "", `/posts/${slug}`);
    window.dispatchEvent(new Event("pushstate"));
  };

  return (
    <div className="relative">
      <div
        data-rail="community"
        className="grid md:grid-cols-3 gap-4 items-stretch"
      >
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFlickWord();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Play FlickWord game"
          >
            <div className="w-full">
              <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                {translations.flickword || "FlickWord"}
              </h3>
              <p className="text-xs text-neutral-400 mb-3">
                {translations.flickword_tagline ||
                  "Wordle-style daily word play"}
              </p>
            </div>

            {/* Stats Display */}
            <div
              className="mt-auto"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <FlickWordStats />
            </div>

            <div className="mt-3">
              <button
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  openFlickWord();
                }}
                aria-label="Play FlickWord now"
              >
                {translations.play_now || "Play Now"}
              </button>
            </div>
          </div>

          {/* Trivia Game Card */}
          <div
            className="rounded-2xl bg-neutral-900 border border-white/5 p-4 flex flex-col justify-between"
            role="button"
            tabIndex={0}
            aria-label="Daily Trivia game card. Click to play."
            onClick={() => setTriviaModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setTriviaModalOpen(true);
              }
            }}
          >
            <div className="w-full">
              <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                {translations.daily_trivia || "Daily Trivia"}
              </h3>
              <p className="text-xs text-neutral-400 mb-3">
                {translations.daily_trivia_tagline ||
                  "Fresh question, new bragging rights"}
              </p>
            </div>

            {/* Stats Display */}
            <div
              className="mt-auto mb-3"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <TriviaStats />
            </div>

            <div className="mt-auto">
              <button
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setTriviaModalOpen(true);
                }}
                aria-label="Play Daily Trivia now"
              >
                {translations.play_now || "Play Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Recent Posts (spans 1 column) */}
        <div className="rounded-2xl bg-neutral-900 border border-white/5 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-200">
              {"Recent Posts"}
            </h3>
            <button
              onClick={() => setNewPostModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "#fff",
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
            <div className="flex-1 overflow-y-auto">
              {posts.map((post) => {
                const publishDate = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : null;

                return (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post.slug)}
                    className="cursor-pointer hover:bg-neutral-800/50 rounded-lg p-3 transition-colors border border-neutral-800/50 hover:border-neutral-700/50 mb-3 last:mb-0"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.2)",
                    }}
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
                      <span>
                        {post.author?.username ||
                          post.author?.name ||
                          "Unknown"}
                      </span>
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
      <Suspense
        fallback={<div className="loading-spinner">Loading FlickWord...</div>}
      >
        <FlickWordModal
          isOpen={flickWordModalOpen}
          onClose={() => setFlickWordModalOpen(false)}
        />
      </Suspense>

      {/* Trivia Modal - Now rendered via Portal */}
      <Suspense
        fallback={<div className="loading-spinner">Loading Trivia...</div>}
      >
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
});

export default CommunityPanel;
