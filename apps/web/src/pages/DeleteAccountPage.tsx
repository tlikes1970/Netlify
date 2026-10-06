import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { changeLanguage, useLanguage } from "../lib/language";
import { accountDeletionCopy } from "../lib/accountDeletionCopy";
import { pendingAccountDeletion } from "../lib/accountDeletionState";
import { finishDeletedAccountLocally } from "../lib/accountDeletion";
import DeleteAccountControl from "../components/DeleteAccountControl";
import AuthModal from "../components/AuthModal";

export default function DeleteAccountPage() {
  const { user } = useAuth();
  const language = useLanguage();
  const copy = accountDeletionCopy[language];
  const [signin, setSignin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = pendingAccountDeletion();
  const cleanup = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await finishDeletedAccountLocally(pending.uid);
      window.location.assign("/");
    } catch {
      setError(copy.local);
      setBusy(false);
    }
  };
  return (
    <main
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: 24,
        color: "var(--text)",
        overflowWrap: "anywhere",
      }}
    >
      <nav aria-label="Language" style={{ display: "flex", gap: 16 }}>
        <button
          onClick={() => changeLanguage("en")}
          aria-pressed={language === "en"}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage("es")}
          aria-pressed={language === "es"}
        >
          Español
        </button>
      </nav>
      <h1>Flicklet — {copy.title}</h1>
      <p>{copy.description}</p>
      <p>{copy.purchase}</p>
      {pending && <p role="status">{copy.pending}</p>}
      {pending?.confirmed ? (
        <button
          disabled={busy}
          onClick={() => void cleanup()}
          style={{ minHeight: 44 }}
        >
          {copy.recovery}
        </button>
      ) : user ? (
        <DeleteAccountControl />
      ) : (
        <button onClick={() => setSignin(true)} style={{ minHeight: 44 }}>
          {copy.signin}
        </button>
      )}
      {pending && !pending.confirmed && (
        <section>
          <p>{copy.uncertain}</p>
          <button
            disabled={busy}
            onClick={() => void cleanup()}
            style={{ minHeight: 44 }}
          >
            {copy.clearLocal}
          </button>
        </section>
      )}
      {error && <p role="alert">{error}</p>}
      <p>
        <a href="https://flicklet.netlify.app/privacy.html">{copy.privacy}</a>
      </p>
      {!pending && <a href="/">{copy.back}</a>}
      <AuthModal isOpen={signin} onClose={() => setSignin(false)} />
    </main>
  );
}
