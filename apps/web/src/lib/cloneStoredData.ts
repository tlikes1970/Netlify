/** Clone plain persisted settings/backup data without requiring newer WebView APIs. */
export function cloneStoredData<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => cloneStoredData(item)) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneStoredData(item)]),
    ) as T;
  }
  return value;
}
