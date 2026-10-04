interface Identity {
  uid: string;
  token: { [key: string]: unknown };
}
interface Dependencies {
  findUser(target: string): Promise<{ uid: string; email?: string }>;
  writeGrant(
    uid: string,
    record: {
      active: boolean;
      version: number;
      userId: string;
      updatedBy: string;
    },
  ): Promise<void>;
}
function reject(code: string, message: string): never {
  throw Object.assign(new Error(message), { code });
}
export async function manageFullAccessGrant(
  identity: Identity | undefined,
  input: unknown,
  dependencies: Dependencies,
) {
  if (!identity) reject("unauthenticated", "Sign in first.");
  if (identity.token.role !== "admin")
    reject(
      "permission-denied",
      "Only administrators can manage Full Access grants.",
    );
  const data = input as {
    target?: unknown;
    userId?: unknown;
    isPro?: unknown;
  } | null;
  const target = data?.target ?? data?.userId;
  if (
    typeof target !== "string" ||
    !target.trim() ||
    target.trim().length > 320 ||
    typeof data?.isPro !== "boolean"
  )
    reject(
      "invalid-argument",
      "An email or account ID and grant/revoke choice are required.",
    );
  const user = await dependencies.findUser(target.trim());
  await dependencies.writeGrant(user.uid, {
    active: data.isPro,
    version: 1,
    userId: user.uid,
    updatedBy: identity.uid,
  });
  return { userId: user.uid, email: user.email || "", granted: data.isPro };
}
