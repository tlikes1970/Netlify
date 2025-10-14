import { useState, useEffect } from 'react';
import { MediaItem } from '../cards/card.types';
import { useTranslations } from '../../lib/language';

interface NotesAndTagsModalProps {
  item: MediaItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MediaItem, notes: string, tags: string[]) => void;
}

export default function NotesAndTagsModal({ item, isOpen, onClose, onSave }: NotesAndTagsModalProps) {
  const [notes, setNotes] = useState(item.userNotes || '');
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [newTag, setNewTag] = useState('');
  // const translations = useTranslations(); // Unused

  // Reset form when item changes
  useEffect(() => {
    setNotes(item.userNotes || '');
    setTags(item.tags || []);
  }, [item]);

  const handleSave = () => {
    onSave(item, notes, tags);
    onClose();
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl border"
        style={{ 
          backgroundColor: 'var(--card)', 
          borderColor: 'var(--line)',
          color: 'var(--text)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--line)' }}>
          <h2 className="text-lg font-semibold">{item.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              📝 Notes & Review
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your thoughts, review, or notes about this show/movie..."
              className="w-full h-32 px-3 py-2 rounded-lg border resize-none"
              style={{ 
                backgroundColor: 'var(--bg)', 
                borderColor: 'var(--line)', 
                color: 'var(--text)' 
              }}
            />
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              🏷️ Tags
            </label>
            
            {/* Add Tag Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ 
                  backgroundColor: 'var(--bg)', 
                  borderColor: 'var(--line)', 
                  color: 'var(--text)' 
                }}
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'var(--accent)', 
                  color: 'white' 
                }}
              >
                Add
              </button>
            </div>

            {/* Tags Display */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: 'white' 
                  }}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  No tags yet. Add some to organize your content!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--btn)', 
              color: 'var(--text)', 
              borderColor: 'var(--line)', 
              border: '1px solid' 
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--accent)', 
              color: 'white' 
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
