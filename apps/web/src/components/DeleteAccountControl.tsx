import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../lib/language";
import { accountDeletionCopy } from "../lib/accountDeletionCopy";
import { deleteCurrentAccount } from "../lib/accountDeletion";
import { pendingAccountDeletion } from "../lib/accountDeletionState";
import { reauthenticateForDeletion } from "../lib/accountReauthentication";
import { useFocusTrap } from "../lib/a11y/useFocusTrap";
import { useAndroidBackDismiss } from "../hooks/useAndroidBackDismiss";
import ModalPortal from "./ModalPortal";
import { auth } from "../lib/firebaseBootstrap";

export default function DeleteAccountControl() {
  const { user } = useAuth();
  const copy = accountDeletionCopy[useLanguage()];
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [reauth, setReauth] = useState(false);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const close = useCallback(() => {
    if (!busy) {
      setOpen(false);
      setTyped("");
      setPassword("");
      setError("");
      setReauth(false);
    }
  }, [busy]);
  useFocusTrap(panel, open, "input");
  useAndroidBackDismiss(open, close);
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    if (open) window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open, close]);
  if (!user) return null;
  const submit = async () => {
    if (typed !== "DELETE" || busy) return;
    setBusy(true);
    setError("");
    try {
      if (reauth) {
        try {
          await reauthenticateForDeletion(password);
        } catch {
          setError(copy.verifyFailure);
          return;
        }
      }
      await deleteCurrentAccount();
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code === "functions/failed-precondition") {
        setReauth(true);
        setError(copy.recent);
      } else
        setError(
          code === "account-changed"
            ? copy.changed
            : pendingAccountDeletion()?.confirmed
              ? copy.local
              : copy.failure,
        );
    } finally {
      setBusy(false);
      setPassword("");
    }
  };
  const button = { minHeight: 44, padding: "8px 16px", borderRadius: 8 };
  return (
    <section aria-label={copy.title}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ ...button, color: "var(--danger, #b91c1c)" }}
      >
        {copy.title}
      </button>
      {open && (
        <ModalPortal>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,.65)",
              display: "grid",
              placeItems: "center",
              padding: 16,
            }}
          >
            <div
              ref={setPanel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-heading"
              aria-describedby="delete-account-description"
              aria-busy={busy}
              style={{
                width: "100%",
                maxWidth: 520,
                maxHeight: "calc(100dvh - 32px)",
                overflowY: "auto",
                padding: 24,
                borderRadius: 12,
                background: "var(--card, white)",
                color: "var(--text, #111)",
              }}
            >
              <h2 id="delete-account-heading">{copy.title}</h2>
              <p id="delete-account-description">{copy.description}</p>
              <p>{copy.purchase}</p>
              <label style={{ display: "block" }}>
                {copy.confirm}
                <input
                  autoComplete="off"
                  value={typed}
                  disabled={busy}
                  onChange={(event) => setTyped(event.target.value)}
                  style={{
                    display: "block",
                    minHeight: 44,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </label>
              {reauth &&
                auth.currentUser?.providerData.some(
                  (provider) => provider.providerId === "password",
                ) && (
                  <label>
                    {copy.password}
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      disabled={busy}
                      onChange={(event) => setPassword(event.target.value)}
                      style={{
                        width: "100%",
                        minHeight: 44,
                        boxSizing: "border-box",
                      }}
                    />
                  </label>
                )}
              {error && (
                <p role="alert">
                  {error} <a href="/delete-account">{copy.title}</a>
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={close}
                  style={button}
                >
                  {copy.cancel}
                </button>
                <button
                  type="button"
                  disabled={busy || typed !== "DELETE"}
                  onClick={() => void submit()}
                  style={button}
                >
                  {busy ? copy.deleting : reauth ? copy.verify : copy.title}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}
