import React, { useState, useEffect, useRef } from 'react';
import { ExtrasVideo, BloopersSearchResult } from '../../lib/extras/types';
import { BloopersSearchAssist } from '../../lib/extras/bloopersSearchAssist';
import { EXTRAS_COPY } from '../../lib/copy/extras';
import { flag } from '../../lib/flags';
import { YouTubePlayer } from './YouTubePlayer';
import { useProStatus } from '../../lib/proStatus';
import { startProUpgrade } from '../../lib/proUpgrade';

interface BloopersModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: number;
  showTitle: string;
}

/**
 * Process: Bloopers Modal
 * Purpose: Displays bloopers content with curated search assist for a specific show
 * Data Source: Official bloopers API + curated search assist
 * Update Path: TabCard bloopers button clicks
 * Dependencies: YouTubePlayer, Pro settings, search assist utility
 */

export const BloopersModal: React.FC<BloopersModalProps> = ({
  isOpen,
  onClose,
  showId,
  showTitle
}) => {
  console.log('🎬 BloopersModal render:', { isOpen, showId, showTitle });
  
  const proStatus = useProStatus();
  const isPro = proStatus.isPro;
  
  const [officialVideos, setOfficialVideos] = useState<ExtrasVideo[]>([]);
  const [searchResults, setSearchResults] = useState<BloopersSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ExtrasVideo | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstVideoRef = useRef<HTMLDivElement>(null);

  // Check if search assist is enabled
  const searchAssistEnabled = flag('EXTRAS_BLOOPERS_SEARCH_ASSIST');

  // Focus management
  useEffect(() => {
    if (isOpen && firstVideoRef.current) {
      firstVideoRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        // Focus trap - let browser handle tab navigation within modal
        const modal = modalRef.current;
        if (modal) {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadBloopers = async () => {
    setLoading(true);
    try {
      // First try to get official bloopers
      const { extrasProvider } = await import('../../lib/extras/extrasProvider');
      const result = await extrasProvider.fetchBloopers(showId, showTitle);
      
      setOfficialVideos(result.videos);
      
      if (result.videos.length > 0) {
        // Analytics: Track official bloopers found
        console.log('📊 Analytics: bloopers_official_found', {
          showId,
          showTitle,
          count: result.videos.length
        });
      } else if (searchAssistEnabled) {
        // No official bloopers, try search assist
        const searchAssistResults = await BloopersSearchAssist.searchBloopers({
          showTitle,
          showId
        });
        
        setSearchResults(searchAssistResults);
        
        // Analytics: Track search assist usage
        console.log('📊 Analytics: bloopers_search_assist', {
          showId,
          showTitle,
          count: searchAssistResults.length
        });
      } else {
        setSearchResults([]);
        
        // Analytics: Track empty state
        console.log('📊 Analytics: bloopers_empty', {
          showId,
          showTitle,
          reason: 'no_official_no_search_assist'
        });
      }
      
      // Analytics: Track modal open
      console.log('📊 Analytics: bloopers_modal_open', {
        showId,
        showTitle,
        officialCount: result.videos.length,
        searchAssistCount: searchAssistEnabled ? (await BloopersSearchAssist.searchBloopers({ showTitle, showId })).length : 0
      });
      
    } catch (error) {
      console.error('Failed to load bloopers:', error);
      setOfficialVideos([]);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Pro gating: Load bloopers only if Pro
  useEffect(() => {
    if (!isOpen) return;
    if (!isPro) {
      // Don't load bloopers if not Pro
      setOfficialVideos([]);
      setSearchResults([]);
      setLoading(false);
      return;
    }
    // Load bloopers if Pro
    loadBloopers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showId, isPro]);

  const handleSearchResultClick = (result: BloopersSearchResult) => {
    if (result.embeddable) {
      // Convert to ExtrasVideo format for player
      const video: ExtrasVideo = {
        id: `bloopers_${result.title.replace(/\s+/g, '_')}`,
        title: result.title,
        description: `Bloopers from ${result.channel}`,
        thumbnail: result.thumbUrl,
        duration: result.duration || 'Unknown',
        publishedAt: result.publishedAt || new Date().toISOString(),
        provider: result.provider,
        channelName: result.channel,
        channelId: 'unknown',
        embedUrl: result.url,
        watchUrl: result.url,
        canEmbed: result.embeddable,
        category: 'bloopers',
        showId,
        showTitle,
        status: 'approved',
        lastVerified: new Date().toISOString()
      };
      
      setSelectedVideo(video);
      
      // Analytics: Track in-app play
      console.log('📊 Analytics: bloopers_play_inapp', {
        showId,
        showTitle,
        title: result.title,
        provider: result.provider,
        reason: result.reason
      });
    } else {
      // Open in new tab
      window.open(result.url, '_blank');
      
      // Analytics: Track click out
      console.log('📊 Analytics: bloopers_click_out', {
        showId,
        showTitle,
        title: result.title,
        provider: result.provider,
        reason: result.reason
      });
    }
  };

  const handleVideoClick = (video: ExtrasVideo) => {
    if (video.canEmbed) {
      setSelectedVideo(video);
      
      // Analytics: Track video play
      console.log('📊 Analytics: bloopers_play', {
        showId,
        showTitle,
        videoId: video.id,
        videoTitle: video.title,
        provider: video.provider,
        category: video.category
      });
    } else {
      window.open(video.watchUrl, '_blank');
      
      // Analytics: Track click out
      console.log('📊 Analytics: bloopers_click_out', {
        showId,
        showTitle,
        videoId: video.id,
        videoTitle: video.title,
        provider: video.provider,
        category: video.category,
        reason: 'cannot_embed'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-32">
        <div 
          ref={modalRef}
          className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl max-h-[75vh] overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bloopers-modal-title"
          aria-describedby="bloopers-modal-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 id="bloopers-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              {showTitle} - Bloopers
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div 
            id="bloopers-modal-description"
            className="p-4 overflow-y-auto max-h-96"
          >
            {!isPro ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>
                  Bloopers are a Pro feature
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
                  Upgrade to Pro in Settings to unlock bloopers, behind-the-scenes content, and other exclusive features.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    startProUpgrade();
                  }}
                  className="px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: "var(--accent)", color: "white" }}
                >
                  Go to Pro settings
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading bloopers...</span>
              </div>
            ) : officialVideos.length === 0 && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  <h3 className="text-lg font-medium mb-2">{EXTRAS_COPY.emptyStates.bloopers.title}</h3>
                  <p className="text-sm">{EXTRAS_COPY.emptyStates.bloopers.description}</p>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => window.open(EXTRAS_COPY.help.bloopersArticle, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {EXTRAS_COPY.emptyStates.bloopers.secondaryCta}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Official bloopers section */}
                {officialVideos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Official Bloopers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {officialVideos.map((video, index) => (
                        <div
                          key={video.id}
                          ref={index === 0 ? firstVideoRef : null}
                          onClick={() => handleVideoClick(video)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleVideoClick(video);
                            }
                          }}
                          className="cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                          tabIndex={0}
                          role="button"
                          aria-label={`Play ${video.title} from ${video.channelName}`}
                        >
                          <img
                            src={video.thumbnail}
                            alt={`Thumbnail for ${video.title}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3">
                            <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                              {video.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {video.channelName}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {new Date(video.publishedAt).toLocaleDateString()}
                              </span>
                              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                Official
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search assist section */}
                {searchResults.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {EXTRAS_COPY.searchAssist.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((result, index) => (
                        <BloopersCard
                          key={`search_${index}`}
                          result={result}
                          onClick={() => handleSearchResultClick(result)}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
                      {EXTRAS_COPY.searchAssist.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      {selectedVideo && (
        <YouTubePlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
};

// BloopersCard component for displaying search results
const BloopersCard = React.forwardRef<HTMLDivElement, {
  result: BloopersSearchResult;
  onClick: () => void;
}>(({ result, onClick }, ref) => {
  const providerDisplayName = BloopersSearchAssist.getProviderDisplayName(result.provider);
  
  return (
    <div
      ref={ref}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
      tabIndex={0}
      role="button"
      aria-label={`${result.embeddable ? 'Play' : 'Watch'} ${result.title} on ${providerDisplayName}`}
    >
      <img
        src={result.thumbUrl}
        alt={`Thumbnail for ${result.title}`}
        className="w-full h-32 object-cover"
      />
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
          {result.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {result.channel}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {providerDisplayName}
            </span>
            {result.verified && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                ✓ Verified
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {result.duration || 'Unknown'}
          </span>
        </div>
        {result.reason && (
          <p className="text-xs text-gray-400 mt-1 italic">
            {result.reason === 'official' ? 'Official content' : 
             result.reason === 'allowlisted' ? 'Official channel' :
             result.reason === 'verified' ? 'Verified channel' : result.reason}
          </p>
        )}
      </div>
    </div>
  );
});

BloopersCard.displayName = 'BloopersCard';
