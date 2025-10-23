import React, { useState, useEffect, useRef } from 'react';
import { ExtrasVideo, BloopersSearchResult } from '../../lib/extras/types';
import { BloopersSearchAssist } from '../../lib/extras/bloopersSearchAssist';
import { EXTRAS_COPY } from '../../lib/copy/extras';
import { flag } from '../../lib/flags';
import { YouTubePlayer } from './YouTubePlayer';

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: number;
  showTitle: string;
}

type TabType = 'bloopers' | 'extras';

/**
 * Process: Extras Modal
 * Purpose: Displays behind-the-scenes extras content and curated bloopers for a specific show
 * Data Source: Official extras API + curated search assist for bloopers
 * Update Path: TabCard extras/bloopers button clicks
 * Dependencies: YouTubePlayer, Pro settings, search assist utility
 */

export const ExtrasModal: React.FC<ExtrasModalProps> = ({
  isOpen,
  onClose,
  showId,
  showTitle
}) => {
  console.log('🎭 ExtrasModal render:', { isOpen, showId, showTitle });
  
  const [activeTab, setActiveTab] = useState<TabType>('bloopers');
  const [extrasVideos, setExtrasVideos] = useState<ExtrasVideo[]>([]);
  const [bloopersResults, setBloopersResults] = useState<BloopersSearchResult[]>([]);
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

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, showId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bloopers') {
        await loadBloopers();
      } else {
        await loadExtras();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBloopers = async () => {
    try {
      // First try to get official bloopers
      const { extrasProvider } = await import('../../lib/extras/extrasProvider');
      const result = await extrasProvider.fetchBloopers(showId, showTitle);
      
      if (result.videos.length > 0) {
        // Convert to BloopersSearchResult format for consistency
        const officialBloopers: BloopersSearchResult[] = result.videos.map(video => ({
          title: video.title,
          channel: video.channelName,
          url: video.watchUrl,
          thumbUrl: video.thumbnail,
          verified: true,
          embeddable: video.canEmbed,
          provider: video.provider,
          reason: 'official',
          publishedAt: video.publishedAt,
          duration: video.duration
        }));
        
        setBloopersResults(officialBloopers);
        
        // Analytics: Track official bloopers found
        console.log('📊 Analytics: bloopers_official_found', {
          showId,
          showTitle,
          count: officialBloopers.length
        });
      } else if (searchAssistEnabled) {
        // No official bloopers, try search assist
        const searchResults = await BloopersSearchAssist.searchBloopers({
          showTitle,
          showId
        });
        
        setBloopersResults(searchResults);
        
        // Analytics: Track search assist usage
        console.log('📊 Analytics: bloopers_search_assist', {
          showId,
          showTitle,
          count: searchResults.length
        });
      } else {
        setBloopersResults([]);
        
        // Analytics: Track empty state
        console.log('📊 Analytics: bloopers_empty', {
          showId,
          showTitle,
          reason: 'no_official_no_search_assist'
        });
      }
    } catch (error) {
      console.error('Failed to load bloopers:', error);
      setBloopersResults([]);
    }
  };

  const loadExtras = async () => {
    try {
      const { extrasProvider } = await import('../../lib/extras/extrasProvider');
      const result = await extrasProvider.fetchExtras(showId, showTitle);
      
      setExtrasVideos(result.videos);
      
      // Analytics: Track modal open
      console.log('📊 Analytics: extras_open', {
        showId,
        showTitle,
        videoCount: result.videos.length
      });
    } catch (error) {
      console.error('Failed to load extras:', error);
      
      // Fallback to mock data when API fails
      const mockVideos: ExtrasVideo[] = [
        {
          id: 'mock_extras_1',
          title: `${showTitle} - Behind the Scenes`,
          description: 'Making of featurette and cast interviews',
          thumbnail: 'https://picsum.photos/320/180?random=3',
          duration: '8:15',
          publishedAt: '2023-03-10T00:00:00Z',
          provider: 'youtube',
          channelName: 'Official Channel',
          channelId: 'mock_channel_1',
          embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          watchUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          canEmbed: true,
          category: 'extras',
          showId,
          showTitle,
          status: 'approved',
          lastVerified: '2024-01-15T00:00:00Z'
        }
      ];
      
      setExtrasVideos(mockVideos);
      
      // Analytics: Track fallback usage
      console.log('📊 Analytics: extras_fallback', {
        showId,
        showTitle,
        videoCount: mockVideos.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleBloopersClick = (result: BloopersSearchResult) => {
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
      console.log('📊 Analytics: extras_play', {
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
      console.log('📊 Analytics: extras_click_out', {
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

  const renderBloopersContent = () => {
    if (bloopersResults.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <h3 className="text-lg font-medium mb-2">{EXTRAS_COPY.emptyStates.bloopers.title}</h3>
            <p className="text-sm">{EXTRAS_COPY.emptyStates.bloopers.description}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => setActiveTab('extras')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {EXTRAS_COPY.emptyStates.bloopers.cta}
            </button>
            <button
              onClick={() => window.open(EXTRAS_COPY.help.bloopersArticle, '_blank')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {EXTRAS_COPY.emptyStates.bloopers.secondaryCta}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Official bloopers section */}
        {bloopersResults.some(r => r.reason === 'official') && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Official Bloopers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bloopersResults
                .filter(r => r.reason === 'official')
                .map((result, index) => (
                  <BloopersCard
                    key={`official_${index}`}
                    result={result}
                    onClick={() => handleBloopersClick(result)}
                    ref={index === 0 ? firstVideoRef : null}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Search assist section */}
        {bloopersResults.some(r => r.reason !== 'official') && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {EXTRAS_COPY.searchAssist.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bloopersResults
                .filter(r => r.reason !== 'official')
                .map((result, index) => (
                  <BloopersCard
                    key={`search_${index}`}
                    result={result}
                    onClick={() => handleBloopersClick(result)}
                  />
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
              {EXTRAS_COPY.searchAssist.disclaimer}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderExtrasContent = () => {
    if (extrasVideos.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <h3 className="text-lg font-medium mb-2">{EXTRAS_COPY.emptyStates.extras.title}</h3>
          <p className="text-sm">{EXTRAS_COPY.emptyStates.extras.description}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {extrasVideos.map((video, index) => (
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
                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                  {video.provider}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
          aria-labelledby="extras-modal-title"
          aria-describedby="extras-modal-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 id="extras-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              {showTitle} - Behind the Scenes
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('bloopers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bloopers'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {EXTRAS_COPY.tabs.bloopers}
              </button>
              <button
                onClick={() => setActiveTab('extras')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'extras'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {EXTRAS_COPY.tabs.extras}
              </button>
            </nav>
          </div>

          {/* Content */}
          <div 
            id="extras-modal-description"
            className="p-4 overflow-y-auto max-h-96"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Loading {activeTab === 'bloopers' ? 'bloopers' : 'extras'}...
                </span>
              </div>
            ) : activeTab === 'bloopers' ? (
              renderBloopersContent()
            ) : (
              renderExtrasContent()
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