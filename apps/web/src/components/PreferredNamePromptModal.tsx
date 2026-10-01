import { useCallback, useEffect, useRef } from "react";
import { useAndroidBackDismiss } from "../hooks/useAndroidBackDismiss";
import ModalPortal from "./ModalPortal";
import PreferredNameEditor from "./PreferredNameEditor";

export default function PreferredNamePromptModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => onClose(), [onClose]);
  useAndroidBackDismiss(isOpen, dismiss);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const timer = window.setTimeout(
      () => panel.current?.querySelector("input")?.focus(),
      0,
    );
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
      if (event.key !== "Tab") return;
      const controls = panel.current?.querySelectorAll<HTMLElement>(
        "input:not(:disabled), button:not(:disabled)",
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", keydown);
      document.documentElement.style.overflow = overflow;
      previous?.focus();
    };
  }, [isOpen, dismiss]);
  if (!isOpen) return null;
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/60 p-4"
        style={{ zIndex: "var(--z-modal)" }}
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="What should we call you?"
          className="w-full max-w-md rounded-2xl p-6"
          style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
        >
          <h2 className="text-xl font-semibold mb-4">
            What should we call you?
          </h2>
          <PreferredNameEditor onSaved={onClose} />
          <button type="button" onClick={onClose} className="mt-4">
            Not now
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
