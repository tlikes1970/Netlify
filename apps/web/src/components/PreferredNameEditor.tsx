import { useEffect, useId, useState } from "react";
import { usePreferredName } from "../hooks/usePreferredName";

export default function PreferredNameEditor({
  onSaved,
}: {
  onSaved?: () => void;
}) {
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
  const [error, setError] = useState("");
  const id = useId();
  useEffect(() => {
    setName(preferredName);
    setError("");
  }, [uid, preferredName]);
  if (!uid) return <p>Sign in to set your preferred name.</p>;
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
          setError(
            cause instanceof Error
              ? cause.message
              : "Your preferred name could not be saved. Please try again.",
          );
        } finally {
          setSaving(false);
        }
      }}
    >
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        Flicklet preferred name
      </label>
      <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
        What should Flicklet call you?
      </p>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={name}
          maxLength={100}
          autoComplete="nickname"
          placeholder="e.g. Travis or Dr. Smith"
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {(error || loadError) && (
        <p role="alert" className="mt-2">
          {error || loadError}
        </p>
      )}
      {loadError && (
        <button type="button" onClick={retry}>
          Try again
        </button>
      )}
    </form>
  );
}
