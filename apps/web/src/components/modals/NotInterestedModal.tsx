import { useState } from 'react';
import { useLibrary, Library } from '@/lib/storage';

interface NotInterestedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotInterestedModal({ isOpen, onClose }: NotInterestedModalProps) {
  const notInterestedItems = useLibrary('not');
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRemoveItem = async (item: any) => {
    if (!item.id || !item.mediaType) return;
    
    setIsRemoving(item.id);
    try {
      Library.remove(item.id, item.mediaType);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] backdrop-blur-sm flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--line)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Not Interested List ({notInterestedItems.length})
          </h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {notInterestedItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😴</div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>
                No items marked as not interested
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Items you mark as "not interested" will appear here for review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--btn)' }}>
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  💡 <strong>Tip:</strong> Items removed from this list will be deleted from your account permanently.
                </p>
              </div>
              
              {notInterestedItems.map((item) => (
                <div key={item.id} className="relative">
                  <div className="flex items-start gap-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}>
                    {/* Poster */}
                    <div className="w-20 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0">
                      {item.posterUrl ? (
                        <img 
                          src={item.posterUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--btn)' }}>
                          <span className="text-2xl">🎬</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--text)' }}>
                        {item.title}
                      </h3>
                      {item.year && (
                        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                          {item.year}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleRemoveItem(item)}
                          className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                          style={{ backgroundColor: '#ef4444', color: 'white' }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {isRemoving === item.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-sm">Removing...</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {notInterestedItems.length} item{notInterestedItems.length !== 1 ? 's' : ''} in your not interested list
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}