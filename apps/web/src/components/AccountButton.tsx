import { t as coreText, useLanguage } from "@/lib/language";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAndroidBackDismiss } from "../hooks/useAndroidBackDismiss";
import AuthModal from "./AuthModal";
import ModalPortal from "./ModalPortal";

export default function AccountButton() {
  useLanguage();
  const { signOut, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [surface, setSurface] = useState<"confirm" | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const open = isAuthenticated && surface !== null;

  const dismiss = useCallback(() => {
    if (pending.current) return;
    setError(null);
    setSurface(null);
  }, []);
  useAndroidBackDismiss(open, dismiss);
  useEffect(() => {
    if (!isAuthenticated) setSurface(null);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    const trigger = buttonRef.current;
    document.documentElement.style.overflow = "hidden";
    // ModalPortal mounts after its own effect; focus after the portal commits.
    const timer = window.setTimeout(
      () =>
        panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus(),
      0,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
      if (event.key !== "Tab") return;
      const buttons = panelRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      );
      if (!buttons?.length) {
        event.preventDefault();
        return;
      }
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open, surface, dismiss]);

  const confirmSignOut = async () => {
    if (pending.current) return;
    pending.current = true;
    setLoggingOut(true);
    setError(null);
    try {
      await signOut();
      setSurface(null);
    } catch (cause) {
      console.error("Sign-out failed:", cause);
      setError(coreText("coreLogoutFailed"));
    } finally {
      pending.current = false;
      setLoggingOut(false);
    }
  };
  const buttonStyle = {
    backgroundColor: "var(--btn)",
    color: "var(--text)",
    border: "1px solid var(--line)",
  };
  const actionClass = "rounded-lg px-4 py-2 min-h-[44px] disabled:opacity-50";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() =>
          isAuthenticated ? setSurface("confirm") : setShowAuthModal(true)
        }
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-1 md:px-3 md:py-2 rounded-lg text-xs md:text-sm min-h-[44px] transition-colors"
        style={buttonStyle}
        aria-haspopup="dialog"
        aria-expanded={open || showAuthModal}
        data-testid="account-button"
        data-role="avatar"
      >
        <span aria-hidden="true">👤</span>
        <span>{isAuthenticated ? coreText("coreLogOut") : coreText("coreLogIn")}</span>
      </button>
      {open && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-modal backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
            onClick={dismiss}
            role="presentation"
          >
            <div
              ref={panelRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={bodyId}
              className="w-full max-w-sm min-w-0 rounded-xl p-6 shadow-xl"
              style={{
                backgroundColor: "var(--card)",
                color: "var(--text)",
                border: "1px solid var(--line)",
                marginBottom: "env(safe-area-inset-bottom, 0px)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={titleId} className="text-lg font-semibold mb-3">{coreText("coreLogOutTitle")}</h2>
              <p
                id={bodyId}
                className="text-sm mb-6"
                style={{ color: "var(--muted)" }}
              >{coreText("coreLogOutConfirm")}</p>
              {error && (
                <p role="alert" className="text-sm mb-3">
                  {coreText('coreLogoutFailed')}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={dismiss}
                  className={actionClass}
                  style={buttonStyle}
                >{coreText("coreCancel")}</button>
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={confirmSignOut}
                  className={actionClass}
                  style={{ backgroundColor: "#dc2626", color: "#fff" }}
                >
                  {loggingOut ? coreText("coreLoggingOut") : coreText("coreLogOut")}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
