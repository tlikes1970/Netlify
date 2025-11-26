/**
 * Process: Community Player Multi-Channel
 * Purpose: Displays community content from multiple channel types (live, loop, short, audio)
 * Data Source: communityChannels.ts (primary), weekly-film.json (backward compat)
 * Update Path: Modify communityChannels.ts to add/change channels
 * Dependencies: Archive.org embed API, YouTube embeds, communityChannels.ts
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  type CommunityChannel,
  type ChannelQueue,
  COMMUNITY_CHANNELS,
  convertLegacyFilm,
  getThumbnailIndex,
  createChannelQueue,
  getValidShorts,
} from "../data/communityChannels";
import { ERROR_MESSAGES, logErrorDetails } from "../lib/errorMessages";

interface WeeklyFilmData {
  weekOf: string;
  itemId: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CommunityPlayerProps {
  // Keep interface for future extensibility
}

export default function CommunityPlayer(_props: CommunityPlayerProps) {
  // Channel queue state
  const [channelQueue, setChannelQueue] = useState<ChannelQueue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysUntilNext, setDaysUntilNext] = useState<number | null>(null);

  // Player controls state
  const [isMuted, setIsMuted] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);

  // Pre-buffer ref for shorts
  const preBufferRef = useRef<HTMLVideoElement | null>(null);

  // Touch/swipe tracking for shorts
  const touchStartX = useRef<number | null>(null);

  // Get current channel
  const currentChannel = channelQueue?.channels[channelQueue.currentIndex];

  // Load channels with backward compatibility for weekly-film.json
  // Also checks localStorage for admin-customized URLs
  useEffect(() => {
    const loadChannels = async () => {
      try {
        // Try to load legacy weekly-film.json first for backward compatibility
        let legacyChannel: CommunityChannel | null = null;

        try {
          const response = await fetch("/weekly-film.json", {
            cache: "no-store",
          });

          if (response.ok) {
            const data: WeeklyFilmData = await response.json();
            legacyChannel = convertLegacyFilm(data.weekOf, data.itemId);

            // Calculate days until next film
            const today = new Date();
            const weekOfDate = new Date(data.weekOf + "T00:00:00Z");
            const nextMonday = new Date(weekOfDate);
            nextMonday.setUTCDate(weekOfDate.getUTCDate() + 7);

            const daysDiff = Math.ceil(
              (nextMonday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            setDaysUntilNext(daysDiff);

            console.log("🎬 Loaded legacy weekly film:", data.itemId);
          }
        } catch (legacyErr) {
          logErrorDetails("CommunityPlayer", legacyErr, {
            context: "loadLegacyFilm",
          });
        }

        // Check localStorage for admin-customized channel URLs and titles
        let customUrls: Record<string, string> = {};
        let customTitles: Record<string, string> = {};
        try {
          const customChannelsJson = localStorage.getItem("flicklet.admin.customChannels");
          const customTitlesJson = localStorage.getItem("flicklet.admin.customTitles");
          if (customChannelsJson) {
            customUrls = JSON.parse(customChannelsJson);
            console.log("🎬 Loaded custom channel URLs:", Object.keys(customUrls).length);
          }
          if (customTitlesJson) {
            customTitles = JSON.parse(customTitlesJson);
            console.log("🎬 Loaded custom channel titles:", Object.keys(customTitles).length);
          }
        } catch {
          // Ignore localStorage errors
        }

        // Merge custom URLs and titles with default channels
        const mergedChannels = COMMUNITY_CHANNELS.map((ch) => ({
          ...ch,
          url: customUrls[ch.id] || ch.url,
          title: customTitles[ch.id] || ch.title,
        }));

        // Build channel list: legacy film first (if exists), then merged channels
        const channels = legacyChannel
          ? [legacyChannel, ...mergedChannels]
          : mergedChannels;

        setChannelQueue(createChannelQueue(channels));
        setIsLoading(false);
      } catch (err) {
        logErrorDetails("CommunityPlayer", err, { context: "loadChannels" });
        setError(ERROR_MESSAGES.loadFailed);
        setIsLoading(false);

        // Fallback to static channels
        setChannelQueue(createChannelQueue(COMMUNITY_CHANNELS));
      }
    };

    loadChannels();
  }, []);

  // Pre-buffer next short when current is a short
  useEffect(() => {
    if (!currentChannel || currentChannel.type !== "short") return;

    const shorts = getValidShorts();
    const currentShortIndex = shorts.findIndex(
      (s) => s.id === currentChannel.id
    );
    const nextShort = shorts[(currentShortIndex + 1) % shorts.length];

    if (nextShort && preBufferRef.current) {
      preBufferRef.current.src = nextShort.url;
      preBufferRef.current.load();
    }
  }, [currentChannel]);

  // Fallback: Clear loading state after 3 seconds if onLoad doesn't fire
  // This handles cross-origin iframes that don't reliably fire load events
  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("🎬 Fallback: Clearing loading state after timeout");
        setIsLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoading, currentChannel?.id]);

  // Navigate to next channel
  const goToNextChannel = useCallback(() => {
    if (!channelQueue) return;

    setChannelQueue((prev) => {
      if (!prev) return prev;
      const nextIndex = (prev.currentIndex + 1) % prev.channels.length;
      return { ...prev, currentIndex: nextIndex };
    });
  }, [channelQueue]);

  // Navigate to previous channel
  const goToPrevChannel = useCallback(() => {
    if (!channelQueue) return;

    setChannelQueue((prev) => {
      if (!prev) return prev;
      const prevIndex =
        (prev.currentIndex - 1 + prev.channels.length) % prev.channels.length;
      return { ...prev, currentIndex: prevIndex };
    });
  }, [channelQueue]);

  // Handle swipe for shorts
  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentChannel?.type !== "short") return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || currentChannel?.type !== "short") return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Swipe left to advance (threshold: 50px)
    if (diff > 50) {
      goToNextChannel();
    }

    touchStartX.current = null;
  };

  // Handle tap on left third to replay/go back
  const handleTapOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentChannel?.type !== "short") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const thirdWidth = rect.width / 3;

    if (clickX < thirdWidth) {
      // Left third: go to previous
      goToPrevChannel();
    }
  };

  // Toggle mute
  const toggleMute = () => setIsMuted((prev) => !prev);

  // Toggle captions
  const toggleCaptions = () => setShowCaptions((prev) => !prev);

  // Get thumbnail for current channel
  const getThumbnail = () => {
    if (!currentChannel || currentChannel.thumbnails.length === 0) return null;

    const index = getThumbnailIndex(
      currentChannel.thumbnails,
      channelQueue?.lastRotation || new Date().toISOString()
    );
    return currentChannel.thumbnails[index];
  };

  // Render error state
  if (error && !channelQueue) {
    return (
      <div
        className="youtube-player-container max-w-[420px] md:max-w-[560px] h-[750px] mx-auto rounded-2xl flex flex-col items-center justify-center p-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--line)",
          borderWidth: "1px",
          borderStyle: "solid",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="error-content text-center">
          <h3
            className="text-sm font-medium mb-2"
            style={{ color: "var(--muted)" }}
          >
            🎬 Community Player
          </h3>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Build embed URL based on channel type
  const getEmbedUrl = () => {
    if (!currentChannel) return "";

    // YouTube embeds already have proper URL format
    if (currentChannel.url.includes("youtube.com/embed")) {
      return currentChannel.url;
    }

    // Archive.org embeds
    if (currentChannel.url.includes("archive.org/embed")) {
      return currentChannel.url;
    }

    // Direct video files (for shorts)
    return currentChannel.url;
  };

  const isDirectVideo =
    currentChannel?.type === "short" ||
    currentChannel?.url.endsWith(".mp4") ||
    currentChannel?.url.endsWith(".webm");

  return (
    <div
      className="youtube-player-container max-w-[420px] md:max-w-[560px] h-[750px] mx-auto rounded-2xl transition-shadow flex flex-col"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--line)",
        borderWidth: "1px",
        borderStyle: "solid",
        boxShadow: "var(--shadow)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
    >
      {/* Header section */}
      <div className="flex justify-between items-center p-3 pb-2">
        <div className="flex flex-col">
          <h3
            className="text-sm font-medium"
            style={{ color: "var(--muted)", opacity: 0.6 }}
          >
            {currentChannel?.title || "🎬 Community Player"}
          </h3>
          {currentChannel?.description && (
            <span
              className="text-xs"
              style={{ color: "var(--muted)", opacity: 0.5 }}
            >
              {currentChannel.description}
            </span>
          )}
          {daysUntilNext !== null && currentChannel?.id?.startsWith("legacy-") && (
            <span
              className="text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              Next film in {daysUntilNext}{" "}
              {daysUntilNext === 1 ? "day" : "days"}
            </span>
          )}
        </div>

        {/* Controls: Mute + Captions */}
        <div className="flex gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--btn2)",
              color: "var(--muted)",
            }}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {currentChannel?.captions && (
            <button
              onClick={toggleCaptions}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: showCaptions ? "var(--accent)" : "var(--btn2)",
                color: showCaptions ? "white" : "var(--muted)",
              }}
              aria-label={showCaptions ? "Hide captions" : "Show captions"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h4M13 15h4M7 11h2M11 11h6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Genre tags */}
      {currentChannel?.genreTags && currentChannel.genreTags.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {currentChannel.genreTags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--accent)",
                color: "white",
                opacity: 0.8,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Video frame */}
      <div
        className="flex-1 my-3 px-3 flex items-center justify-center min-h-0 relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading && (
          <div className="player-loading absolute inset-0 flex items-center justify-center z-10">
            <div className="loading-spinner"></div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Loading...
            </p>
          </div>
        )}

        {/* Thumbnail overlay when loading - fades out after iframe loads */}
        {isLoading && getThumbnail() && (
          <img
            src={getThumbnail()!}
            alt={currentChannel?.title || "Channel thumbnail"}
            className="absolute inset-3 object-cover rounded-xl pointer-events-none"
            style={{ zIndex: 5, opacity: 0.8 }}
          />
        )}

        {/* Tap overlay for shorts (left third for previous) */}
        {currentChannel?.type === "short" && (
          <div
            className="absolute inset-3 z-20 cursor-pointer"
            onClick={handleTapOverlay}
            style={{ pointerEvents: "auto" }}
          />
        )}

        <div
          className="w-full h-full max-h-full rounded-xl overflow-hidden mx-auto shadow-inner"
          style={{
            borderColor: "var(--line)",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
        >
          {isDirectVideo ? (
            // Direct video element for shorts/MP4s
            <video
              src={getEmbedUrl()}
              autoPlay={currentChannel?.autoplay !== false}
              muted={isMuted}
              loop={currentChannel?.type !== "short"}
              playsInline
              className="w-full h-full object-cover"
              style={{ display: isLoading ? "none" : "block" }}
              onLoadedData={() => {
                setIsLoading(false);
                console.log("🎬 Video loaded:", currentChannel?.id);
              }}
              onEnded={() => {
                if (currentChannel?.type === "short") {
                  goToNextChannel();
                }
              }}
            >
              {/* Captions track */}
              {typeof currentChannel?.captions === "string" && showCaptions && (
                <track
                  kind="captions"
                  src={currentChannel.captions}
                  srcLang="en"
                  default
                />
              )}
            </video>
          ) : (
            // iframe for embeds (YouTube, Archive.org)
            // Always display iframe - don't hide it while loading
            // The onLoad event may not fire reliably for cross-origin iframes
            <iframe
              id="ia-player"
              src={getEmbedUrl()}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media"
              loading="lazy"
              title={currentChannel?.title || "Community content"}
              style={{
                border: "none",
              }}
              onLoad={() => {
                setIsLoading(false);
                console.log("🎬 Player loaded:", currentChannel?.id);
              }}
            />
          )}
        </div>

        {/* Hidden pre-buffer for next short */}
        <video
          ref={preBufferRef}
          preload="auto"
          muted
          playsInline
          style={{ display: "none" }}
        />
      </div>

      {/* Footer section */}
      <div
        className="rounded-b-2xl p-3 flex flex-col items-center gap-2"
        style={{
          backgroundColor: "var(--btn2)",
        }}
      >
        {/* Social proof placeholder */}
        <p
          className="text-xs"
          style={{ color: "var(--muted)", opacity: 0.6 }}
        >
          12 watchers today
        </p>

        {/* Source attribution */}
        {currentChannel?.source && (
          <p
            className="text-xs"
            style={{
              opacity: 0.7,
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Content courtesy {currentChannel.source}
            {currentChannel.source === "Internet Archive" && " – public domain"}
          </p>
        )}

        {/* Channel navigation */}
        {channelQueue && channelQueue.channels.length > 1 && (
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={goToPrevChannel}
              className="p-1 rounded transition-colors"
              style={{ color: "var(--muted)" }}
              aria-label="Previous channel"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <span
              className="text-xs"
              style={{ color: "var(--muted)", opacity: 0.6 }}
            >
              {channelQueue.currentIndex + 1} / {channelQueue.channels.length}
            </span>

            <button
              onClick={goToNextChannel}
              className="p-1 rounded transition-colors"
              style={{ color: "var(--muted)" }}
              aria-label="Next channel"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
