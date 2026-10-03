import { profileErrorKey, type AccountMessageKey } from "../lib/accountErrors";
import { t, useLanguage } from "../lib/language";
import { useEffect, useId, useState } from "react";
import { usePreferredName } from "../hooks/usePreferredName";

export default function PreferredNameEditor({
  onSaved,
}: {
  onSaved?: () => void;
}) {
  useLanguage();
  const {
    uid,
    preferredName,
    loading,
    error: loadError,
    updatePreferredName,
    retry,
  } = usePreferredName();
  const [name, setName] = useState(preferredName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<AccountMessageKey | "">("");
  const id = useId();
  useEffect(() => {
    setName(preferredName);
    setError("");
  }, [uid, preferredName]);
  if (!uid) return <p>{t("profileSignIn")}</p>;
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");
        try {
          await updatePreferredName(name);
          onSaved?.();
        } catch (cause) {
          console.error("Preferred name save failed", cause);
          setError(profileErrorKey(cause));
        } finally {
          setSaving(false);
        }
      }}
    >
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        {t("profileLabel")}
      </label>
      <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
        {t("profileCopy")}
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          type="text"
          value={name}
          maxLength={100}
          autoComplete="nickname"
          placeholder={t("profilePlaceholder")}
          disabled={loading || saving || !!loadError}
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 flex-1 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            border: "1px solid var(--line)",
          }}
        />
        <button
          type="submit"
          disabled={
            loading ||
            saving ||
            !!loadError ||
            !name.trim() ||
            (name.trim() === preferredName && !onSaved)
          }
          className="min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {saving ? t("profileSaving") : t("save")}
        </button>
      </div>
      {(error || loadError) && (
        <p role="alert" className="mt-2">
          {error ? t(error) : t("profileLoadError")}
        </p>
      )}
      {loadError && (
        <button type="button" onClick={retry}>
          {t("profileRetry")}
        </button>
      )}
    </form>
  );
}
