import { useCallback, useEffect, useState } from "react";
import ModalPortal from "./ModalPortal";
import { useFocusTrap } from "../lib/a11y/useFocusTrap";
import { useAndroidBackDismiss } from "../hooks/useAndroidBackDismiss";
import { createBackup } from "../lib/backupPersistence";
import { downloadBackup } from "../lib/downloadBackup";
import { startOver } from "../lib/startOver";

export default function StartOverControl({ disabled = false }: { disabled?: boolean }) {
  const [step, setStep] = useState<"backup" | "confirm" | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
    catch (cause) { setError(`Backup failed: ${cause instanceof Error ? cause.message : "Please try again."}`); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    if (typed !== "DELETE" || busy) return;
    setBusy(true); setError("");
    try { await startOver(); }
    catch (cause) { setError(`Start Over failed: ${cause instanceof Error ? cause.message : "Please try again."}`); setBusy(false); }
  };
  const button = "min-h-[44px] px-4 py-2 rounded-lg border whitespace-normal";
  return <>
    <div className="p-4 rounded-lg border" style={{ borderColor: "var(--error)", background: "var(--card)" }}>
      <h5 className="font-medium mb-2">Start Over</h5>
      <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>Clear your Flicklet content and reset preferences. Your login, account handle and access will be kept.</p>
      <button disabled={disabled} className={button} onClick={() => { setError(""); setTyped(""); setStep("backup"); }}>Start Over</button>
    </div>
    {step && <ModalPortal><div className="fixed inset-0 z-modal flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,.7)", paddingTop: "calc(12px + var(--safe-top, env(safe-area-inset-top, 0px)))", paddingBottom: "calc(12px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))" }} onClick={close}>
      <div ref={setPanel} role="dialog" aria-modal="true" aria-labelledby="start-over-title" aria-describedby="start-over-copy" tabIndex={-1} className="w-full max-w-lg min-w-0 rounded-xl p-4 sm:p-6 overflow-y-auto" style={{ background: "var(--card)", color: "var(--text)", maxHeight: "100%" }} onClick={event => event.stopPropagation()}>
        <h2 id="start-over-title" className="text-xl font-semibold mb-3">{step === "backup" ? "Before you start over" : "Start Over?"}</h2>
        {step === "backup" ? <>
          <p id="start-over-copy" className="text-sm mb-4">You can download a Flicklet backup first, or continue without one. Starting a download does not confirm that the file was saved. Keep the file if you want to restore supported content later.</p>
          <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={backup}>{busy ? "Creating backup…" : "Download Backup"}</button><button className={button} disabled={busy} onClick={() => { setError(""); setStep("confirm"); }}>Continue Without Backup</button><button className={button} disabled={busy} onClick={close}>Cancel</button></div>
        </> : <>
          <p id="start-over-copy" className="text-sm mb-3">This will remove your Flicklet library, lists, ratings, notes, progress, reminders, personalization, game history, preferred name and app preferences from <strong>this account and this device</strong>.</p>
          <p className="text-sm mb-3">Your login, account handle, Full Access and server trial entitlement will be kept. If you are signed out, only this device’s Flicklet data will be reset.</p>
          <p className="text-sm mb-4">You can restore supported content later only if you have a Flicklet backup.</p>
          <label className="block text-sm mb-2" htmlFor="start-over-delete">Type DELETE to confirm</label>
          <input id="start-over-delete" autoComplete="off" disabled={busy} value={typed} onChange={event => setTyped(event.target.value)} className="w-full min-w-0 min-h-[44px] border rounded px-3 mb-4" style={{ background: "var(--bg)", color: "var(--text)" }}/>
          <div className="flex flex-wrap gap-2"><button className={button} disabled={busy || typed !== "DELETE"} onClick={reset} style={{ background: "var(--error)", color: "white" }}>{busy ? "Starting over…" : "Start Over"}</button><button className={button} disabled={busy} onClick={close}>Cancel</button></div>
        </>}
        {error && <p role="alert" className="text-sm mt-4 break-words">{error}</p>}
      </div>
    </div></ModalPortal>}
  </>;
}
