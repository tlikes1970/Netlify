/* Schema reader for settings-schema.json */
export async function loadSettingsSchema() {
  const res = await fetch('/js/settings-schema.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Failed to load settings schema');
  const schema = await res.json();
  if (!schema || !Array.isArray(schema.settings)) {
    throw new Error('Invalid settings schema format');
  }
  return schema;
}

export function getDefaults(schema) {
  const out = {};
  for (const s of schema.settings) out[s.storageKey] = s.default;
  return out;
}

const NS = 'flicklet';
function k(key) {
  return `${NS}:${key}`;
}

export function readSetting(storageKey, fallback) {
  try {
    const raw = localStorage.getItem(k(storageKey));
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeSetting(storageKey, value) {
  try {
    localStorage.setItem(k(storageKey), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function ensureDefaults(schema) {
  const defs = getDefaults(schema);
  for (const [key, val] of Object.entries(defs)) {
    const existing = readSetting(key, undefined);
    if (existing === undefined) writeSetting(key, val);
  }
}
