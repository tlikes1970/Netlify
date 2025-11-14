import { useState, useEffect } from "react";

interface WeeklyFilmData {
  weekOf: string;
  itemId: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CommunityPlayerProps {
  // Keep interface for future extensibility
}

/**
 * Process: Archive.org Weekly Film Player
 * Purpose: Displays a public-domain feature film from Archive.org that rotates weekly
 * Data Source: weekly-film.json in /public (updated weekly via automation)
 * Update Path: Update weekly-film.json every Monday with next film ID
 * Dependencies: Archive.org embed API, weekly-film.json
 */

export default function CommunityPlayer(_props: CommunityPlayerProps) {
  const [filmData, setFilmData] = useState<WeeklyFilmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysUntilNext, setDaysUntilNext] = useState<number | null>(null);

  // Pre-vetted playlist of public domain films (Archive.org item identifiers)
  // Format: Use exact item identifier from archive.org/details/{ITEM_ID}
  // These identifiers come from the URL when viewing the item on Archive.org
  const filmPlaylist = [
    "House_On_Haunted_Hill.avi", // House on Haunted Hill (1959) - Vincent Price
    "Night_of_the_Living_Dead", // Night of the Living Dead (1968)
    "TheGeneral", // The General (1926) - Buster Keaton
    "HisGirlFriday1940", // His Girl Friday (1940)
    "CarnivalOfSouls", // Carnival of Souls (1962)
    "TheKid1921", // The Kid (1921) - Charlie Chaplin
    "Detour", // Detour (1945)
    "The_Last_Man_on_Earth_1964", // The Last Man on Earth (1964)
  ];

  // Load weekly film data
  useEffect(() => {
    const loadFilmData = async () => {
      try {
        const response = await fetch("/weekly-film.json", {
          cache: "no-store", // Always check for latest version
        });

        if (!response.ok) {
          throw new Error(`Failed to load film data: ${response.status}`);
        }

        const data: WeeklyFilmData = await response.json();
        setFilmData(data);

        // Calculate days until next film (Monday at 00:00 UTC)
        const today = new Date();
        const weekOfDate = new Date(data.weekOf + "T00:00:00Z");

        // Get next Monday
        const nextMonday = new Date(weekOfDate);
        nextMonday.setUTCDate(weekOfDate.getUTCDate() + 7);

        const daysDiff = Math.ceil(
          (nextMonday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        setDaysUntilNext(daysDiff);

        setIsLoading(false);
        console.log(
          "🎬 Loaded weekly film:",
          data.itemId,
          "Week of:",
          data.weekOf
        );
      } catch (err) {
        console.error("❌ Failed to load weekly film data:", err);
        setError("Failed to load film");
        setIsLoading(false);

        // Fallback to first film
        setFilmData({
          weekOf: new Date().toISOString().slice(0, 10),
          itemId: filmPlaylist[0],
        });
      }
    };

    loadFilmData();
  }, []);

  if (error && !filmData) {
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
            Unable to load film content
          </p>
        </div>
      </div>
    );
  }

  const filmId = filmData?.itemId || filmPlaylist[0];
  const embedUrl = `https://archive.org/embed/${filmId}`;

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
            🎬 Community Player
          </h3>
          {daysUntilNext !== null && (
            <span
              className="text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              Next film in {daysUntilNext}{" "}
              {daysUntilNext === 1 ? "day" : "days"}
            </span>
          )}
        </div>
      </div>

      {/* Video frame with Archive.org iframe - flex to fill remaining space */}
      <div className="flex-1 my-3 px-3 flex items-center justify-center min-h-0">
        {isLoading && (
          <div className="player-loading">
            <div className="loading-spinner"></div>
            <p>Loading film...</p>
          </div>
        )}

        <div
          className="w-full h-full max-h-full rounded-xl overflow-hidden mx-auto shadow-inner"
          style={{
            borderColor: "var(--line)",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
        >
          <iframe
            id="ia-player"
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            loading="lazy"
            title="Public-domain feature film"
            style={{
              display: isLoading ? "none" : "block",
              border: "none",
            }}
            onLoad={() => {
              setIsLoading(false);
              console.log("🎬 Archive.org player loaded:", filmId);
            }}
          />
        </div>
      </div>

      {/* Footer section with attribution */}
      <div
        className="rounded-b-2xl p-3 flex flex-col items-center gap-2"
        style={{
          backgroundColor: "var(--btn2)",
        }}
      >
        <p
          className="ia-attribution"
          style={{
            fontSize: "0.75rem",
            opacity: 0.7,
            marginTop: "4px",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          Film courtesy Internet Archive – public domain.
        </p>
      </div>
    </div>
  );
}
