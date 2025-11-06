/**
 * Process: Post Detail Component
 * Purpose: Display full post content with author, metadata, and tags
 * Data Source: API endpoint /api/v1/posts/:slug
 * Update Path: N/A - display component
 * Dependencies: VoteBar, useAuth for user display
 */

import { useEffect, useState } from 'react';
import VoteBar from './VoteBar';
import { useAuth } from '@/hooks/useAuth';
import FlickletHeader from './FlickletHeader';

interface PostDetailProps {
  slug: string;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  content?: string;
  body?: string;
  excerpt?: string;
  publishedAt: string;
  author: {
    id?: string;
    username?: string;
    name?: string;
    email?: string;
    profile?: {
      avatarUrl?: string;
      bio?: string;
    };
  };
  tags?: Array<{ slug: string; name: string }>;
}

export default function PostDetail({ slug }: PostDetailProps) {
  const { isAuthenticated: _isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/v1/posts/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found');
          } else {
            setError(`Failed to load post: ${response.statusText}`);
          }
          return;
        }
        
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('pushstate'));
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <FlickletHeader
          appName="Flicklet"
          onSearch={() => {}}
          onClear={() => {}}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <FlickletHeader
          appName="Flicklet"
          onSearch={() => {}}
          onClear={() => {}}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center px-4">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              {error || 'Post not found'}
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-lg bg-accent-primary text-white hover:opacity-90 transition"
            >
              Go Back
            </button>
          </div>
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
    : '';

  const content = post.content || post.body || '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <FlickletHeader
        appName="Flicklet"
        showMarquee={false}
        onSearch={() => {}}
        onClear={() => {}}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 text-sm text-secondary hover:text-primary transition flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to Home</span>
        </button>

        {/* Post Content */}
        <article className="bg-layer rounded-lg p-6 border border-line">
          <div className="flex gap-4 mb-6">
            {/* Vote Bar - Vertical */}
            <div className="flex-shrink-0">
              <VoteBar postId={post.id} orientation="vertical" />
            </div>

            {/* Post Header */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                {post.title}
              </h1>

              {/* Author and Date */}
              <div className="flex items-center gap-2 mb-4 text-sm text-secondary">
                <span>{post.author?.username || post.author?.name || 'Unknown'}</span>
                {publishDate && (
                  <>
                    <span>·</span>
                    <span>{publishDate}</span>
                  </>
                )}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-base"
                      style={{ color: 'var(--muted)', border: '1px solid var(--line)' }}
                    >
                      {tag.name || tag.slug}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Post Body */}
          <div 
            className="prose prose-invert max-w-none"
            style={{ 
              color: 'var(--text)',
            }}
          >
            <div 
              className="whitespace-pre-wrap text-secondary leading-relaxed"
              style={{ 
                color: 'var(--text-secondary)',
              }}
            >
              {content}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
