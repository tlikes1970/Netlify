import {
  loadSettingsSchema,
  readSetting,
  writeSetting,
  ensureDefaults,
} from '/js/settings-schema.js';
import { initSettingsEffects } from '/js/settings-effects.js';
import { validateDraftAgainstSchema } from '/js/settings-validate.js';

const STATE = {
  schema: null,
  saved: {}, // last persisted
  draft: {}, // in-flight edits
  dirty: false,
  errors: {},
};

function qs(s, root = document) {
  return root.querySelector(s);
}
function qsa(s, root = document) {
  return Array.from(root.querySelectorAll(s));
}

function setDirty(v) {
  STATE.dirty = !!v;
  const sec = qs('#settingsSection');
  if (sec) sec.dataset.dirty = STATE.dirty ? 'true' : 'false'; // hook for styling/buttons
  const saveBtn = qs('#settingsSave');
  const cancelBtn = qs('#settingsCancel');
  const resetBtn = qs('#settingsReset');
  if (saveBtn) saveBtn.disabled = !STATE.dirty || Object.keys(STATE.errors).length > 0;
  if (cancelBtn) cancelBtn.disabled = !STATE.dirty;
  if (resetBtn) resetBtn.disabled = false; // always allow reset
}

// map controls to keys (single source for validation rendering)
const ID_TO_KEY = {
  '#displayNameInput': 'user.displayName',
  '#langToggle': 'app.language',
  '#settingCuratedRows': 'home.curatedRows',
  '#settingCurrentlyWatchingLimit': 'home.currentlyWatchingLimit',
  '#mardiOverlayToggle': 'ui.mardiGrasOverlay',
  '#notifEpisodes': 'notif.episodes',
  '#notifDiscover': 'notif.discover',
  '#notifDigest': 'notif.monthlyDigest',
  '#enableEpisodeTracking': 'cards.episodeTracking',
  '#advOn': 'pro.advancedNotifications',
  '#themePackSelect': 'pro.themePack',
};

function collectSaved(schema) {
  const out = {};
  for (const s of schema.settings) {
    out[s.storageKey] = readSetting(s.storageKey, s.default);
  }
  return out;
}

function renderDraftIntoControls() {
  for (const [sel, key] of Object.entries(ID_TO_KEY)) {
    const el = qs(sel);
    if (!el) continue;
    const val = STATE.draft[key];
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!val;
    else el.value = String(val ?? '');
  }
  // theme radio group
  const theme = STATE.draft['ui.theme'];
  const radioMap = { system: '#themeSystem', light: '#themeLight', dark: '#themeDark' };
  const rSel = radioMap[theme];
  if (rSel && qs(rSel)) qs(rSel).checked = true;

  // run validation render
  STATE.errors = validateDraftAgainstSchema(STATE.schema, STATE.draft, ID_TO_KEY);
  setDirty(STATE.dirty); // recompute Save disabled state
}

function readControlsIntoDraft() {
  const map = {
    '#displayNameInput': ['user.displayName', (v) => String(v)],
    '#langToggle': ['app.language', (v) => String(v)],
    '#settingCuratedRows': ['home.curatedRows', (v) => Number(v)],
    '#settingCurrentlyWatchingLimit': ['home.currentlyWatchingLimit', (v) => Number(v)],
    '#mardiOverlayToggle': ['ui.mardiGrasOverlay', (v) => !!v],
    '#notifEpisodes': ['notif.episodes', (v) => !!v],
    '#notifDiscover': ['notif.discover', (v) => !!v],
    '#notifDigest': ['notif.monthlyDigest', (v) => !!v],
    '#enableEpisodeTracking': ['cards.episodeTracking', (v) => !!v],
    '#advOn': ['pro.advancedNotifications', (v) => !!v],
    '#themePackSelect': ['pro.themePack', (v) => String(v)],
  };
  for (const [sel, [key, cast]] of Object.entries(map)) {
    const el = qs(sel);
    if (!el) continue;
    const raw = el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value;
    STATE.draft[key] = cast(raw);
  }
  // theme radios
  const theme = qs('#themeLight')?.checked
    ? 'light'
    : qs('#themeDark')?.checked
      ? 'dark'
      : 'system';
  STATE.draft['ui.theme'] = theme;

  // validate on read
  STATE.errors = validateDraftAgainstSchema(STATE.schema, STATE.draft, ID_TO_KEY);
}

function attachDraftListeners() {
  const ctrls = qsa('#settingsSection input, #settingsSection select, #settingsSection textarea');
  ctrls.forEach((el) => {
    if (el.__draft) return;
    el.addEventListener('input', () => {
      readControlsIntoDraft();
      setDirty(true);
    });
    el.addEventListener('change', () => {
      readControlsIntoDraft();
      setDirty(true);
    });
    el.__draft = true;
  });
}

function persistSaved() {
  for (const [key, val] of Object.entries(STATE.draft)) {
    if (STATE.saved[key] !== val) writeSetting(key, val);
  }
  STATE.saved = { ...STATE.draft };
}

function applyEffects() {
  // minimal: theme, language, mardi (others already handled by app code where present)
  document.documentElement.setAttribute('data-theme', STATE.saved['ui.theme'] || 'light');
  document.documentElement.lang = String(STATE.saved['app.language'] || 'en');
  document.body.classList.toggle('mardi-gras', !!STATE.saved['ui.mardiGrasOverlay']);
}

export async function initSettingsState() {
  STATE.schema = await loadSettingsSchema();
  ensureDefaults(STATE.schema);
  STATE.saved = collectSaved(STATE.schema);
  STATE.draft = { ...STATE.saved };
  setDirty(false);
  renderDraftIntoControls();
  attachDraftListeners();

  // Wire buttons if present
  const saveBtn = qs('#settingsSave');
  const cancelBtn = qs('#settingsCancel');
  const resetBtn = qs('#settingsReset');

  if (saveBtn && !saveBtn.__fx) {
    saveBtn.addEventListener('click', () => {
      readControlsIntoDraft();
      if (Object.keys(STATE.errors).length > 0) return; // block save on errors
      persistSaved();
      applyEffects();
      setDirty(false);
    });
    saveBtn.__fx = true;
  }
  if (cancelBtn && !cancelBtn.__fx) {
    cancelBtn.addEventListener('click', () => {
      STATE.draft = { ...STATE.saved };
      renderDraftIntoControls();
      setDirty(false);
    });
    cancelBtn.__fx = true;
  }
  if (resetBtn && !resetBtn.__fx) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Reset all settings to defaults?')) return;
      const defs = {};
      for (const s of STATE.schema.settings) defs[s.storageKey] = s.default;
      STATE.draft = defs;
      renderDraftIntoControls();
      setDirty(true); // requires Save to persist
    });
    resetBtn.__fx = true;
  }
}

// Re-init when Settings tab becomes active
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t && (t.id === 'settingsTab' || (t.closest && t.closest('#settingsTab')))) {
    queueMicrotask(() => initSettingsState().catch(console.error));
  }
});
const mo = new MutationObserver(() => {
  const active = document.querySelector('#settingsSection.tab-section:not([hidden])');
  if (active) initSettingsState().catch(console.error);
});
mo.observe(document.documentElement, {
  attributes: true,
  subtree: true,
  attributeFilter: ['class'],
});
