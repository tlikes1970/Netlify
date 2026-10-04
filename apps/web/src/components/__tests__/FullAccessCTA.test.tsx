import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  android: true,
  paid: false,
  trial: true,
  purchase: vi.fn(),
}));
vi.mock("../../hooks/useEntitlements", () => ({
  useEntitlements: () => ({
    paidPro: m.paid,
    hasFullAccess: m.paid || m.trial,
    isReadOnlyMode: !m.paid && !m.trial,
  }),
}));
vi.mock("../../lib/proUpgrade", () => ({
  isAndroidBillingAvailable: () => m.android,
  startProUpgrade: m.purchase,
}));
import { UpgradeToProCTA } from "../UpgradeToProCTA";
import { changeLanguage, t } from "../../lib/language";
beforeEach(() => {
  m.android = true;
  m.paid = false;
  m.trial = true;
  m.purchase.mockReset().mockResolvedValue(undefined);
  changeLanguage("en");
});
afterEach(cleanup);
it.each(["en", "es"] as const)(
  "%s active-trial Android user can purchase early",
  (lang) => {
    changeLanguage(lang);
    render(<UpgradeToProCTA variant="button" />);
    fireEvent.click(screen.getByRole("button", { name: t("accessUnlock") }));
    expect(m.purchase).toHaveBeenCalledOnce();
  },
);
it("web has no pretend purchase control", () => {
  m.android = false;
  render(<UpgradeToProCTA variant="button" />);
  expect(screen.queryByRole("button")).toBeNull();
});
it("purchased user has no duplicate purchase CTA", () => {
  m.paid = true;
  render(<UpgradeToProCTA variant="button" />);
  expect(screen.queryByRole("button")).toBeNull();
});
it("expired Android user retains purchase action", () => {
  m.trial = false;
  render(<UpgradeToProCTA variant="button" />);
  expect(
    screen.getByRole("button", { name: "Unlock Full Access" }),
  ).toBeVisible();
});
