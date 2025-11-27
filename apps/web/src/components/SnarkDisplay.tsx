import { useRef, useEffect } from "react";
import { useUsername } from "../hooks/useUsername";
import { useSettings, getPersonalityText, DEFAULT_PERSONALITY } from "../lib/settings";
import { useAuth } from "../hooks/useAuth";
// ⚠️ REMOVED: flickerDiagnostics import disabled

export default function SnarkDisplay() {
  const { username } = useUsername();
  const settings = useSettings();
  const { isAuthenticated } = useAuth();

  // Use refs to track previous values for accurate logging
  const prevUsernameRef = useRef<string | undefined>(username);
  const prevIsAuthenticatedRef = useRef<boolean>(isAuthenticated);

  // ⚠️ REMOVED: flickerDiagnostics logging disabled
  useEffect(() => {
    if (prevUsernameRef.current !== username) {
      prevUsernameRef.current = username;
    }
    if (prevIsAuthenticatedRef.current !== isAuthenticated) {
      prevIsAuthenticatedRef.current = isAuthenticated;
    }
  }, [username, isAuthenticated]);

  // If user is authenticated but has no username, show link to set username
  if (isAuthenticated && !username) {
    const handleOpenSettings = () => {
      // Dispatch custom event to open SettingsPage
      window.dispatchEvent(new CustomEvent("settings:open-page"));
    };

    return (
      <div
        className="text-xs md:text-sm md:truncate md:max-w-none"
        style={{
          color: "var(--muted)",
          maxWidth: "100%",
          wordBreak: "break-word",
        }}
      >
        <button
          onClick={handleOpenSettings}
          className="underline hover:no-underline transition-all"
          style={{ color: "var(--accent)" }}
        >
          Click here to set a username
        </button>
      </div>
    );
  }

  // If no username (and not authenticated), show nothing
  if (!username) {
    return null;
  }

  // Show welcome message when username exists (using new personality system)
  const personality = settings.personality || DEFAULT_PERSONALITY;
  const snarkText = getPersonalityText(personality, "welcome", {
    username,
  });

  return (
    <div
      className="text-xs md:text-sm md:truncate md:max-w-none"
      style={{
        color: "var(--muted)",
        maxWidth: "100%",
        wordBreak: "break-word",
        lineHeight: "1.4",
      }}
    >
      {snarkText}
    </div>
  );
}
