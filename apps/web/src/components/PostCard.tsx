/**
 * Process: Post Card Component
 * Purpose: Display post preview with voting, author, and metadata
 * Data Source: Post data from API or Firestore
 * Update Path: N/A - display component
 * Dependencies: VoteBar, useAuth for user display
 */

import VoteBar from './VoteBar';
import { useAuth } from '../hooks/useAuth';

export interface PostCardProps {
  post: {
    id: string;
    slug: string;
    title: string;
    content?: string;
    excerpt?: string;
    body?: string;
    publishedAt: string;
    author: {
      username?: string;
      name?: string;
      email?: string;
    };
    tags?: Array<{ slug: string; name: string }>;
  };
  onClick?: (slug: string) => void;
  compact?: boolean;
}

export default function PostCard({ post, onClick, compact = false }: PostCardProps) {
  const { isAuthenticated: _isAuthenticated } = useAuth(); // Reserved for future use

  const handleClick = (e: React.MouseEvent) => {
    e?.preventDefault?.();
    if (onClick) {
      onClick(post.slug);
    } else {
      window.history.pushState({}, '', `/posts/${post.slug}`);
      window.dispatchEvent(new Event('pushstate'));
    }
  };

  const previewText = post.excerpt || post.content?.slice(0, 100) || post.body?.slice(0, 100) || '';
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <article
      className="bg-layer rounded-lg p-3 hover:ring-2 hover:ring-accent-primary transition cursor-pointer border border-line"
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Vote Bar - Vertical */}
        <div className="flex-shrink-0">
          <VoteBar postId={post.id} compact={compact} orientation="vertical" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-primary font-medium truncate mb-1">{post.title}</h4>
          {!compact && previewText && (
            <p className="text-secondary text-sm mt-1 line-clamp-2 mb-2">
              {previewText}
              {previewText.length >= 100 ? '...' : ''}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-secondary">
            <span>{post.author?.username || post.author?.name || 'Unknown'}</span>
            {publishDate && (
              <>
                <span>·</span>
                <span>{publishDate}</span>
              </>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.slug}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-base"
                  style={{ color: 'var(--muted)', border: '1px solid var(--line)' }}
                >
                  {tag.name || tag.slug}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
