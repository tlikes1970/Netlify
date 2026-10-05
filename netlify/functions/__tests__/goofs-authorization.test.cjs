const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(
  path.join(__dirname, "../goofs-fetch.cjs"),
  "utf8",
);
function load(secret) {
  let firebaseLoads = 0;
  const context = {
    exports: {},
    Buffer,
    process: { env: { GOOFS_INGESTION_ADMIN_TOKEN: secret } },
    console: { warn() {}, error() {}, log() {} },
    require(name) {
      if (name === "node:crypto") return require(name);
      if (name.endsWith("insightTranslations.json")) return {};
      if (name === "firebase-admin") {
        firebaseLoads++;
        return { apps: [{}], firestore: () => ({}) };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(source, context, { filename: "goofs-fetch.cjs" });
  return { handler: context.exports.handler, loads: () => firebaseLoads };
}
for (const secret of [undefined, "", "   "]) {
  test(`missing server secret fails closed: ${JSON.stringify(secret)}`, async () => {
    const runtime = load(secret);
    const response = await runtime.handler({
      httpMethod: "POST",
      headers: { "x-admin-token": "anything" },
      body: JSON.stringify({ tmdbId: 1, role: "admin" }),
    });
    assert.equal(response.statusCode, 401);
    assert.equal(runtime.loads(), 0);
  });
}
for (const headers of [
  {},
  { "x-admin-token": "wrong" },
  { "x-admin-token": "wrong!!" },
  { "x-admin-token": ["correct"] },
  { Authorization: "Bearer admin", role: "admin" },
]) {
  test(`unauthorized header cannot reach Firebase: ${JSON.stringify(headers)}`, async () => {
    const runtime = load("correct");
    assert.equal(
      (await runtime.handler({ httpMethod: "GET", headers })).statusCode,
      401,
    );
    assert.equal(runtime.loads(), 0);
  });
}
for (const header of ["x-admin-token", "X-Admin-Token"]) {
  test(`valid ${header} reaches input validation`, async () => {
    const runtime = load("correct");
    assert.equal(
      (
        await runtime.handler({
          httpMethod: "GET",
          headers: { [header]: "correct" },
          queryStringParameters: {},
        })
      ).statusCode,
      400,
    );
    assert.equal(runtime.loads(), 1);
  });
}
test("CORS preflight performs no privileged operation", async () => {
  const runtime = load(undefined);
  assert.equal(
    (await runtime.handler({ httpMethod: "OPTIONS", headers: {} })).statusCode,
    204,
  );
  assert.equal(runtime.loads(), 0);
});
