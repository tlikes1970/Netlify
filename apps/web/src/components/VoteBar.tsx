/**
 * Process: Vote Bar Component
 * Purpose: Display upvote/downvote buttons with live score counter
 * Data Source: useVote hook (Firestore real-time)
 * Update Path: User clicks trigger useVote.upvote/downvote
 * Dependencies: useVote hook, useAuth for authentication check
 */

import { useVote } from '../hooks/useVote';
import { useAuth } from '../hooks/useAuth';

interface VoteBarProps {
  postId: string;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export default function VoteBar({ postId, compact = false, orientation = 'horizontal' }: VoteBarProps) {
  const { isAuthenticated: _isAuthenticated } = useAuth(); // Reserved for future use
  const { score, voteCount, userVote, upvote, downvote, isUpvoted, isDownvoted, canVote, loading } = useVote(postId);

  const isVertical = orientation === 'vertical';
  const containerClass = isVertical 
    ? 'flex flex-col items-center gap-1' 
    : 'flex items-center gap-2';

  const buttonBaseClass = compact
    ? 'p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
    : 'px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const upvoteClass = `${buttonBaseClass} ${
    isUpvoted
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-layer hover:bg-layer-hover border border-line'
  }`;

  const downvoteClass = `${buttonBaseClass} ${
    isDownvoted
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-layer hover:bg-layer-hover border border-line'
  }`;

  // Format score display
  const formatScore = (num: number): string => {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num > 0 ? `+${num}` : `${num}`;
  };

  if (loading && userVote === null) {
    return (
      <div className={containerClass}>
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className={containerClass} aria-label="Vote controls">
      {/* Upvote button */}
      <button
        type="button"
        onClick={upvote}
        disabled={!canVote}
        className={upvoteClass}
        aria-label={isUpvoted ? 'Remove upvote' : 'Upvote'}
        title={isUpvoted ? 'Remove upvote' : canVote ? 'Upvote' : 'Sign in to vote'}
        style={!isUpvoted ? { color: 'var(--text)', borderColor: 'var(--line)' } : undefined}
      >
        <svg
          width={compact ? '14' : '16'}
          height={compact ? '14' : '16'}
          viewBox="0 0 16 16"
          fill="currentColor"
          className={isUpvoted ? '' : 'opacity-70'}
        >
          <path d="M8 0L3 5h3v6h4V5h3L8 0z" />
        </svg>
      </button>

      {/* Score display */}
      <div
        className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}
        style={{ color: 'var(--text)', minWidth: compact ? '32px' : '48px', textAlign: 'center' }}
        aria-label={`Score: ${score}, Votes: ${voteCount}`}
      >
        {formatScore(score)}
      </div>

      {/* Downvote button */}
      <button
        type="button"
        onClick={downvote}
        disabled={!canVote}
        className={downvoteClass}
        aria-label={isDownvoted ? 'Remove downvote' : 'Downvote'}
        title={isDownvoted ? 'Remove downvote' : canVote ? 'Downvote' : 'Sign in to vote'}
        style={!isDownvoted ? { color: 'var(--text)', borderColor: 'var(--line)' } : undefined}
      >
        <svg
          width={compact ? '14' : '16'}
          height={compact ? '14' : '16'}
          viewBox="0 0 16 16"
          fill="currentColor"
          className={isDownvoted ? '' : 'opacity-70'}
        >
          <path d="M8 16L3 11h3V5h4v6h3L8 16z" />
        </svg>
      </button>
    </div>
  );
}


