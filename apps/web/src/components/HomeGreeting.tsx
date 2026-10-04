import { t, useLanguage } from "../lib/language";
import { usePreferredName } from "../hooks/usePreferredName";
import { useSettings } from "../lib/settings";
import { getPersonalityText } from "../data/personalities";

export default function HomeGreeting() {
  useLanguage();
  const { uid, preferredName, loading, error } = usePreferredName();
  const settings = useSettings();
  if (!uid || loading || error || !preferredName) return null;
  // The historical template token is named username; its value is exclusively
  // the authoritative preferred name, never a handle or authentication identity.
  const greeting = getPersonalityText(settings.personality, "welcome", {
    username: preferredName,
  });
  return (
    <div
      data-testid="home-greeting"
      className="min-w-0 text-left text-xs leading-snug md:text-sm break-words line-clamp-2"
      style={{ color: "var(--muted)" }}
    >
      {greeting || t("contentHelloName", { name: preferredName })}
    </div>
  );
}
