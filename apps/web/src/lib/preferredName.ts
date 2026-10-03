import { trackedWrite } from "./restoreBarrier";
import { doc, runTransaction as firestoreTransaction, updateDoc as firestoreWrite } from "firebase/firestore";
import { authManager } from "./auth";
import { db } from "./firebaseBootstrap";
import type { AuthUser, UserSettings } from "./auth.types";

const runTransaction = trackedWrite(firestoreTransaction);
const updateDoc = trackedWrite(firestoreWrite);

export function resolvePreferredName(settings: UserSettings): string {
  // An explicit new field, including an empty value, takes precedence forever.
  if (typeof settings.preferredName === "string")
    return settings.preferredName.trim();
  // The old prompt and Settings editor both marked user-entered answers this way.
  if (settings.usernamePrompted && settings.username?.trim())
    return settings.username.trim();
  const legacy = settings.displayName?.trim() || "";
  return /^(guest|user|flicklet user)$/i.test(legacy) ? "" : legacy;
}

type Snapshot = {
  uid: string | null;
  preferredName: string;
  loading: boolean;
  error: string | null;
};
type Dependencies = {
  currentUser: () => AuthUser | null;
  subscribeAuth: (listener: (user: AuthUser | null) => void) => () => void;
  read: (uid: string) => Promise<UserSettings | null>;
  write: (uid: string, name: string) => Promise<void>;
  migrate?: (uid: string, name: string) => Promise<string>;
};

/** Shared, auth-scoped state: prompt, Settings and greeting see the same value. */
export class PreferredNameStore {
  private snapshot: Snapshot = {
    uid: null,
    preferredName: "",
    loading: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private stopAuth?: () => void;
  private generation = 0;
  private saving = false;
  constructor(private dependencies: Dependencies) {}
  getSnapshot = () => this.snapshot;
  private publish(snapshot: Snapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.stopAuth) {
      this.stopAuth = this.dependencies.subscribeAuth(this.onAuth);
      this.onAuth(this.dependencies.currentUser());
    }
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) {
        this.stopAuth?.();
        this.stopAuth = undefined;
        this.generation++;
        this.snapshot = {
          uid: null,
          preferredName: "",
          loading: false,
          error: null,
        };
      }
    };
  };
  private onAuth = (user: AuthUser | null) => {
    const uid = user?.uid || null;
    if (uid === this.snapshot.uid) {
      // Auth announces again after its background user-document creation.
      if (uid && this.snapshot.error && !this.snapshot.loading) this.retry();
      return;
    }
    const generation = ++this.generation;
    this.publish({ uid, preferredName: "", loading: !!uid, error: null });
    if (uid) void this.load(uid, generation);
  };
  private async load(uid: string, generation: number) {
    try {
      const settings = await this.dependencies.read(uid);
      if (generation !== this.generation) return;
      if (!settings)
        throw new Error(
          "Your preferred name could not be loaded. Please try again.",
        );
      let preferredName = resolvePreferredName(settings);
      if (preferredName && settings.preferredName === undefined) {
        if (this.dependencies.migrate) {
          preferredName = await this.dependencies.migrate(uid, preferredName);
        } else {
          await this.dependencies.write(uid, preferredName);
        }
      }
      if (generation === this.generation)
        this.publish({ uid, preferredName, loading: false, error: null });
    } catch (cause) {
      console.error("Preferred name load failed", cause);
      if (generation === this.generation)
        this.publish({
          uid,
          preferredName: "",
          loading: false,
          error:
            cause instanceof Error
              ? cause.message
              : "Your preferred name could not be loaded.",
        });
    }
  }
  resetAfterStartOver = () => {
    this.generation++;
    this.publish({ ...this.snapshot, preferredName: "", loading: false, error: null });
  };
  retry = () => {
    const uid = this.snapshot.uid;
    if (!uid || this.saving) return;
    this.publish({ ...this.snapshot, loading: true, error: null });
    void this.load(uid, ++this.generation);
  };
  updatePreferredName = async (value: string) => {
    const name = value.trim();
    if (!name) throw new Error("Please enter a preferred name.");
    if (name.length > 100)
      throw new Error("Please use 100 characters or fewer.");
    const uid = this.snapshot.uid;
    if (!uid || this.dependencies.currentUser()?.uid !== uid)
      throw new Error("Please sign in to save your preferred name.");
    if (this.snapshot.loading || this.saving)
      throw new Error("Please wait before saving your preferred name.");
    const generation = ++this.generation;
    this.saving = true;
    try {
      await this.dependencies.write(uid, name);
      if (
        generation !== this.generation ||
        this.dependencies.currentUser()?.uid !== uid
      )
        throw new Error("The signed-in account changed. Please try again.");
      this.publish({ uid, preferredName: name, loading: false, error: null });
    } finally {
      this.saving = false;
    }
  };
}

export const preferredNameStore = new PreferredNameStore({
  currentUser: () => authManager.getCurrentUser(),
  subscribeAuth: (listener) => authManager.subscribe(listener),
  read: (uid) => authManager.getUserSettings(uid),
  // A dotted update preserves sibling settings, handles and provider identity.
  write: (uid, name) =>
    updateDoc(doc(db, "users", uid), { "settings.preferredName": name }),
  migrate: (uid, name) =>
    runTransaction(db, async (transaction) => {
      const reference = doc(db, "users", uid);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists())
        throw new Error(
          "Your preferred name could not be loaded. Please try again.",
        );
      const current = snapshot.data().settings?.preferredName;
      // Another device may already have migrated or edited the name.
      if (typeof current === "string") return current.trim();
      transaction.update(reference, { "settings.preferredName": name });
      return name;
    }),
});
