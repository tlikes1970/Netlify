import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { changeLanguage, t } from "../../lib/language";
import { getSnapshot } from "../../i18n/translationStore";
const delivery = vi.hoisted(() => ({ create: vi.fn(), save: vi.fn() }));
vi.mock("../../lib/backupPersistence", () => ({
  createBackup: delivery.create,
  restoreBackup: vi.fn(),
}));
vi.mock("../../lib/downloadBackup", () => ({ downloadBackup: delivery.save }));
import { renderSettingsSection } from "../settingsSections";
async function language(value: "en" | "es") {
  act(() => changeLanguage(value));
  await waitFor(() => expect(getSnapshot().locale).toBe(value));
}
beforeEach(async () => {
  vi.clearAllMocks();
  await language("en");
  delivery.create.mockResolvedValue({ createdAt: "2026-10-05" });
  delivery.save.mockResolvedValue({ status: "saved" });
  vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it.each(["en", "es"] as const)(
  "%s Settings confirms native saved delivery",
  async (lang) => {
    await language(lang);
    render(renderSettingsSection("data", {}));
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(t("recoveryDownload")) }),
    );
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(t("recoveryBackupSaved")),
    );
    expect(delivery.save).toHaveBeenCalledWith({ createdAt: "2026-10-05" });
  },
);
it.each(["en", "es"] as const)(
  "%s Settings explains a save failure",
  async (lang) => {
    await language(lang);
    delivery.save.mockResolvedValueOnce({ status: "failed" });
    render(renderSettingsSection("data", {}));
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(t("recoveryDownload")) }),
    );
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(t("recoveryBackupSaveError")),
    );
    expect(window.alert).not.toHaveBeenCalledWith(t("recoveryBackupSaved"));
  },
);
it("Settings cancellation is quiet and allows retry", async () => {
  delivery.save.mockResolvedValueOnce({ status: "cancelled" });
  render(renderSettingsSection("data", {}));
  const button = screen.getByRole("button", {
    name: new RegExp(t("recoveryDownload")),
  });
  fireEvent.click(button);
  await waitFor(() => expect(button).toBeEnabled());
  expect(window.alert).not.toHaveBeenCalled();
  fireEvent.click(button);
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(t("recoveryBackupSaved")),
  );
});
it("Settings reports browser initiation without claiming saved delivery", async () => {
  delivery.save.mockResolvedValueOnce({ status: "download-started" });
  render(renderSettingsSection("data", {}));
  fireEvent.click(
    screen.getByRole("button", { name: new RegExp(t("recoveryDownload")) }),
  );
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      t("recoveryBackupDownloadStarted"),
    ),
  );
  expect(window.alert).not.toHaveBeenCalledWith(t("recoveryBackupSaved"));
});
it("Settings remains busy and silent while native saving is pending", async () => {
  let finish!: (value: { status: string }) => void;
  delivery.save.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  render(renderSettingsSection("data", {}));
  const button = screen.getByRole("button", {
    name: new RegExp(t("recoveryDownload")),
  });
  fireEvent.click(button);
  await waitFor(() => expect(delivery.save).toHaveBeenCalledOnce());
  expect(button).toBeDisabled();
  expect(window.alert).not.toHaveBeenCalled();
  await act(async () => finish({ status: "saved" }));
  expect(window.alert).toHaveBeenCalledWith(t("recoveryBackupSaved"));
  expect(button).toBeEnabled();
});
