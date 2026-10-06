/** Coordinates restore with writes already using the normal persistence paths. */
import {pendingAccountDeletion} from './accountDeletionState';
let restoring = false;
export const isRestoring = (): boolean => restoring || !!pendingAccountDeletion();
const pending = new Set<Promise<unknown>>();
export function trackedWrite<T extends (...args: never[]) => Promise<unknown>>(
  write: T,
): T {
  return ((...args: Parameters<T>) => {
    if (isRestoring())
      return Promise.reject(new Error("Backup restore is in progress."));
    const operation = write as unknown as (
      ...args: Parameters<T>
    ) => ReturnType<T>;
    const promise = operation(...args);
    pending.add(promise);
    void promise.finally(() => pending.delete(promise)).catch(() => undefined);
    return promise;
  }) as T;
}
export async function beginRestore(deletionRecovery = false): Promise<() => void> {
  if (restoring || (!deletionRecovery && pendingAccountDeletion())) throw new Error("Another restore is already in progress.");
  restoring = true;
  await Promise.allSettled([...pending]);
  return () => {
    restoring = false;
  };
}

/** User-content writers share the replacement barrier, including mounted game effects. */
export function persistLocalContent(key: string, value: string): void {
  if (!isRestoring()) localStorage.setItem(key, value);
}
