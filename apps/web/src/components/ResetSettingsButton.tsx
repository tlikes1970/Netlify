import { useState } from "react";
import { settingsManager } from "../lib/settings";
import { useLanguage, useTranslations } from "../lib/language";

/** Existing confirmation, with a visible retryable failure for cloud resets. */
export default function ResetSettingsButton() {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const translations = useTranslations();
  const language = useLanguage();
  return (
    <div>
      <button
        disabled={resetting}
        onClick={async () => {
          if (resetting || !window.confirm(translations.confirmResetSettings))
            return;
          setResetting(true);
          setError("");
          try {
            await settingsManager.resetToDefaults();
          } catch {
            setError(
              language === "es"
                ? "No se pudo restablecer la configuración. Inténtalo de nuevo."
                : "Settings could not be reset. Please try again.",
            );
          } finally {
            setResetting(false);
          }
        }}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        {translations.resetSettingsToDefaults}
      </button>
      {error && (
        <p role="alert" className="mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
