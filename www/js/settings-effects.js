import {
  readSetting,
  writeSetting,
  loadSettingsSchema,
  ensureDefaults,
} from '/js/settings-schema.js';

function qs(s, root = document) {
  return root.querySelector(s);
}

function applyTheme(value) {
  // Prefer existing app theming if exposed; otherwise set a data attribute fallback
  try {
    if (typeof window.applyTheme === 'function') {
      window.applyTheme(value);
    } else {
      const root = document.documentElement;
      root.setAttribute('data-theme', value); // 'system'|'light'|'dark'
    }
  } catch {}
}

function applyLanguage(value) {
  try {
    document.documentElement.lang = value || 'en';
    if (window.i18n && typeof window.i18n.setLanguage === 'function') {
      window.i18n.setLanguage(value);
    }
  } catch {}
}

function applyMardiGras(on) {
  try {
    document.body.classList.toggle('mardi-gras', !!on);
  } catch {}
}

function wireEffect(selector, key, onChange) {
  const el = qs(selector);
  if (!el) return false;
  // seed from storage
  const val = readSetting(key, null);
  if (val !== null) onChange(val);
  // react to user changes
  el.addEventListener('change', () => {
    const raw = el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value;
    onChange(raw);
  });
  return true;
}

export async function initSettingsEffects() {
  const schema = await loadSettingsSchema();
  ensureDefaults(schema);

  // 1) Theme radios -> apply theme immediately
  const themeRadios = ['#themeSystem', '#themeLight', '#themeDark']
    .map((sel) => qs(sel))
    .filter(Boolean);
  if (themeRadios.length === 3) {
    // seed
    applyTheme(readSetting('ui.theme', 'light'));
    // listen
    themeRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          const next =
            radio.id === 'themeLight' ? 'light' : radio.id === 'themeDark' ? 'dark' : 'system';
          applyTheme(next);
        }
      });
    });
  }

  // 2) Header language select (#langToggle) -> set <html lang> and invoke i18n if present
  wireEffect('#langToggle', 'app.language', (val) => applyLanguage(String(val)));

  // 3) Mardi Gras overlay toggle
  wireEffect('#mardiOverlayToggle', 'ui.mardiGrasOverlay', (on) => applyMardiGras(!!on));

  // Optional: expose a simple hook others can use
  window.flickletSettingsEffectsApplied = true;
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSettingsEffects().catch(console.error));
} else {
  initSettingsEffects().catch(console.error);
}

export function bindSettingsControlsOnce() {
  // idempotent: attach listeners if present
  const themeRadios = ['#themeSystem', '#themeLight', '#themeDark']
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);
  if (themeRadios.length === 3) {
    // ensure checked one applies on (re)enter
    const checked = themeRadios.find((r) => r.checked);
    if (checked) {
      const next =
        checked.id === 'themeLight' ? 'light' : checked.id === 'themeDark' ? 'dark' : 'system';
      try {
        document.documentElement.setAttribute('data-theme', next);
      } catch {}
    }
    themeRadios.forEach((radio) => {
      if (!radio.__fx) {
        radio.addEventListener('change', () => {
          if (radio.checked) {
            const next =
              radio.id === 'themeLight' ? 'light' : radio.id === 'themeDark' ? 'dark' : 'system';
            document.documentElement.setAttribute('data-theme', next);
          }
        });
        radio.__fx = true;
      }
    });
  }
  const lang = document.querySelector('#langToggle');
  if (lang && !lang.__fx) {
    lang.addEventListener('change', () => {
      try {
        document.documentElement.lang = String(lang.value || 'en');
      } catch {}
    });
    lang.__fx = true;
  }
  const mg = document.querySelector('#mardiOverlayToggle');
  if (mg && !mg.__fx) {
    mg.addEventListener('change', () => {
      document.body.classList.toggle('mardi-gras', !!mg.checked);
    });
    mg.__fx = true;
  }
}

// Listen for Settings tab activation (cheap heuristic)
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!t) return;
  // any click on the Settings tab or its nav triggers a rebind on next frame
  if (t.id === 'settingsTab' || (t.closest && t.closest('#settingsTab'))) {
    queueMicrotask(bindSettingsControlsOnce);
  }
});
// Also observe section activation by class change
const mo = new MutationObserver(() => {
  const active = document.querySelector('#settingsSection.tab-section:not([hidden])');
  if (active) bindSettingsControlsOnce();
});
mo.observe(document.documentElement, {
  attributes: true,
  subtree: true,
  attributeFilter: ['class'],
});
