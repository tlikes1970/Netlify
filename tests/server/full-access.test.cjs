const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  createHandler,
  createPlayClient,
  ownershipId,
  accountId,
} = require("../../netlify/functions/billing/validate.cjs");
const PRODUCT = "flicklet_full_access";
const purchased = () => ({
  productLineItem: [
    {
      productId: PRODUCT,
      productOfferDetails: {
        quantity: 1,
        refundableQuantity: 1,
        consumptionState: "CONSUMPTION_STATE_YET_TO_BE_CONSUMED",
      },
    },
  ],
  purchaseStateContext: { purchaseState: "PURCHASED" },
  acknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING",
});
let store, play, admin, handler, uid, identityError;
const deleted = Symbol("deleted");
beforeEach(() => {
  store = new Map();
  uid = "owner";
  identityError = false;
  const snapshot = (path) => ({
    exists: store.has(path),
    data: () => store.get(path),
  });
  const db = {
    doc: (path) => ({ path, get: async () => snapshot(path) }),
    runTransaction: async (work) => {
      const writes = [];
      const result = await work({
        get: async (ref) => snapshot(ref.path),
        set: (ref, data) => writes.push([ref.path, data]),
      });
      for (const [path, data] of writes) {
        const merged = { ...store.get(path), ...data };
        for (const key of Object.keys(merged))
          if (merged[key] === deleted) delete merged[key];
        store.set(path, merged);
      }
      return result;
    },
  };
  admin = {
    auth: () => ({
      verifyIdToken: async (token) => {
        assert.equal(token, "firebase-id-token");
        if (identityError) throw Error("invalid");
        return { uid };
      },
    }),
    firestore: {
      FieldValue: { serverTimestamp: () => 123, delete: () => deleted },
    },
  };
  play = { get: async () => purchased(), acknowledge: async () => {} };
  handler = createHandler(() => ({ admin, db, play }));
});
const event = (
  body = {},
  headers = { authorization: "Bearer firebase-id-token" },
) => ({
  httpMethod: "POST",
  headers: { origin: "https://flicklet.netlify.app", ...headers },
  body: JSON.stringify({
    platform: "android",
    productId: PRODUCT,
    purchaseToken: "real-token",
    ...body,
  }),
});
const invoke = async (body, headers) => {
  const r = await handler(event(body, headers));
  return { status: r.statusCode, ...JSON.parse(r.body) };
};
test("missing auth cannot reach entitlement writes", async () => {
  assert.equal((await invoke({}, { authorization: "" })).status, 401);
  assert.equal(store.size, 0);
});
test("invalid Firebase identity is rejected", async () => {
  identityError = true;
  assert.equal((await invoke()).status, 401);
});
test("verified identity owns grant; body UID ignored", async () => {
  assert.equal((await invoke({ userId: "victim" })).status, 200);
  assert.equal(store.has("users/victim/billing/status"), false);
  assert.equal(store.get("users/owner/billing/status").verified, true);
});
test("wrong package fails closed", async () => {
  assert.equal((await invoke({ packageName: "other.app" })).status, 400);
});
test("wrong configured product fails closed", async () => {
  assert.equal((await invoke({ productId: "other" })).status, 400);
});
test("wrong platform fails closed", async () => {
  assert.equal((await invoke({ platform: "ios" })).status, 400);
});
test("empty token rejected", async () => {
  assert.equal((await invoke({ purchaseToken: "" })).status, 400);
});
test("non-string token rejected", async () => {
  assert.equal((await invoke({ purchaseToken: 12 })).status, 400);
});
test("provider unavailable cannot grant", async () => {
  play.get = async () => {
    throw Error("secret provider diagnostic");
  };
  assert.equal((await invoke()).error, "verification-unavailable");
  assert.equal(store.size, 0);
});
test("provider token-not-found cannot grant", async () => {
  play.get = async () => {
    throw Object.assign(Error(), { code: "purchase-not-owned", status: 409 });
  };
  assert.equal((await invoke()).status, 409);
  assert.equal(store.size, 0);
});
test("pending cannot acknowledge or grant", async () => {
  play.get = async () => ({
    ...purchased(),
    purchaseStateContext: { purchaseState: "PENDING" },
  });
  play.acknowledge = async () => {
    assert.fail("pending acknowledged");
  };
  assert.equal((await invoke()).error, "purchase-pending");
  assert.equal(store.size, 0);
});
test("cancelled cannot grant", async () => {
  play.get = async () => ({
    ...purchased(),
    purchaseStateContext: { purchaseState: "CANCELLED" },
  });
  assert.equal((await invoke()).error, "purchase-not-owned");
});
test("unspecified purchase state cannot grant", async () => {
  play.get = async () => ({ ...purchased(), purchaseStateContext: {} });
  assert.equal((await invoke()).status, 409);
});
test("different product in Play response cannot grant", async () => {
  play.get = async () => ({
    ...purchased(),
    productLineItem: [{ productId: "other" }],
  });
  assert.equal((await invoke()).error, "wrong-product");
});
test("consumed non-consumable cannot grant", async () => {
  play.get = async () => {
    const p = purchased();
    p.productLineItem[0].productOfferDetails.consumptionState =
      "CONSUMPTION_STATE_CONSUMED";
    return p;
  };
  assert.equal((await invoke()).error, "purchase-not-owned");
});
test("fully refunded quantity revokes verified existing ownership", async () => {
  await invoke();
  play.get = async () => {
    const p = purchased();
    p.productLineItem[0].productOfferDetails.refundableQuantity = 0;
    return p;
  };
  assert.equal((await invoke()).status, 409);
  assert.equal(store.get("users/owner/billing/status").isPro, false);
});
test("cancelled existing ownership is revoked", async () => {
  await invoke();
  play.get = async () => ({
    ...purchased(),
    purchaseStateContext: { purchaseState: "CANCELLED" },
  });
  await invoke();
  assert.equal(store.get("users/owner/billing/status").verified, false);
});
test("unrelated invalid token never revokes other ownership", async () => {
  await invoke();
  play.get = async () => {
    throw Object.assign(Error(), { code: "purchase-not-owned", status: 409 });
  };
  await invoke({ purchaseToken: "other-token" });
  assert.equal(store.get("users/owner/billing/status").isPro, true);
});
test("same purchase and UID idempotently restores", async () => {
  await invoke();
  await invoke();
  assert.equal(store.size, 2);
  assert.equal(
    store.get("playPurchases/" + ownershipId("real-token")).uid,
    "owner",
  );
});
test("purchase cannot transfer to another UID", async () => {
  await invoke();
  uid = "other";
  assert.equal((await invoke()).error, "purchase-account-mismatch");
  assert.equal(store.has("users/other/billing/status"), false);
});
test('deletion marker rejects verification before Play or any grant', async () => {
  store.set('accountDeletions/owner',{expiresAt:{toMillis:()=>Date.now()+3900000}});
  let queried=false;play.get=async()=>{queried=true;return purchased();};
  assert.equal((await invoke()).error,'account-deletion-in-progress');
  assert.equal(queried,false);assert.equal(store.has('users/owner/billing/status'),false);
});
test('expired marker does not block a verified purchase',async()=>{
  store.set('accountDeletions/owner',{expiresAt:{toMillis:()=>0}});
  assert.equal((await invoke()).status,200);
});
test('marker created during Play verification blocks final ownership writes',async()=>{
  play.get=async()=>{store.set('accountDeletions/owner',{expiresAt:{toMillis:()=>Date.now()+3900000}});return purchased();};
  assert.equal((await invoke()).error,'account-deletion-in-progress');
  assert.equal(store.has('users/owner/billing/status'),false);assert.equal(store.has('playPurchases/'+ownershipId('real-token')),false);
});
test('deleted binding cannot regain access from an invalid token',async()=>{
  play.get=async()=>({purchaseStateContext:{purchaseState:'CANCELLED'},productLineItem:[{productId:PRODUCT}]});
  assert.equal((await invoke()).error,'purchase-not-owned');assert.equal(store.size,0);
});
test("fresh verified purchase can bind after prior account binding was deleted", async () => {
  play.get = async () => ({
    ...purchased(),
    obfuscatedExternalAccountId: accountId("other"),
  });
  assert.equal((await invoke()).status, 200);
  assert.equal(store.get("playPurchases/" + ownershipId("real-token")).uid, "owner");
});
test("matching obfuscated account verifies", async () => {
  play.get = async () => ({
    ...purchased(),
    obfuscatedExternalAccountId: accountId("owner"),
  });
  assert.equal((await invoke()).status, 200);
});
test("acknowledgement failure is recoverable and not clean success", async () => {
  play.acknowledge = async () => {
    throw Error("ack failure");
  };
  assert.equal((await invoke()).status, 503);
  assert.equal(store.has("users/owner/billing/status"), false);
  play.acknowledge = async () => {};
  assert.equal((await invoke()).status, 200);
});
test("acknowledged purchase is not acknowledged twice", async () => {
  play.get = async () => ({
    ...purchased(),
    acknowledgementState: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
  });
  play.acknowledge = async () => {
    assert.fail("duplicate acknowledgement");
  };
  assert.equal((await invoke()).status, 200);
});
test("new billing docs contain no raw token", async () => {
  await invoke();
  assert.equal(
    store.get("users/owner/billing/status").purchaseToken,
    undefined,
  );
  assert.equal(
    store.get("playPurchases/" + ownershipId("real-token")).purchaseToken,
    "real-token",
  );
});
test("legacy data is preserved privately when replaced by verified purchase", async () => {
  store.set("users/owner/billing/status", {
    isPro: true,
    purchaseToken: "legacy",
    source: "manual",
  });
  await invoke();
  assert.equal(
    store.get("playPurchases/" + ownershipId("real-token")).legacyBilling
      .source,
    "manual",
  );
  assert.equal(
    store.get("users/owner/billing/status").purchaseToken,
    undefined,
  );
});
test("account reconciliation reuses private ownership token", async () => {
  await invoke();
  assert.equal(
    (await invoke({ reconcileAccount: true, purchaseToken: undefined })).status,
    200,
  );
});
test("legacy paid flag does not manufacture reconciliation ownership", async () => {
  store.set("users/owner/billing/status", {
    isPro: true,
    purchaseType: "one_time",
  });
  const result = await invoke({
    reconcileAccount: true,
    purchaseToken: undefined,
  });
  assert.equal(result.noPurchase, true);
  assert.equal(result.isValid, false);
});
test("missing Play configuration fails closed", () => {
  assert.throws(() => createPlayClient({}), /billing-not-configured/);
});
test("invalid Play configuration fails closed", () => {
  assert.throws(
    () => createPlayClient({ GOOGLE_PLAY_SERVICE_ACCOUNT: "invalid" }),
    /billing-not-configured/,
  );
});
test("configuration failure cannot write entitlement", async () => {
  const h = createHandler(() => {
    throw Error("missing credentials");
  });
  const r = await h(event());
  assert.equal(r.statusCode, 503);
  assert.equal(store.size, 0);
});
test("provider failure preserves existing verified grant rather than falsely revoke", async () => {
  await invoke();
  play.get = async () => {
    throw Error("network");
  };
  await invoke();
  assert.equal(store.get("users/owner/billing/status").isPro, true);
});
const { generateKeyPairSync, verify } = require("node:crypto");
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const service = {
  client_email: "play@example.test",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
};
const env = { GOOGLE_PLAY_SERVICE_ACCOUNT: JSON.stringify(service) };
const response = (status, value) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => value,
});
test("production transport signs OAuth and requests configured package product API", async () => {
  const calls = [];
  const client = createPlayClient(env, async (url, options) => {
    calls.push([url, options]);
    if (url.includes("oauth2")) {
      const assertion = options.body.get("assertion"),
        parts = assertion.split(".");
      assert.equal(
        verify(
          "RSA-SHA256",
          Buffer.from(parts.slice(0, 2).join(".")),
          publicKey,
          Buffer.from(parts[2], "base64url"),
        ),
        true,
      );
      const claims = JSON.parse(Buffer.from(parts[1], "base64url"));
      assert.equal(
        claims.scope,
        "https://www.googleapis.com/auth/androidpublisher",
      );
      return response(200, { access_token: "oauth-access" });
    }
    return response(200, purchased());
  });
  await client.get("a/b");
  assert.equal(
    calls[1][0],
    "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.TravisL.tvtracker/purchases/productsv2/tokens/a%2Fb",
  );
  assert.equal(calls[1][1].headers.Authorization, "Bearer oauth-access");
});
test("production transport acknowledges non-consumable and never consumes", async () => {
  const calls = [];
  const client = createPlayClient(env, async (url) => {
    calls.push(url);
    return url.includes("oauth2")
      ? response(200, { access_token: "oauth" })
      : response(204);
  });
  await client.acknowledge("token");
  assert.match(calls[1], /flicklet_full_access\/tokens\/token:acknowledge$/);
  assert.equal(
    calls.some((url) => url.includes(":consume")),
    false,
  );
});
test("production transport reuses short-lived OAuth token", async () => {
  let oauth = 0;
  const client = createPlayClient(env, async (url) => {
    if (url.includes("oauth2")) {
      oauth++;
      return response(200, { access_token: "oauth" });
    }
    return response(200, purchased());
  });
  await client.get("token");
  await client.get("token");
  assert.equal(oauth, 1);
});
test("OAuth failure never calls Play", async () => {
  let calls = 0;
  const client = createPlayClient(env, async () => {
    calls++;
    return response(403);
  });
  await assert.rejects(client.get("token"), /verification-unavailable/);
  assert.equal(calls, 1);
});
test("Play not-found reports authoritative not-owned", async () => {
  const client = createPlayClient(env, async (url) =>
    url.includes("oauth2")
      ? response(200, { access_token: "oauth" })
      : response(404),
  );
  await assert.rejects(client.get("token"), /purchase-not-owned/);
});
test("Play permission failure reports unavailable, not revocation", async () => {
  const client = createPlayClient(env, async (url) =>
    url.includes("oauth2")
      ? response(200, { access_token: "oauth" })
      : response(403),
  );
  await assert.rejects(client.get("token"), /verification-unavailable/);
});
test("Play acknowledgement API failure is surfaced", async () => {
  const client = createPlayClient(env, async (url) =>
    url.includes("oauth2")
      ? response(200, { access_token: "oauth" })
      : response(500),
  );
  await assert.rejects(client.acknowledge("token"), /acknowledgement-failed/);
});

test("Play acknowledgement accepts HTTP 200 with an empty body", async () => {
  const client = createPlayClient(env, async (url) =>
    url.includes("oauth2")
      ? response(200, { access_token: "oauth" })
      : {
          ok: true,
          status: 200,
          json: async () => {
            throw Error("empty body");
          },
        },
  );
  assert.deepEqual(await client.acknowledge("token"), {});
});
