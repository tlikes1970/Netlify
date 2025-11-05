import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, serverTimestamp } from '../lib/firebaseBootstrap';
import { useAuth } from '../hooks/useAuth';
import ModalPortal from './ModalPortal';

interface Tag {
  slug: string;
  name: string;
  countOfPosts: number;
}

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (slug: string) => void;
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewPostModal({ isOpen, onClose, onSuccess }: NewPostModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingTags, setFetchingTags] = useState(true);

  // Fetch available tags on mount
  useEffect(() => {
    if (isOpen) {
      setFetchingTags(true);
      fetch('http://localhost:4000/api/v1/tags')
        .then((res) => res.json())
        .then((data) => {
          setTags(data);
          setFetchingTags(false);
        })
        .catch((err) => {
          console.error('Failed to fetch tags:', err);
          setFetchingTags(false);
        });
    }
  }, [isOpen]);

  const handleTagToggle = (tagSlug: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagSlug)
        ? prev.filter((slug) => slug !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to create a post');
      return;
    }

    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = generateSlug(title);
      
      // Create post document in Firestore
      await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        excerpt: excerpt.trim() || '',
        body: body.trim(),
        slug,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorAvatar: user.photoURL || '',
        tagSlugs: selectedTags,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        score: 0,
        voteCount: 0,
        commentCount: 0,
      });

      // Reset form
      setTitle('');
      setExcerpt('');
      setBody('');
      setSelectedTags([]);
      setLoading(false);
      onClose();
      
      // Navigate to new post
      if (onSuccess) {
        onSuccess(slug);
      } else {
        window.history.pushState({}, '', `/posts/${slug}`);
        window.dispatchEvent(new Event('pushstate'));
      }
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setExcerpt('');
      setBody('');
      setSelectedTags([]);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        onClick={handleClose}
      >
        <div
          className="w-full max-w-2xl rounded-lg p-6 max-h-[90vh] overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--line)',
            color: 'var(--text)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              New Post
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-2xl leading-none hover:opacity-70 transition"
              style={{ color: 'var(--muted)' }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--layer)', color: '#ef4444', border: '1px solid #ef4444' }}
              >
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text)' }}
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--layer)',
                  color: 'var(--text)',
                  border: '1px solid var(--line)',
                }}
                placeholder="Enter post title"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label
                htmlFor="excerpt"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text)' }}
              >
                Excerpt
              </label>
              <input
                id="excerpt"
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--layer)",
                  color: "var(--text)",
                  border: "1px solid var(--line)",
                }}
                placeholder="Brief summary (optional)"
              />
            </div>

            {/* Body */}
            <div>
              <label
                htmlFor="body"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text)' }}
              >
                Content * (Markdown supported)
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                disabled={loading}
                rows={12}
                className="w-full px-3 py-2 rounded-lg text-sm resize-y font-mono"
                style={{
                  backgroundColor: 'var(--layer)',
                  color: 'var(--text)',
                  border: '1px solid var(--line)',
                }}
                placeholder="Write your post content here..."
              />
            </div>

            {/* Tags */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text)' }}
              >
                Tags
              </label>
              {fetchingTags ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Loading tags...
                </div>
              ) : tags.length === 0 ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  No tags available
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() => handleTagToggle(tag.slug)}
                      disabled={loading}
                      className="px-3 py-1 rounded-full text-xs font-medium transition"
                      style={{
                        backgroundColor: selectedTags.includes(tag.slug)
                          ? 'var(--accent-primary)'
                          : 'var(--layer)',
                        color: selectedTags.includes(tag.slug) ? '#fff' : 'var(--text)',
                        border: `1px solid ${selectedTags.includes(tag.slug) ? 'var(--accent-primary)' : 'var(--line)'}`,
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium transition"
                style={{
                  backgroundColor: 'var(--layer)',
                  color: 'var(--text)',
                  border: '1px solid var(--line)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !body.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                }}
              >
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

