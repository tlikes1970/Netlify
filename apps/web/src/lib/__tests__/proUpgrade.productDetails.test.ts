import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebaseBootstrap", () => ({
  auth: { currentUser: null },
}));

vi.mock("@/lib/apiConfig", () => ({
  apiUrl: (path: string) => path,
}));

vi.mock("@/lib/proStatus", () => ({
  clearBillingCache: vi.fn(),
}));

import {
  getFullAccessProductDetails,
  isAndroidBillingAvailable,
} from "@/lib/proUpgrade";

describe("Full Access Play product details", () => {
  afterEach(() => {
    delete (window as typeof window & { Capacitor?: unknown }).Capacitor;
  });

  it("returns the localized price from the configured Play INAPP product", async () => {
    const initialize = vi.fn().mockResolvedValue({ ready: true });
    const getProducts = vi.fn().mockResolvedValue({
      products: [
        {
          productId: "flicklet_full_access",
          price: "CA$12.99",
          currency: "CAD",
          title: "Full Access",
        },
      ],
    });
    (window as typeof window & { Capacitor?: unknown }).Capacitor = {
      getPlatform: () => "android",
      Plugins: { Billing: { initialize, getProducts } },
    };

    expect(isAndroidBillingAvailable()).toBe(true);
    await expect(getFullAccessProductDetails()).resolves.toMatchObject({
      productId: "flicklet_full_access",
      price: "CA$12.99",
      currency: "CAD",
    });
    expect(getProducts).toHaveBeenCalledWith({
      productIds: ["flicklet_full_access"],
      productType: "inapp",
    });
  });

  it("does not fabricate a product outside Android Billing", async () => {
    (window as typeof window & { Capacitor?: unknown }).Capacitor = {
      getPlatform: () => "web",
      Plugins: {},
    };

    expect(isAndroidBillingAvailable()).toBe(false);
    await expect(getFullAccessProductDetails()).resolves.toBeNull();
  });
});
