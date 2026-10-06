const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const project = "demo-flicklet31",
  host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host) throw Error("Firestore emulator required; never production");
const jwt = (uid, admin = false) => {
  const encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ aud: project, iss: `https://securetoken.google.com/${project}`, sub: uid, user_id: uid, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, role: admin ? "admin" : "user", firebase: { sign_in_provider: "custom" } })}.`;
};
const request = (path, identity, method = "GET", fields) =>
  fetch(
    `http://${host}/v1/projects/${project}/databases/(default)/documents/${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          identity === "server"
            ? "Bearer owner"
            : `Bearer ${jwt(identity, identity === "deleted-admin" || identity === "other-admin")}`,
      },
      ...(fields ? { body: JSON.stringify({ fields }) } : {}),
    },
  );
before(async () => {
  const response = await fetch(
    `http://${host}/emulator/v1/projects/${project}:securityRules`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rules: {
          files: [
            {
              name: "firestore.rules",
              content: fs.readFileSync("firestore.rules", "utf8"),
            },
          ],
        },
      }),
    },
  );
  assert.equal(response.status, 200, await response.text());
  for (const uid of ["deleted", "deleted-admin"])
    assert.equal(
      (
        await request(`accountDeletions/${uid}`, "server", "PATCH", {
          expiresAt: {
            timestampValue: new Date(Date.now() + 65 * 60000).toISOString(),
          },
        })
      ).status,
      200,
    );
  assert.equal(
    (
      await request("accountDeletions/expired", "server", "PATCH", {
        expiresAt: {
          timestampValue: new Date(Date.now() - 1000).toISOString(),
        },
      })
    ).status,
    200,
  );
});
for (const path of [
  "users/deleted",
  "users/deleted/settings/main",
  "users/deleted/tabState/watching",
  "users/deleted/episodeProgress/1",
  "users/deleted/notificationSettings/main",
])
  test(`old deleted UID cannot recreate ${path}`, async () => {
    assert.equal(
      (
        await request(path, "deleted", "PATCH", {
          value: { stringValue: "stale" },
        })
      ).status,
      403,
    );
  });
test("old administrator token cannot write shared data", async () => {
  assert.equal(
    (
      await request("insights/1", "deleted-admin", "PATCH", {
        value: { stringValue: "stale" },
      })
    ).status,
    403,
  );
});
test("another admin cannot delete or overwrite security marker", async () => {
  assert.equal(
    (await request("accountDeletions/deleted", "other-admin", "DELETE")).status,
    403,
  );
  assert.equal(
    (
      await request("accountDeletions/deleted", "other-admin", "PATCH", {
        expiresAt: { timestampValue: new Date(0).toISOString() },
      })
    ).status,
    403,
  );
});
test("trusted deletion process remains able to remove protected user data", async () => {
  assert.equal(
    (
      await request("users/deleted", "server", "PATCH", {
        value: { stringValue: "old" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("users/deleted", "server", "DELETE")).status,
    200,
  );
});
test("expired marker has no authorization effect even before physical purge", async () => {
  assert.equal(
    (
      await request("users/expired", "expired", "PATCH", {
        uid: { stringValue: "expired" },
        settings: { mapValue: { fields: {} } },
      })
    ).status,
    200,
  );
});
test("unrelated new UID remains unaffected", async () => {
  assert.equal(
    (
      await request("users/unrelated-new", "unrelated-new", "PATCH", {
        uid: { stringValue: "unrelated-new" },
        settings: { mapValue: { fields: {} } },
      })
    ).status,
    200,
  );
});
test("deleted UID cannot claim a username or trial", async () => {
  assert.equal(
    (
      await request("usernames/deleted-name", "deleted", "PATCH", {
        uid: { stringValue: "deleted" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("users/deleted/entitlements/trial", "deleted", "PATCH", {
        trialStartMs: { integerValue: String(Date.now()) },
        version: { integerValue: "2" },
      })
    ).status,
    403,
  );
});
test("TTL configuration purges expiry-only markers", () => {
  const config = JSON.parse(fs.readFileSync("firestore.indexes.json"));
  assert.deepEqual(
    config.fieldOverrides.find((v) => v.collectionGroup === "accountDeletions"),
    {
      collectionGroup: "accountDeletions",
      fieldPath: "expiresAt",
      ttl: true,
      indexes: [],
    },
  );
});
