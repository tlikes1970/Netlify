import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  create: vi.fn(),
  download: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("../../lib/backupPersistence", () => ({ createBackup: m.create }));
vi.mock("../../lib/downloadBackup", () => ({ downloadBackup: m.download }));
vi.mock("../../lib/startOver", () => ({ startOver: m.reset }));
import StartOverControl from "../StartOverControl";
beforeEach(() => {
  m.create.mockReset().mockResolvedValue({ createdAt: "2026-10-01" });
  m.download.mockReset().mockResolvedValue({ status: "saved" });
  m.reset.mockReset().mockResolvedValue(undefined);
  render(<StartOverControl />);
});
afterEach(cleanup);
const open = () =>
  fireEvent.click(screen.getByRole("button", { name: "Start Over" }));
const confirm = () => within(screen.getByRole("dialog"));
describe("Start Over backup choice and typed confirmation", () => {
  it("offers all three choices before any destructive confirmation", () => {
    open();
    expect(
      screen.getByRole("button", { name: "Download Backup" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Continue Without Backup" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(m.reset).not.toHaveBeenCalled();
  });
  it("exports through existing backup functionality and then asks for DELETE", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Download Backup" }));
    await screen.findByRole("textbox");
    expect(m.create).toHaveBeenCalledOnce();
    expect(m.download).toHaveBeenCalledWith({ createdAt: "2026-10-01" });
    expect(m.reset).not.toHaveBeenCalled();
    expect(
      confirm().getByRole("button", { name: "Start Over" }),
    ).toBeDisabled();
  });
  it("failed backup stays at the choice with error and never automatically resets", async () => {
    m.create.mockRejectedValueOnce(Error("offline"));
    open();
    fireEvent.click(screen.getByRole("button", { name: "Download Backup" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Backup creation failed. Please try again.",
    );
    expect(
      screen.getByRole("button", { name: "Continue Without Backup" }),
    ).toBeEnabled();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(m.reset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Download Backup" }));
    await screen.findByRole("textbox");
    expect(m.create).toHaveBeenCalledTimes(2);
  });
  it("continuing without backup requires exact DELETE and cancel remains safe", () => {
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue Without Backup" }),
    );
    for (const value of ["delete", "DELETE ", "wrong"]) {
      fireEvent.change(screen.getByRole("textbox"), { target: { value } });
      expect(
        confirm().getByRole("button", { name: "Start Over" }),
      ).toBeDisabled();
    }
    fireEvent.click(confirm().getByRole("button", { name: "Cancel" }));
    expect(m.create).not.toHaveBeenCalled();
    expect(m.reset).not.toHaveBeenCalled();
  });
  it("only exact DELETE starts the coordinated operation", async () => {
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue Without Backup" }),
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "DELETE" },
    });
    fireEvent.click(confirm().getByRole("button", { name: "Start Over" }));
    await waitFor(() => expect(m.reset).toHaveBeenCalledOnce());
    expect(m.create).not.toHaveBeenCalled();
  });
  it("reset failure stays visible without success or automatic retry", async () => {
    m.reset.mockRejectedValue(Error("cloud failure"));
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue Without Backup" }),
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "DELETE" },
    });
    fireEvent.click(confirm().getByRole("button", { name: "Start Over" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Start Over failed. Please try again.",
    );
    expect(confirm().getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(m.reset).toHaveBeenCalledOnce();
  });
  it("Escape and Android Back cancel without changing data", () => {
    open();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    open();
    act(() =>
      window.dispatchEvent(
        new Event("flicklet:android-back", { cancelable: true }),
      ),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(m.reset).not.toHaveBeenCalled();
  });
});

describe("backup delivery safety", () => {
  it.each(["cancelled", "failed"])(
    "does not advance or reset when saving is %s",
    async (status) => {
      m.download.mockResolvedValueOnce({ status });
      open();
      fireEvent.click(screen.getByRole("button", { name: "Download Backup" }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Download Backup" }),
        ).toBeEnabled(),
      );
      expect(screen.queryByRole("textbox")).toBeNull();
      expect(m.reset).not.toHaveBeenCalled();
      if (status === "failed")
        expect(screen.getByRole("alert")).toHaveTextContent(
          "The backup could not be saved.",
        );
      else {
        expect(screen.queryByRole("alert")).toBeNull();
        expect(screen.getByRole("status")).toHaveTextContent("cancelled");
      }
    },
  );
  it("waits for native completion, rather than file generation or picker initiation", async () => {
    let finish!: (result: { status: string }) => void;
    m.download.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    open();
    fireEvent.click(screen.getByRole("button", { name: "Download Backup" }));
    await waitFor(() => expect(m.download).toHaveBeenCalledOnce());
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen.getByRole("button", { name: /Saving backup/ }),
    ).toBeDisabled();
    expect(m.reset).not.toHaveBeenCalled();
    await act(async () => finish({ status: "saved" }));
    expect(screen.getByRole("textbox")).toBeVisible();
    expect(m.reset).not.toHaveBeenCalled();
  });
  it("requires explicit retained-file confirmation for a browser download", async () => {
    m.download.mockResolvedValueOnce({ status: "download-started" });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Download Backup" }));
    const acknowledge = await screen.findByRole("button", {
      name: "I saved my backup",
    });
    expect(acknowledge).toHaveFocus();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(m.reset).not.toHaveBeenCalled();
    fireEvent.click(acknowledge);
    expect(screen.getByRole("textbox")).toBeVisible();
    expect(m.reset).not.toHaveBeenCalled();
  });
  it("browser confirmation can be cancelled without starting over", async () => {
    m.download.mockResolvedValueOnce({ status: "download-started" });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Download Backup" }));
    await screen.findByRole("button", { name: "I saved my backup" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(m.reset).not.toHaveBeenCalled();
  });
});
