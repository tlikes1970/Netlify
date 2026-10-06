const { test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  deleteOwnAccount,
  deleteFlickletData,
  DELETION_PROTECTION_MS,
} = require("../lib/src/accountDeletion");
const { assertNotDeleting } = require("../lib/src/deletionProtection");
const { db } = require("../lib/src/admin");
let calls, deps;
const now = 2000000000000;
const identity = () => ({ uid: "self", token: { auth_time: now / 1000 } });
beforeEach(() => {
  calls = [];
  deps = {
    now: () => now,
    getUser: async (uid) => {
      calls.push(["lookup", uid]);
      return {};
    },
    isProtected: async () => true,
    protect: async (...args) => calls.push(["protect", ...args]),
    deleteData: async (uid) => calls.push(["data", uid]),
    deleteAuth: async (uid) => calls.push(["auth", uid]),
  };
});
afterEach(() => mock.restoreAll());
test("requires verified callable identity before any effect", async () => {
  await assert.rejects(
    deleteOwnAccount(undefined, { confirmation: "DELETE" }, deps),
    { code: "unauthenticated" },
  );
  assert.deepEqual(calls, []);
});
for (const confirmation of [undefined, "delete", true, ""])
  test(`explicit confirmation required: ${confirmation}`, async () => {
    await assert.rejects(deleteOwnAccount(identity(), { confirmation }, deps), {
      code: "invalid-argument",
    });
    assert.deepEqual(calls, []);
  });
for (const auth_time of [undefined, NaN, now / 1000 - 301, now / 1000 + 31])
  test(`recent authentication required: ${auth_time}`, async () => {
    await assert.rejects(
      deleteOwnAccount(
        { uid: "self", token: { auth_time } },
        { confirmation: "DELETE" },
        deps,
      ),
      { code: "failed-precondition" },
    );
    assert.deepEqual(calls, []);
  });
test("caller UID alone controls target; body UID/email/admin assertions ignored", async () => {
  assert.deepEqual(
    await deleteOwnAccount(
      identity(),
      { confirmation: "DELETE", uid: "victim", email: "victim", role: "admin" },
      deps,
    ),
    { deleted: true },
  );
  assert.deepEqual(
    calls.map((c) => c[1]),
    ["self", "self", "self", "self", "self"],
  );
  assert.deepEqual(
    calls.map((c) => c[0]),
    ["lookup", "protect", "data", "protect", "auth"],
  );
});
test("protection exceeds ID token lifetime and contains only UID/expiry", async () => {
  await deleteOwnAccount(identity(), { confirmation: "DELETE" }, deps);
  assert.equal(DELETION_PROTECTION_MS, 65 * 60 * 1000);
  assert.deepEqual(calls[1], ["protect", "self", now + DELETION_PROTECTION_MS]);
});
test("revoked authentication rejects before marker or data deletion", async () => {
  deps.getUser = async () => ({
    tokensValidAfterTime: new Date(now + 1000).toISOString(),
  });
  await assert.rejects(
    deleteOwnAccount(identity(), { confirmation: "DELETE" }, deps),
    { code: "failed-precondition" },
  );
  assert.deepEqual(calls, []);
});
test('token revocation comparison uses Firebase auth_time second precision', async () => {
  deps.getUser = async () => ({tokensValidAfterTime:new Date(now+499).toISOString()});
  assert.deepEqual(await deleteOwnAccount(identity(),{confirmation:'DELETE'},deps),{deleted:true});
});
for (const step of ["protect", "deleteData", "deleteAuth"])
  test(`${step} failure cannot report success`, async () => {
    deps[step] = async () => {
      throw Error("secret token or provider payload");
    };
    await assert.rejects(
      deleteOwnAccount(identity(), { confirmation: "DELETE" }, deps),
      (error) =>
        error.code === "internal" &&
        error.message === "account-deletion-incomplete",
    );
    if (step !== "deleteAuth")
      assert.equal(
        calls.some((c) => c[0] === "auth"),
        false,
      );
  });
test("lost response after Auth deletion permits idempotent protected retry", async () => {
  deps.getUser = async () => {
    throw Object.assign(Error(), { code: "auth/user-not-found" });
  };
  assert.deepEqual(
    await deleteOwnAccount(identity(), { confirmation: "DELETE" }, deps),
    { deleted: true },
  );
  assert.equal(calls.at(-1)[0], "auth");
});
test("missing Auth user without active protection cannot invent deletion success", async () => {
  deps.getUser = async () => {
    throw Object.assign(Error(), { code: "auth/user-not-found" });
  };
  deps.isProtected = async () => false;
  await assert.rejects(
    deleteOwnAccount(identity(), { confirmation: "DELETE" }, deps),
    { code: "internal" },
  );
  assert.deepEqual(calls, []);
});
test("recursive deletion removes root, purchase bindings and usernames, preserving shared collections", async () => {
  const removed = [],
    queries = [],
    updated = [],
    visited = new Set();
  mock.method(db, "collection", (name) => ({
    where(field, op, uid) {
      if (!visited.has(name)) queries.push([name, field, op, uid]);
      return {
        limit: () => ({
          get: async () => {
            const records = visited.has(name)
              ? []
              : [{ ref: { path: `${name}/owned` } }];
            visited.add(name);
            return { empty: !records.length, docs: records };
          },
        }),
      };
    },
  }));
  mock.method(db, "collectionGroup", (name) => ({
    where: (_field, _op, _uid) => ({
      get: async () => ({
        docs: [
          {
            ref: {
              path: `users/other/${name}/record`,
              update: async (value) => updated.push([name, value]),
            },
          },
        ],
      }),
    }),
  }));
  mock.method(db, "doc", (path) => ({ path }));
  mock.method(db, "recursiveDelete", async (ref) => removed.push(ref.path));
  await deleteFlickletData("self");
  assert.deepEqual(removed, [
    "usernames/owned",
    "playPurchases/owned",
    "users/self",
  ]);
  assert.deepEqual(queries, [
    ["usernames", "uid", "==", "self"],
    ["playPurchases", "uid", "==", "self"],
  ]);
  assert.equal(updated[0][1].updatedBy, "deleted-administrator");
  assert.equal(Object.hasOwn(updated[1][1], "resetBy"), true);
});
for (const [label, expiresAt, blocked] of [
  ["future", Date.now() + 3600000, true],
  ["expired", 0, false],
  ["absent", undefined, false],
])
  test(`server bypass protection: ${label}`, async () => {
    mock.method(db, "doc", (path) => {
      assert.equal(path, "accountDeletions/self");
      return {
        get: async () => ({
          data: () =>
            expiresAt === undefined
              ? undefined
              : { expiresAt: { toMillis: () => expiresAt } },
        }),
      };
    });
    if (blocked)
      await assert.rejects(assertNotDeleting("self"), {
        code: "permission-denied",
      });
    else await assertNotDeleting("self");
  });
