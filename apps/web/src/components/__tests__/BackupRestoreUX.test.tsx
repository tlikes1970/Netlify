import { changeLanguage, t } from "../../lib/language";
import { formatDateTime } from "../../lib/localeFormatters";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ restore: vi.fn(), create: vi.fn() }));
vi.mock("../../lib/backupPersistence", () => ({
  restoreBackup: mocks.restore,
  createBackup: mocks.create,
}));
import { renderSettingsSection } from "../settingsSections";
import { mergeSettingsFromPayload } from "../../lib/settings";
let input: HTMLInputElement;
const valid = () =>
  JSON.stringify({
    type: "flicklet-backup",
    schemaVersion: 1,
    createdAt: "2026-10-01T00:00:00Z",
    appVersion: "2.0.9",
    library: [],
    customLists: [],
    settings: mergeSettingsFromPayload({}),
    preferredName: "TJ",
    local: {},
  });
async function choose(raw: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(t("recoveryRestoreButton")) }));
  const file = new File([raw], "backup.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: async () => raw });
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("flicklet.library.v2", "original");
  mocks.restore.mockReset();
  const create = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((
    tag: string,
    options?: ElementCreationOptions,
  ) => {
    const element = create(tag, options);
    if (tag === "input") input = element as HTMLInputElement;
    return element;
  }) as typeof document.createElement);
  vi.spyOn(window, "alert").mockImplementation(() => undefined);
  vi.spyOn(window, "confirm").mockReturnValue(false);
  render(renderSettingsSection("data", {}));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Backup/Restore confirmation and errors", () => {
  it("leaves data and controls unchanged when the platform picker is cancelled", async () => {
    fireEvent.click(screen.getByRole("button", {name:/Restore from Backup/}));
    fireEvent(input,new Event("cancel"));
    await act(async()=>fireEvent.change(input,{target:{files:[]}}));
    expect(mocks.restore).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(localStorage.getItem("flicklet.library.v2")).toBe("original");
    expect(screen.getByRole("button",{name:/Restore from Backup/})).not.toBeDisabled();
  });
  it("validates a malformed file before confirmation and reports the error", async () => {
    await choose("{bad");
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "This is not a valid supported Flicklet backup. Choose another backup file.",
      ),
    );
    expect(window.confirm).not.toHaveBeenCalled();
    expect(mocks.restore).not.toHaveBeenCalled();
    expect(localStorage.getItem("flicklet.library.v2")).toBe("original");
  });
  it("explains replacement and preserves data when confirmation is cancelled", async () => {
    await choose(valid());
    await waitFor(() =>
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringMatching(
          /library, custom lists and backed-up preferences will be replaced/,
        ),
      ),
    );
    expect(mocks.restore).not.toHaveBeenCalled();
    expect(localStorage.getItem("flicklet.library.v2")).toBe("original");
  });
  it("shows a useful restore error and re-enables the controls", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    mocks.restore.mockRejectedValueOnce(
      new Error("Cloud restore was rejected"),
    );
    await choose(valid());
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "Restore failed. Please try again.",
      ),
    );
    expect(
      screen.getByRole("button", { name: new RegExp(t("recoveryRestoreButton")) }),
    ).not.toBeDisabled();
  });
});

it("Spanish restore uses the shared date formatter and preserves cancellation semantics", async () => {
  act(() => changeLanguage("es"));
  await screen.findByRole("button", { name: /Restaurar desde una copia de seguridad/ });
  await choose(valid());
  expect(window.confirm).toHaveBeenCalledWith(t("recoveryConfirm", { date: formatDateTime(new Date("2026-10-01T00:00:00Z")) }));
  expect(mocks.restore).not.toHaveBeenCalled();
  expect(localStorage.getItem("flicklet.library.v2")).toBe("original");
  act(() => changeLanguage("en"));
});
