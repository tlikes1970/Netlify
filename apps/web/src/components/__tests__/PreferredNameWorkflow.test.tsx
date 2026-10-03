import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser, UserSettings } from "../../lib/auth.types";

const mocks = vi.hoisted(() => ({
  user: null as AuthUser | null,
  listeners: new Set<(user: AuthUser | null) => void>(),
  read: vi.fn(),
  write: vi.fn(),
  personality: "Zen",
  migratedName: undefined as string | undefined,
}));
vi.mock("../../lib/auth", () => ({
  authManager: {
    getCurrentUser: () => mocks.user,
    getUserSettings: mocks.read,
    subscribe: (listener: (user: AuthUser | null) => void) => {
      mocks.listeners.add(listener);
      return () => mocks.listeners.delete(listener);
    },
  },
}));
vi.mock("../../lib/firebaseBootstrap", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, collection: string, uid: string) =>
    `${collection}/${uid}`,
  updateDoc: mocks.write,
  runTransaction: async (
    _db: unknown,
    callback: (transaction: unknown) => Promise<string>,
  ) =>
    callback({
      get: async () => ({
        exists: () => true,
        data: () => ({ settings: { preferredName: mocks.migratedName } }),
      }),
      update: mocks.write,
    }),
}));
vi.mock("../../lib/settings", () => ({
  useSettings: () => ({ personality: mocks.personality }),
}));
vi.mock("../AccountButton", () => ({
  default: () => <button>Account</button>,
}));
vi.mock("../SearchSuggestions", () => ({
  default: () => null,
  addSearchToHistory: vi.fn(),
}));
vi.mock("../VoiceSearch", () => ({ default: () => null }));
vi.mock("../../pwa/useInstall", () => ({ useCanInstallPWA: () => false }));
vi.mock("../../pwa/installSignal", () => ({ promptInstall: vi.fn() }));
vi.mock("../../lib/language", async (importOriginal) => ({...await importOriginal<typeof import("@/lib/language")>(),
  useTranslations: () => ({ search: "Search" }),
}));
vi.mock("../../lib/capacitorEnv", () => ({
  isCapacitorAndroid: () => false,
  isCapacitorNative: () => false,
}));

import FlickletHeader from "../FlickletHeader";
import PreferredNameEditor from "../PreferredNameEditor";
import HomeGreeting from "../HomeGreeting";
import {
  PreferredNameStore,
  resolvePreferredName,
} from "../../lib/preferredName";
import {
  PERSONALITY_LIST,
  getAllVariants,
  getPersonalityText,
} from "../../data/personalities";

const user = (uid = "one"): AuthUser => ({
  uid,
  displayName: "Google Person",
  email: "private@example.com",
  photoURL: null,
});
function auth(next: AuthUser | null) {
  act(() => {
    mocks.user = next;
    mocks.listeners.forEach((listener) => listener(next));
  });
}
beforeEach(() => {
  mocks.user = user();
  mocks.personality = "Zen";
  mocks.migratedName = undefined;
  mocks.read.mockReset().mockResolvedValue({});
  mocks.write.mockReset().mockResolvedValue(undefined);
});

