import { useState, useEffect } from 'react';
import VoteBar from './VoteBar';
import CommentComposer from './CommentComposer';
import CommentList from './CommentList';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseBootstrap';

interface PostDetailProps {
  slug: string;
}

interface Post {
  id: string;
  title?: string;
  excerpt?: string;
  content?: string;
  body?: string; // Firestore uses 'body', Prisma uses 'content'
  publishedAt: string;
  author: {
    username?: string;
    name?: string; // Firestore uses 'name', Prisma uses 'username'
    email?: string;
    profile?: {
      avatarUrl?: string;
      bio?: string;
    };
  };
  tags?: Array<{
    slug: string;
    name: string;
  }>;
}

export default function PostDetail({ slug }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch post from Firestore by slug
    const fetchPost = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          throw new Error('Post not found');
        }

        const doc = snapshot.docs[0];
        const data = doc.data();
        
        // Convert tagSlugs to tags array format
        const tagSlugs = data.tagSlugs || [];
        const tags = tagSlugs.map((slug: string) => ({
          slug,
          name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
        }));
        
        setPost({
          id: doc.id,
          title: data.title || '',
          excerpt: data.excerpt || '',
          content: data.content || data.body || '',
          body: data.body || data.content || '',
          publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt || new Date().toISOString(),
          author: data.author || { 
            username: data.authorName || 'Anonymous',
            name: data.authorName || 'Anonymous',
            email: data.authorId || '',
            profile: {}
          },
          tags: tags,
        });
        setLoading(false);
      } catch (err: any) {
        console.error('PostDetail fetch error:', err);
        setError(err.message || 'Failed to fetch post');
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Post not found</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {error || 'The post you are looking for does not exist.'}
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 rounded-lg bg-accent-primary text-white hover:opacity-90 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Guard against missing required fields
  if (!post.body && !post.content) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown date';

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => (window.location.href = '/')}
          className="mb-6 text-sm hover:opacity-70 transition"
          style={{ color: 'var(--muted)' }}
        >
          ← Back to Home
        </button>

        {/* Post header */}
        <article>
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <VoteBar postId={post.id} orientation="vertical" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {post.title || 'Untitled'}
              </h1>
              <div className="flex items-center gap-4 mb-6 text-sm" style={{ color: 'var(--muted)' }}>
                <span className="font-medium" style={{ color: 'var(--text)' }}>
                  {post.author.name || post.author.username || 'Anonymous'}
                </span>
                <span>·</span>
                <span>{publishDate}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-layer"
                  style={{ color: 'var(--text)', border: '1px solid var(--line)' }}
                >
                  {tag.name || tag.slug}
                </span>
              ))}
            </div>
          )}

          {/* Post content */}
          <div
            className="prose prose-invert max-w-none mb-12"
            style={{ color: 'var(--text)' }}
            dangerouslySetInnerHTML={{
              __html: (post.body || post.content || '').replace(/\n/g, '<br />'),
            }}
          />

          {/* Comments section */}
          <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--line)' }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
              Comments
            </h2>

            {/* Comment Composer */}
            <CommentComposer postId={post.id} />

            {/* Comment List with real-time updates */}
            <CommentList 
              postId={post.id} 
              postAuthorId={post.author?.email || ''} 
            />
          </div>
        </article>
      </div>
    </div>
  );
}

