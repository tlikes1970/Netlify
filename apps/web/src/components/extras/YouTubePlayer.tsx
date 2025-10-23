import React from 'react';
import { ExtrasVideo } from '../../lib/extras/types';

interface YouTubePlayerProps {
  video: ExtrasVideo;
  onClose: () => void;
}

/**
 * Process: YouTube Player
 * Purpose: Embeds YouTube videos with proper controls and accessibility
 * Data Source: ExtrasVideo embedUrl
 * Update Path: Video selection in ExtrasModal
 * Dependencies: YouTube iframe API, ExtrasModal
 */

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ video, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-75 pt-48">
      <div className="relative w-full max-w-4xl mx-4 mt-24">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold z-10"
          aria-label="Close video player"
        >
          ×
        </button>
        
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={video.embedUrl}
            title={video.title}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        <div className="mt-4 text-white">
          <h3 className="text-lg font-semibold">{video.title}</h3>
          <p className="text-sm text-gray-300">{video.channelName}</p>
        </div>
      </div>
    </div>
  );
};
