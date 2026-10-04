import { purchaseErrorKey } from "./accountErrors";
import { t } from "./language";
import { auth } from "./firebaseBootstrap";
import { apiUrl } from "./apiConfig";
import { clearBillingCache } from "./proStatus";
import {
  FULL_ACCESS_PRODUCT_ID,
  FULL_ACCESS_PRODUCT_TYPE,
} from "./billingProducts";
import type { User } from "firebase/auth";
function getCapacitor(): any {
  return typeof window === "undefined" ? null : (window as any).Capacitor;
}
export interface FullAccessProductDetails {
  productId: string;
  price: string;
  title?: string;
  description?: string;
  currency?: string;
}
export function isAndroidBillingAvailable(): boolean {
  const cap = getCapacitor();
  return cap?.getPlatform?.() === "android" && Boolean(cap?.Plugins?.Billing);
}
const error = (code: string) => Object.assign(new Error(code), { code });
let initialization: Promise<unknown> | null = null;
let initializedPlugin: any;
async function billingPlugin(): Promise<any> {
  if (!isAndroidBillingAvailable()) throw error("billing-unavailable");
  const plugin = getCapacitor().Plugins.Billing;
  if (initializedPlugin !== plugin) {
    initializedPlugin = plugin;
    initialization = null;
  }
  if (!initialization)
    initialization = plugin.initialize().catch((cause: unknown) => {
      initialization = null;
      throw cause;
    });
  await initialization;
  return plugin;
}
export async function getFullAccessProductDetails(): Promise<FullAccessProductDetails | null> {
  if (!isAndroidBillingAvailable()) return null;
  const plugin = await billingPlugin();
  const result = await plugin.getProducts({
    productIds: [FULL_ACCESS_PRODUCT_ID],
    productType: FULL_ACCESS_PRODUCT_TYPE,
  });
  return (
    result.products?.find(
      (p: FullAccessProductDetails) =>
        p.productId === FULL_ACCESS_PRODUCT_ID && p.price,
    ) ?? null
  );
}
function sameAccount(user: User): void {
  if (auth.currentUser?.uid !== user.uid) throw error("account-changed");
}
async function obfuscatedAccount(uid: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`flicklet:${uid}`),
  );
  return Array.from(new Uint8Array(digest), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
}
function report(cause: unknown): void {
  const key = purchaseErrorKey(cause);
  window.dispatchEvent(
    new CustomEvent("pro-upgrade-error", {
      detail: { message: t(key), messageKey: key },
    }),
  );
}
async function validate(
  user: User,
  purchaseToken?: string,
  announce = true,
): Promise<boolean> {
  sameAccount(user);
  const idToken = await user.getIdToken(true);
  sameAccount(user);
  const response = await fetch(apiUrl("/api/billing/validate"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      platform: "android",
      productId: FULL_ACCESS_PRODUCT_ID,
      ...(purchaseToken ? { purchaseToken } : { reconcileAccount: true }),
    }),
  });
  sameAccount(user);
  const result = await response.json();
  if (!response.ok) throw error(result.error || "verification-unavailable");
  if (!result.isValid) {
    if (result.noPurchase) return false;
    throw error("verification-unavailable");
  }
  if (result.userId !== user.uid) throw error("account-changed");
  clearBillingCache();
  window.dispatchEvent(
    announce
      ? new CustomEvent("pro-upgrade-success", {
          detail: {
            message: t("purchaseSuccess"),
            messageKey: "purchaseSuccess",
            productId: FULL_ACCESS_PRODUCT_ID,
          },
        })
      : new Event("billing:changed"),
  );
  return true;
}
let operation: { uid: string; promise: Promise<void> } | null = null;
function run(
  user: User,
  work: () => Promise<void>,
  quiet = false,
): Promise<void> {
  if (operation) {
    if (operation.uid === user.uid) return operation.promise;
    return Promise.reject(error("account-changed"));
  }
  const promise = work()
    .catch((cause) => {
      if (!quiet || cause?.code === "purchase-account-mismatch") report(cause);
      throw cause;
    })
    .finally(() => {
      if (operation?.promise === promise) operation = null;
    });
  operation = { uid: user.uid, promise };
  return promise;
}
interface OwnedPurchase {
  productId: string;
  purchaseToken?: string;
  purchaseState: number;
}
async function recover(user: User, explicit: boolean): Promise<void> {
  const plugin = await billingPlugin();
  sameAccount(user);
  const result = await plugin.restorePurchases();
  sameAccount(user);
  const owned: OwnedPurchase[] =
    result.purchases?.filter(
      (p: OwnedPurchase) => p.productId === FULL_ACCESS_PRODUCT_ID,
    ) ?? [];
  let restored = false,
    pending = false;
  for (const p of owned) {
    if (p.purchaseState === 2) {
      pending = true;
      continue;
    }
    if (p.purchaseState !== 1 || !p.purchaseToken)
      throw error("purchase-not-owned");
    restored = (await validate(user, p.purchaseToken, explicit)) || restored;
  }
  // Absence in this device's Play account is not revocation. Recheck known server ownership.
  if (!restored) restored = await validate(user, undefined, explicit);
  if (!restored && pending) throw error("purchase-pending");
  if (!restored && explicit) throw error("restore-empty");
}
export async function restoreFullAccess(explicit = true): Promise<void> {
  if (!isAndroidBillingAvailable()) throw error("purchase-android-only");
  const user = auth.currentUser;
  if (!user) {
    window.dispatchEvent(new CustomEvent("auth:sign-in-required"));
    return;
  }
  return run(user, () => recover(user, explicit), !explicit);
}
export async function startProUpgrade(): Promise<void> {
  if (!isAndroidBillingAvailable()) return;
  const user = auth.currentUser;
  if (!user) {
    window.dispatchEvent(new CustomEvent("auth:sign-in-required"));
    return;
  }
  return run(user, async () => {
    const plugin = await billingPlugin();
    sameAccount(user);
    const product = await getFullAccessProductDetails();
    sameAccount(user);
    if (!product) throw error("product-unavailable");
    const account = await obfuscatedAccount(user.uid);
    sameAccount(user);
    let result: OwnedPurchase;
    try {
      result = await plugin.purchase({
        productId: FULL_ACCESS_PRODUCT_ID,
        productType: FULL_ACCESS_PRODUCT_TYPE,
        obfuscatedAccountId: account,
      });
    } catch (cause) {
      if ((cause as { code?: string }).code === "ITEM_ALREADY_OWNED") {
        await recover(user, true);
        return;
      }
      throw cause;
    }
    sameAccount(user);
    if (result.purchaseState === 2) throw error("purchase-pending");
    if (
      result.purchaseState !== 1 ||
      result.productId !== FULL_ACCESS_PRODUCT_ID ||
      !result.purchaseToken
    )
      throw error("purchase-not-owned");
    await validate(user, result.purchaseToken);
  });
}
