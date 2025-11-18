/**
 * Process: Post Card Component
 * Purpose: Display post preview with voting, author, and metadata
 * Data Source: Post data from API or Firestore
 * Update Path: N/A - display component
 * Dependencies: VoteBar, useAuth for user display
 */

import { useState } from 'react';
import VoteBar from './VoteBar';
import { useAuth } from '../hooks/useAuth';
import ProBadge from './ProBadge';
import SpoilerWrapper from './SpoilerWrapper';
import { reportPostOrComment } from '../lib/communityReports';

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
    containsSpoilers?: boolean;
    authorIsPro?: boolean;
    commentCount?: number;
  };
  onClick?: (slug: string) => void;
  compact?: boolean;
}

export default function PostCard({ post, onClick, compact = false }: PostCardProps) {
  const { isAuthenticated, user } = useAuth();
  const [reporting, setReporting] = useState(false);

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !user || reporting) return;

    if (!confirm("Report this post? This will notify moderators for review.")) {
      return;
    }

    setReporting(true);
    try {
      await reportPostOrComment(post.id, "post", user.uid);
      alert("Post reported. Thank you for helping keep the community safe.");
    } catch (error: any) {
      alert(error.message || "Failed to report post. Please try again.");
    } finally {
      setReporting(false);
    }
  };

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
  
  // Check if post is new (within last 24 hours)
  const isNew = post.publishedAt
    ? (Date.now() - new Date(post.publishedAt).getTime()) < 24 * 60 * 60 * 1000
    : false;

  return (
    <article
      className="bg-layer rounded-lg p-3 hover:ring-2 hover:ring-accent-primary transition cursor-pointer border border-line relative group"
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Vote Bar - Vertical */}
        <div className="flex-shrink-0">
          <VoteBar postId={post.id} compact={compact} orientation="vertical" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-primary font-medium truncate flex-1">{post.title}</h4>
            {isNew && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide flex-shrink-0"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text)',
                }}
              >
                New
              </span>
            )}
          </div>
          {!compact && previewText && (
            <SpoilerWrapper containsSpoilers={post.containsSpoilers || false}>
              <p className="text-secondary text-sm mt-1 line-clamp-2 mb-2">
                {previewText}
                {previewText.length >= 100 ? '...' : ''}
              </p>
            </SpoilerWrapper>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-secondary">
            <span>{post.author?.username || post.author?.name || 'Unknown'}</span>
            <ProBadge isPro={post.authorIsPro} />
            {publishDate && (
              <>
                <span>·</span>
                <span>{publishDate}</span>
              </>
            )}
            {post.commentCount !== undefined && post.commentCount > 0 && (
              <>
                <span>·</span>
                <span
                  className="font-semibold"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                </span>
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

      {/* Report Button - appears on hover */}
      {isAuthenticated && user && (
        <button
          onClick={handleReport}
          disabled={reporting}
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 px-2 py-1 text-xs rounded hover:bg-red-500/10"
          style={{ color: 'var(--muted)' }}
          title="Report post"
        >
          {reporting ? 'Reporting...' : 'Report'}
        </button>
      )}
    </article>
  );
}
