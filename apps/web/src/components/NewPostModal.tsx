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

interface Tag {
  slug: string;
  name: string;
  countOfPosts?: number;
}

export default function NewPostModal({ isOpen, onClose, onPostCreated }: NewPostModalProps) {
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [loadingTags, setLoadingTags] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  const remainingChars = MAX_LENGTH - content.length;
  const canSubmit = content.trim().length >= MIN_LENGTH && content.trim().length <= MAX_LENGTH && !submitting;

  // Fetch available tags when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const fetchTags = async () => {
    try {
      setLoadingTags(true);
      // Try relative URL first (works with Vite proxy or Netlify redirect)
      // Fallback to direct localhost if that fails
      let apiUrl = import.meta.env.DEV
        ? ''
        : (import.meta.env.VITE_API_URL || 'http://localhost:4000');
      
      let response = await fetch(`${apiUrl}/api/v1/tags`);
      
      // If relative URL fails with 404, try direct localhost (for netlify dev)
      if (!response.ok && apiUrl === '' && response.status === 404) {
        console.log('[NewPostModal] Relative URL failed, trying direct localhost...');
        apiUrl = 'http://localhost:4000';
        response = await fetch(`${apiUrl}/api/v1/tags`);
      }
      
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      // Don't show error - tags are optional
    } finally {
      setLoadingTags(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setError(null);
      setSubmitting(false);
      setSelectedTags([]);
      setNewTagInput('');
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
      // Process tags: get slugs for selected tags and create new ones if needed
      let tagSlugs: string[] = [...selectedTags];
      
      // If user entered new tags, create them
      if (newTagInput.trim()) {
        const newTagNames = newTagInput
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);
        
        if (newTagNames.length > 0) {
          try {
            // Try relative URL first (works with Vite proxy or Netlify redirect)
            // Fallback to direct localhost if that fails
            let apiUrl = import.meta.env.DEV
              ? ''
              : (import.meta.env.VITE_API_URL || 'http://localhost:4000');
            
            let tagResponse = await fetch(`${apiUrl}/api/v1/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tagNames: newTagNames }),
            });
            
            // If relative URL fails with 404, try direct localhost (for netlify dev)
            if (!tagResponse.ok && apiUrl === '' && tagResponse.status === 404) {
              console.log('[NewPostModal] Relative URL failed for tag creation, trying direct localhost...');
              apiUrl = 'http://localhost:4000';
              tagResponse = await fetch(`${apiUrl}/api/v1/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagNames: newTagNames }),
              });
            }
            
            if (tagResponse.ok) {
              const { tags } = await tagResponse.json();
              const newSlugs = tags.map((t: Tag) => t.slug);
              tagSlugs = [...new Set([...tagSlugs, ...newSlugs])]; // Remove duplicates
            }
          } catch (tagErr) {
            console.error('Failed to create tags:', tagErr);
            // Continue without tags - not critical
          }
        }
      }

      // Generate slug from content
      const title = trimmedContent.slice(0, 100).trim() || 'Untitled Post';
      const slug = title
        .toLowerCase()
        .replace(/[^\da-z]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now()}`;

      const postsRef = collection(db, 'posts');
      
      // Create post in Firestore (matches Firestore rules structure)
      const postData = {
        title,
        excerpt: trimmedContent.slice(0, 200).trim(),
        body: trimmedContent,
        slug,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email || null,
        tagSlugs,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        score: 0,
        voteCount: 0,
        commentCount: 0,
      };
      
      console.log('[NewPostModal] Creating post in Firestore:', {
        slug,
        title,
        tagSlugs,
        authorId: user.uid,
        authorName: postData.authorName
      });
      
      const docRef = await addDoc(postsRef, postData);
      console.log('[NewPostModal] Post created in Firestore:', {
        id: docRef.id,
        slug,
        path: docRef.path
      });

      // Track analytics
      trackCommunityPostCreate(false, trimmedContent.length);

      // Clear form and announce success
      setContent('');
      if (announcementRef.current) {
        announcementRef.current.textContent = 'Post published.';
      }

      // Call callback to refresh posts list
      // This happens before closing modal to ensure immediate refresh
      if (onPostCreated) {
        onPostCreated();
      }

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 100);
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border shadow-2xl"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--line)',
          borderWidth: '1px',
          maxHeight: 'calc(90vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
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

            {/* Tag Selection */}
            <div className="mb-4">
              <label htmlFor="post-tags" className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Tags (optional)
              </label>
              
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTags.map((tagSlug) => {
                    const tag = availableTags.find(t => t.slug === tagSlug);
                    return (
                      <span
                        key={tagSlug}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: '#fff',
                        }}
                      >
                        {tag?.name || tagSlug}
                        <button
                          type="button"
                          onClick={() => setSelectedTags(prev => prev.filter(t => t !== tagSlug))}
                          className="hover:opacity-70"
                          aria-label={`Remove tag ${tag?.name || tagSlug}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Available Tags */}
              {!loadingTags && availableTags.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
                    Select existing tags:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter(tag => !selectedTags.includes(tag.slug))
                      .slice(0, 10)
                      .map((tag) => (
                        <button
                          key={tag.slug}
                          type="button"
                          onClick={() => setSelectedTags(prev => [...prev, tag.slug])}
                          className="px-2 py-1 rounded-full text-xs font-medium transition hover:opacity-80"
                          style={{
                            backgroundColor: 'var(--layer)',
                            color: 'var(--text)',
                            border: '1px solid var(--line)',
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* New Tag Input */}
              <div>
                <input
                  id="post-tags"
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add new tags (comma-separated)"
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--line)',
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Enter new tags separated by commas (e.g., "discussion, review")
                </p>
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
