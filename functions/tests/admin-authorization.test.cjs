const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const endpoints = require("../lib/src/index.js");
const { auth, db } = require("../lib/src/admin.js");
const admin = { uid: "administrator", token: { role: "admin" } };
const ordinary = { uid: "ordinary", token: { role: "user" } };
afterEach(() => mock.restoreAll());
function deny(code) {
  return (error) => error.code === code;
}
function noSideEffects() {
  const lookup = mock.method(auth, "getUser", async () => {
    throw new Error("Unexpected lookup");
  });
  const claims = mock.method(auth, "setCustomUserClaims", async () => {
    throw new Error("Unexpected write");
  });
  const database = mock.method(db, "collection", () => {
    throw new Error("Unexpected database access");
  });
  return () => {
    for (const item of [lookup, claims, database])
      assert.equal(item.mock.callCount(), 0);
  };
}
for (const name of [
  "manageAdminRole",
  "manageProStatus",
  "resetTrialEntitlement",
  "ingestGoofs",
]) {
  for (const [label, identity, code] of [
    ["signed out", undefined, "unauthenticated"],
    ["ordinary user", ordinary, "permission-denied"],
  ]) {
    test(`${name} denies ${label} before privileged side effects`, async () => {
      const unchanged = noSideEffects();
      await assert.rejects(
        endpoints[name].run({
          auth: identity,
          data: {
            userId: "ordinary",
            target: "other",
            grant: true,
            isPro: true,
            role: "admin",
          },
        }),
        deny(code),
      );
      unchanged();
    });
  }
}
test("ordinary user cannot promote another account using body admin claims", async () => {
  const unchanged = noSideEffects();
  await assert.rejects(
    endpoints.manageAdminRole.run({
      auth: ordinary,
      data: { userId: "other", grant: true, role: "admin", isAdmin: true },
    }),
    deny("permission-denied"),
  );
  unchanged();
});
for (const [label, existing, grant, expected] of [
  [
    "grant preserves unrelated claims",
    { tenant: "team", feature: true },
    true,
    { tenant: "team", feature: true, role: "admin" },
  ],
  [
    "revoke preserves unrelated claims",
    { role: "admin", tenant: "team", feature: true },
    false,
    { tenant: "team", feature: true },
  ],
  ["grant supports no previous claims", undefined, true, { role: "admin" }],
  [
    "revoke leaves another role intact",
    { role: "editor", feature: true },
    false,
    { role: "editor", feature: true },
  ],
  [
    "repeated grant is idempotent",
    { role: "admin", feature: true },
    true,
    { role: "admin", feature: true },
  ],
]) {
  test(label, async () => {
    mock.method(auth, "getUser", async (uid) => ({
      uid,
      email: "target@example.test",
      customClaims: existing,
    }));
    const write = mock.method(auth, "setCustomUserClaims", async () => {});
    const result = await endpoints.manageAdminRole.run({
      auth: admin,
      data: { userId: "target", grant },
    });
    assert.equal(result.userId, "target");
    assert.deepEqual(write.mock.calls[0].arguments, ["target", expected]);
    assert.equal(write.mock.callCount(), 1);
  });
}
test("administrator cannot revoke their own role", async () => {
  const unchanged = noSideEffects();
  await assert.rejects(
    endpoints.manageAdminRole.run({
      auth: admin,
      data: { userId: admin.uid, grant: false },
    }),
    deny("permission-denied"),
  );
  unchanged();
});
for (const data of [
  null,
  {},
  { userId: " ", grant: true },
  { userId: "target", grant: "true" },
]) {
  test(`invalid role request rejected: ${JSON.stringify(data)}`, async () => {
    const unchanged = noSideEffects();
    await assert.rejects(
      endpoints.manageAdminRole.run({ auth: admin, data }),
      deny("invalid-argument"),
    );
    unchanged();
  });
}
test("retired self-promotion endpoint has no source or production export", () => {
  assert.equal(Object.hasOwn(endpoints, "setAdminRole"), false);
  assert.equal(
    fs.existsSync(path.join(__dirname, "../src/setAdminRole.ts")),
    false,
  );
  assert.deepEqual(
    Object.keys(endpoints).sort(),
    [
      "ingestGoofs",
      "manageAdminRole",
      "manageProStatus",
      "resetTrialEntitlement",
    ].sort(),
  );
});
for (const [label, data, active, email] of [
  [
    "current email grant",
    { target: "target@example.test", isPro: true },
    true,
    true,
  ],
  ["current UID grant", { target: "target", isPro: true }, true, false],
  ["legacy UID revoke", { userId: "target", isPro: false }, false, false],
]) {
  test(`production Full Access callable accepts ${label} without purchase/trial writes`, async () => {
    const lookup = mock.method(
      auth,
      email ? "getUserByEmail" : "getUser",
      async () => ({ uid: "target", email: "target@example.test" }),
    );
    const locations = [];
    const writes = [];
    const ref = {
      collection(name) {
        locations.push(name);
        return ref;
      },
      doc(name) {
        locations.push(name);
        return ref;
      },
      async set(record, options) {
        writes.push({ record, options });
      },
    };
    mock.method(db, "collection", (name) => {
      locations.push(name);
      return ref;
    });
    const result = await endpoints.manageProStatus.run({ auth: admin, data });
    assert.equal(result.granted, active);
    assert.equal(lookup.mock.callCount(), 1);
    assert.deepEqual(locations, ["users", "target", "billing", "adminGrant"]);
    assert.equal(writes.length, 1);
    assert.deepEqual(writes[0].options, { merge: true });
    assert.equal(writes[0].record.active, active);
    assert.equal(writes[0].record.updatedBy, admin.uid);
    assert.equal(writes[0].record.userId, "target");
    assert.equal(writes[0].record.version, 1);
    assert.equal(Object.hasOwn(writes[0].record, "isPro"), false);
  });
}
for (const failure of ["auth/invalid-id-token", "auth/id-token-expired"]) {
  test(`real callable HTTP wrapper rejects ${failure} before handler`, async () => {
    const unchanged = noSideEffects();
    mock.method(auth, "verifyIdToken", async () => {
      throw Object.assign(new Error("Test token rejected"), { code: failure });
    });
    const app = express();
    app.use(express.json());
    app.post("/roles", endpoints.manageAdminRole);
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    try {
      const response = await fetch(
        `http://127.0.0.1:${server.address().port}/roles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-invalid-token",
          },
          body: JSON.stringify({ data: { userId: "ordinary", grant: true } }),
        },
      );
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error.status, "UNAUTHENTICATED");
      unchanged();
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
}
