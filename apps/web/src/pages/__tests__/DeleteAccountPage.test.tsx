import { beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const m = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  language: "en" as "en" | "es",
  pending: null as { uid: string; confirmed: boolean } | null,
  finish: vi.fn(),
}));
vi.mock("../../hooks/useAuth", () => ({ useAuth: () => ({ user: m.user }) }));
vi.mock("../../lib/language", () => ({
  useLanguage: () => m.language,
  changeLanguage: vi.fn(),
}));
vi.mock("../../lib/accountDeletionState", () => ({
  pendingAccountDeletion: () => m.pending,
}));
vi.mock("../../lib/accountDeletion", () => ({
  finishDeletedAccountLocally: m.finish,
}));
vi.mock("../../components/DeleteAccountControl", () => ({
  default: () => <button>Shared deletion control</button>,
}));
vi.mock("../../components/AuthModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog">Sign in</div> : null,
}));
import Page from "../DeleteAccountPage";
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  m.user = null;
  m.pending = null;
  m.language = "en";
  m.finish.mockResolvedValue(undefined);
});
it("public route explains permanent deletion and sign-in without opening automatically", () => {
  render(<Page />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Flicklet — Delete account",
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Sign in to delete your account" }),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(m.finish).not.toHaveBeenCalled();
});
it("signed-in public route reuses in-app deletion control", () => {
  m.user = { uid: "owner" };
  render(<Page />);
  expect(
    screen.getByRole("button", { name: "Shared deletion control" }),
  ).toBeVisible();
});
it("confirmed cleanup works even after Auth is gone", async () => {
  m.pending = { uid: "owner", confirmed: true };
  render(<Page />);
  fireEvent.click(
    screen.getByRole("button", { name: "Finish device cleanup" }),
  );
  await waitFor(() => expect(m.finish).toHaveBeenCalledWith("owner"));
  expect(
    screen.queryByRole("button", { name: "Shared deletion control" }),
  ).toBeNull();
});
it("ambiguous outcome offers explicitly device-only cleanup without claiming cloud success", () => {
  m.pending = { uid: "owner", confirmed: false };
  render(<Page />);
  expect(
    screen.getByText(/This does not confirm cloud account deletion/),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Clear this device only and sign out" }),
  ).toBeVisible();
});
it("failed cleanup remains visible and retryable", async () => {
  m.pending = { uid: "owner", confirmed: true };
  m.finish.mockRejectedValue(Error("device"));
  render(<Page />);
  fireEvent.click(
    screen.getByRole("button", { name: "Finish device cleanup" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Device cleanup still needs to finish",
  );
  expect(
    screen.getByRole("button", { name: "Finish device cleanup" }),
  ).toBeEnabled();
});
it("Spanish public route retains canonical privacy destination", () => {
  m.language = "es";
  render(<Page />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Eliminar cuenta",
  );
  expect(
    screen.getByRole("link", { name: "Política de privacidad" }),
  ).toHaveAttribute("href", "https://flicklet.netlify.app/privacy.html");
});
