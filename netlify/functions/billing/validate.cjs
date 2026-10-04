const crypto = require("node:crypto");
const { validateOrigin } = require("../origin-validation.cjs");
const PACKAGE = "com.TravisL.tvtracker",
  PRODUCT = "flicklet_full_access",
  VERSION = 2;
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const ownershipId = (token) => hash(`${PACKAGE}:${PRODUCT}:${token}`);
const accountId = (uid) => hash(`flicklet:${uid}`);
const fault = (code, status = 400) =>
  Object.assign(new Error(code), { code, status });
function createPlayClient(env = process.env, fetcher = fetch) {
  let credential;
  try {
    credential = JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT || "null");
    if (!credential?.client_email || !credential?.private_key)
      throw new Error();
  } catch {
    throw fault("billing-not-configured", 503);
  }
  let cached;
  async function accessToken() {
    if (cached?.expires > Date.now()) return cached.token;
    const now = Math.floor(Date.now() / 1000),
      encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
    const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: credential.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
    const assertion = `${unsigned}.${crypto.sign("RSA-SHA256", Buffer.from(unsigned), credential.private_key).toString("base64url")}`;
    const response = await fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw fault("verification-unavailable", 503);
    const result = await response.json();
    if (!result.access_token) throw fault("verification-unavailable", 503);
    cached = { token: result.access_token, expires: Date.now() + 3000000 };
    return cached.token;
  }
  async function request(path, method = "GET") {
    const response = await fetcher(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(PACKAGE)}/${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${await accessToken()}`,
          "Content-Type": "application/json",
        },
        ...(method === "POST" ? { body: "{}" } : {}),
        signal: AbortSignal.timeout(20000),
      },
    );
    if (response.status === 404 || response.status === 410)
      throw fault("purchase-not-owned", 409);
    if (!response.ok)
      throw fault(
        method === "POST"
          ? "acknowledgement-failed"
          : "verification-unavailable",
        503,
      );
    return method === "POST" || response.status === 204 ? {} : response.json();
  }
  return {
    get: (token) =>
      request(`purchases/productsv2/tokens/${encodeURIComponent(token)}`),
    acknowledge: (token) =>
      request(
        `purchases/products/${PRODUCT}/tokens/${encodeURIComponent(token)}:acknowledge`,
        "POST",
      ),
  };
}
function inspectPurchase(purchase, uid) {
  const item = purchase.productLineItem?.find((v) => v.productId === PRODUCT);
  if (!item) throw fault("wrong-product");
  if (
    purchase.obfuscatedExternalAccountId &&
    purchase.obfuscatedExternalAccountId !== accountId(uid)
  )
    throw fault("purchase-account-mismatch", 409);
  const state = purchase.purchaseStateContext?.purchaseState;
  if (state === "PENDING") throw fault("purchase-pending", 409);
  if (state !== "PURCHASED") throw fault("purchase-not-owned", 409);
  const offer = item.productOfferDetails;
  if (
    !offer ||
    offer.consumptionState !== "CONSUMPTION_STATE_YET_TO_BE_CONSUMED" ||
    !Number.isInteger(offer.quantity) ||
    offer.quantity < 1 ||
    !Number.isInteger(offer.refundableQuantity) ||
    offer.refundableQuantity < 1 ||
    offer.rentOfferDetails
  )
    throw fault("purchase-not-owned", 409);
  if (
    ![
      "ACKNOWLEDGEMENT_STATE_PENDING",
      "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
    ].includes(purchase.acknowledgementState)
  )
    throw fault("verification-unavailable", 503);
  return purchase;
}
// Injectable boundaries are used by tests; the deployed handler uses only real Admin and Play.
function createHandler(getDependencies) {
  return async (event) => {
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Cache-Control": "no-store",
    };
    const reply = (statusCode, body) => ({
      statusCode,
      headers,
      body: JSON.stringify(body),
    });
    if (event.httpMethod === "OPTIONS") return reply(204, {});
    if (!validateOrigin(event).allowed)
      return reply(403, { error: "origin-rejected" });
    if (event.httpMethod !== "POST")
      return reply(405, { error: "method-not-allowed" });
    const bearer = (
      event.headers?.authorization ||
      event.headers?.Authorization ||
      ""
    ).match(/^Bearer (\S+)$/);
    if (!bearer) return reply(401, { error: "authentication-required" });
    try {
      const { admin, db, play } = await getDependencies();
      let identity;
      try {
        identity = await admin.auth().verifyIdToken(bearer[1], true);
      } catch {
        throw fault("invalid-identity", 401);
      }
      const uid = identity.uid;
      if (!uid) throw fault("invalid-identity", 401);
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        throw fault("invalid-request");
      }
      if (
        body.platform !== "android" ||
        body.productId !== PRODUCT ||
        (body.packageName && body.packageName !== PACKAGE)
      )
        throw fault("wrong-product");
      const billing = db.doc(`users/${uid}/billing/status`);
      let token = body.purchaseToken;
      if (body.reconcileAccount === true) {
        const current = await billing.get(),
          id = current.data()?.ownershipId;
        if (!id || current.data()?.verificationVersion !== VERSION)
          return reply(200, { isValid: false, noPurchase: true });
        const owned = await db.doc(`playPurchases/${id}`).get();
        if (owned.data()?.uid !== uid)
          throw fault("purchase-account-mismatch", 409);
        token = owned.data().purchaseToken;
      }
      if (typeof token !== "string" || !token.trim() || token.length > 4096)
        throw fault("invalid-purchase-token");
      const id = ownershipId(token),
        ownerRef = db.doc(`playPurchases/${id}`);
      const revoke = () =>
        db.runTransaction(async (tx) => {
          const owner = await tx.get(ownerRef),
            status = await tx.get(billing);
          if (owner.data()?.uid === uid && status.data()?.ownershipId === id) {
            tx.set(
              billing,
              {
                isPro: false,
                verified: false,
                validatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
            tx.set(
              ownerRef,
              {
                revoked: true,
                verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          }
        });
      let purchase;
      try {
        purchase = inspectPurchase(await play.get(token), uid);
      } catch (error) {
        if (error.code === "purchase-not-owned") await revoke();
        throw error;
      }
      // Real verification precedes account reservation. Interrupted acknowledgement retries cannot transfer ownership.
      await db.runTransaction(async (tx) => {
        const owner = await tx.get(ownerRef),
          previous = await tx.get(billing);
        if (owner.exists && owner.data().uid !== uid)
          throw fault("purchase-account-mismatch", 409);
        tx.set(
          ownerRef,
          {
            uid,
            productId: PRODUCT,
            packageName: PACKAGE,
            purchaseToken: token,
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            revoked: false,
            ...(previous.exists &&
            previous.data().verificationVersion !== VERSION
              ? { legacyBilling: previous.data() }
              : {}),
          },
          { merge: true },
        );
      });
      if (purchase.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING")
        await play.acknowledge(token);
      await db.runTransaction(async (tx) => {
        const owner = await tx.get(ownerRef);
        if (owner.data()?.uid !== uid)
          throw fault("purchase-account-mismatch", 409);
        tx.set(
          billing,
          {
            isPro: true,
            source: "android",
            purchaseType: "one_time",
            productId: PRODUCT,
            verified: true,
            verificationVersion: VERSION,
            ownershipId: id,
            purchaseToken: admin.firestore.FieldValue.delete(),
            validatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });
      return reply(200, {
        isValid: true,
        userId: uid,
        productId: PRODUCT,
        purchaseType: "one_time",
      });
    } catch (error) {
      return reply(error.status || 503, {
        isValid: false,
        error: error.code || "verification-unavailable",
      });
    }
  };
}
let dependencies;
exports.handler = createHandler(() => {
  if (!dependencies) {
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT)
        throw fault("billing-not-configured", 503);
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
        ),
      });
    }
    dependencies = { admin, db: admin.firestore(), play: createPlayClient() };
  }
  return dependencies;
});
Object.assign(exports, {
  createHandler,
  createPlayClient,
  inspectPurchase,
  ownershipId,
  accountId,
});
