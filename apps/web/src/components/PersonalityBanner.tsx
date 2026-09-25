import { useEffect, useState } from "react";
import { useUsername } from "../hooks/useUsername";
import { useSettings, resolveFlickletLine } from "../lib/settings";
import { Library } from "../lib/storage";

/**
 * Full-width page-level home.header personality band (below trial banner).
 * Scrolls with content; not sticky.
 */
export function PersonalityBanner() {
  const { username } = useUsername();
  const settings = useSettings();
  const [, setLibraryBump] = useState(0);

  useEffect(() => {
    const unsubscribe = Library.subscribe(() => {
      setLibraryBump((v) => v + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const line =
    resolveFlickletLine("home.header", settings.personalityLevel, {
      username: username || undefined,
    }) || "Back again. Your lists are here.";

  return (
    <div
      className="w-full px-3 py-2 text-center text-sm leading-snug border-b"
      style={{
        color: "var(--muted)",
        backgroundColor: "var(--bg)",
        borderColor: "var(--line)",
      }}
      role="note"
      data-testid="personality-banner"
    >
      {line}
    </div>
  );
}
