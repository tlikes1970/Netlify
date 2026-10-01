import { usePreferredName } from "../hooks/usePreferredName";
import { useSettings } from "../lib/settings";
import { getPersonalityText } from "../data/personalities";

export default function HomeGreeting() {
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
      className="w-full border-b py-2 text-center text-sm"
      style={{ color: "var(--muted)", borderColor: "var(--line)" }}
    >
      {greeting || `Hello, ${preferredName}`}
    </div>
  );
}
