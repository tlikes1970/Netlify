import { beforeEach, afterEach, expect, it, vi } from "vitest";
let signal: typeof import("../installSignal");
let handlers: Record<string, EventListener>;
let standalone: boolean;
let displayChange: () => void;
function emit(event: Event) {
  handlers[event.type]?.(event);
}
function event(choice: "accepted" | "dismissed" = "accepted") {
  return Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn(async () => ({ outcome: choice })),
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
beforeEach(async () => {
  vi.resetModules();
  handlers = {};
  standalone = false;
  Object.defineProperty(navigator, "standalone", {
    configurable: true,
    value: false,
  });
  delete (window as Window & { Capacitor?: unknown }).Capacitor;
  vi.spyOn(window, "addEventListener").mockImplementation((name, handler) => {
    handlers[name] = handler as EventListener;
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return standalone;
      },
      addEventListener: (_name: string, fn: () => void) => {
        displayChange = fn;
      },
    })),
  );
  signal = await import("../installSignal");
  signal.initInstallSignal();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("normal browser starts unavailable without an event", () =>
  expect(signal.getCanInstall()).toBe(false));
it("beforeinstallprompt makes Install available and prevents browser default", () => {
  const e = event();
  emit(e);
  expect(e.defaultPrevented).toBe(true);
  expect(signal.getCanInstall()).toBe(true);
});
it("invokes the retained event and reports accepted", async () => {
  const e = event();
  emit(e);
  expect(await signal.promptInstall()).toBe("accepted");
  expect(e.prompt).toHaveBeenCalledOnce();
});
it("dismissal is not success and consumes the event", async () => {
  emit(event("dismissed"));
  expect(await signal.promptInstall()).toBe("dismissed");
  expect(signal.getCanInstall()).toBe(false);
});
it("consumed event cannot be used again even if redispatched", async () => {
  const e = event();
  emit(e);
  await signal.promptInstall();
  emit(e);
  expect(await signal.promptInstall()).toBe("unavailable");
  expect(e.prompt).toHaveBeenCalledOnce();
});
it("duplicate clicks during prompt cannot invoke another prompt", async () => {
  const d = deferred<{ outcome: "accepted" }>(),
    e = event();
  e.prompt.mockReturnValue(d.promise);
  emit(e);
  const running = signal.promptInstall();
  expect(signal.getCanInstall()).toBe(false);
  expect(await signal.promptInstall()).toBe("unavailable");
  expect(e.prompt).toHaveBeenCalledOnce();
  d.resolve({ outcome: "accepted" });
  await running;
});
it("rejected prompt is handled and leaves no dead control", async () => {
  const e = event();
  e.prompt.mockRejectedValue(Error("failed"));
  emit(e);
  expect(await signal.promptInstall()).toBe("failed");
  expect(signal.getCanInstall()).toBe(false);
  expect(await signal.promptInstall()).toBe("unavailable");
});
it("awaits userChoice when prompt resolves without a choice", async () => {
  const e = Object.assign(new Event("beforeinstallprompt"), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome: "dismissed" }),
  });
  emit(e);
  expect(await signal.promptInstall()).toBe("dismissed");
});
it("userChoice rejection is handled", async () => {
  const e = Object.assign(new Event("beforeinstallprompt"), {
    prompt: vi.fn(async () => {}),
    get userChoice() {
      return Promise.reject(Error("choice failure"));
    },
  });
  emit(e);
  expect(await signal.promptInstall()).toBe("failed");
  expect(signal.getCanInstall()).toBe(false);
});
it("truthy unknown response does not report success", async () => {
  const e = Object.assign(new Event("beforeinstallprompt"), {
    prompt: vi.fn(async () => ({})),
  });
  emit(e);
  expect(await signal.promptInstall()).toBe("failed");
});
for (const outcome of ["accepted", "dismissed", "failed"] as const)
  it(`newer event survives older ${outcome} completion`, async () => {
    const d = deferred<{ outcome: "accepted" | "dismissed" }>(),
      a = event(),
      b = event();
    a.prompt.mockReturnValue(d.promise as ReturnType<typeof a.prompt>);
    emit(a);
    const running = signal.promptInstall();
    emit(b);
    expect(signal.getCanInstall()).toBe(false);
    expect(await signal.promptInstall()).toBe("unavailable");
    if (outcome === "failed") d.reject(Error("failure"));
    else d.resolve({ outcome });
    expect(await running).toBe(outcome);
    expect(signal.getCanInstall()).toBe(true);
    expect(await signal.promptInstall()).toBe("accepted");
    expect(b.prompt).toHaveBeenCalledOnce();
  });
