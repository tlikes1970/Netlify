const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const project = "demo-flicklet31",
  host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host)
  throw Error("Run this test with the Firestore emulator, never production");
const jwt = (uid) => {
  const e = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  return `${e({ alg: "none", typ: "JWT" })}.${e({ aud: project, iss: `https://securetoken.google.com/${project}`, sub: uid, user_id: uid, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, firebase: { sign_in_provider: "custom" } })}.`;
};
const rules = fs.readFileSync("firestore.rules", "utf8");
const apply = async (content) => {
  const r = await fetch(
    `http://${host}/emulator/v1/projects/${project}:securityRules`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rules: { files: [{ name: "firestore.rules", content }] },
      }),
    },
  );
  assert.equal(r.status, 200, await r.text());
};
const request = (path, uid, method = "GET", body) =>
  fetch(
    `http://${host}/v1/projects/${project}/databases/(default)/documents/${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(uid ? { Authorization: `Bearer ${jwt(uid)}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
const trial = (ms) => ({
  fields: {
    trialStartMs: { integerValue: String(ms) },
    version: { integerValue: "2" },
  },
});
test("original duration arithmetic denies valid creation; millisecond fix permits it", async () => {
  await apply(
    rules.replace(
      "request.time.toMillis() + 300000",
      "request.time.toMillis() + duration.value(5, 'm')",
    ),
  );
  const denied = await request(
    "users/baseline/entitlements/trial",
    "baseline",
    "PATCH",
    trial(Date.now()),
  );
  assert.equal(denied.status, 403, await denied.text());
  await apply(rules);
  const allowed = await request(
    "users/owner/entitlements/trial",
    "owner",
    "PATCH",
    trial(Date.now()),
  );
  assert.equal(allowed.status, 200, await allowed.text());
});
test("account can read its established trial", async () => {
  assert.equal(
    (await request("users/owner/entitlements/trial", "owner")).status,
    200,
  );
});
test("account cannot restart trial", async () => {
  assert.equal(
    (
      await request(
        "users/owner/entitlements/trial",
        "owner",
        "PATCH",
        trial(Date.now()),
      )
    ).status,
    403,
  );
});
test("account cannot delete trial", async () => {
  assert.equal(
    (await request("users/owner/entitlements/trial", "owner", "DELETE")).status,
    403,
  );
});
test("other account cannot read trial", async () => {
  assert.equal(
    (await request("users/owner/entitlements/trial", "other")).status,
    403,
  );
});
test("future trial beyond five minutes rejected", async () => {
  assert.equal(
    (
      await request(
        "users/future/entitlements/trial",
        "future",
        "PATCH",
        trial(Date.now() + 600000),
      )
    ).status,
    403,
  );
});
test("anonymous cannot create account trial", async () => {
  assert.equal(
    (
      await request(
        "users/anonymous/entitlements/trial",
        null,
        "PATCH",
        trial(Date.now()),
      )
    ).status,
    403,
  );
});
test("ordinary account cannot directly grant paid billing", async () => {
  assert.equal(
    (
      await request("users/owner/billing/status", "owner", "PATCH", {
        fields: {
          isPro: { booleanValue: true },
          verified: { booleanValue: true },
        },
      })
    ).status,
    403,
  );
});
test("private purchase ledger cannot be read by client", async () => {
  assert.equal((await request("playPurchases/tokenhash", "owner")).status, 403);
});
test("private purchase ledger cannot be written by client", async () => {
  assert.equal(
    (
      await request("playPurchases/tokenhash", "owner", "PATCH", {
        fields: { uid: { stringValue: "owner" } },
      })
    ).status,
    403,
  );
});
