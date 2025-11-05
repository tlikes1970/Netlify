/**
 * Process: Comment Composer
 * Purpose: Allow authenticated users to create comments with optimistic submit
 * Data Source: Firestore posts/{postId}/comments/{commentId}
 * Update Path: User submits comment → writes to Firestore → Cloud Function sanitizes
 * Dependencies: firebaseBootstrap, authManager, serverTimestamp
 */

import { useState, FormEvent } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebaseBootstrap';
import { useAuth } from '../hooks/useAuth';

interface CommentComposerProps {
  postId: string;
  onCommentAdded?: () => void;
}

export default function CommentComposer({ postId, onCommentAdded }: CommentComposerProps) {
  const { isAuthenticated, user } = useAuth();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setError('You must be signed in to comment');
      return;
    }

    if (!body.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      
      // Optimistic submit - write to Firestore
      await addDoc(commentsRef, {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorAvatar: user.photoURL || '',
        body: body.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Clear form
      setBody('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err: any) {
      console.error('Failed to create comment:', err);
      
      // Check if error is from Cloud Function rejection
      if (err.message?.includes('disallowed words')) {
        setError('Comment contains disallowed words');
      } else {
        setError(err.message || 'Failed to post comment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 rounded-lg bg-layer border border-line">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Sign in to leave a comment
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="p-4 rounded-lg bg-layer border border-line">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment..."
          disabled={submitting}
          rows={4}
          className="w-full px-3 py-2 rounded-lg text-sm resize-y"
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--line)',
          }}
        />
        
        {error && (
          <div className="mt-2 text-sm" style={{ color: '#ef4444' }}>
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Comments are automatically filtered
          </span>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
            }}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </form>
  );
}


