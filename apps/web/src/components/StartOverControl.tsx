import { recoveryErrorKey, type AccountMessageKey } from "../lib/accountErrors";
import { t, useLanguage } from "../lib/language";
import { useCallback, useEffect, useState } from "react";
import ModalPortal from "./ModalPortal";
import { useFocusTrap } from "../lib/a11y/useFocusTrap";
import { useAndroidBackDismiss } from "../hooks/useAndroidBackDismiss";
import { createBackup } from "../lib/backupPersistence";
import { downloadBackup } from "../lib/downloadBackup";
import { startOver } from "../lib/startOver";

export default function StartOverControl({ disabled = false }: { disabled?: boolean }) {
  useLanguage();
  const [step, setStep] = useState<"backup" | "confirm" | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AccountMessageKey | "">("");
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const close = useCallback(() => { if (!busy) { setStep(null); setTyped(""); setError(""); } }, [busy]);
  useFocusTrap(panel, !!step, step === "confirm" ? "input" : undefined);
  useAndroidBackDismiss(!!step, close);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    if (step) window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [step, close]);
  const backup = async () => {
    setBusy(true); setError("");
    try { downloadBackup(await createBackup()); setStep("confirm"); }
    catch (cause) { console.error("Backup failed", cause); setError(recoveryErrorKey(cause, "backup")); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    if (typed !== "DELETE" || busy) return;
    setBusy(true); setError("");
    try { await startOver(); }
    catch (cause) { console.error("Start Over failed", cause); setError(recoveryErrorKey(cause, "reset")); setBusy(false); }
  };
  const button = "min-h-[44px] px-4 py-2 rounded-lg border whitespace-normal";
  return <>
    <div className="p-4 rounded-lg border" style={{ borderColor: "var(--error)", background: "var(--card)" }}>
      <h5 className="font-medium mb-2">{t("startOverTitle")}</h5>
      <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{t("startOverIntro")}</p>
      <button disabled={disabled} className={button} onClick={() => { setError(""); setTyped(""); setStep("backup"); }}>{t("startOverTitle")}</button>
    </div>
    {step && <ModalPortal><div className="fixed inset-0 z-modal flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,.7)", paddingTop: "calc(12px + var(--safe-top, env(safe-area-inset-top, 0px)))", paddingBottom: "calc(12px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))" }} onClick={close}>
      <div ref={setPanel} role="dialog" aria-modal="true" aria-labelledby="start-over-title" aria-describedby="start-over-copy" tabIndex={-1} className="w-full max-w-lg min-w-0 rounded-xl p-4 sm:p-6 overflow-y-auto" style={{ background: "var(--card)", color: "var(--text)", maxHeight: "100%" }} onClick={event => event.stopPropagation()}>
        <h2 id="start-over-title" className="text-xl font-semibold mb-3">{step === "backup" ? t("startOverBefore") : t("startOverConfirm")}</h2>
        {step === "backup" ? <>
          <p id="start-over-copy" className="text-sm mb-4">{t("startOverBackupCopy")}</p>
          <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={backup}>{busy ? t("recoveryCreating") : t("recoveryDownload")}</button><button className={button} disabled={busy} onClick={() => { setError(""); setStep("confirm"); }}>{t("startOverWithout")}</button><button className={button} disabled={busy} onClick={close}>{t("coreCancel")}</button></div>
        </> : <>
          <p id="start-over-copy" className="text-sm mb-3">{t("startOverRemoval")}</p>
          <p className="text-sm mb-3">{t("startOverPreserved")}</p>
          <p className="text-sm mb-4">{t("startOverRecovery")}</p>
          <label className="block text-sm mb-2" htmlFor="start-over-delete">{t("startOverDelete")}</label>
          <input id="start-over-delete" autoComplete="off" disabled={busy} value={typed} onChange={event => setTyped(event.target.value)} className="w-full min-w-0 min-h-[44px] border rounded px-3 mb-4" style={{ background: "var(--bg)", color: "var(--text)" }}/>
          <div className="flex flex-wrap gap-2"><button className={button} disabled={busy || typed !== "DELETE"} onClick={reset} style={{ background: "var(--error)", color: "white" }}>{busy ? t("startOverBusy") : t("startOverTitle")}</button><button className={button} disabled={busy} onClick={close}>{t("coreCancel")}</button></div>
        </>}
        {error && <p role="alert" className="text-sm mt-4 break-words">{t(error)}</p>}
      </div>
    </div></ModalPortal>}
  </>;
}
