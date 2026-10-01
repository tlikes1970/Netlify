/** Small recovery journal for interrupted local application of a restore. */
export const RESTORE_JOURNAL_KEY = "flicklet.restore.pending.v1";
export type RestoreJournal = {
  uid: string | null;
  revision: string;
  before: Array<[string, string | null]>;
  after: Array<[string, string | null]>;
};
let recovered = false;
function readJournal(): RestoreJournal | null {
  const raw = localStorage.getItem(RESTORE_JOURNAL_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as RestoreJournal;
  if (
    !parsed ||
    typeof parsed.revision !== "string" ||
    !(parsed.uid === null || typeof parsed.uid === "string")
  )
    throw new Error("Invalid restore recovery record.");
  for (const entries of [parsed.before, parsed.after])
    if (
      !Array.isArray(entries) ||
      !entries.every(
        (entry) =>
          Array.isArray(entry) &&
          entry.length === 2 &&
          typeof entry[0] === "string" &&
          (entry[1] === null || typeof entry[1] === "string"),
      )
    )
      throw new Error("Invalid restore recovery entries.");
  return parsed;
}
function apply(values: RestoreJournal["before"]): void {
  // Reclaim staged values before recovering the prior snapshot (quota safety).
  for (const [key] of values) localStorage.removeItem(key);
  for (const [key, value] of values)
    if (value !== null) localStorage.setItem(key, value);
}
/** Runs before managers read local state; cloud verification resolves ambiguity. */
export function recoverLocalRestore(): void {
  if (recovered || typeof localStorage === "undefined") return;
  recovered = true;
  try {
    const journal = readJournal();
    if (!journal) return;
    apply(journal.before);
    if (!journal.uid) localStorage.removeItem(RESTORE_JOURNAL_KEY);
  } catch (error) {
    console.error("Restore recovery could not finish:", error);
  }
}
export function hasPendingCloudRestore(uid: string): boolean {
  try {
    return readJournal()?.uid === uid;
  } catch {
    return false;
  }
}
/** Resolve an interrupted cloud commit before normal cloud/local library merging. */
export function resolveCloudRestore(uid: string, revision: unknown): void {
  const journal = readJournal();
  if (!journal) return;
  if (journal.uid === uid)
    apply(revision === journal.revision ? journal.after : journal.before);
  localStorage.removeItem(RESTORE_JOURNAL_KEY);
}
if (typeof window !== "undefined")
  window.addEventListener("library:cleared", () => {
    // Signing out must never revive the previous account's private local snapshot.
    localStorage.removeItem(RESTORE_JOURNAL_KEY);
  });
