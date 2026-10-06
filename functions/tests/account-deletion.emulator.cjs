const { test } = require("node:test");
const assert = require("node:assert/strict");
if (
  !process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.GCLOUD_PROJECT !== "demo-flicklet31"
)
  throw Error("Isolated emulator required");
const { db } = require("../lib/src/admin");
const { deleteFlickletData } = require("../lib/src/accountDeletion");
test("production recursive cleanup removes all mapped data and preserves unrelated accounts/catalog", async () => {
  const docs = {
    "users/to-delete": {
      email: "delete@example.test",
      watchlists: {},
      customLists: [],
      settings: {},
    },
    "users/to-delete/episodeProgress/1": { episodes: { S1E1: true } },
    "users/to-delete/tabState/watching": { order: ["1"] },
    "users/to-delete/settings/legacy": { preferredName: "name" },
    "users/to-delete/notificationSettings/main": { enabled: true },
    "users/to-delete/billing/status": { ownershipId: "fingerprint" },
    "users/to-delete/billing/adminGrant": { active: true },
    "users/to-delete/entitlements/trial": { trialStartMs: 1 },
    "usernames/deleted": { uid: "to-delete" },
    "playPurchases/fingerprint": {
      uid: "to-delete",
      purchaseToken: "sensitive",
    },
    "users/keep": { email: "keep@example.test" },
    "usernames/keep": { uid: "keep" },
    "playPurchases/keep": { uid: "keep" },
    "users/keep/billing/adminGrant": { active: true, updatedBy: "to-delete" },
    "users/keep/entitlements/trial": {
      trialStartMs: 123,
      resetBy: "to-delete",
    },
    "insights/shared": { content: "shared" },
    "accountDeletions/to-delete": {
      expiresAt: new Date(Date.now() + 65 * 60000),
    },
  };
  await Promise.all(
    Object.entries(docs).map(([path, data]) => db.doc(path).set(data)),
  );
  await deleteFlickletData("to-delete");
  for (const path of Object.keys(docs).filter(
    (path) =>
      path.startsWith("users/to-delete") ||
      path === "usernames/deleted" ||
      path === "playPurchases/fingerprint",
  ))
    assert.equal((await db.doc(path).get()).exists, false, path);
  for (const path of [
    "users/keep",
    "usernames/keep",
    "playPurchases/keep",
    "insights/shared",
    "accountDeletions/to-delete",
  ])
    assert.equal((await db.doc(path).get()).exists, true, path);
  assert.deepEqual(
    (await db.doc("users/keep/billing/adminGrant").get()).data(),
    { active: true, updatedBy: "deleted-administrator" },
  );
  assert.deepEqual(
    (await db.doc("users/keep/entitlements/trial").get()).data(),
    { trialStartMs: 123 },
  );
  await deleteFlickletData("to-delete");
  assert.equal((await db.doc("users/keep").get()).exists, true);
});
