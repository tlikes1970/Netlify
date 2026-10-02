/** Coordinates restore with writes already using the normal persistence paths. */
let restoring = false;
export const isRestoring = (): boolean => restoring;
const pending = new Set<Promise<unknown>>();
export function trackedWrite<T extends (...args: never[]) => Promise<unknown>>(
  write: T,
): T {
  return ((...args: Parameters<T>) => {
    if (restoring)
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
export async function beginRestore(): Promise<() => void> {
  if (restoring) throw new Error("Another restore is already in progress.");
  restoring = true;
  await Promise.allSettled([...pending]);
  return () => {
    restoring = false;
  };
}

/** User-content writers share the replacement barrier, including mounted game effects. */
export function persistLocalContent(key: string, value: string): void {
  if (!restoring) localStorage.setItem(key, value);
}
