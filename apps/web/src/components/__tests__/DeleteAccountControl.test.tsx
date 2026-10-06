import { beforeEach, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
  cleanup,
} from "@testing-library/react";
const m = vi.hoisted(() => ({
  user: { uid: "owner" } as { uid: string } | null,
  language: "en" as "en" | "es",
  delete: vi.fn(),
  reauth: vi.fn(),
  pending: null as { confirmed: boolean } | null,
}));
vi.mock("../../hooks/useAuth", () => ({ useAuth: () => ({ user: m.user }) }));
vi.mock("../../lib/language", () => ({ useLanguage: () => m.language }));
vi.mock("../../lib/accountDeletion", () => ({
  deleteCurrentAccount: m.delete,
}));
vi.mock("../../lib/accountReauthentication", () => ({
  reauthenticateForDeletion: m.reauth,
}));
vi.mock("../../lib/accountDeletionState", () => ({
  pendingAccountDeletion: () => m.pending,
}));
vi.mock("../../lib/firebaseBootstrap", () => ({
  auth: { currentUser: { providerData: [{ providerId: "password" }] } },
}));
vi.mock("../../hooks/useAndroidBackDismiss", () => ({
  useAndroidBackDismiss: vi.fn(),
}));
import Control from "../DeleteAccountControl";
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  m.user = { uid: "owner" };
  m.language = "en";
  m.pending = null;
  m.delete.mockResolvedValue(undefined);
  m.reauth.mockResolvedValue(undefined);
});
const open = () => {
  render(<Control />);
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
  return within(screen.getByRole("dialog"));
};
it("signed-in account gets distinct permanent deletion control", () => {
  render(<Control />);
  expect(screen.getByRole("button", { name: "Delete account" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Start Over" })).toBeNull();
  expect(m.delete).not.toHaveBeenCalled();
});
it("signed-out account has no destructive control", () => {
  m.user = null;
  render(<Control />);
  expect(screen.queryByRole("button")).toBeNull();
});
it("explicit exact DELETE is required", () => {
  const dialog = open();
  const button = dialog.getByRole("button", { name: "Delete account" });
  expect(button).toBeDisabled();
  fireEvent.change(dialog.getByRole("textbox"), {
    target: { value: "delete" },
  });
  expect(button).toBeDisabled();
  fireEvent.change(dialog.getByRole("textbox"), {
    target: { value: "DELETE" },
  });
  expect(button).toBeEnabled();
});
it("Cancel and Escape never invoke deletion and restore focus", () => {
  const dialog = open();
  fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(m.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("recent-auth rejection offers password verification and retries same flow", async () => {
  m.delete.mockRejectedValueOnce({ code: "functions/failed-precondition" });
  const dialog = open();
  fireEvent.change(dialog.getByRole("textbox"), {
    target: { value: "DELETE" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
  await screen.findByLabelText("Password");
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "temporary" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Verify identity and delete" }),
  );
  await waitFor(() => expect(m.delete).toHaveBeenCalledTimes(2));
  expect(m.reauth).toHaveBeenCalledWith("temporary");
  expect(screen.getByLabelText("Password")).toHaveValue("");
});
it("verification cancellation does not retry deletion", async () => {
  m.delete.mockRejectedValueOnce({ code: "functions/failed-precondition" });
  m.reauth.mockRejectedValue(Error("cancel"));
  const dialog = open();
  fireEvent.change(dialog.getByRole("textbox"), {
    target: { value: "DELETE" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
  await screen.findByLabelText("Password");
  fireEvent.click(
    screen.getByRole("button", { name: "Verify identity and delete" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Identity verification did not finish",
    ),
  );
  expect(m.delete).toHaveBeenCalledOnce();
});
it("server/network failure gives honest recovery rather than success", async () => {
  m.delete.mockRejectedValue(Error("offline"));
  const dialog = open();
  fireEvent.change(dialog.getByRole("textbox"), {
    target: { value: "DELETE" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Deletion could not be confirmed",
    ),
  );
  expect(screen.getByRole("link", { name: "Delete account" })).toHaveAttribute(
    "href",
    "/delete-account",
  );
});
it("EN to ES live switching preserves deliberate confirmation", () => {
  const view = render(<Control />);
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "DELETE" },
  });
  m.language = "es";
  view.rerender(<Control />);
  expect(screen.getByRole("dialog", { name: "Eliminar cuenta" })).toBeVisible();
  expect(screen.getByRole("textbox")).toHaveValue("DELETE");
  expect(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Eliminar cuenta",
    }),
  ).toBeEnabled();
});
