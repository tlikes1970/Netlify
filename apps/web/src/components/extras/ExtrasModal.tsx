import React, { useState, useEffect, useRef } from "react";
import { ExtrasVideo } from "../../lib/extras/types";
import { YouTubePlayer } from "./YouTubePlayer";
import { useProStatus } from "../../lib/proStatus";
import { startProUpgrade } from "../../lib/proUpgrade";

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: number;
  showTitle: string;
  mediaType?: "movie" | "tv";
}

/**
 * Process: Extras Modal
 * Purpose: Displays behind-the-scenes extras content for a specific show
 * Data Source: Official extras API
 * Update Path: TabCard extras button clicks
 * Dependencies: YouTubePlayer, Pro settings
 */

export const ExtrasModal: React.FC<ExtrasModalProps> = ({
  isOpen,
  onClose,
  showId,
  showTitle,
  mediaType = "tv",
}) => {
  console.log("🎭 ExtrasModal render:", { isOpen, showId, showTitle });

  const proStatus = useProStatus();
  const isPro = proStatus.isPro;

  const [extrasVideos, setExtrasVideos] = useState<ExtrasVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ExtrasVideo | null>(null);
  const [extrasError, setExtrasError] = useState<{
    kind: string;
    message?: string;
  } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstVideoRef = useRef<HTMLDivElement>(null);

  // Pro gating: Don't fetch content if not Pro
  useEffect(() => {
    if (isOpen && !isPro) {
      // Don't load extras if not Pro
      return;
    }
    if (isOpen && isPro) {
      loadExtras();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showId, isPro]);

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

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Tab") {
        // Focus trap - let browser handle tab navigation within modal
        const modal = modalRef.current;
        if (modal) {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

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

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const loadExtras = async () => {
    setLoading(true);
    setExtrasError(null);
    try {
      const { extrasProvider } = await import(
        "../../lib/extras/extrasProvider"
      );
      const result = await extrasProvider.fetchExtras(
        showId,
        showTitle,
        mediaType
      );

      // Handle structured result
      if (result.kind === "success") {
        setExtrasVideos(result.videos);
        setExtrasError(null);

        // Analytics: Track modal open
        console.log("📊 Analytics: extras_open", {
          showId,
          showTitle,
          videoCount: result.videos.length,
        });
      } else if (result.kind === "config-error") {
        // Configuration error - API keys missing
        setExtrasVideos([]);
        setExtrasError({
          kind: "config-error",
          message:
            "Extras are temporarily unavailable due to configuration issues.",
        });
      } else if (result.kind === "api-error") {
        // API error - network or API failure
        setExtrasVideos([]);
        setExtrasError({
          kind: "api-error",
          message:
            "Extras are temporarily unavailable. Please check back later.",
        });
      } else {
        // No content found
        setExtrasVideos([]);
        setExtrasError(null);
      }
    } catch (error) {
      console.error("Failed to load extras:", error);
      setExtrasVideos([]);
      setExtrasError({
        kind: "api-error",
        message: "Extras are temporarily unavailable. Please check back later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: ExtrasVideo) => {
    if (video.canEmbed) {
      setSelectedVideo(video);

      // Analytics: Track video play
      console.log("📊 Analytics: extras_play", {
        showId,
        showTitle,
        videoId: video.id,
        videoTitle: video.title,
        provider: video.provider,
        category: video.category,
      });
    } else {
      window.open(video.watchUrl, "_blank");

      // Analytics: Track click out
      console.log("📊 Analytics: extras_click_out", {
        showId,
        showTitle,
        videoId: video.id,
        videoTitle: video.title,
        provider: video.provider,
        category: video.category,
        reason: "cannot_embed",
      });
    }
  };

  const renderExtrasContent = () => {
    // Show error state if there's a configuration or API error
    if (extrasError) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <h3 className="text-lg font-medium mb-2">
            Extras Temporarily Unavailable
          </h3>
          <p className="text-sm">
            {extrasError.message || "Please check back later."}
          </p>
        </div>
      );
    }

    // Show empty state if no videos found (but no error)
    if (extrasVideos.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <h3 className="text-lg font-medium mb-2">No extras found</h3>
          <p className="text-sm">
            We couldn&apos;t find official extras for this title. Some movies
            and shows simply don&apos;t have them.
          </p>
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
              if (e.key === "Enter" || e.key === " ") {
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
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />
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
            <h2
              id="extras-modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
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

          {/* Content */}
          <div
            id="extras-modal-description"
            className="p-4 overflow-y-auto max-h-96"
          >
            {!isPro ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💎</div>
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: "var(--text)" }}
                >
                  Extras are a Pro feature
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
                  Upgrade in Settings → Pro to unlock behind-the-scenes content.
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
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Loading extras...
                </span>
              </div>
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