describe("preferred-name workflow", () => {
  it("renders one personalized greeting inside the header, before Search", async () => {
    mocks.user = {uid:"header-user", displayName:"Google name", email:"google@example.com",photoURL:null};
    mocks.read.mockResolvedValue({preferredName:"Travis"});
    const {container}=render(<FlickletHeader />);
    const greeting=await screen.findByTestId("home-greeting");
    expect(container.querySelector("header")!.contains(greeting)).toBe(true);
    expect(screen.getAllByTestId("home-greeting")).toHaveLength(1);
    expect(greeting).toHaveTextContent("Travis");
    expect(greeting).not.toHaveClass("text-center", "border-b");
  });

  it("first sign-in saves a non-unique name and immediately greets; returning users are not prompted", async () => {
    const view = render(
      <>
        <FlickletHeader showGreeting={false} />
        <HomeGreeting />
      </>,
    );
    expect(
      await screen.findByRole("dialog", { name: "What should we call you?" }),
    ).toBeVisible();
    expect(screen.queryByTestId("home-greeting")).toBeNull();
    const input = screen.getByLabelText("Flicklet preferred name");
    expect(input).toHaveValue("");
    fireEvent.change(input, { target: { value: " Travis " } });
    fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.write).toHaveBeenCalledTimes(1);
    expect(mocks.write).toHaveBeenCalledWith("users/one", {
      "settings.preferredName": "Travis",
    });
    expect(screen.getByTestId("home-greeting")).toHaveTextContent("Travis");
    view.unmount();
    mocks.read.mockResolvedValue({ preferredName: "Travis" });
    render(
      <>
        <FlickletHeader showGreeting={false} />
        <HomeGreeting />
      </>,
    );
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent(
      "Travis",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("Settings changes the same authoritative name and greeting", async () => {
    mocks.read.mockResolvedValue({
      preferredName: "Travis",
      username: "public_handle",
    });
    render(
      <>
        <PreferredNameEditor />
        <HomeGreeting />
      </>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Flicklet preferred name")).toHaveValue(
        "Travis",
      ),
    );
    fireEvent.change(screen.getByLabelText("Flicklet preferred name"), {
      target: { value: "TJ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByTestId("home-greeting")).toHaveTextContent("TJ"),
    );
    expect(screen.getByTestId("home-greeting")).not.toHaveTextContent("Travis");
    expect(mocks.write).toHaveBeenCalledWith("users/one", {
      "settings.preferredName": "TJ",
    });
  });
  it("migrates a previous prompt answer once without prompting or changing its handle", async () => {
    mocks.read.mockResolvedValue({ username: "Mom", usernamePrompted: true });
    render(
      <>
        <FlickletHeader showGreeting={false} />
        <HomeGreeting />
      </>,
    );
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent("Mom");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.write).toHaveBeenCalledTimes(1);
    expect(mocks.write).toHaveBeenCalledWith("users/one", {
      "settings.preferredName": "Mom",
    });
  });
  it("migration preserves a preferred name saved by another device during the read", async () => {
    mocks.read.mockResolvedValue({
      username: "Travis",
      usernamePrompted: true,
    });
    mocks.migratedName = "TJ";
    render(
      <>
        <FlickletHeader showGreeting={false} />
        <HomeGreeting />
      </>,
    );
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent("TJ");
    expect(mocks.write).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("signed-out state has no greeting and no prompt", async () => {
    mocks.read.mockResolvedValue({ preferredName: "Pam" });
    render(
      <>
        <FlickletHeader showGreeting={false} />
        <HomeGreeting />
      </>,
    );
    await screen.findByTestId("home-greeting");
    auth(null);
    expect(screen.queryByTestId("home-greeting")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("missing name never falls back to provider name, email or a public handle", async () => {
    mocks.read.mockResolvedValue({
      username: "public_handle",
      usernamePrompted: false,
      displayName: "Guest",
    });
    render(
      <>
        <FlickletHeader showGreeting={false} />
        <HomeGreeting />
      </>,
    );
    await screen.findByRole("dialog");
    expect(screen.getByLabelText("Flicklet preferred name")).toHaveValue("");
    expect(screen.queryByTestId("home-greeting")).toBeNull();
    for (const identity of [
      "Google Person",
      "private@example.com",
      "public_handle",
      "Guest",
    ])
      expect(screen.queryByText(identity)).toBeNull();
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("allows the same preferred name for different accounts, including spaces and punctuation", async () => {
    render(<PreferredNameEditor />);
    await waitFor(() =>
      expect(
        screen.getByLabelText("Flicklet preferred name"),
      ).not.toBeDisabled(),
    );
    fireEvent.change(screen.getByLabelText("Flicklet preferred name"), {
      target: { value: "Dr. Smith" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.write).toHaveBeenCalledWith("users/one", {
        "settings.preferredName": "Dr. Smith",
      }),
    );
    auth(user("two"));
    await waitFor(() =>
      expect(
        screen.getByLabelText("Flicklet preferred name"),
      ).not.toBeDisabled(),
    );
    fireEvent.change(screen.getByLabelText("Flicklet preferred name"), {
      target: { value: "Dr. Smith" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.write).toHaveBeenCalledWith("users/two", {
        "settings.preferredName": "Dr. Smith",
      }),
    );
  });
  it("failed save retains the prompt and offers a retry without publishing an unsaved greeting", async () => {
    mocks.write.mockRejectedValueOnce(new Error("Offline"));
    render(
      <>
        <FlickletHeader showGreeting={false} />
        <HomeGreeting />
      </>,
    );
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText("Flicklet preferred name"), {
      target: { value: "Pam" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.queryByTestId("home-greeting")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent("Pam");
  });
  it("dismissal does not establish a name and resets on next sign-in", async () => {
    render(<FlickletHeader showGreeting={false} />);
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.write).not.toHaveBeenCalled();
    auth(null);
    auth(user());
    expect(await screen.findByRole("dialog")).toBeVisible();
  });
  it("first sign-in waits for background document creation and then prompts", async () => {
    mocks.read.mockResolvedValueOnce(null).mockResolvedValueOnce({});
    render(<FlickletHeader showGreeting={false} />);
    await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(screen.queryByRole("dialog")).toBeNull();
    auth(user());
    expect(await screen.findByRole("dialog")).toBeVisible();
  });
  it("read failure does not prompt over an unknown existing name; retry loads it", async () => {
    mocks.read
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ preferredName: "Mom" });
    render(
      <>
        <FlickletHeader showGreeting={false} />
        <PreferredNameEditor />
        <HomeGreeting />
      </>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be loaded",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent("Mom");
  });
});

describe("conservative migration and account isolation", () => {
  it.each([
    [
      {
        preferredName: "TJ",
        username: "Travis",
        usernamePrompted: true,
        displayName: "Pam",
      },
      "TJ",
    ],
    [{ preferredName: "", username: "Travis", usernamePrompted: true }, ""],
    [{ displayName: " Dr. Smith " }, "Dr. Smith"],
    [{ displayName: "Guest" }, ""],
    [{ username: "public_handle", usernamePrompted: false }, ""],
  ] as [UserSettings, string][])("resolves %j to %s", (settings, name) =>
    expect(resolvePreferredName(settings)).toBe(name),
  );
  it("ignores a stale name read after another account signs in", async () => {
    let release!: (settings: UserSettings) => void;
    mocks.read
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = resolve;
          }),
      )
      .mockResolvedValue({ preferredName: "Pam" });
    render(<HomeGreeting />);
    auth(user("two"));
    expect(await screen.findByTestId("home-greeting")).toHaveTextContent("Pam");
    await act(async () =>
      release({ username: "Travis", usernamePrompted: true }),
    );
    expect(screen.getByTestId("home-greeting")).toHaveTextContent("Pam");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("an in-flight save cannot publish into another account", async () => {
    let current: AuthUser | null = user();
    let notify!: (user: AuthUser | null) => void;
    let release!: () => void;
    const write = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const store = new PreferredNameStore({
      currentUser: () => current,
      subscribeAuth: (listener) => {
        notify = listener;
        return () => {};
      },
      read: async () => ({}),
      write,
    });
    const stop = store.subscribe(() => {});
    await waitFor(() => expect(store.getSnapshot().loading).toBe(false));
    const saved = store.updatePreferredName("Travis");
    current = user("two");
    notify(current);
    release();
    await expect(saved).rejects.toThrow("account changed");
    expect(store.getSnapshot().preferredName).toBe("");
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith("one", "Travis");
    stop();
  });
});

describe("historical personality greetings", () => {
  it.each(PERSONALITY_LIST.map(({ name }) => name))(
    "preserves %s welcome variants and updates the preferred name",
    async (personality) => {
      mocks.personality = personality;
      mocks.read.mockResolvedValue({ preferredName: "TJ" });
      render(<HomeGreeting />);
      const greeting = await screen.findByTestId("home-greeting");
      expect(greeting).toHaveTextContent("TJ");
      expect(
        getAllVariants(personality, "welcome").map((line) =>
          line.replace(/\{username\}/g, "TJ"),
        ),
      ).toContain(greeting.textContent);
      expect(
        getPersonalityText(personality, "welcome", { username: "Pam" }),
      ).toContain("Pam");
    },
  );
  it("treats replacement characters in a preferred name literally", () => {
    expect(getPersonalityText("Zen", "welcome", { username: "$&" })).toContain(
      "$&",
    );
    expect(
      getPersonalityText("Zen", "welcome", { username: "$&" }),
    ).not.toContain("{username}");
  });
});
