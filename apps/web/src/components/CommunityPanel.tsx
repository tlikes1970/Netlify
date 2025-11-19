import { useState, lazy, Suspense, useEffect, useRef, memo, useCallback } from "react";
import { collection, query, orderBy, limit, getDocs, startAfter, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseBootstrap";
import { useTranslations } from "@/lib/language";
import { useSettings, settingsManager } from "../lib/settings";
import { useAdminRole } from "../hooks/useAdminRole";
import { useAuth } from "../hooks/useAuth";
import FlickWordStats from "./games/FlickWordStats";
import TriviaStats from "./games/TriviaStats";
import CommunityPlayer from "./CommunityPlayer";
import NewPostModal from "./NewPostModal";
import { TOPICS, getTopicBySlug } from "../lib/communityTopics";
import { SortMode, sortPosts, isProSortMode, getAvailableSortModes, getSortModeLabel } from "../lib/communitySorting";
import ProBadge from "./ProBadge";
import { reportPostOrComment } from "../lib/communityReports";
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
  topics?: string[];
  score?: number;
  voteCount?: number;
  commentCount?: number;
  containsSpoilers?: boolean;
  authorIsPro?: boolean;
}

// ⚠️ FIXED: Memoize component to prevent unnecessary re-renders from parent
const CommunityPanel = memo(function CommunityPanel() {
  // ⚠️ REMOVED: flickerDiagnostics logging disabled

  const translations = useTranslations();
  const { isAdmin } = useAdminRole();
  const { isAuthenticated, user } = useAuth();
  const settings = useSettings();
  const isPro = settings.pro.isPro || false;
  const followedTopics = settings.community.followedTopics || [];
  const [reportingPosts, setReportingPosts] = useState<Record<string, boolean>>({});
  
  const [flickWordModalOpen, setFlickWordModalOpen] = useState(false);
  const [triviaModalOpen, setTriviaModalOpen] = useState(false);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  // Persist selectedTopics to localStorage
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('flicklet.community.selectedTopics');
    return saved ? JSON.parse(saved) : [];
  }); // Multi-select for Pro, single for Free
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Persist selectedTopics to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flicklet.community.selectedTopics', JSON.stringify(selectedTopics));
    }
  }, [selectedTopics]);
  
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Fetch posts from Firestore with filtering, sorting, and infinite scroll
  const fetchPosts = useCallback(async (reset: boolean = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }
    
    // Capture isAdmin from component scope
    const adminStatus = isAdmin;

    try {
      fetchingRef.current = true;
      if (reset) {
        setPostsLoading(true);
        setPosts([]);
        lastDocRef.current = null;
        hasFetchedRef.current = false;
      } else {
        setLoadingMore(true);
      }
      setPostsError(null);

      const postsRef = collection(db, "posts");
      const pageSize = 20; // Increased from 5 for infinite scroll
      
      // Build query based on sort mode
      // For Firestore, we can only orderBy fields that exist, so we'll fetch and sort in memory for advanced modes
      let postsQuery;
      
      if (sortMode === 'newest' || sortMode === 'oldest') {
        // Can use Firestore orderBy for these
        postsQuery = query(
          postsRef,
          orderBy("publishedAt", sortMode === 'newest' ? "desc" : "asc"),
          ...(lastDocRef.current && !reset ? [startAfter(lastDocRef.current)] : []),
          limit(pageSize)
        );
      } else {
        // For Top/Hot/Trending, fetch by publishedAt desc and sort in memory
        postsQuery = query(
          postsRef,
          orderBy("publishedAt", "desc"),
          ...(lastDocRef.current && !reset ? [startAfter(lastDocRef.current)] : []),
          limit(pageSize * 2) // Fetch more for filtering/sorting
        );
      }

      const snapshot = await getDocs(postsQuery);
      
      // Map to Post objects and filter out hidden posts (unless admin)
      let newPosts: Post[] = snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          // Show hidden posts only to admins
          if (data.hidden === true && !adminStatus) {
            return false;
          }
          return true;
        })
        .map((doc) => {
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
          topics: data.topics || [],
          score: data.score || 0,
          voteCount: data.voteCount || 0,
          commentCount: data.commentCount || 0,
          containsSpoilers: data.containsSpoilers || false,
          authorIsPro: data.authorIsPro || false,
        };
      });

      // Apply topic filtering
      if (selectedTopics.length > 0) {
        newPosts = newPosts.filter(post => {
          const postTopics = post.topics || [];
          return selectedTopics.some(topic => postTopics.includes(topic));
        });
      }

      // Apply sorting (for modes that need in-memory sorting)
      if (sortMode !== 'newest' && sortMode !== 'oldest') {
        newPosts = sortPosts(newPosts, sortMode);
      }

      // Prioritize followed topics if user has followed topics
      if (followedTopics.length > 0 && !selectedTopics.length) {
        newPosts.sort((a, b) => {
          const aHasFollowed = (a.topics || []).some(t => followedTopics.includes(t));
          const bHasFollowed = (b.topics || []).some(t => followedTopics.includes(t));
          if (aHasFollowed && !bHasFollowed) return -1;
          if (!aHasFollowed && bHasFollowed) return 1;
          return 0;
        });
      }

      // Limit to pageSize after filtering/sorting
      newPosts = newPosts.slice(0, pageSize);

      // Update last document for pagination
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
      
      // Check if there are more posts
      setHasMore(snapshot.docs.length >= pageSize);

      // Append or replace posts
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          // Avoid duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }

      hasFetchedRef.current = true;
    } catch (error) {
      console.error("[CommunityPanel] Error fetching posts:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load posts";

      setPostsError(errorMsg);
      if (reset) {
        setPosts([]);
      }
      hasFetchedRef.current = true;
    } finally {
      setPostsLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [sortMode, selectedTopics, followedTopics, isAdmin]);

  // Fetch posts on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchPosts(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset and refetch when sort mode or topics change
  useEffect(() => {
    if (hasFetchedRef.current) {
      fetchPosts(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortMode, selectedTopics]);

  // Listen for force-refresh event from pull-to-refresh
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log("[CommunityPanel] Force refresh triggered, refreshing posts...");
      fetchPosts(true);
    };
    window.addEventListener("force-refresh", handleForceRefresh);
    return () => {
      window.removeEventListener("force-refresh", handleForceRefresh);
    };
  }, [fetchPosts]);

  const handlePostCreated = () => {
    // Refresh posts list immediately after new post is created
    console.log(
      "[CommunityPanel] Post created callback triggered, refreshing posts..."
    );
    // Small delay to ensure Firestore write is complete
    setTimeout(() => {
      console.log("[CommunityPanel] Fetching posts after delay...");
      fetchPosts(true);
    }, 300);
  };

  // Handle topic selection (single for Free, multi for Pro)
  const handleTopicToggle = (topicSlug: string) => {
    if (isPro) {
      // Multi-select for Pro
      setSelectedTopics(prev => 
        prev.includes(topicSlug) 
          ? prev.filter(t => t !== topicSlug)
          : [...prev, topicSlug]
      );
    } else {
      // Single-select for Free
      setSelectedTopics(prev => 
        prev.includes(topicSlug) ? [] : [topicSlug]
      );
    }
  };

  // Handle topic follow/unfollow
  const handleFollowTopic = (topicSlug: string) => {
    settingsManager.toggleFollowTopic(topicSlug);
  };

  // Handle sort mode change with Pro gating
  const handleSortChange = (newMode: SortMode) => {
    if (isProSortMode(newMode) && !isPro) {
      // Show upgrade prompt (you can implement a modal/notification here)
      alert("Advanced sorting is a Pro feature. Upgrade in Settings → Pro.");
      return;
    }
    setSortMode(newMode);
  };

  // Load more posts (infinite scroll)
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !fetchingRef.current) {
      fetchPosts(false);
    }
  }, [loadingMore, hasMore, fetchPosts]);

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

  const handleReportPost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !user || reportingPosts[postId]) return;

    if (!confirm("Report this post? This will notify moderators for review.")) {
      return;
    }

    setReportingPosts((prev) => ({ ...prev, [postId]: true }));
    try {
      await reportPostOrComment(postId, "post", user.uid);
      alert("Post reported. Thank you for helping keep the community safe.");
    } catch (error: any) {
      alert(error.message || "Failed to report post. Please try again.");
    } finally {
      setReportingPosts((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="relative">
      <div
        data-rail="community"
        className="grid md:grid-cols-3 gap-4 items-start"
      >
        {/* Left: Player (spans 1 column) */}
        <div className="md:col-span-1">
          <CommunityPlayer />
        </div>

        {/* Middle: Stacked Games (spans 1 column) */}
        <div 
          className="grid grid-rows-[1fr_1fr] gap-4" 
          style={{ 
            height: "750px", // Match CommunityPlayer height
            maxHeight: "750px",
          }}
        >
          {/* FlickWord Game Card */}
          <div
            className="rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-colors"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--line)",
              borderWidth: "1px",
              borderStyle: "solid",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--btn)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--card)";
            }}
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
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--text)" }}
              >
                {translations.flickword || "FlickWord"}
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
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
            className="rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-colors"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--line)",
              borderWidth: "1px",
              borderStyle: "solid",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--btn)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--card)";
            }}
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
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--text)" }}
              >
                {translations.daily_trivia || "Daily Trivia"}
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
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
        <div
          className="rounded-2xl p-4 flex flex-col"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--line)",
            borderWidth: "1px",
            borderStyle: "solid",
            height: "calc(100vh - 200px)", // Fixed height for scrollable container
            maxHeight: "calc(100vh - 200px)",
            minHeight: "400px",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              {"Community Feed"}
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

          {/* Sort Controls & Topic Filters - Sticky Header */}
          <div 
            className="sticky top-0 z-10 mb-3 pb-2"
            style={{
              backgroundColor: "var(--card)",
              paddingTop: "0.5rem",
              marginTop: "-0.5rem",
            }}
          >
            {/* Sort Controls */}
            <div className="mb-3">
              <select
                value={sortMode}
                onChange={(e) => handleSortChange(e.target.value as SortMode)}
                className="w-full px-2 py-1.5 text-xs rounded-lg"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--line)",
                }}
              >
                {getAvailableSortModes(isPro).map(mode => (
                  <option key={mode} value={mode}>
                    {getSortModeLabel(mode)}
                    {isProSortMode(mode) && " ⭐"}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Filters */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5">
              {TOPICS.map(topic => {
                const isSelected = selectedTopics.includes(topic.slug);
                const isFollowed = followedTopics.includes(topic.slug);
                return (
                  <div key={topic.slug} className="flex items-center gap-1">
                    <button
                      onClick={() => handleTopicToggle(topic.slug)}
                      className="px-2 py-1 rounded-full text-[10px] font-medium transition"
                      style={{
                        backgroundColor: isSelected
                          ? "var(--accent-primary)"
                          : "var(--layer)",
                        color: isSelected ? "#fff" : "var(--text)",
                        border: `1px solid ${
                          isSelected ? "var(--accent-primary)" : "var(--line)"
                        }`,
                      }}
                      title={topic.description}
                    >
                      {topic.name}
                    </button>
                    <button
                      onClick={() => handleFollowTopic(topic.slug)}
                      className="text-xs"
                      style={{
                        color: isFollowed ? "#fbbf24" : "var(--muted)",
                      }}
                      title={isFollowed ? "Unfollow topic" : "Follow topic"}
                    >
                      {isFollowed ? "★" : "☆"}
                    </button>
                  </div>
                );
              })}
              {selectedTopics.length > 0 && (
                <button
                  onClick={() => setSelectedTopics([])}
                  className="px-2 py-1 rounded-full text-[10px] font-medium"
                  style={{
                    backgroundColor: "var(--layer)",
                    color: "var(--text)",
                    border: "1px solid var(--line)",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {!isPro && selectedTopics.length > 0 && (
              <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                Pro users can filter by multiple topics
              </p>
            )}
            </div>
          </div>

          {postsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Loading posts...
              </div>
            </div>
          ) : postsError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {postsError}
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                No posts yet
              </div>
            </div>
          ) : (
            <div 
              className="flex-1 overflow-y-auto min-h-0"
              style={{
                maxHeight: "100%",
              }}
              onScroll={(e) => {
                const target = e.currentTarget;
                const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                // Load more when within 100px of bottom
                if (scrollBottom < 100) {
                  loadMore();
                }
              }}
            >
              {posts.map((post) => {
                const publishDate = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : null;

                // Check if post is new (within last 24 hours)
                const isNew = post.publishedAt
                  ? (Date.now() - new Date(post.publishedAt).getTime()) < 24 * 60 * 60 * 1000
                  : false;

                return (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post.slug)}
                    className="cursor-pointer rounded-lg p-3 transition-colors mb-3 last:mb-0 relative group"
                    style={{
                      backgroundColor: "var(--btn2)",
                      borderColor: "var(--line)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--btn)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--btn2)";
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className="text-xs font-semibold line-clamp-2 flex-1"
                        style={{ color: "var(--text)" }}
                      >
                        {post.title}
                      </h4>
                      {isNew && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide flex-shrink-0 relative z-0"
                          style={{
                            backgroundColor: "var(--accent-primary)",
                            color: "var(--text)",
                            zIndex: 0,
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    {post.excerpt && (
                      <p
                        className="text-xs mb-2 line-clamp-2"
                        style={{ color: "var(--muted)" }}
                      >
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {post.topics && post.topics.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {post.topics.slice(0, 3).map(topicSlug => {
                            const topic = getTopicBySlug(topicSlug);
                            return topic ? (
                              <span
                                key={topicSlug}
                                className="px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                                style={{
                                  backgroundColor: "var(--layer)",
                                  color: "var(--muted)",
                                  border: "1px solid var(--line)",
                                }}
                              >
                                {topic.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      <span>
                        {post.author?.username ||
                          post.author?.name ||
                          "Unknown"}
                      </span>
                      <ProBadge isPro={post.authorIsPro} />
                      {publishDate && (
                        <>
                          <span>·</span>
                          <span>{publishDate}</span>
                        </>
                      )}
                      {post.score !== undefined && (
                        <>
                          <span>·</span>
                          <span>Score: {post.score}</span>
                        </>
                      )}
                      {post.commentCount !== undefined && post.commentCount > 0 && (
                        <>
                          <span>·</span>
                          <span
                            className="font-semibold"
                            style={{ color: "var(--accent-primary)" }}
                          >
                            {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Report Button - appears on hover */}
                    {isAuthenticated && user && (
                      <button
                        onClick={(e) => handleReportPost(post.id, e)}
                        disabled={reportingPosts[post.id]}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2 px-2 py-1 text-xs rounded hover:bg-red-500/10 z-10"
                        style={{ color: "var(--muted)", zIndex: 10 }}
                        title="Report post"
                      >
                        {reportingPosts[post.id] ? "Reporting..." : "Report"}
                      </button>
                    )}
                  </div>
                );
              })}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    Loading more...
                  </div>
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    No more posts
                  </div>
                </div>
              )}
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
