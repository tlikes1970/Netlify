import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  call: vi.fn(),
  clear: vi.fn(),
  auth: { currentUser: { uid: "owner" } },
}));
vi.mock("firebase/functions", () => ({ httpsCallable: () => m.call }));
vi.mock("../../lib/firebaseBootstrap", () => ({ auth: m.auth, functions: {} }));
vi.mock("../../lib/proStatus", () => ({ clearBillingCache: m.clear }));
import AdminFullAccess from "../admin/AdminFullAccess";
import { languageManager } from "../../lib/language";
beforeEach(() => {
  languageManager.setLanguage("en");
  m.call
    .mockReset()
    .mockResolvedValue({
      data: { userId: "recipient", email: "person@example.com", granted: true },
    });
  m.clear.mockReset();
});
afterEach(() => {
  cleanup();
  languageManager.setLanguage("en");
});
it("grants by email and displays confirmed recipient", async () => {
  render(<AdminFullAccess />);
  fireEvent.change(screen.getByLabelText("Account email or account ID"), {
    target: { value: "person@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Grant Full Access" }));
  await screen.findByText("Full Access granted to person@example.com.");
  expect(m.call).toHaveBeenCalledWith({
    target: "person@example.com",
    isPro: true,
  });
  expect(m.clear).not.toHaveBeenCalled();
});
it("self shortcut and revocation use the account ID and refresh current access", async () => {
  m.call.mockResolvedValue({
    data: { userId: "owner", email: "", granted: false },
  });
  render(<AdminFullAccess />);
  fireEvent.click(screen.getByRole("button", { name: "Use my account" }));
  expect(screen.getByLabelText("Account email or account ID")).toHaveValue(
    "owner",
  );
  fireEvent.click(screen.getByRole("button", { name: "Revoke grant" }));
  await screen.findByText("Full Access grant revoked for owner.");
  expect(m.call).toHaveBeenCalledWith({ target: "owner", isPro: false });
  expect(m.clear).toHaveBeenCalledTimes(1);
});
it("failure gives retry feedback without claiming a grant", async () => {
  m.call.mockRejectedValue(new Error("denied"));
  render(<AdminFullAccess />);
  fireEvent.click(screen.getByRole("button", { name: "Use my account" }));
  fireEvent.click(screen.getByRole("button", { name: "Grant Full Access" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("status")).toHaveTextContent("");
  expect(m.clear).not.toHaveBeenCalled();
});
it("Spanish switches live without losing entered account", () => {
  render(<AdminFullAccess />);
  fireEvent.change(screen.getByLabelText("Account email or account ID"), {
    target: { value: "person@example.com" },
  });
  act(() => languageManager.setLanguage("es"));
  expect(screen.getByLabelText("Correo o ID de la cuenta")).toHaveValue(
    "person@example.com",
  );
  expect(
    screen.getByRole("button", { name: "Conceder Acceso completo" }),
  ).toBeInTheDocument();
});
it("empty account disables grant and revoke", () => {
  render(<AdminFullAccess />);
  expect(
    screen.getByRole("button", { name: "Grant Full Access" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Revoke grant" })).toBeDisabled();
});