it("superseded event cannot replace newer event later", async () => {
  const a = event(),
    b = event();
  emit(a);
  emit(b);
  emit(a);
  await signal.promptInstall();
  expect(a.prompt).not.toHaveBeenCalled();
  expect(b.prompt).toHaveBeenCalledOnce();
});
it("appinstalled clears available event", () => {
  emit(event());
  emit(new Event("appinstalled"));
  expect(signal.getCanInstall()).toBe(false);
});
it("appinstalled prevents stale completion resurrecting a newer event", async () => {
  const d = deferred<{ outcome: "accepted" }>(),
    a = event(),
    b = event();
  a.prompt.mockReturnValue(d.promise);
  emit(a);
  const running = signal.promptInstall();
  emit(b);
  emit(new Event("appinstalled"));
  d.resolve({ outcome: "accepted" });
  await running;
  expect(signal.getCanInstall()).toBe(false);
  expect(await signal.promptInstall()).toBe("unavailable");
});
it("events after appinstalled stay unavailable", () => {
  emit(new Event("appinstalled"));
  emit(event());
  expect(signal.getCanInstall()).toBe(false);
});
it("standalone display excludes subsequently captured events", () => {
  standalone = true;
  emit(event());
  expect(signal.getCanInstall()).toBe(false);
});
it("navigator standalone excludes install", () => {
  Object.defineProperty(navigator, "standalone", {
    configurable: true,
    value: true,
  });
  emit(event());
  expect(signal.getCanInstall()).toBe(false);
});
it("switching to standalone clears retained event", async () => {
  const e = event();
  emit(e);
  standalone = true;
  displayChange();
  standalone = false;
  displayChange();
  expect(signal.getCanInstall()).toBe(false);
  expect(await signal.promptInstall()).toBe("unavailable");
});
it("native Capacitor excludes browser install", async () => {
  Object.assign(window, {
    Capacitor: { isNativePlatform: () => true, getPlatform: () => "android" },
  });
  emit(event());
  expect(signal.getCanInstall()).toBe(false);
  expect(await signal.promptInstall()).toBe("unavailable");
});
it("native platform fallback excludes Android without isNativePlatform", () => {
  Object.assign(window, { Capacitor: { getPlatform: () => "android" } });
  emit(event());
  expect(signal.getCanInstall()).toBe(false);
});
it("Capacitor web platform remains installable", () => {
  Object.assign(window, {
    Capacitor: { isNativePlatform: () => false, getPlatform: () => "web" },
  });
  emit(event());
  expect(signal.getCanInstall()).toBe(true);
});
it("subscribers receive availability transitions and can unsubscribe", async () => {
  const listener = vi.fn(),
    stop = signal.onInstallChange(listener);
  emit(event());
  expect(listener).toHaveBeenCalledOnce();
  await signal.promptInstall();
  expect(listener).toHaveBeenCalledTimes(2);
  stop();
  emit(event());
  expect(listener).toHaveBeenCalledTimes(2);
});
it("initialization is idempotent", () => {
  signal.initInstallSignal();
  expect(window.addEventListener).toHaveBeenCalledTimes(2);
});
it("malformed event without prompt does not expose Install", () => {
  emit(new Event("beforeinstallprompt"));
  expect(signal.getCanInstall()).toBe(false);
});
