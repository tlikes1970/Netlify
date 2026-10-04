import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { auth } from "@/lib/firebaseBootstrap";
import { changeLanguage, t } from "@/lib/language";
import { startProUpgrade, restoreFullAccess } from "@/lib/proUpgrade";
vi.mock("@/lib/firebaseBootstrap", () => ({
  auth: { currentUser: null as unknown },
}));
vi.mock("@/lib/apiConfig", () => ({ apiUrl: (path: string) => path }));
vi.mock("@/lib/proStatus", () => ({ clearBillingCache: vi.fn() }));
let initialize: ReturnType<typeof vi.fn>,
  getProducts: ReturnType<typeof vi.fn>,
  purchase: ReturnType<typeof vi.fn>,
  restore: ReturnType<typeof vi.fn>;
const token = vi.fn();
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  (auth as any).currentUser = {
    uid: "owner",
    getIdToken: token.mockResolvedValue("firebase-id"),
  };
  initialize = vi.fn().mockResolvedValue({});
  getProducts = vi
    .fn()
    .mockResolvedValue({
      products: [{ productId: "flicklet_full_access", price: "12,99 €" }],
    });
  purchase = vi
    .fn()
    .mockResolvedValue({
      productId: "flicklet_full_access",
      purchaseToken: "token",
      purchaseState: 1,
    });
  restore = vi.fn().mockResolvedValue({ purchases: [] });
  (window as any).Capacitor = {
    getPlatform: () => "android",
    Plugins: {
      Billing: { initialize, getProducts, purchase, restorePurchases: restore },
    },
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ isValid: true, userId: "owner" }),
      }),
  );
});
afterEach(() => {
  delete (window as any).Capacitor;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it.each(["en", "es"] as const)(
  "%s verified purchase uses identity header and localized success",
  async (lang) => {
    changeLanguage(lang);
    const listener = vi.fn();
    window.addEventListener("pro-upgrade-success", listener);
    await startProUpgrade();
    window.removeEventListener("pro-upgrade-success", listener);
    expect(purchase).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "flicklet_full_access",
        productType: "inapp",
        obfuscatedAccountId: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    const options = (fetch as any).mock.calls[0][1];
    expect(options.headers.Authorization).toBe("Bearer firebase-id");
    expect(JSON.parse(options.body)).toEqual({
      platform: "android",
      productId: "flicklet_full_access",
      purchaseToken: "token",
    });
    expect(listener.mock.calls[0][0].detail.message).toBe(t("purchaseSuccess"));
  },
);
it.each(["en", "es"] as const)(
  "%s cancellation is not success",
  async (lang) => {
    changeLanguage(lang);
    purchase.mockRejectedValueOnce(
      Object.assign(Error("User canceled purchase"), { code: "USER_CANCELED" }),
    );
    await expect(startProUpgrade()).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  },
);
it("pending never validates token", async () => {
  purchase.mockResolvedValueOnce({
    purchaseState: 2,
    purchaseToken: "pending",
  });
  await expect(startProUpgrade()).rejects.toMatchObject({
    code: "purchase-pending",
  });
  expect(fetch).not.toHaveBeenCalled();
});
it("uncompleted token is not success", async () => {
  purchase.mockResolvedValueOnce({ purchaseState: 0, purchaseToken: "token" });
  await expect(startProUpgrade()).rejects.toMatchObject({
    code: "purchase-not-owned",
  });
});
it("wrong product cannot validate", async () => {
  purchase.mockResolvedValueOnce({
    purchaseState: 1,
    productId: "other",
    purchaseToken: "token",
  });
  await expect(startProUpgrade()).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
it("plugin failure cannot validate", async () => {
  initialize.mockRejectedValueOnce(Error("plugin failed"));
  await expect(startProUpgrade()).rejects.toThrow("plugin failed");
  expect(fetch).not.toHaveBeenCalled();
});
it("validation failure remains failure", async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "acknowledgement-failed" }),
  } as Response);
  await expect(startProUpgrade()).rejects.toMatchObject({
    code: "acknowledgement-failed",
  });
});
it("account change during purchase cannot send validation", async () => {
  purchase.mockImplementationOnce(async () => {
    (auth as any).currentUser = { uid: "other" };
    return {
      purchaseState: 1,
      productId: "flicklet_full_access",
      purchaseToken: "token",
    };
  });
  await expect(startProUpgrade()).rejects.toMatchObject({
    code: "account-changed",
  });
  expect(fetch).not.toHaveBeenCalled();
});
it("account change during ID token refresh cannot send validation", async () => {
  token.mockImplementationOnce(async () => {
    (auth as any).currentUser = { uid: "other" };
    return "id";
  });
  await expect(startProUpgrade()).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
it("account change during validation cannot announce success", async () => {
  vi.mocked(fetch).mockImplementationOnce(async () => {
    (auth as any).currentUser = { uid: "other" };
    return {
      ok: true,
      json: async () => ({ isValid: true, userId: "owner" }),
    } as Response;
  });
  await expect(startProUpgrade()).rejects.toMatchObject({
    code: "account-changed",
  });
});
it("Restore queries owned product and uses same validation", async () => {
  restore.mockResolvedValueOnce({
    purchases: [
      {
        productId: "flicklet_full_access",
        purchaseState: 1,
        purchaseToken: "owned",
      },
    ],
  });
  await restoreFullAccess();
  expect(JSON.parse((fetch as any).mock.calls[0][1].body).purchaseToken).toBe(
    "owned",
  );
});
it("Restore account mismatch never reports success", async () => {
  restore.mockResolvedValueOnce({
    purchases: [
      {
        productId: "flicklet_full_access",
        purchaseState: 1,
        purchaseToken: "owned",
      },
    ],
  });
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "purchase-account-mismatch" }),
  } as Response);
  await expect(restoreFullAccess()).rejects.toMatchObject({
    code: "purchase-account-mismatch",
  });
});
it("Restore no ownership communicates no purchase", async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ isValid: false, noPurchase: true }),
  } as Response);
  await expect(restoreFullAccess()).rejects.toMatchObject({
    code: "restore-empty",
  });
});
it("startup no purchase is silent", async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ isValid: false, noPurchase: true }),
  } as Response);
  await expect(restoreFullAccess(false)).resolves.toBeUndefined();
});
it("Restore pending does not validate its token", async () => {
  restore.mockResolvedValueOnce({
    purchases: [
      {
        productId: "flicklet_full_access",
        purchaseState: 2,
        purchaseToken: "pending",
      },
    ],
  });
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ isValid: false, noPurchase: true }),
  } as Response);
  await expect(restoreFullAccess()).rejects.toMatchObject({
    code: "purchase-pending",
  });
  expect(JSON.parse((fetch as any).mock.calls[0][1].body)).not.toHaveProperty(
    "purchaseToken",
  );
});
it("already-owned purchase invokes recovery", async () => {
  purchase.mockRejectedValueOnce(
    Object.assign(Error(), { code: "ITEM_ALREADY_OWNED" }),
  );
  restore.mockResolvedValueOnce({
    purchases: [
      {
        productId: "flicklet_full_access",
        purchaseState: 1,
        purchaseToken: "owned",
      },
    ],
  });
  await startProUpgrade();
  expect(restore).toHaveBeenCalledOnce();
});
it("repeated Restore is safe", async () => {
  await restoreFullAccess();
  await restoreFullAccess();
  expect(restore).toHaveBeenCalledTimes(2);
});
it("web never opens checkout or queries Play Restore", async () => {
  (window as any).Capacitor = { getPlatform: () => "web" };
  await startProUpgrade();
  await expect(restoreFullAccess()).rejects.toMatchObject({
    code: "purchase-android-only",
  });
  expect(purchase).not.toHaveBeenCalled();
  expect(restore).not.toHaveBeenCalled();
});
it("signed out Android asks for authentication before purchase", async () => {
  (auth as any).currentUser = null;
  const listener = vi.fn();
  window.addEventListener("auth:sign-in-required", listener);
  await startProUpgrade();
  window.removeEventListener("auth:sign-in-required", listener);
  expect(listener).toHaveBeenCalledOnce();
  expect(purchase).not.toHaveBeenCalled();
});
