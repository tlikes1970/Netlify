import { t, useLanguage } from "../lib/language";
import { useEffect, useState } from "react";
import { usePreferredName } from "../hooks/usePreferredName";
import { useSettings, resolveFlickletLine } from "../lib/settings";
import HomeMarquee from "./HomeMarquee";
import { Library } from "../lib/storage";

/**
 * Full-width page-level home.header personality band (below trial banner).
 * Scrolls with content; not sticky.
 */
export function PersonalityBanner() {
  useLanguage();
  const { preferredName } = usePreferredName();
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
      username: preferredName || undefined,
    }) || t("contentBackAgain");

  return (
    <div
      className="personality-banner w-full px-3 py-2 text-center text-sm leading-snug border-b"
      style={{
        color: "var(--muted)",
        backgroundColor: "var(--bg)",
        borderColor: "var(--line)",
      }}
      role="note"
      data-testid="personality-banner"
    >
      <HomeMarquee messages={[line]} />
    </div>
  );
}
