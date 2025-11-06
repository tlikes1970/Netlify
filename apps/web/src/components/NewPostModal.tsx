/**
 * Process: New Post Modal
 * Purpose: Allow authenticated users to create posts with optimistic submit
 * Data Source: Firestore posts collection
 * Update Path: User submits post → writes to Firestore → Cloud Function sanitizes
 * Dependencies: firebaseBootstrap, authManager, serverTimestamp
 */

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebaseBootstrap';
import { useAuth } from '../hooks/useAuth';
import { trackCommunityPostCreate } from '../lib/analytics';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const MAX_LENGTH = 5000;
const MIN_LENGTH = 1;

export default function NewPostModal({ isOpen, onClose, onPostCreated }: NewPostModalProps) {
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  const remainingChars = MAX_LENGTH - content.length;
  const canSubmit = content.trim().length >= MIN_LENGTH && content.trim().length <= MAX_LENGTH && !submitting;

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setError('You must be signed in to create a post');
      return;
    }

    if (!canSubmit) {
      return;
    }

    const trimmedContent = content.trim();
    
    // Validation
    if (trimmedContent.length < MIN_LENGTH) {
      setError('Post must be at least 1 character long');
      return;
    }

    if (trimmedContent.length > MAX_LENGTH) {
      setError(`Post must be no more than ${MAX_LENGTH} characters`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Generate slug from content
      const title = trimmedContent.slice(0, 100).trim() || 'Untitled Post';
      const slug = title
        .toLowerCase()
        .replace(/[^\da-z]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now()}`;

      const postsRef = collection(db, 'posts');
      
      // Create post in Firestore (matches Firestore rules structure)
      await addDoc(postsRef, {
        title,
        excerpt: trimmedContent.slice(0, 200).trim(),
        body: trimmedContent,
        slug,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        tagSlugs: [],
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        score: 0,
        voteCount: 0,
        commentCount: 0,
      });

      // Track analytics
      trackCommunityPostCreate(false, trimmedContent.length);

      // Clear form and announce success
      setContent('');
      if (announcementRef.current) {
        announcementRef.current.textContent = 'Post published.';
      }

      // Call callback
      if (onPostCreated) {
        onPostCreated();
      }

      // Close modal
      onClose();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      
      // Check if error is from Cloud Function rejection
      if (err.message?.includes('disallowed words')) {
        setError('Post contains disallowed words');
      } else {
        setError(err.message || 'Failed to post. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter submits
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
    // Plain Enter just inserts newline (default behavior)
    // Escape closes modal
    if (e.key === 'Escape' && !submitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-layer rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-line shadow-lg"
        style={{
          maxHeight: 'calc(90vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary">Create Post</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-primary transition"
            aria-label="Close modal"
            disabled={submitting}
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-4 rounded-lg bg-layer border border-line">
            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
              Sign in to create a post
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            role="form"
            aria-label="Create post"
          >
            <div className="mb-4">
              <label htmlFor="post-content" className="sr-only">
                Post content
              </label>
              <textarea
                id="post-content"
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind?"
                disabled={submitting}
                rows={6}
                maxLength={MAX_LENGTH}
                className="w-full px-3 py-2 rounded-lg text-sm resize-y min-h-[150px]"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  border: `1px solid ${error ? '#ef4444' : 'var(--line)'}`,
                }}
                aria-label="Post content"
                aria-describedby="post-help post-error"
                aria-invalid={!!error}
              />
              
              {error && (
                <div
                  id="post-error"
                  className="mt-2 text-sm"
                  style={{ color: '#ef4444' }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span
                  id="post-help"
                  className="text-xs"
                  style={{
                    color: remainingChars < 100 ? '#ef4444' : 'var(--muted)',
                  }}
                >
                  {remainingChars} characters remaining
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  Press Cmd/Ctrl+Enter to submit, Esc to close
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--btn)',
                  color: 'var(--text)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canSubmit ? 'var(--accent-primary)' : 'var(--btn)',
                  color: canSubmit ? '#fff' : 'var(--muted)',
                }}
                aria-label={submitting ? 'Posting...' : 'Submit post'}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        )}

        {/* Screen reader announcement */}
        <div
          ref={announcementRef}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </div>
    </div>
  );
}
