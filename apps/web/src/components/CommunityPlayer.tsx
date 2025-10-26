import { useState, useEffect, useRef } from 'react';

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

/**
 * Process: Video Rotation System
 * Purpose: Cycles through six official trailer/sizzle videos with privacy-enhanced embeds
 * Data Source: Official studio YouTube channels (Shudder, IFC Films, Magnolia Pictures)
 * Update Path: Modify videoIds array to add/remove videos
 * Dependencies: YouTube IFrame API, rotation timer, fallback error handling
 */

export default function YouTubePlayer(_props: YouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const rotationTimerRef = useRef<number | null>(null);

  // Official trailer/sizzle videos from verified studio channels
  const videoIds = [
    '68xPqmT0jC4', // Shudder - A Year of Shudder (2024) Sizzle
    'l8XxoeV5LRU', // Shudder - V/H/S/HALLOWEEN | Official Trailer
    'WyXuRmXbS7U', // IFC Films - In a Violent Nature | Official Trailer
    'LwBS3a9HOWI', // IFC Films - The Salvation | Official Trailer
    '55892jT06aI', // Magnolia Pictures - The China Hustle | Official Trailer
    'Ut1xOFdASa0'  // IFC Films - Hold Your Fire | Official Trailer
  ];

  const videoTitles = [
    'A Year of Shudder (2024) Sizzle',
    'V/H/S/HALLOWEEN | Official Trailer',
    'In a Violent Nature | Official Trailer',
    'The Salvation | Official Trailer',
    'The China Hustle | Official Trailer',
    'Hold Your Fire | Official Trailer'
  ];

  const videoCategories = [
    'Horror Collection',
    'Horror Collection',
    'Horror Collection',
    'Action Collection',
    'Dark Documentary',
    'Dark Documentary'
  ];

  // Rotation function to cycle through videos
  const rotateToNextVideo = () => {
    const nextIndex = (currentVideoIndex + 1) % videoIds.length;
    setCurrentVideoIndex(nextIndex);
    setCurrentVideoTitle(videoTitles[nextIndex]);
    
    if (youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.loadVideoById(videoIds[nextIndex]);
        console.log(`🎬 Rotated to video ${nextIndex + 1}/${videoIds.length}: ${videoTitles[nextIndex]}`);
      } catch (err) {
        console.error('🎬 Error rotating to next video:', err);
        // Try next video in sequence if current fails
        setTimeout(() => rotateToNextVideo(), 1000);
      }
    }
  };

  // Start rotation timer
  const startRotationTimer = () => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }
    
    // Rotate every 30 seconds
    rotationTimerRef.current = setInterval(() => {
      rotateToNextVideo();
    }, 30000);
    
    console.log('🎬 Video rotation timer started (30s intervals)');
  };

  // Stop rotation timer
  const stopRotationTimer = () => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
      console.log('🎬 Video rotation timer stopped');
    }
  };

  useEffect(() => {
    // Initialize current video title
    setCurrentVideoTitle(videoTitles[currentVideoIndex]);

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
        console.log('🎬 Initializing YouTube player with rotation...');
        
        // Use privacy-enhanced domain and current video
        const currentVideoId = videoIds[currentVideoIndex];
        
        youtubePlayerRef.current = new window.YT.Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: currentVideoId,
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
            // Privacy-enhanced settings
            privacy_mode: 1,
            host: 'https://www.youtube-nocookie.com'
          },
          events: {
            onReady: () => {
              console.log(`🎬 YouTube player ready with video: ${videoTitles[currentVideoIndex]}`);
              setIsLoading(false);
              setError(null);
              // Start rotation timer after player is ready
              startRotationTimer();
            },
            onStateChange: (event: any) => {
              console.log('🎬 Player state changed:', event.data);
              if (event.data === window.YT.PlayerState.PLAYING) {
                console.log('🎬 Video started playing');
              }
            },
            onError: (event: any) => {
              console.error('🎬 YouTube player error:', event.data);
              // Try next video if current fails
              console.log('🎬 Attempting to load next video due to error');
              setTimeout(() => rotateToNextVideo(), 2000);
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
      stopRotationTimer();
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy();
        } catch (err) {
          console.warn('🎬 Error destroying player:', err);
        }
      }
    };
  }, [currentVideoIndex]);

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
    rotateToNextVideo();
  };

  const handlePreviousVideo = () => {
    const prevIndex = currentVideoIndex === 0 ? videoIds.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(prevIndex);
    setCurrentVideoTitle(videoTitles[prevIndex]);
    
    if (youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.loadVideoById(videoIds[prevIndex]);
        console.log(`🎬 Rotated to previous video ${prevIndex + 1}/${videoIds.length}: ${videoTitles[prevIndex]}`);
      } catch (err) {
        console.error('🎬 Error rotating to previous video:', err);
      }
    }
  };

  const handleToggleRotation = () => {
    if (rotationTimerRef.current) {
      stopRotationTimer();
    } else {
      startRotationTimer();
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
    <div className="youtube-player-container max-w-[420px] md:max-w-[560px] mx-auto bg-neutral-900/70 border border-neutral-800/50 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-shadow">
      {/* Header section - vertical stacking */}
      <div className="flex justify-between items-center p-3 pb-2">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-neutral-400 opacity-60">🎬 Community Player</h3>
          <span className="text-xs font-medium text-blue-400">{currentVideoIndex + 1}/{videoIds.length} {videoCategories[currentVideoIndex]}</span>
        </div>
        
        {/* Controls - right aligned, smaller icons */}
        <div className="flex gap-1">
          <button 
            className="control-btn w-5 h-5 hover:bg-blue-500/30 rounded-md p-1 transition-colors"
            onClick={handlePreviousVideo}
            title="Previous Video"
          >
            ⏮️
          </button>
          <button 
            className="control-btn w-5 h-5 hover:bg-blue-500/30 rounded-md p-1 transition-colors"
            onClick={handlePlayPause}
            title="Play/Pause"
          >
            ⏯️
          </button>
          <button 
            className="control-btn w-5 h-5 hover:bg-blue-500/30 rounded-md p-1 transition-colors"
            onClick={handleNextVideo}
            title="Next Video"
          >
            ⏭️
          </button>
          <button 
            className={`control-btn w-5 h-5 rounded-md p-1 transition-colors ${rotationTimerRef.current ? 'bg-blue-500/30 animate-pulse' : 'hover:bg-blue-500/30'}`}
            onClick={handleToggleRotation}
            title={rotationTimerRef.current ? "Stop Auto-Rotation" : "Start Auto-Rotation"}
          >
            🔄
          </button>
        </div>
      </div>
      
      {/* Video frame with proper margins */}
      <div className="my-3 px-3">
        {isLoading && (
          <div className="player-loading">
            <div className="loading-spinner"></div>
            <p>Loading video content...</p>
          </div>
        )}
        
        <div className="aspect-video rounded-xl overflow-hidden border border-neutral-700/60 mx-auto shadow-inner">
          <div 
            ref={playerRef}
            className="youtube-player w-full h-full"
            style={{ 
              display: isLoading ? 'none' : 'block'
            }}
          />
        </div>
      </div>
      
      {/* Footer section - solid footer band */}
      <div className="bg-neutral-950/80 rounded-b-2xl p-3 flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-neutral-200 text-center">
          {currentVideoTitle}
        </p>
        <div className="flex flex-wrap gap-2 justify-center transition-opacity duration-700">
          <span className="px-2 py-1 rounded-full bg-neutral-800/80 text-xs text-neutral-300">🎞 Official Trailer</span>
          <span className="px-2 py-1 rounded-full bg-neutral-800/80 text-xs text-neutral-300">⏱ 2–3 min</span>
          <span className="px-2 py-1 rounded-full bg-neutral-800/80 text-xs text-neutral-300">🔒 Privacy Enhanced</span>
          <span className={`px-2 py-1 rounded-full text-xs transition-opacity duration-700 ${rotationTimerRef.current ? 'bg-blue-900/40 text-blue-300' : 'bg-neutral-800/80 text-neutral-300'}`}>
            {rotationTimerRef.current ? '♻️ Auto-Rotating' : '⏸️ Manual'}
          </span>
        </div>
      </div>
    </div>
  );
}
