/** One authoritative, session-local browser install-event lifecycle. */
import { isCapacitorNative } from "../lib/capacitorEnv";

export type InstallOutcome =
  | "accepted"
  | "dismissed"
  | "unavailable"
  | "failed";
type InstallChoice = { outcome: "accepted" | "dismissed" };
interface InstallEvent extends Event {
  prompt(): Promise<InstallChoice | void>;
  userChoice?: Promise<InstallChoice>;
}

let initialized = false;
let installed = false;
let prompting = false;
let deferredEvent: InstallEvent | null = null;
let available = false;
const retiredEvents = new WeakSet<InstallEvent>();
const listeners = new Set<() => void>();

function excluded(): boolean {
  return (
    installed ||
    isCapacitorNative() ||
    Boolean(window.matchMedia?.("(display-mode: standalone)").matches) ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}
function publish(): void {
  const next = !excluded() && !prompting && deferredEvent !== null;
  if (next !== available) {
    available = next;
    listeners.forEach((listener) => listener());
  }
}
function clearEvent(): void {
  if (deferredEvent) retiredEvents.add(deferredEvent);
  deferredEvent = null;
  publish();
}
export function getCanInstall(): boolean {
  return available && !excluded();
}
export function onInstallChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function initInstallSignal(): void {
  if (initialized) return;
  initialized = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    const incoming = event as InstallEvent;
    if (excluded()) {
      retiredEvents.add(incoming);
      clearEvent();
      return;
    }
    if (retiredEvents.has(incoming) || typeof incoming.prompt !== "function")
      return;
    if (deferredEvent && deferredEvent !== incoming)
      retiredEvents.add(deferredEvent);
    deferredEvent = incoming;
    publish();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    clearEvent();
  });
  const displayMode = window.matchMedia?.("(display-mode: standalone)");
  displayMode?.addEventListener?.("change", () => {
    if (excluded()) clearEvent();
    else publish();
  });
  publish();
}
export async function promptInstall(): Promise<InstallOutcome> {
  if (excluded()) {
    clearEvent();
    return "unavailable";
  }
  if (prompting || !deferredEvent) return "unavailable";
  const event = deferredEvent;
  retiredEvents.add(event);
  deferredEvent = null;
  prompting = true;
  publish();
  try {
    const response = await event.prompt();
    const userChoice = event.userChoice;
    const choice = userChoice ? await userChoice : response;
    if (choice?.outcome === "accepted") return "accepted";
    if (choice?.outcome === "dismissed") return "dismissed";
    return "failed";
  } catch {
    return "failed";
  } finally {
    prompting = false;
    // Completion owns only the consumed event; a newer event stays retained.
    if (excluded()) clearEvent();
    else publish();
  }
}
