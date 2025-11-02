import { useState, useEffect } from 'react';

interface PostDetailProps {
  slug: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  author: {
    username: string;
    email: string;
    profile?: {
      avatarUrl?: string;
      bio?: string;
    };
  };
  tags: Array<{
    slug: string;
    name: string;
  }>;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    profile?: {
      avatarUrl?: string;
    };
  };
}

export default function PostDetail({ slug }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch post
    fetch(`http://localhost:4000/api/v1/posts/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch post');
        return res.json();
      })
      .then((data) => {
        setPost(data);
        // Fetch comments
        return fetch(`http://localhost:4000/api/v1/posts/${slug}/comments`);
      })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch comments');
        return res.json();
      })
      .then((data) => {
        setComments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('PostDetail fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
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

  const publishDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            {post.title}
          </h1>

          <div className="flex items-center gap-4 mb-6 text-sm" style={{ color: 'var(--muted)' }}>
            <span className="font-medium" style={{ color: 'var(--text)' }}>{post.author.username}</span>
            <span>·</span>
            <span>{publishDate}</span>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-layer"
                  style={{ color: 'var(--text)', border: '1px solid var(--line)' }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Post content */}
          <div
            className="prose prose-invert max-w-none mb-12"
            style={{ color: 'var(--text)' }}
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
          />

          {/* Comments section */}
          <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--line)' }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
              Comments ({comments.length})
            </h2>

            {comments.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => {
                  const commentDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={comment.id}
                      className="p-4 rounded-lg bg-layer"
                      style={{ border: '1px solid var(--line)' }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {comment.author.profile?.avatarUrl && (
                          <img
                            src={comment.author.profile.avatarUrl}
                            alt={comment.author.username}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                            {comment.author.username}
                          </span>
                          <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
                            {commentDate}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                        {comment.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

