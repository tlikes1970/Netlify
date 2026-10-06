import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { parseBackup, validateBackup, type Backup } from "../backup";
const native = vi.hoisted(() => ({ android: false, save: vi.fn() }));
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => native.android,
    getPlatform: () => (native.android ? "android" : "web"),
  },
  registerPlugin: () => ({ saveBackup: native.save }),
}));
import { downloadBackup } from "../downloadBackup";
const backup = (): Backup => ({
  type: "flicklet-backup",
  schemaVersion: 1,
  createdAt: "2026-10-05T10:00:00Z",
  appVersion: "2.0.48",
  library: [
    {
      id: 7,
      mediaType: "tv",
      title: "España 🎬",
      list: "watching",
      addedAt: 123,
      userRating: 4,
      userNotes: "Keep my notes",
      tags: ["familia"],
    },
  ],
  customLists: [],
  settings: {
    personality: "Zen",
    personalityLevel: 2,
    notifications: {
      upcomingEpisodes: true,
      weeklyDiscover: true,
      monthlyStats: true,
    },
    layout: {
      theme: "dark",
      homePageLists: [],
      forYouGenres: [],
      episodeTracking: true,
      discoveryLimit: 25,
    },
  },
  preferredName: "España 🎬",
  local: {},
});
let click: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  native.android = false;
  native.save.mockReset().mockResolvedValue({ status: "saved" });
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:backup"),
    revokeObjectURL: vi.fn(),
  });
  click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("browser/PWA retains the anchor download and reports initiation only", async () => {
  const anchors: HTMLAnchorElement[] = [];
  click.mockImplementation(function (this: HTMLAnchorElement) {
    anchors.push(this);
  });
  expect(await downloadBackup(backup())).toEqual({
    status: "download-started",
  });
  expect(native.save).not.toHaveBeenCalled();
  expect(anchors[0].download).toBe("flicklet-backup-2026-10-05.json");
  expect(anchors[0].href).toBe("blob:backup");
  expect(anchors[0].isConnected).toBe(false);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:backup");
});
it("browser serialization and MIME type remain unchanged", async () => {
  const original = backup();
  await downloadBackup(original);
  const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
  expect(blob.type).toBe("application/json");
  const json = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });
  expect(json).toBe(JSON.stringify(original, null, 2));
  expect(parseBackup(json)).toEqual(validateBackup(original));
});
it("browser errors fail and clean up the download URL", async () => {
  click.mockImplementation(() => {
    throw Error("download blocked");
  });
  expect(await downloadBackup(backup())).toEqual({ status: "failed" });
  expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
});
it("Android uses native saving and passes the exact JSON and filename", async () => {
  native.android = true;
  const value = backup();
  expect(await downloadBackup(value)).toEqual({ status: "saved" });
  expect(native.save).toHaveBeenCalledWith({
    filename: "flicklet-backup-2026-10-05.json",
    json: JSON.stringify(value, null, 2),
  });
  expect(click).not.toHaveBeenCalled();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
it.each(["saved", "cancelled", "failed"])(
  "native %s result is explicit",
  async (status) => {
    native.android = true;
    native.save.mockResolvedValueOnce({ status });
    expect(await downloadBackup(backup())).toEqual({ status });
  },
);
it("native plugin rejection fails without a WebView fallback", async () => {
  native.android = true;
  native.save.mockRejectedValueOnce(Error("provider failure"));
  expect(await downloadBackup(backup())).toEqual({ status: "failed" });
  expect(click).not.toHaveBeenCalled();
});
it("unknown native response cannot imply save success", async () => {
  native.android = true;
  native.save.mockResolvedValueOnce({ status: "opened" });
  expect(await downloadBackup(backup())).toEqual({ status: "failed" });
});
it("native delivery remains pending until the saver resolves", async () => {
  native.android = true;
  let done!: (result: { status: string }) => void;
  native.save.mockReturnValueOnce(
    new Promise((resolve) => {
      done = resolve;
    }),
  );
  const settled = vi.fn();
  const request = downloadBackup(backup()).then(settled);
  await Promise.resolve();
  expect(settled).not.toHaveBeenCalled();
  done({ status: "saved" });
  await request;
  expect(settled).toHaveBeenCalledWith({ status: "saved" });
});
it("native JSON is accepted by the existing restore validator, including Unicode", async () => {
  native.android = true;
  const value = validateBackup(backup());
  await downloadBackup(value);
  const json = native.save.mock.calls[0][0].json;
  expect(parseBackup(json)).toEqual(value);
  expect(JSON.parse(json).preferredName).toBe("España 🎬");
  expect(parseBackup(json).library[0]).toMatchObject({
    userRating: 4,
    userNotes: "Keep my notes",
    tags: ["familia"],
  });
});
it("serialization failure never opens a picker or reports success", async () => {
  native.android = true;
  const value = backup();
  value.settings.circular = value.settings;
  expect(await downloadBackup(value)).toEqual({ status: "failed" });
  expect(native.save).not.toHaveBeenCalled();
});
