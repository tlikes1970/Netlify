import {
  loadSettingsSchema,
  readSetting,
  writeSetting,
  ensureDefaults,
} from '/js/settings-schema.js';

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}
function coerce(value, def, type) {
  if (type === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? n : def;
  }
  if (type === 'boolean') return Boolean(value);
  return value;
}

function warnMissing(id) {
  console.warn('[settings-bind] Missing control for selector:', id);
}

// Bind a radio group by value
function bindRadioGroup({ selectors, storageKey, values }) {
  const els = selectors.map((s) => qs(s)).filter(Boolean);
  if (els.length !== selectors.length) {
    warnMissing(selectors.join(', '));
    return;
  }
  // Seed initial
  const current = readSetting(storageKey, values[0]);
  els.forEach((el, idx) => {
    el.checked = values[idx] === current;
  });
  // Wire change
  els.forEach((el, idx) => {
    el.addEventListener('change', () => {
      if (el.checked) writeSetting(storageKey, values[idx]);
    });
  });
}

export async function initSettings() {
  console.log('[settings-renderer] initSettings called');
  const schema = await loadSettingsSchema();
  console.log('[settings-renderer] schema loaded:', schema);
  ensureDefaults(schema);

  // Map existing, real DOM controls to storage keys
  // NOTE: We use #langToggle from the header because Settings lacks a language select.
  const map = {
    '#displayNameInput': { key: 'user.displayName', type: 'string' },
    '#langToggle': { key: 'app.language', type: 'enum' },
    '#mardiOverlayToggle': { key: 'ui.mardiGrasOverlay', type: 'boolean' },
    '#notifEpisodes': { key: 'notif.episodes', type: 'boolean' },
    '#notifDiscover': { key: 'notif.discover', type: 'boolean' },
    '#notifDigest': { key: 'notif.monthlyDigest', type: 'boolean' },
    '#settingCustomRowsCount': { key: 'home.customRowsCount', type: 'number' },
    '#settingCurrentlyWatchingLimit': { key: 'home.currentlyWatchingLimit', type: 'number' },
    '#enableEpisodeTracking': { key: 'cards.episodeTracking', type: 'boolean' },
    '#advOn': { key: 'pro.advancedNotifications', type: 'boolean' },
    '#themePackSelect': { key: 'pro.themePack', type: 'enum' },
    // '#socialEnabled' missing in DOM; skip for now.
  };

  // Seed simple controls from storage
  console.log('[settings-renderer] Binding controls...');
  for (const [selector, cfg] of Object.entries(map)) {
    const el = qs(selector);
    if (!el) {
      warnMissing(selector);
      continue;
    }
    console.log(`[settings-renderer] Found control: ${selector} -> ${cfg.key}`);
    const val = readSetting(cfg.key, null);
    if (val === null) continue;
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!val;
    else el.value = String(val);
    console.log(`[settings-renderer] Set ${selector} to:`, val);
  }

  // Write-through on change
  for (const [selector, cfg] of Object.entries(map)) {
    const el = qs(selector);
    if (!el) continue;
    el.addEventListener('change', () => {
      const raw = el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value;
      const next = coerce(raw, readSetting(cfg.key, null), cfg.type);
      writeSetting(cfg.key, next);
    });
  }

  // Theme radio group: #themeSystem, #themeLight, #themeDark -> 'system' | 'light' | 'dark'
  console.log('[settings-renderer] Binding theme radio group...');
  bindRadioGroup({
    selectors: ['#themeSystem', '#themeLight', '#themeDark'],
    storageKey: 'ui.theme',
    values: ['system', 'light', 'dark'],
  });
}

// Auto-init if this file is loaded directly (defensive)
console.log('[settings-renderer] Module loaded, document.readyState:', document.readyState);
if (document.readyState === 'loading') {
  console.log('[settings-renderer] Adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', () =>
    initSettings().catch((err) => console.error('[settings-renderer] Error:', err)),
  );
} else {
  console.log('[settings-renderer] DOM already ready, calling initSettings immediately');
  initSettings().catch((err) => console.error('[settings-renderer] Error:', err));
}

export function __settings__refreshFromStorageForTests() {
  // helper for tests; reloads saved -> draft and re-renders (used later by Playwright)
  try {
    const ev = new Event('click');
    const tab = document.getElementById('settingsTab');
    if (tab) tab.dispatchEvent(ev);
  } catch {}
}
