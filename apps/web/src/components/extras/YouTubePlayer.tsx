import { t, useLanguage } from "@/lib/language";
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
  useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="relative w-full max-w-4xl max-h-[90dvh] overflow-y-auto pt-12">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 min-w-[44px] min-h-[44px] text-white hover:text-gray-300 text-2xl font-bold z-10"
          aria-label={t("contentCloseVideoPlayer")}
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
          <h3 className="text-lg font-semibold break-words">{video.title}</h3>
          <p className="text-sm text-gray-300">{video.channelName}</p>
        </div>
      </div>
    </div>
  );
};
