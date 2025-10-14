import { useState, useEffect, useRef } from 'react';
import { useTranslations } from '@/lib/language';

// YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

interface YouTubePlayerProps {
  playlistId?: string;
  videoId?: string;
}

export default function YouTubePlayer({ playlistId }: YouTubePlayerProps) {
  const translations = useTranslations();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [currentVideo, setCurrentVideo] = useState<string | null>(null); // Unused
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);

  // Top 10 Horror Movies of 2024 playlist (we'll modify this later)
  const defaultPlaylistId = 'PLScC8g4bqD47tQJXcQJ4O6XqY1Z2K3L4M5'; // Placeholder - we'll use a real horror playlist

  useEffect(() => {
    // Load YouTube API
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initializePlayer();
      } else {
        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (existingScript) {
          // Script exists, wait for it to load
          window.onYouTubeIframeAPIReady = initializePlayer;
        } else {
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          script.async = true;
          script.onload = () => {
            console.log('🎬 YouTube API script loaded');
          };
          script.onerror = () => {
            console.error('🎬 Failed to load YouTube API script');
            setError('Failed to load YouTube API');
            setIsLoading(false);
          };
          document.head.appendChild(script);
          
          // Set up the callback
          window.onYouTubeIframeAPIReady = initializePlayer;
        }
      }
    };

    const initializePlayer = () => {
      if (!playerRef.current) {
        console.error('🎬 Player ref not available');
        setError('Player container not available');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🎬 Initializing YouTube player...');
        
        // Use a single video instead of playlist for now (more reliable)
        const videoId = 'dQw4w9WgXcQ'; // Rick Roll as placeholder - replace with actual horror movie
        
        youtubePlayerRef.current = new window.YT.Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            fs: 1,
            cc_load_policy: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              console.log('🎬 YouTube player ready');
              setIsLoading(false);
              setError(null);
            },
            onStateChange: (event: any) => {
              console.log('🎬 Player state changed:', event.data);
              if (event.data === window.YT.PlayerState.PLAYING) {
                console.log('🎬 Video started playing');
              }
            },
            onError: (event: any) => {
              console.error('🎬 YouTube player error:', event.data);
              setError(`Video error: ${event.data}`);
              setIsLoading(false);
            }
          }
        });
      } catch (err) {
        console.error('🎬 Failed to initialize YouTube player:', err);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      loadYouTubeAPI();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy();
        } catch (err) {
          console.warn('🎬 Error destroying player:', err);
        }
      }
    };
  }, [playlistId, defaultPlaylistId]);

  const handlePlayPause = () => {
    if (youtubePlayerRef.current) {
      const state = youtubePlayerRef.current.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
    }
  };

  const handleNextVideo = () => {
    if (youtubePlayerRef.current) {
      // For now, just restart the current video
      youtubePlayerRef.current.seekTo(0);
    }
  };

  const handlePreviousVideo = () => {
    if (youtubePlayerRef.current) {
      // For now, just restart the current video
      youtubePlayerRef.current.seekTo(0);
    }
  };

  if (error) {
    return (
      <div className="youtube-player-error">
        <div className="error-content">
          <h3>🎬 Community Player</h3>
          <p>Unable to load video content</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="youtube-player-container">
      <div className="player-header">
        <h3>🎬 Community Player</h3>
        <div className="player-controls">
          <button 
            className="control-btn"
            onClick={handlePreviousVideo}
            title="Restart Video"
          >
            🔄
          </button>
          <button 
            className="control-btn"
            onClick={handlePlayPause}
            title="Play/Pause"
          >
            ⏯️
          </button>
          <button 
            className="control-btn"
            onClick={handleNextVideo}
            title="Restart Video"
          >
            🔄
          </button>
        </div>
      </div>
      
      <div className="player-wrapper">
        {isLoading && (
          <div className="player-loading">
            <div className="loading-spinner"></div>
            <p>Loading video content...</p>
          </div>
        )}
        
        <div 
          ref={playerRef}
          className="youtube-player"
          style={{ 
            display: isLoading ? 'none' : 'block',
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      
      <div className="player-info">
        <p className="playlist-description">
          {translations.community_player_placeholder || 'Community video player - ready for your content!'}
        </p>
        <div className="playlist-stats">
          <span>📺 Demo Video</span>
          <span>⏱️ ~3 minutes</span>
          <span>👥 Community Ready</span>
        </div>
      </div>
    </div>
  );
}
